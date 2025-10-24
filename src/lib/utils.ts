export const SCORE_REGEX = /^(?<t1>[A-Za-zÀ-ÿ0-9\.\-_ ]{2,})\s+(?<g1>\d{1,2})\s*[xX\-–]\s*(?<g2>\d{1,2})\s+(?<t2>[A-Za-zÀ-ÿ0-9\.\-_ ]{2,})\s*$/u;

export function normalizeName(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

export function cmpOutcome(aH: number, aA: number, bH: number, bA: number) {
  const da = Math.sign(aH - aA);
  const db = Math.sign(bH - bA);
  return da === db; // true se vencedor/empate coincide
}