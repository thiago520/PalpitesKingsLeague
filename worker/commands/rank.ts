import { prisma } from "@/src/lib/db";
import type { Client, ChatUserstate } from "tmi.js";

type UserRank = {
  pos: number;
  points: number;
  winner_hits: number;
  score_hits: number;
  display_name: string;
};

async function getRankForUser(streamerLogin: string, viewerLogin: string): Promise<UserRank | null> {
  
  const rows = await prisma.$queryRawUnsafe<UserRank[]>(`
    WITH per_user AS (
      SELECT
        g."userId"                                   AS user_id,
        SUM(g.points)                                AS points,
        SUM(CASE WHEN g.correct_winner THEN 1 ELSE 0 END) AS winner_hits,
        SUM(CASE WHEN g.correct_score  THEN 1 ELSE 0 END) AS score_hits
      FROM "Guess" g
      JOIN "Channel" c ON c.id = g."channelId"
      WHERE LOWER(c.login) = LOWER($1)
      GROUP BY g."userId"
    ),
    ranked AS (
      SELECT
        u.id,
        u."displayName"                              AS display_name,
        u.login,
        p.points,
        p.winner_hits,
        p.score_hits,
        RANK() OVER (ORDER BY p.points DESC, p.winner_hits DESC, p.score_hits DESC) AS pos
      FROM per_user p
      JOIN "User" u ON u.id = p.user_id
    )
    SELECT pos, points, winner_hits, score_hits, display_name
    FROM ranked
    WHERE LOWER(login) = LOWER($2)
    LIMIT 1;
  `, streamerLogin, viewerLogin);

  return rows[0] ?? null;
}

function formatReply(target: string, r: UserRank, mention: string) {
  return `@${mention} você está #${r.pos} no ranking de ${target}: ${r.points} pts | ${r.winner_hits} acertos vencedor | ${r.score_hits} placares cravados.`;
}

export function wireRankCommand(client: Client) {
  client.on("message", async (channel: string, userstate: ChatUserstate, message: string, self: boolean) => {
    if (self) return;

    const trimmed = (message || "").trim();
    if (!trimmed) return;

    const [cmd, maybeUser] = trimmed.split(/\s+/);
    if (cmd?.toLowerCase() !== "!rank") return;

    try {
      const streamerLogin = channel.replace(/^#/, "");
      // Permitir "!rank @alguem" para consultar outro viewer; padrão = o autor
      const lookupLogin = (maybeUser?.replace(/^@/, "") || userstate.username || "").toLowerCase();
      const mention = maybeUser?.replace(/^@/, "") || userstate["display-name"] || userstate.username || "você";

      if (!lookupLogin) {
        await client.say(channel, `@${userstate.username} não consegui identificar seu usuário. Tente novamente.`);
        return;
      }

      const rank = await getRankForUser(streamerLogin, lookupLogin);

      if (!rank) {
        await client.say(channel, `@${mention} ainda não tem pontos neste canal. Participe dos palpites!`);
        return;
      }

      await client.say(channel, formatReply(streamerLogin, rank, mention));
    } catch (err) {
      console.error("!rank error:", err);
      await client.say(channel, `@${userstate.username} não consegui consultar o ranking agora.`);
    }
  });
}
