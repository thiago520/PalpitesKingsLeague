// worker/chat-worker.ts
import { config } from "dotenv";
config(); // Carrega as variáveis do .env

import tmi, { Client, ChatUserstate } from "tmi.js";
import { prisma } from "../src/lib/db";
import { SCORE_REGEX, normalizeName } from "../src/lib/utils";
import { ensureValidUserAccess } from "../src/lib/twitch";
import { ensureValidBotAccess } from "../src/lib/twitchBot";

type MessageHandler = (channel: string, tags: ChatUserstate, message: string, self: boolean) => void;
type HandlerMap = Map<string, MessageHandler>; // matchId -> handler

const clients = new Map<string, Client>();      // streamerUserId -> tmi Client
const handlers = new Map<string, HandlerMap>(); // streamerUserId -> (matchId -> fn)
const globalHandlers = new Map<string, MessageHandler>(); // streamerUserId -> fn (comandos globais)

// ===============================
// Bot (mensagens via conta separada)
// ===============================
const BOT_ENABLED = /^(1|true|yes)$/i.test((process.env.TWITCH_BOT_ENABLED || "").trim());
const BOT_USERNAME = (process.env.TWITCH_BOT_USERNAME || "").trim();
const BOT_OAUTH_RAW = (process.env.TWITCH_BOT_OAUTH || "").trim();

function isBotEnabled() {
  // Habilita com flag + username. O token pode vir do env (rápido) ou do DB (produção).
  return !!(BOT_ENABLED && BOT_USERNAME);
}

function toTmiOauthPassword(raw: string) {
  // Aceita token no formato "oauth:xxxx" ou só "xxxx"
  return raw.startsWith("oauth:") ? raw : `oauth:${raw}`;
}

async function getBotAccessToken(options?: { forceRefresh?: boolean }) {
  // Opção rápida (sem refresh): token direto do env
  if (BOT_OAUTH_RAW) return BOT_OAUTH_RAW;
  // Produção: token armazenado no DB + refresh automático
  return ensureValidBotAccess(options);
}

let botClient: Client | null = null;
let botConnecting: Promise<Client> | null = null;
const botJoined = new Set<string>(); // canal login (sem #)

async function ensureBotClient(): Promise<Client> {
  if (!isBotEnabled()) throw new Error("Bot desabilitado (TWITCH_BOT_ENABLED/TWITCH_BOT_USERNAME)");
  if (botClient) return botClient;
  if (botConnecting) return botConnecting;

  botConnecting = (async () => {
    const access1 = await getBotAccessToken();
    const client = new tmi.Client({
      options: { debug: false },
      identity: {
        username: BOT_USERNAME,
        password: toTmiOauthPassword(access1),
      },
      channels: [],
      connection: { secure: true, reconnect: true },
    });

    client.on("connected", (_addr, _port) => console.log(`[worker] BOT IRC connected as ${BOT_USERNAME}`));
    client.on("join", (chan, username, self) => {
      if (self) console.log(`[worker] BOT joined ${chan} as ${username}`);
    });
    client.on("notice", (channel, msgid, message) =>
      console.warn(`[worker][bot][notice] ${channel} ${msgid ?? ""} ${message}`)
    );

    try {
      await client.connect();
    } catch (e: any) {
      const msg = String(e?.message || e);
      // Se estamos em modo DB (sem token no env), tenta um refresh forçado uma vez.
      if (!BOT_OAUTH_RAW && /login authentication failed/i.test(msg)) {
        console.warn("[worker] BOT auth failed, forcing refresh and retrying once...");
        const access2 = await getBotAccessToken({ forceRefresh: true });
        const retry = new tmi.Client({
          options: { debug: false },
          identity: {
            username: BOT_USERNAME,
            password: toTmiOauthPassword(access2),
          },
          channels: [],
          connection: { secure: true, reconnect: true },
        });
        retry.on("connected", (_addr, _port) => console.log(`[worker] BOT IRC connected as ${BOT_USERNAME}`));
        retry.on("join", (chan, username, self) => {
          if (self) console.log(`[worker] BOT joined ${chan} as ${username}`);
        });
        retry.on("notice", (channel, msgid, message) =>
          console.warn(`[worker][bot][notice] ${channel} ${msgid ?? ""} ${message}`)
        );
        await retry.connect();
        botClient = retry;
        return retry;
      }
      throw e;
    }
    botClient = client;
    return client;
  })().finally(() => {
    botConnecting = null;
  });

  return botConnecting;
}

async function ensureBotJoinedChannel(channelLogin: string) {
  const login = (channelLogin || "").replace(/^#/, "").toLowerCase().trim();
  if (!login) return;
  if (botJoined.has(login)) return;

  const client = await ensureBotClient();
  await client.join(`#${login}`);
  botJoined.add(login);
}

const aliasCache = new Map<string, { at: number; values: string[] }>();
const ALIAS_TTL_MS = 5 * 60 * 1000;

// Anunciar quando uma captura é ligada (evita spam)
const ANNOUNCE_ON_ATTACH = true;

// ===============================
// Helix send (escrita no chat)
// ===============================
async function sendChatMessageHelix(streamerUserId: string, channelLogin: string, text: string) {
  try {
    // Sender = usuário que concedeu user:write:chat (normalmente o próprio streamer)
    const sender = await prisma.user.findUnique({
      where: { id: streamerUserId },
      select: { twitchUserId: true, accessToken: true, scopes: true, login: true },
    });
    if (!sender?.twitchUserId || !sender.accessToken) {
      console.error("[helix.send] sender inválido", { streamerUserId });
      return;
    }
    if (!sender.scopes?.includes("user:write:chat")) {
      console.warn("[helix.send] token sem escopo user:write:chat para", sender.login);
      return;
    }

    // broadcaster = dono do canal de destino (padrão: o próprio streamer)
    let broadcasterId: string | null = null;
    const chan = await prisma.user.findFirst({
      where: { login: channelLogin.toLowerCase() },
      select: { twitchUserId: true },
    });
    broadcasterId = chan?.twitchUserId ?? sender.twitchUserId;

    const body = {
      broadcaster_id: broadcasterId,
      sender_id: sender.twitchUserId,
      message: text,
    };

    const r = await fetch("https://api.twitch.tv/helix/chat/messages", {
      method: "POST",
      headers: {
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
        "Authorization": `Bearer ${sender.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("[helix.send] failed", r.status, errText);
    }
  } catch (e) {
    console.error("[helix.send] error:", e);
  }
}

async function sendChatMessage(streamerUserId: string, channelLogin: string, text: string) {
  if (isBotEnabled()) {
    const login = (channelLogin || "").replace(/^#/, "").toLowerCase().trim();
    if (!login) return;
    try {
      if (!botJoined.has(login)) {
        console.log(`[worker] BOT will join & speak in #${login}`);
      }
      await ensureBotJoinedChannel(login);
      const client = await ensureBotClient();
      await client.say(`#${login}`, text);
      return;
    } catch (e) {
      console.warn(`[worker] BOT say failed in #${login}. Falling back to Helix:`, e);
    }
  }

  // Observabilidade: ajuda a identificar por que a msg ainda sai como streamer
  if (!BOT_ENABLED) {
    console.log(`[worker] Bot desabilitado (TWITCH_BOT_ENABLED=false). Enviando via Helix (streamer).`);
  } else if (!BOT_USERNAME) {
    console.log(`[worker] Bot desabilitado (faltando TWITCH_BOT_USERNAME). Enviando via Helix (streamer).`);
  }

  // fallback: comportamento atual (mensagem via Helix usando token do streamer)
  await sendChatMessageHelix(streamerUserId, channelLogin, text);
}

function getHandlerMap(userId: string): HandlerMap {
  let m = handlers.get(userId);
  if (!m) { m = new Map(); handlers.set(userId, m); }
  return m;
}

async function buildAliases(teamId: string) {
  const now = Date.now();
  const c = aliasCache.get(teamId);
  if (c && now - c.at < ALIAS_TTL_MS) return c.values;
  const team = await prisma.team.findUnique({ where: { id: teamId }, include: { aliases: true } });
  const vals = team ? [team.name, team.code, ...team.aliases.map(a => a.alias)].map(normalizeName) : [];
  aliasCache.set(teamId, { at: now, values: vals });
  return vals;
}

async function ensureClientFor(userId: string, login: string) {
  const existing = clients.get(userId);
  if (existing) {
    attachGlobalHandler(userId, existing);
    return existing;
  }
  const access = await ensureValidUserAccess(userId);
  const client = new tmi.Client({
    options: { debug: false }, // mude para true se quiser diagnosticar IRC
    identity: { username: login, password: `oauth:${access}` },
    channels: [`#${login}`],
    connection: { secure: true, reconnect: true },
  });

  // Logs úteis (opcionais)
  client.on("connected", (_addr, _port) => console.log(`[worker] IRC connected as ${login}`));
  client.on("join", (chan, username, self) => { if (self) console.log(`[worker] joined ${chan} as ${username}`); });
  client.on("notice", (channel, msgid, message) => console.warn(`[worker][notice] ${channel} ${msgid ?? ""} ${message}`));

  await client.connect();
  clients.set(userId, client);
  handlers.set(userId, new Map());
  attachGlobalHandler(userId, client);
  console.log(`[worker] Connected & wired global commands for @${login}`);
  return client;
}

function attachHandler(userId: string, client: Client, matchId: string, fn: MessageHandler) {
  const map = getHandlerMap(userId);
  if (map.has(matchId)) return false;
  client.on("message", fn);
  map.set(matchId, fn);
  console.log(`[worker] Listening for match ${matchId} (user ${userId})`);
  return true;
}

function detachHandler(userId: string, client: Client, matchId: string) {
  const map = handlers.get(userId);
  if (!map) return;
  const fn = map.get(matchId);
  if (!fn) return;
  client.removeListener("message", fn);
  map.delete(matchId);
  console.log(`[worker] Stopped listening for match ${matchId} (user ${userId})`);
}

// ===============================
// Ranking helpers (Guess + Result)
// ===============================

type UserRankRow = {
  pos: number;
  points: number;
  winner_hits: number;
  score_hits: number;
  login: string;
  display_name: string | null;
};

async function getRankForUserInChannel(streamerUserId: string, lookupLogin: string): Promise<UserRankRow | null> {
  const rows = await prisma.$queryRaw<UserRankRow[]>`
    WITH per_user AS (
      SELECT
        g."twitchUserId" AS uid,
        MAX(g."twitchLogin") AS login,
        MAX(g."twitchDisplay") AS display_name,
        COALESCE(SUM(g."pointsAwarded"), 0) AS points,
        COALESCE(SUM(
          CASE
            WHEN r."goalsHome" IS NOT NULL AND r."goalsAway" IS NOT NULL
                 AND (CASE WHEN r."goalsHome" - r."goalsAway" > 0 THEN 1
                           WHEN r."goalsHome" - r."goalsAway" < 0 THEN -1
                           ELSE 0 END)
                 =
                 (CASE WHEN g."goalsHome" - g."goalsAway" > 0 THEN 1
                       WHEN g."goalsHome" - g."goalsAway" < 0 THEN -1
                       ELSE 0 END)
            THEN 1 ELSE 0
          END
        ), 0) AS winner_hits,
        COALESCE(SUM(
          CASE WHEN r."goalsHome" = g."goalsHome" AND r."goalsAway" = g."goalsAway" THEN 1 ELSE 0 END
        ), 0) AS score_hits
      FROM "Guess" g
      LEFT JOIN "Result" r ON r."matchId" = g."matchId"
      WHERE g."streamerUserId" = ${streamerUserId}
      GROUP BY g."twitchUserId"
    ),
    ranked AS (
      SELECT
        uid, login, display_name, points, winner_hits, score_hits,
        RANK() OVER (ORDER BY points DESC, winner_hits DESC, score_hits DESC, login ASC) AS pos
      FROM per_user
    )
    SELECT pos, points, winner_hits, score_hits, login, display_name
    FROM ranked
    WHERE LOWER(login) = LOWER(${lookupLogin})
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

async function getTopNInChannel(streamerUserId: string, limit: number): Promise<UserRankRow[]> {
  const rows = await prisma.$queryRaw<UserRankRow[]>`
    WITH per_user AS (
      SELECT
        g."twitchUserId" AS uid,
        MAX(g."twitchLogin") AS login,
        MAX(g."twitchDisplay") AS display_name,
        COALESCE(SUM(g."pointsAwarded"), 0) AS points,
        COALESCE(SUM(
          CASE
            WHEN r."goalsHome" IS NOT NULL AND r."goalsAway" IS NOT NULL
                 AND (CASE WHEN r."goalsHome" - r."goalsAway" > 0 THEN 1
                           WHEN r."goalsHome" - r."goalsAway" < 0 THEN -1
                           ELSE 0 END)
                 =
                 (CASE WHEN g."goalsHome" - g."goalsAway" > 0 THEN 1
                       WHEN g."goalsHome" - g."goalsAway" < 0 THEN -1
                       ELSE 0 END)
            THEN 1 ELSE 0
          END
        ), 0) AS winner_hits,
        COALESCE(SUM(
          CASE WHEN r."goalsHome" = g."goalsHome" AND r."goalsAway" = g."goalsAway" THEN 1 ELSE 0 END
        ), 0) AS score_hits
      FROM "Guess" g
      LEFT JOIN "Result" r ON r."matchId" = g."matchId"
      WHERE g."streamerUserId" = ${streamerUserId}
      GROUP BY g."twitchUserId"
    ),
    ranked AS (
      SELECT
        uid, login, display_name, points, winner_hits, score_hits,
        RANK() OVER (ORDER BY points DESC, winner_hits DESC, score_hits DESC, login ASC) AS pos
      FROM per_user
    )
    SELECT pos, points, winner_hits, score_hits, login, display_name
    FROM ranked
    ORDER BY pos ASC
    LIMIT ${limit};
  `;
  return rows;
}

function shortName(s: string, max = 16) {
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function formatRankReply(targetLogin: string, r: UserRankRow, mention: string) {
  const pts = Number(r.points) || 0;
  const w = Number(r.winner_hits) || 0;
  const s = Number(r.score_hits) || 0;
  return `@${mention} você está #${r.pos} no ranking de ${targetLogin}: ${pts} pts | ${w} acertos de vencedor | ${s} placares cravados.`;
}

function formatTopReply(targetLogin: string, list: UserRankRow[]) {
  if (!list.length) return `Ainda não há pontuações em ${targetLogin}. Participe dos palpites!`;
  const items = list.map(r => {
    const name = shortName(r.display_name || r.login);
    const pts = Number(r.points) || 0;
    const w = Number(r.winner_hits) || 0;
    const s = Number(r.score_hits) || 0;
    return `#${r.pos} ${name} (${pts} pts | ${w} V | ${s} P)`;
  });
  return `TOP ${list.length} de ${targetLogin}: ${items.join(", ")}`;
}

// ===============================
// Handler global: !rank e !top5 (sempre ativos)
// ===============================
function attachGlobalHandler(streamerUserId: string, client: Client) {
  if (globalHandlers.has(streamerUserId)) return;

  const onGlobalMessage: MessageHandler = async (channel, tags, message, self) => {
    if (self) return;
    const trimmed = (message || "").trim();
    if (!trimmed) return;

    const targetLogin = channel.replace(/^#/, "");
    const authorLogin =
      (tags["username"] as string) ||
      (tags["login"] as string) ||
      (tags["display-name"] as string) ||
      "";

    // !rank [@user]
    const rankMatch = /^!rank(?:\s+(.+))?$/i.exec(trimmed);
    if (rankMatch) {
      try {
        const maybeUser = (rankMatch[1] || "").trim();
        const lookupLogin = (maybeUser ? maybeUser.replace(/^@/, "") : authorLogin).toLowerCase();
        const mention = (maybeUser ? maybeUser.replace(/^@/, "") : (tags["display-name"] as string) || authorLogin) || "você";
        if (!lookupLogin) {
          await sendChatMessage(streamerUserId, targetLogin, `@${authorLogin} não consegui identificar seu usuário. Tente novamente.`);
          return;
        }
        const rank = await getRankForUserInChannel(streamerUserId, lookupLogin);
        if (!rank) {
          await sendChatMessage(streamerUserId, targetLogin, `@${mention} ainda não tem pontos neste canal. Participe dos palpites!`);
          return;
        }
        await sendChatMessage(streamerUserId, targetLogin, formatRankReply(targetLogin, rank, mention));
      } catch (err) {
        console.error("!rank error:", err);
        const who = (tags["username"] as string) || (tags["login"] as string) || "você";
        await sendChatMessage(streamerUserId, targetLogin, `@${who} não consegui consultar o ranking agora.`);
      }
      return;
    }

    // !top5
    if (/^!top5$/i.test(trimmed)) {
      try {
        const top = await getTopNInChannel(streamerUserId, 5);
        const msg = formatTopReply(targetLogin, top);
        await sendChatMessage(streamerUserId, targetLogin, msg);
      } catch (err) {
        console.error("!top5 error:", err);
        const who = (tags["username"] as string) || (tags["login"] as string) || "você";
        await sendChatMessage(streamerUserId, targetLogin, `@${who} não consegui consultar o TOP 5 agora.`);
      }
      return;
    }
  };

  client.on("message", onGlobalMessage);
  globalHandlers.set(streamerUserId, onGlobalMessage);
  console.log(`[worker] Global commands wired (!rank, !top5) for user ${streamerUserId}`);
}

// ===============================
// Mantém comandos ativos para todos os streamers
// ===============================
async function ensureGlobalCommandClients() {
  // Conecta usuários que têm leitura de chat.
  // Se o BOT não estiver configurado, também exige permissão de escrita via Helix.
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { scopes: { contains: "chat:read" } },
        ...(isBotEnabled() ? [] : [{ scopes: { contains: "user:write:chat" } }]),
      ],
    },
    select: { id: true, login: true },
  });

  let ok = 0, fail = 0;
  for (const u of users) {
    try {
      await ensureClientFor(u.id, u.login);
      ok++;
    } catch (e) {
      fail++;
      console.warn(`[worker] Could not ensure commands for @${u.login}:`, e);
    }
  }
  console.log(`[worker] Commands active for ${ok} streamers (failed: ${fail}).`);
}

// ===============================
// Fluxo de captura (SCORE_REGEX)
// ===============================
let ticking = false;
async function tick() {
  if (ticking) return; ticking = true;
  try {
    // Comandos SEMPRE ativos:
    await ensureGlobalCommandClients();

    // Capturas abertas (para salvar palpites):
    const caps = await prisma.capture.findMany({
      where: { status: "OPEN" },
      include: {
        match: { select: { id: true, homeId: true, awayId: true } },
        streamer: { select: { id: true, login: true } }
      },
    });

    console.log(`[worker] Found ${caps.length} OPEN captures`);

    // agrupa por streamer
    const byUser = new Map<string, typeof caps>();
    for (const c of caps) {
      const arr = byUser.get(c.streamer.id) ?? [];
      arr.push(c);
      byUser.set(c.streamer.id, arr);
    }

    // para cada streamer, garante client + handlers de captura
    for (const [userId, list] of byUser.entries()) {
      const login = list[0]!.streamer.login;
      const client = await ensureClientFor(userId, login); // já garante comandos globais
      const activeIds = new Set(list.map(c => c.match.id));
      const map = getHandlerMap(userId);

      for (const cap of list) {
        const { match } = cap;
        const homeAliases = await buildAliases(match.homeId);
        const awayAliases = await buildAliases(match.awayId);

        const onMessage: MessageHandler = async (ch, tags, message, self) => {
          if (self) return;
          // checa se a captura ainda está OPEN
          const nowCap = await prisma.capture.findUnique({
            where: { matchId_streamerUserId: { matchId: match.id, streamerUserId: userId } },
            select: { status: true, channelLogin: true },
          });
          if (!nowCap || nowCap.status !== "OPEN") return;

          const mreg = SCORE_REGEX.exec(message);
          if (!mreg?.groups) return;

          const t1 = normalizeName(mreg.groups.t1);
          const t2 = normalizeName(mreg.groups.t2);
          const g1 = parseInt(mreg.groups.g1, 10);
          const g2 = parseInt(mreg.groups.g2, 10);
          if (!Number.isFinite(g1) || !Number.isFinite(g2)) return;

          const isHomeAway = homeAliases.includes(t1) && awayAliases.includes(t2);
          const isAwayHome = homeAliases.includes(t2) && awayAliases.includes(t1);
          if (!isHomeAway && !isAwayHome) return;

          const goalsHome = isHomeAway ? g1 : g2;
          const goalsAway = isHomeAway ? g2 : g1;

          const twitchUserId = `${tags["user-id"] ?? ""}`;
          if (!twitchUserId) return;
          const twitchLogin = `${tags["username"] || (tags as any)["login"] || tags["display-name"] || ""}`;
          const twitchDisplay = `${tags["display-name"] || twitchLogin}`;

          await prisma.guess.upsert({
            where: { matchId_streamerUserId_twitchUserId: { matchId: match.id, streamerUserId: userId, twitchUserId } },
            update: { goalsHome, goalsAway, twitchLogin, twitchDisplay, channelLogin: nowCap.channelLogin },
            create: {
              matchId: match.id,
              streamerUserId: userId,
              channelLogin: nowCap.channelLogin,
              twitchUserId, twitchLogin, twitchDisplay,
              goalsHome, goalsAway,
            },
          });
        };

        const firstAttach = attachHandler(userId, client, match.id, onMessage);

        if (firstAttach && ANNOUNCE_ON_ATTACH) {
          try {
            await sendChatMessage(userId, login,
              `📣 Palpites abertos! Envie: <time1> <gols1>x<gols2> <time2> (ex.: G3X 2x1 Fúria).`);
          } catch (e) {
            console.warn(`[worker] Failed to announce open capture in #${login}:`, e);
          }
        }
      }

      // limpa handlers órfãos desse user (mas mantém client online p/ comandos)
      for (const staleId of Array.from(map.keys())) {
        if (!activeIds.has(staleId)) detachHandler(userId, client, staleId);
      }
    }

    // IMPORTANTE: não desconecta o client quando não há capturas
    // (mantemos comandos sempre ativos)
  } catch (e) {
    console.error("[worker] tick fatal:", e);
  } finally {
    ticking = false;
  }
}

(async function main() {
  console.log("[worker] starting…");
  console.log(
    `[worker] Bot mode: ${isBotEnabled() ? `ENABLED (@${BOT_USERNAME})` : "DISABLED"}`
  );
  setInterval(tick, 5000);
  await tick();
})();
