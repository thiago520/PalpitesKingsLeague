import { cookies, headers } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "sid";

export async function getSession() {
  const sid = cookies().get(COOKIE_NAME)?.value;
  if (!sid) return null;
  const now = new Date();
  const session = await prisma.session.findFirst({
    where: { id: sid, expiresAt: { gt: now } },
    include: { user: true },
  });
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return session.user;
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 dias
  const session = await prisma.session.create({
    data: { userId, expiresAt: expires },
  });
  // set cookie (Next 14 route handler)
  const cookieStore = cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: session.id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export function getBasePoints() {
  const n = Number(process.env.BASE_POINTS || "2");
  return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 2;
}

// --- ADMIN GUARD ---
export function isAdminLogin(login?: string | null) {
  if (!login) return false;
  const allowed = (process.env.ADMIN_TWITCH_LOGIN || "thiago521").toLowerCase();
  return login.toLowerCase() === allowed;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminLogin(session.user.login)) {
    const err = new Error("Forbidden");
    // @ts-ignore
    err.status = 403;
    throw err;
  }
  return session.user;
}
