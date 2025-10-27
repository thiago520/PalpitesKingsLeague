// app/admin/ui/AdminClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

type Region =
  | "ES"
  | "MX"
  | "IT"
  | "BR"
  | "FR"
  | "DE"
  | "MENA"
  | "QL_ES"
  | "QL_MX";

type Team = {
  id: string;
  name: string;
  code: string;
  region: Region;
  badgeFile?: string | null;
};

type Match = {
  id: string;
  round: number;
  region: Region;
  startsAt: string;
  home: { id: string; name: string; code: string };
  away: { id: string; name: string; code: string };
  result: { goalsHome: number; goalsAway: number } | null;
};

type Props = { initialTeams: Team[]; initialMatches: Match[] };

type Streamer = {
  id?: string | null;
  login: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  lastSeenAt?: string | null;
};

const REGION_LABEL: Record<Region, string> = {
  ES: "Espanha",
  MX: "México",
  IT: "Itália",
  BR: "Brasil",
  FR: "França",
  DE: "Alemanha",
  MENA: "MENA",
  QL_ES: "QL Espanha",
  QL_MX: "QL México",
};

const REGION_ORDER: Region[] = [
  "BR",
  "ES",
  "MX",
  "IT",
  "FR",
  "DE",
  "MENA",
  "QL_ES",
  "QL_MX",
];

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Falha ao carregar");
    return r.json();
  });

/** ====== Helpers de formatação iguais ao /matches ====== */
function formatDate(s: string) {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (m) {
    const [, y, mo, d] = m;
    return `${d}/${mo}/${y}`; // dd/MM/yyyy
  }
  try {
    const d = new Date(s);
    return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d);
  } catch {
    return s;
  }
}
function formatTime(s: string) {
  const m = s.match(/T(\d{2}):(\d{2})/);
  if (m) {
    const [, hh, mm] = m;
    return `${hh}:${mm}`;
  }
  try {
    const d = new Date(s);
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return "";
  }
}

/** ====== Ícones iguais ao /matches ====== */
function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      className="inline-block align-[-2px]"
      fill="currentColor"
    >
      <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm13 8H6v10h14V10Z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      className="inline-block align-[-2px]"
      fill="currentColor"
    >
      <path d="M12 1a11 11 0 1 1 0 22A11 11 0 0 1 12 1Zm1 6h-2v6l5 3 1-1.73-4-2.27V7Z" />
    </svg>
  );
}

function Crest({ file, alt }: { file?: string | null; alt: string }) {
  const src = file ? `/img/${file}` : "/img/placeholder-ball.png";
  return (
    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full grid place-items-center bg-zinc-800/60 border border-zinc-700 overflow-hidden">
      {/* usar img simples aqui para evitar domain config */}
      <img
        src={src}
        alt={alt}
        width={48}
        height={48}
        className="object-contain"
      />
    </div>
  );
}

/** ====== Card do ADMIN no mesmo estilo do /matches, com inputs e salvar→editar ====== */
function AdminMatchCard({
  m,
  homeBadge,
  awayBadge,
  onRemove,
  onSave,
}: {
  m: Match;
  homeBadge?: string | null;
  awayBadge?: string | null;
  onRemove: () => void;
  onSave: (id: string, gh: number, ga: number) => Promise<void>;
}) {
  const [gh, setGh] = useState<number>(m.result?.goalsHome ?? 0);
  const [ga, setGa] = useState<number>(m.result?.goalsAway ?? 0);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(true); // começa editável; após salvar vira "Editar"

  async function handleSaveOrEdit() {
    if (!editing) {
      setEditing(true);
      return;
    }
    setBusy(true);
    await onSave(m.id, gh, ga);
    setBusy(false);
    setEditing(false);
  }

  const hasResult = m.result !== null;

  return (
    <div
      className={[
        "rounded-2xl border p-5 shadow-[0_0_0_1px_rgba(255,196,28,0.08),0_18px_50px_-20px_rgba(0,0,0,.8)]",
        hasResult
          ? "border-green-400/20 bg-green-900/20"
          : "border-amber-400/20 bg-zinc-900/60",
      ].join(" ")}
    >
      {/* Top bar com região + horário e botão remover */}
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
        <span>
          {REGION_LABEL[m.region]} • {formatDate(m.startsAt)} •{" "}
          {formatTime(m.startsAt)}
        </span>
        <button
          onClick={onRemove}
          className="rounded-lg bg-red-600/90 text-white px-2.5 py-1 hover:bg-red-600"
          title="Remover partida"
        >
          Remover
        </button>
      </div>

      {/* Linha principal: escudos e VS/placar (visual) */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-2 w-1/3">
          <Crest file={homeBadge} alt={m.home.name} />
          <div className="text-sm font-semibold text-zinc-100 text-center">
            {m.home.name}
          </div>
        </div>

        <div className="w-1/3 text-center">
          {hasResult ? (
            <div className="font-extrabold text-xl">
              <span
                className={[
                  "text-2xl",
                  m.result!.goalsHome > m.result!.goalsAway
                    ? "text-green-400"
                    : "text-zinc-300",
                ].join(" ")}
              >
                {m.result!.goalsHome}
              </span>
              <span className="text-zinc-500 mx-2">x</span>
              <span
                className={[
                  "text-2xl",
                  m.result!.goalsAway > m.result!.goalsHome
                    ? "text-green-400"
                    : "text-zinc-300",
                ].join(" ")}
              >
                {m.result!.goalsAway}
              </span>
            </div>
          ) : (
            <div className="font-extrabold text-amber-400 text-xl">VS</div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 w-1/3">
          <Crest file={awayBadge} alt={m.away.name} />
          <div className="text-sm font-semibold text-zinc-100 text-center">
            {m.away.name}
          </div>
        </div>
      </div>

      {/* Rodapé: inputs numéricos + botões */}
      <div className="mt-4">
        <div className="flex items-center justify-center gap-3">
          <input
            type="number"
            min={0}
            value={gh}
            onChange={(e) => setGh(Number(e.target.value))}
            disabled={!editing}
            className="w-16 text-center rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1 disabled:opacity-60"
          />
          <span className="opacity-70">×</span>
          <input
            type="number"
            min={0}
            value={ga}
            onChange={(e) => setGa(Number(e.target.value))}
            disabled={!editing}
            className="w-16 text-center rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1 disabled:opacity-60"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleSaveOrEdit}
            disabled={busy}
            className={[
              "flex-1 rounded-lg px-3 py-2 font-semibold transition",
              editing
                ? "bg-emerald-600/90 text-white hover:bg-emerald-600"
                : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-600",
            ].join(" ")}
          >
            {busy ? "Salvando..." : editing ? "Salvar" : "Editar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminClient({ initialTeams, initialMatches }: Props) {
  const router = useRouter();

  /** ====== Streamers (inalterado) ====== */
  const { data: streamersFetch, isLoading: loadingStreamers } = useSWR<
    Streamer[]
  >("/api/admin/streamers", fetcher, { refreshInterval: 15000 });

  const [allStreamers, setAllStreamers] = useState<Streamer[]>([]);
  useEffect(() => {
    if (!streamersFetch || streamersFetch.length === 0) return;
    setAllStreamers((prev) => {
      const byLogin = new Map<string, Streamer>();
      for (const s of prev) {
        const key = (s.login ?? "").toLowerCase();
        if (!key) continue;
        byLogin.set(key, s);
      }
      for (const s of streamersFetch) {
        const key = (s.login ?? "").toLowerCase();
        if (!key) continue;
        const existing = byLogin.get(key);
        if (!existing) byLogin.set(key, s);
        else {
          byLogin.set(key, {
            ...existing,
            displayName: s.displayName ?? existing.displayName,
            avatarUrl: s.avatarUrl ?? existing.avatarUrl,
            id: s.id ?? existing.id,
            lastSeenAt: s.lastSeenAt ?? existing.lastSeenAt,
          });
        }
      }
      const arr = Array.from(byLogin.values());
      const hasLastSeen = arr.some((x) => !!x.lastSeenAt);
      if (hasLastSeen) {
        arr.sort((a, b) => {
          const ta = a.lastSeenAt ? Date.parse(a.lastSeenAt) : 0;
          const tb = b.lastSeenAt ? Date.parse(b.lastSeenAt) : 0;
          return tb - ta;
        });
      }
      return arr;
    });
  }, [streamersFetch]);

  /** ====== Form de cadastro ====== */
  const [region, setRegion] = useState<Region>("BR");
  const [homeId, setHomeId] = useState("");
  const [awayId, setAwayId] = useState("");
  const [round, setRound] = useState<number>(1);
  const [startsAt, setStartsAt] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const allowedTeamRegionsByRegion: Record<Region, Region[]> = {
    BR: ["BR"],
    ES: ["ES"],
    MX: ["MX"],
    IT: ["IT"],
    FR: ["FR"],
    DE: ["DE"],
    MENA: ["MENA"],
    QL_ES: ["ES"], // Queens ES usa times da Espanha
    QL_MX: ["MX"], // Queens MX usa times do México
  };

  const teamsByRegion = useMemo(() => {
    const allowed = allowedTeamRegionsByRegion[region];
    return initialTeams.filter((t) => !t.region || allowed.includes(t.region));
  }, [initialTeams, region]);

  const teamById = useMemo(() => {
    const m = new Map<string, Team>();
    for (const t of initialTeams) m.set(t.id, t);
    return m;
  }, [initialTeams]);

  async function createMatch() {
    if (!homeId || !awayId || !startsAt) {
      alert("Preencha times e data/hora");
      return;
    }
    if (homeId === awayId) {
      alert("Times não podem ser iguais");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeId,
          awayId,
          round,
          region,
          // 🔴 Envia o valor cru do input (sem toISOString) — backend faz a conversão wallclock
          startsAt,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setHomeId("");
      setAwayId("");
      setStartsAt("");
      setRound(1);
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Erro ao criar partida");
    } finally {
      setBusy(false);
    }
  }

  async function removeMatch(id: string) {
    if (!confirm("Remover esta partida?")) return;
    const res = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert(t || "Falha ao remover");
      return;
    }
    router.refresh();
  }

  async function saveResult(id: string, goalsHome: number, goalsAway: number) {
    const res = await fetch(`/api/matches/${id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalsHome, goalsAway }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert(t || "Falha ao salvar resultado");
      return;
    }
    router.refresh();
  }

  /** ====== Agrupar por RODADA (desc) e dentro por REGIÃO ====== */
  const grouped = useMemo(() => {
    // round -> region -> matches[]
    const map = new Map<number, Map<Region, Match[]>>();
    for (const m of initialMatches) {
      const rmap = map.get(m.round) ?? new Map<Region, Match[]>();
      const arr = rmap.get(m.region) ?? [];
      arr.push(m);
      rmap.set(m.region, arr);
      map.set(m.round, rmap);
    }

    // rounds desc
    const roundsDesc = Array.from(map.entries()).sort(([a], [b]) => b - a);

    // normalize inner order of regions using REGION_ORDER
    return roundsDesc.map(([round, rmap]) => {
      const regions = REGION_ORDER.filter((reg) => rmap.has(reg)).map(
        (reg) => [reg, rmap.get(reg)!] as [Region, Match[]]
      );
      return { round, regions };
    });
  }, [initialMatches]);

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-amber-400/20 bg-black/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold">
            <span className="text-amber-300">Kings League</span> - Palpites
          </h1>
          <nav className="flex gap-2">
            <a
              className="rounded-lg px-3 py-1.5 border border-amber-400/30 hover:bg-zinc-900"
              href="/ranking"
            >
              🏆 Ranking
            </a>
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

      <section className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <h2 className="text-3xl font-extrabold">Painel Admin</h2>

        {/* Canais que já usaram o sistema */}
        <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-5">
          <div className="font-semibold text-amber-300 mb-3">
            Canais que já usaram o sistema
          </div>
          {!allStreamers.length && loadingStreamers ? (
            <div className="text-sm text-zinc-400">Carregando canais…</div>
          ) : !allStreamers.length ? (
            <div className="text-sm text-zinc-400">
              Ainda não há capturas iniciadas por nenhum canal.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {allStreamers.map((s) => {
                const key = (s.login ?? "").toLowerCase() || cryptoKey(s);
                return (
                  <a
                    key={key}
                    href={s.login ? `https://twitch.tv/${s.login}` : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-zinc-900 px-3 py-1.5 hover:bg-zinc-800 transition"
                    title={s.displayName ?? s.login ?? undefined}
                  >
                    <span className="inline-flex h-7 w-7 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                      {s.avatarUrl ? (
                        <img
                          src={s.avatarUrl}
                          alt={s.displayName ?? s.login ?? "avatar"}
                          width={28}
                          height={28}
                          className="h-7 w-7 object-cover"
                        />
                      ) : (
                        <span className="h-7 w-7 grid place-items-center text-[10px] text-zinc-400">
                          ?
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium text-zinc-200">
                      {s.displayName ?? s.login ?? "—"}
                    </span>
                    {s.login && (
                      <span className="text-xs text-zinc-400 group-hover:text-zinc-300">
                        @{s.login}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Cadastro */}
        <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-5">
          <div className="font-semibold text-amber-300 mb-3">
            ＋ Cadastrar Nova Partida
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Região */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Região</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2"
              >
                {Object.keys(REGION_LABEL).map((k) => (
                  <option key={k} value={k}>
                    {REGION_LABEL[k as Region]}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-400 mt-1">
                Os combos de time mostram apenas {REGION_LABEL[region]}.
              </p>
            </div>

            {/* Rodada */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Rodada</label>
              <input
                type="number"
                min={1}
                value={round}
                onChange={(e) => setRound(Number(e.target.value))}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2"
              />
            </div>

            {/* Casa */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Time da Casa
              </label>
              <select
                value={homeId}
                onChange={(e) => setHomeId(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2"
              >
                <option value="">Selecione o time</option>
                {teamsByRegion.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Visitante */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Time Visitante
              </label>
              <select
                value={awayId}
                onChange={(e) => setAwayId(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2"
              >
                <option value="">Selecione o time</option>
                {teamsByRegion.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Data/hora */}
            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1">
                Horário da Partida
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Dica: digite <code>17:00</code> — o banco grava exatamente o que
                você inserir.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={createMatch}
              disabled={busy}
              className="w-full md:w-auto rounded-xl bg-amber-400 text-black font-semibold px-5 py-2.5 hover:bg-amber-300 active:translate-y-px disabled:opacity-70"
            >
              {busy ? "Salvando..." : "Cadastrar Partida"}
            </button>
          </div>
        </div>

        {/* Listagem agrupada por rodada (desc) e região */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Partidas Cadastradas</h3>

          {grouped.map(({ round, regions }) => (
            <section
              key={round}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <h4 className="text-xl font-bold">
                  Rodada <span className="text-amber-300">{round}</span>
                </h4>
                <span className="text-xs uppercase tracking-wider text-zinc-400">
                  {regions.reduce((acc, [, list]) => acc + list.length, 0)}{" "}
                  partidas
                </span>
              </div>

              <div className="p-4 space-y-5">
                {regions.map(([reg, list]) => (
                  <div key={reg}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-zinc-300">
                        {REGION_LABEL[reg]}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {list.length}{" "}
                        {list.length === 1 ? "partida" : "partidas"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {list.map((m) => (
                        <AdminMatchCard
                          key={m.id}
                          m={m}
                          homeBadge={teamById.get(m.home.id)?.badgeFile ?? null}
                          awayBadge={teamById.get(m.away.id)?.badgeFile ?? null}
                          onRemove={() => removeMatch(m.id)}
                          onSave={saveResult}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

// Fallback de chave caso streamer.login esteja nulo
function cryptoKey(s: Streamer) {
  return `${s.id ?? "s"}-${s.displayName ?? "d"}-${s.avatarUrl ?? "a"}`;
}
