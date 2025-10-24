"use client";

import useSWR, { mutate as globalMutate } from "swr";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type MyCapture = { status: "OPEN" | "LOCKED"; channelLogin: string };
type Match = {
  id: string;
  round: number;
  startsAt: string;
  status: "DRAFT" | "OPEN" | "LOCKED" | "FINISHED"; // status global (apenas FINISHED é relevante aqui)
  home: { name: string; code?: string };
  away: { name: string; code?: string };
  homeBadgeFile?: string | null;
  awayBadgeFile?: string | null;
  myCapture?: MyCapture | null; // estado da captura para o streamer logado
};

type Guess = {
  id: string;
  twitchDisplay: string;
  goalsHome: number;
  goalsAway: number;
  firstIsHome?: boolean; // ordem digitada (se faltou, assume home primeiro)
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Falha ao carregar");
    return r.json();
  });

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("pt-BR");
  } catch {
    return s;
  }
}
function formatTime(s: string) {
  try {
    return new Date(s).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function StatusBadge({ status }: { status: Match["status"] }) {
  const map: Record<Match["status"], string> = {
    DRAFT: "bg-zinc-800 text-zinc-200 border-zinc-700",
    OPEN: "bg-emerald-100 text-emerald-900 border-emerald-300",
    LOCKED: "bg-amber-100 text-amber-900 border-amber-300",
    FINISHED: "bg-violet-100 text-violet-900 border-violet-300",
  };
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${map[status]}`}
    >
      {status}
    </span>
  );
}

function Crest({ file, alt }: { file?: string | null; alt: string }) {
  const src = file ? `/img/${file}` : "/img/placeholder-ball.png";
  return (
    <div className="h-12 w-12 md:h-14 md:w-14 rounded-full grid place-items-center bg-zinc-800/60 border border-zinc-700 overflow-hidden">
      <Image
        src={src}
        alt={alt}
        width={56}
        height={56}
        className="object-contain"
      />
    </div>
  );
}

/** Escudinho pequeno para a lista de palpites */
function CrestMini({
  file,
  alt,
  size = 20,
}: {
  file?: string | null;
  alt: string;
  size?: number;
}) {
  const src = file ? `/img/${file}` : "/img/placeholder-ball.png";
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-contain"
      />
    </span>
  );
}

function ExampleChip({ text }: { text: string }) {
  return (
    <code className="font-mono text-[11px] rounded bg-zinc-800/60 border border-zinc-700 px-1 py-0.5">
      {text}
    </code>
  );
}

export default function MatchPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const {
    data: match,
    isLoading: loadingMatch,
    mutate,
  } = useSWR<Match>(`/api/matches/${id}`, fetcher, {
    refreshInterval: 0,
  });

  const { data: guesses } = useSWR<Guess[]>(
    () => `/api/guesses?matchId=${id}`,
    fetcher,
    { refreshInterval: 2000 }
  );

  const [busy, setBusy] = useState(false);

  async function startCapture() {
    setBusy(true);
    try {
      const res = await fetch(`/api/matches/${id}/open`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      await mutate();
      globalMutate(`/api/matches`);
    } catch (e) {
      console.error(e);
      alert("Não foi possível iniciar a captura de palpites.");
    } finally {
      setBusy(false);
    }
  }

  async function stopCapture() {
    setBusy(true);
    try {
      const res = await fetch(`/api/matches/${id}/stop`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      await mutate();
      globalMutate(`/api/matches`);
    } catch (e) {
      console.error(e);
      alert("Não foi possível parar a captura.");
    } finally {
      setBusy(false);
    }
  }

  if (loadingMatch || !match) {
    return <main className="p-6 max-w-5xl mx-auto">Carregando…</main>;
  }

  // Depois do guard acima, match está definido:
  const m = match as Match;

  // Status efetivo na UI por streamer:
  // - Se a partida acabou globalmente, sempre mostra FINISHED.
  // - Caso contrário, usa o status por streamer (myCapture) quando existir; se não, mostra DRAFT.
  const effectiveStatus: Match["status"] =
    m.status === "FINISHED" ? "FINISHED" : (m.myCapture?.status ?? "DRAFT");

  const isOpenForMe = m.myCapture?.status === "OPEN";

  const nameExample = `${m.home.name} 3 x 2 ${m.away.name}`;
  const codeExample =
    m.home.code || m.away.code
      ? `${m.home.code ?? "HOME"} 3 x 2 ${m.away.code ?? "AWAY"}`
      : null;

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-amber-400/20 bg-black/60 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">
              <span className="text-amber-300">Kings League</span> - Palpites
            </h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/matches"
              className="rounded-lg px-3 py-1.5 border border-amber-400/30 hover:bg-zinc-900"
              title="Voltar para Partidas"
            >
              🔰 Partidas
            </Link>
            <Link
              className="rounded-lg px-3 py-1.5 border border-amber-400/30 hover:bg-zinc-900"
              href="/ranking"
            >
              🏆 Ranking
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                className="rounded-lg px-3 py-1.5 border border-red-500/40 hover:bg-red-500/10"
                type="submit"
              >
                ⇦ Sair
              </button>
            </form>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Card da partida */}
        <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-6 shadow-[0_0_0_1px_rgba(255,196,28,0.08),0_18px_50px_-20px_rgba(0,0,0,.8)]">
          {/* linha status + banner de captura */}
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={effectiveStatus} />
            {isOpenForMe && m.myCapture?.channelLogin && (
              <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/40 bg-emerald-900/20 text-emerald-200 px-3 py-1 text-xs font-semibold">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Capturando em{" "}
                <strong className="ml-1">#{m.myCapture.channelLogin}</strong>
              </span>
            )}
          </div>

          {/* escudos + instruções */}
          <div className="mt-3 flex items-start justify-between">
            {/* HOME */}
            <div className="flex flex-col items-center gap-2 w-1/3">
              <Crest file={m.homeBadgeFile} alt={m.home.name} />
              <div className="text-sm font-semibold">{m.home.name}</div>
              <div className="text-[11px] text-zinc-400 text-center leading-4">
                No chat, digite:
                <div className="mt-1">
                  <ExampleChip text={nameExample} />
                </div>
                {codeExample && (
                  <div className="mt-1">
                    <span className="opacity-70">ou: </span>
                    <ExampleChip text={codeExample} />
                  </div>
                )}
              </div>
            </div>

            <div className="w-1/3 text-center font-extrabold text-amber-400 text-2xl self-center">
              VS
            </div>

            {/* AWAY */}
            <div className="flex flex-col items-center gap-2 w-1/3">
              <Crest file={m.awayBadgeFile} alt={m.away.name} />
              <div className="text-sm font-semibold">{m.away.name}</div>
              <div className="text-[11px] text-zinc-400 text-center leading-4">
                No chat, digite:
                <div className="mt-1">
                  <ExampleChip text={nameExample} />
                </div>
                {codeExample && (
                  <div className="mt-1">
                    <span className="opacity-70">ou: </span>
                    <ExampleChip text={codeExample} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* data/hora */}
          <div className="mt-4 text-center text-sm text-zinc-300 space-y-1">
            <div>
              {formatDate(m.startsAt)} às {formatTime(m.startsAt)}
            </div>
          </div>

          {/* botão toggle */}
          <div className="mt-4 flex justify-center">
            {m.status === "FINISHED" ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-300">
                Partida finalizada
              </span>
            ) : (
              <button
                onClick={isOpenForMe ? stopCapture : startCapture}
                disabled={busy}
                className={[
                  "inline-flex items-center gap-2 rounded-xl font-semibold px-4 py-2 active:translate-y-px transition disabled:opacity-70",
                  isOpenForMe
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-amber-400 text-black hover:bg-amber-300",
                ].join(" ")}
              >
                {busy
                  ? isOpenForMe
                    ? "Parando..."
                    : "Iniciando..."
                  : isOpenForMe
                  ? "Parar Captura"
                  : "Iniciar Palpites"}
              </button>
            )}
          </div>
        </div>

        {/* Palpites do Chat */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Palpites do Chat</h2>

          {(guesses ?? []).length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-300">
              Nenhum palpite ainda. Formato:{" "}
              <code className="text-amber-300 font-mono">
                TimeA 3 x 2 TimeB
              </code>
              . Você pode usar o <em>nome</em> do time ou a <em>sigla</em>.
            </div>
          )}

          <ul className="space-y-3">
            {(guesses ?? []).map((g) => {
              // default para dados antigos: assume "home primeiro"
              const homeFirst = g.firstIsHome !== false;

              const leftCrest = homeFirst ? (
                <CrestMini file={m.homeBadgeFile} alt={m.home.name} />
              ) : (
                <CrestMini file={m.awayBadgeFile} alt={m.away.name} />
              );

              const rightCrest = homeFirst ? (
                <CrestMini file={m.awayBadgeFile} alt={m.away.name} />
              ) : (
                <CrestMini file={m.homeBadgeFile} alt={m.home.name} />
              );

              const leftScore = homeFirst ? g.goalsHome : g.goalsAway;
              const rightScore = homeFirst ? g.goalsAway : g.goalsHome;

              return (
                <li
                  key={g.id}
                  className="rounded-xl border border-amber-400/20 bg-zinc-900/60 px-4 py-2 shadow-[0_0_0_1px_rgba(255,196,28,0.06)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="max-w-[60%] truncate">
                      <span className="inline-flex items-center rounded-lg bg-zinc-800 px-3 py-1 text-sm font-medium">
                        {g.twitchDisplay}
                      </span>
                    </div>

                    {/* ordem EXATA digitada: escudo-left  placar  escudo-right */}
                    <div className="flex items-center gap-2 text-base font-semibold">
                      {leftCrest}
                      <span className="tabular-nums">{leftScore}</span>
                      <span className="opacity-70">×</span>
                      <span className="tabular-nums">{rightScore}</span>
                      {rightCrest}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </main>
  );
}
