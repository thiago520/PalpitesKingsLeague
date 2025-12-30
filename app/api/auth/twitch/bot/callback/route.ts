import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getSelfUser } from "@/src/lib/twitch";
import { prisma } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return new NextResponse(
      "Forbidden (admin only). Faça login como admin em /api/auth/twitch/login e tente novamente.",
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const cookieState = req.cookies.get("oauth_state_bot")?.value;

  if (!code || !returnedState || !cookieState || returnedState !== cookieState) {
    return new NextResponse("Invalid OAuth state", { status: 400 });
  }

  const redirectUri =
    process.env.OAUTH_BOT_REDIRECT_URI ||
    `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/twitch/bot/callback`;

  const tok = await exchangeCodeForTokens(code, redirectUri);
  const self = await getSelfUser(tok.access_token);
  const exp = new Date(Date.now() + tok.expires_in * 1000);

  const expectedLogin = (process.env.TWITCH_BOT_USERNAME || "").trim().toLowerCase();
  if (expectedLogin && self.login.toLowerCase() !== expectedLogin) {
    return new NextResponse(
      `Conta incorreta. Esperado: @${expectedLogin} | Logado: @${self.login}`,
      { status: 400 }
    );
  }
  
  await (prisma as any).twitchBot.upsert({
    where: { key: "main" },
    create: {
      key: "main",
      twitchUserId: self.id,
      login: self.login,
      displayName: self.display_name,
      avatarUrl: self.profile_image_url ?? null,
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token,
      accessTokenExp: exp,
      scopes: tok.scope.join(" "),
    },
    update: {
      twitchUserId: self.id,
      login: self.login,
      displayName: self.display_name,
      avatarUrl: self.profile_image_url ?? null,
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token,
      accessTokenExp: exp,
      scopes: tok.scope.join(" "),
    },
  });

  const base = process.env.APP_URL ?? "http://localhost:3000";
  const res = NextResponse.redirect(`${base}/admin`);
  res.cookies.set({
    name: "oauth_state_bot",
    value: "",
    path: "/",
    expires: new Date(0),
  });
  return res;
}
