// app/api/auth/twitch/twitch/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/src/lib/auth";
import { exchangeCodeForTokens, getSelfUser } from "@/src/lib/twitch";
import { prisma } from "@/src/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const cookieState = req.cookies.get("oauth_state")?.value;
  if (!code || !returnedState || !cookieState || returnedState !== cookieState) {
    return new NextResponse("Invalid OAuth state", { status: 400 });
  }

  const tok = await exchangeCodeForTokens(code);
  const self = await getSelfUser(tok.access_token);
  const exp = new Date(Date.now() + tok.expires_in * 1000);

  const user = await prisma.user.upsert({
    where: { twitchUserId: self.id },
    create: {
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
      login: self.login,
      displayName: self.display_name,
      avatarUrl: self.profile_image_url ?? null,
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token,
      accessTokenExp: exp,
      scopes: tok.scope.join(" "),
    },
  });

  await createSession(user.id);
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const res = NextResponse.redirect(`${base}/matches`);
  res.cookies.delete("oauth_state");
  return res;
}
