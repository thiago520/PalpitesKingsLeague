// app/login/page.tsx
import LoginScreen from "@/components/LoginScreen";
import { getSession } from "@/src/lib/auth";
import { redirect } from "next/navigation";


export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/matches");

  return <LoginScreen />;
}
