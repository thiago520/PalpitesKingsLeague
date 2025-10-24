// app/page.tsx
import { getSession } from "@/src/lib/auth";
import LoginScreen from "@/components/LoginScreen";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/matches"); // pós-login

  return <LoginScreen />;
}
