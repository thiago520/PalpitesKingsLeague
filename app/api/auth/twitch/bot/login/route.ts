import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { twitchAuthorizeUrl } from "@/src/lib/twitch";
import { requireAdmin } from "@/src/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new NextResponse(
      "Forbidden (admin only). Faça login como admin em /api/auth/twitch/login e tente novamente.",
      { status: 403 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri =
    process.env.OAUTH_BOT_REDIRECT_URI ||
    `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/twitch/bot/callback`;

  let url = twitchAuthorizeUrl({
    state,
    scope: ["chat:read", "chat:edit"],
    redirectUri,
  });

  url += (url.includes("?") ? "&" : "?") + "force_verify=true";

  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state_bot", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
