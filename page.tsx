import Link from "next/link";

async function getMatches() {
  const res = await fetch(`${process.env.APP_URL}/api/matches`, { cache: "no-store" });
  return res.json();
}

export default async function Home() {
  const matches = await getMatches();
  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kings League – Palpites</h1>
        <a className="rounded px-3 py-2 bg-black text-white" href="/api/auth/twitch/login">Entrar com Twitch</a>
      </header>
      <section className="space-y-3">
        {matches.map((m: any) => (
          <div key={m.id} className="border rounded p-4">
            <div className="text-sm text-gray-500">Rodada {m.round} • {new Date(m.startsAt).toLocaleString()}</div>
            <div className="text-lg font-semibold">{m.home.name} vs {m.away.name}</div>
            <Link className="text-indigo-600" href={`/matches/${m.id}`}>Abrir partida</Link>
          </div>
        ))}
      </section>
    </main>
  );
}