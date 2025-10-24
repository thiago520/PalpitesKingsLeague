import { prisma } from "./db";

const TWITCH_AUTH_BASE = "https://id.twitch.tv/oauth2";
const TWITCH_API_BASE = "https://api.twitch.tv/helix";

function assertEnv(name: string, value?: string) {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

const CLIENT_ID = assertEnv("TWITCH_CLIENT_ID", process.env.TWITCH_CLIENT_ID);
const CLIENT_SECRET = assertEnv("TWITCH_CLIENT_SECRET", process.env.TWITCH_CLIENT_SECRET);

export function twitchAuthorizeUrl({ state, scope }: { state: string; scope: string[] }) {
  const redirectUri = assertEnv("OAUTH_REDIRECT_URI", process.env.OAUTH_REDIRECT_URI);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scope.join(" "),
    state,
  });
  return `${TWITCH_AUTH_BASE}/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const redirectUri = assertEnv("OAUTH_REDIRECT_URI", process.env.OAUTH_REDIRECT_URI);
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  const res = await fetch(`${TWITCH_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string[];
    token_type: string;
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(`${TWITCH_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Refresh failed: ${await res.text()}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string[];
    token_type: string;
  };
}

export async function helix<T>(path: string, accessToken: string) {
  const res = await fetch(`${TWITCH_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": CLIENT_ID,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Helix ${path} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export async function getSelfUser(accessToken: string) {
  type UsersResponse = { data: Array<{ id: string; login: string; display_name: string; profile_image_url?: string }> };
  const data = await helix<UsersResponse>(`/users`, accessToken);
  return data.data[0];
}

export async function ensureValidUserAccess(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  const now = Date.now();
  if (user.accessTokenExp.getTime() - now > 60_000) {
    return user.accessToken;
  }
  const refreshed = await refreshAccessToken(user.refreshToken);
  const exp = new Date(Date.now() + refreshed.expires_in * 1000);
  await prisma.user.update({
    where: { id: userId },
    data: {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? user.refreshToken,
      accessTokenExp: exp,
      scopes: refreshed.scope.join(" "),
    },
  });
  return refreshed.access_token;
}