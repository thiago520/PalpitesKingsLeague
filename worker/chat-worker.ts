// worker/chat-worker.ts
import tmi, { Client, ChatUserstate } from "tmi.js";
import { prisma } from "../src/lib/db";
import { SCORE_REGEX, normalizeName } from "../src/lib/utils";
import { ensureValidUserAccess } from "../src/lib/twitch";

type MessageHandler = (channel: string, tags: ChatUserstate, message: string, self: boolean) => void;
type HandlerMap = Map<string, MessageHandler>; // matchId -> handler

const clients = new Map<string, Client>();      // streamerUserId -> tmi Client
const handlers = new Map<string, HandlerMap>(); // streamerUserId -> (matchId -> fn)
const aliasCache = new Map<string, { at: number; values: string[] }>();
const ALIAS_TTL_MS = 5 * 60 * 1000;

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
  if (existing) return existing;
  const access = await ensureValidUserAccess(userId);
  const client = new tmi.Client({
    options: { debug: false },
    identity: { username: login, password: `oauth:${access}` },
    channels: [`#${login}`],
    connection: { secure: true, reconnect: true },
  });
  await client.connect();
  clients.set(userId, client);
  handlers.set(userId, new Map());
  console.log(`[worker] Connected as ${login}`);
  return client;
}

function attachHandler(userId: string, client: Client, matchId: string, fn: MessageHandler) {
  const map = getHandlerMap(userId);
  if (map.has(matchId)) return;
  client.on("message", fn);
  map.set(matchId, fn);
  console.log(`[worker] Listening for match ${matchId} (user ${userId})`);
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

let ticking = false;
async function tick() {
  if (ticking) return; ticking = true;
  try {
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const caps = await prisma.capture.findMany({
      where: { status: "OPEN", startedAt: { gt: since } },
      include: { match: { select: { id: true, homeId: true, awayId: true } }, streamer: { select: { id: true, login: true } } },
    });

    // agrupa por streamer
    const byUser = new Map<string, typeof caps>();
    for (const c of caps) {
      const arr = byUser.get(c.streamer.id) ?? [];
      arr.push(c);
      byUser.set(c.streamer.id, arr);
    }

    // para cada streamer, garante client + handlers
    for (const [userId, list] of byUser.entries()) {
      const login = list[0]!.streamer.login;
      const client = await ensureClientFor(userId, login);
      const activeIds = new Set(list.map(c => c.match.id));
      const map = getHandlerMap(userId);

      for (const cap of list) {
        const { match } = cap;
        const homeAliases = await buildAliases(match.homeId);
        const awayAliases = await buildAliases(match.awayId);

        const onMessage: MessageHandler = async (_ch, tags, message, self) => {
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
          const twitchLogin = `${tags["username"] || tags["login"] || tags["display-name"] || ""}`;
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

        attachHandler(userId, client, match.id, onMessage);
      }

      // limpa handlers órfãos desse user
      for (const staleId of Array.from(map.keys())) {
        if (!activeIds.has(staleId)) detachHandler(userId, client, staleId);
      }
    }

    // desconecta/limpa quem não tem capturas OPEN
    for (const [userId, client] of clients.entries()) {
      if (byUser.has(userId)) continue;
      const map = handlers.get(userId);
      if (map) for (const staleId of Array.from(map.keys())) detachHandler(userId, client, staleId);
      // (se quiser, pode também desconectar o client aqui)
      // await client.disconnect(); clients.delete(userId); handlers.delete(userId);
    }
  } catch (e) {
    console.error("[worker] tick fatal:", e);
  } finally {
    ticking = false;
  }
}

(async function main() {
  console.log("[worker] starting…");
  setInterval(tick, 5000);
  await tick();
})();
