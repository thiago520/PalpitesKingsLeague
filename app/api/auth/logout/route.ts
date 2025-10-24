// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";

const COOKIE_NAME = "sid";

export async function POST(req: NextRequest) {
  const sid = req.cookies.get(COOKIE_NAME)?.value;

  if (sid) {
    // apaga a sessão no banco (ignora erro se já não existir)
    await prisma.session.delete({ where: { id: sid } }).catch(() => {});
  }

  const base = process.env.APP_URL ?? "http://localhost:3000";
  const res = NextResponse.redirect(`${base}/`);

  // zera o cookie no browser
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res;
}