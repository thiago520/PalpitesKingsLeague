import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { twitchAuthorizeUrl } from "@/src/lib/twitch";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  
  let url = twitchAuthorizeUrl({
    state,
    scope: ["chat:read", "chat:edit", "user:write:chat"],
  });

  url += (url.includes("?") ? "&" : "?") + "force_verify=true";

  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
