// app/admin/ui/AdminClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

type Region = "ES" | "MX" | "IT" | "BR" | "FR" | "DE" | "MENA";

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
  // opcionalmente o backend pode enviar lastSeenAt para ordenar
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
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Falha ao carregar");
    return r.json();
  });

export default function AdminClient({ initialTeams, initialMatches }: Props) {
  const router = useRouter();

  // ← Canais que já usaram o sistema (atualiza periodicamente)
  const { data: streamersFetch, isLoading: loadingStreamers } = useSWR<
    Streamer[]
  >(
    "/api/admin/streamers",
    fetcher,
    { refreshInterval: 15000 } // 15s para ir aparecendo novos
  );

  // Mantém uma lista ACUMULATIVA e DEDUPLICADA por login (não substitui anterior)
  const [allStreamers, setAllStreamers] = useState<Streamer[]>([]);

  useEffect(() => {
    if (!streamersFetch || streamersFetch.length === 0) return;

    setAllStreamers((prev) => {
      // dedup por login; atualiza dados se já existir
      const byLogin = new Map<string, Streamer>();

      // começa com os anteriores (preserva ordem)
      for (const s of prev) {
        const key = (s.login ?? "").toLowerCase();
        if (!key) continue;
        byLogin.set(key, s);
      }

      // acrescenta/atualiza com os novos
      for (const s of streamersFetch) {
        const key = (s.login ?? "").toLowerCase();
        if (!key) continue;

        const existing = byLogin.get(key);
        if (!existing) {
          byLogin.set(key, s);
        } else {
          // atualiza campos possivelmente alterados (ex.: avatar)
          byLogin.set(key, {
            ...existing,
            displayName: s.displayName ?? existing.displayName,
            avatarUrl: s.avatarUrl ?? existing.avatarUrl,
            id: s.id ?? existing.id,
            lastSeenAt: s.lastSeenAt ?? existing.lastSeenAt,
          });
        }
      }

      // Ordena opcionalmente por lastSeenAt desc se existir, senão mantém ordem de inserção
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

  // form state (criar partida)
  const [region, setRegion] = useState<Region>("BR");
  const [homeId, setHomeId] = useState("");
  const [awayId, setAwayId] = useState("");
  const [round, setRound] = useState<number>(1);
  const [startsAt, setStartsAt] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // depois (defensivo: se não houver region no time, mostramos mesmo assim)
  const teamsByRegion = useMemo(
    () => initialTeams.filter((t) => !t.region || t.region === region),
    [initialTeams, region]
  );

  // criar partida
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
          startsAt: new Date(startsAt).toISOString(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setHomeId("");
      setAwayId("");
      setStartsAt("");
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Erro ao criar partida");
    } finally {
      setBusy(false);
    }
  }

  // remover
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

  // salvar resultado
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

  // agrupado por rodada
  const grouped = useMemo(() => {
    const map = new Map<number, Match[]>();
    for (const m of initialMatches) {
      const arr = map.get(m.round) || [];
      arr.push(m);
      map.set(m.round, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
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

          {loadingStreamers && allStreamers.length === 0 ? (
            <div className="text-sm text-zinc-400">Carregando canais…</div>
          ) : allStreamers.length === 0 ? (
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
                    {/* usar <img> para evitar config domains do next/image */}
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

            {/* Time da casa */}
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

            {/* Time visitante */}
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

        {/* Listagem + salvar resultado */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Partidas Cadastradas</h3>

          {grouped.map(([rodada, list]) => (
            <div
              key={rodada}
              className="rounded-2xl border border-amber-400/20 bg-zinc-900/40 p-4"
            >
              <div className="text-sm text-zinc-400 mb-3">Rodada {rodada}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((m) => (
                  <MatchRow
                    key={m.id}
                    m={m}
                    onRemove={() => removeMatch(m.id)}
                    onSave={saveResult}
                  />
                ))}
              </div>
            </div>
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

// Componente de linha com inputs numéricos e botão Salvar
function MatchRow({
  m,
  onRemove,
  onSave,
}: {
  m: Match;
  onRemove: () => void;
  onSave: (id: string, gh: number, ga: number) => Promise<void>;
}) {
  const [gh, setGh] = useState<number>(m.result?.goalsHome ?? 0);
  const [ga, setGa] = useState<number>(m.result?.goalsAway ?? 0);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(m.id, gh, ga);
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="text-xs text-zinc-400 flex items-center justify-between">
        <span>
          {REGION_LABEL[m.region]} •{" "}
          {new Date(m.startsAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <button
          onClick={onRemove}
          className="rounded-lg bg-red-600/90 text-white px-3 py-1.5 hover:bg-red-600"
        >
          Remover
        </button>
      </div>

      <div className="mt-2 flex items-center justify-center gap-3 text-[15px]">
        <span className="font-medium text-zinc-100">{m.home.name}</span>
        <input
          type="number"
          min={0}
          value={gh}
          onChange={(e) => setGh(Number(e.target.value))}
          className="w-16 text-center rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1"
        />
        <span className="opacity-70">×</span>
        <input
          type="number"
          min={0}
          value={ga}
          onChange={(e) => setGa(Number(e.target.value))}
          className="w-16 text-center rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1"
        />
        <span className="font-medium text-zinc-100">{m.away.name}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-lg bg-emerald-600/90 text-white px-3 py-1.5 hover:bg-emerald-600 disabled:opacity-70"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
