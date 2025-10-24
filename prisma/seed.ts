/* eslint-disable no-console */
// prisma/seed.ts
import { PrismaClient, MatchRegion } from "@prisma/client";

const prisma = new PrismaClient();

type TeamInput = {
  code: string;
  name: string;
  aliases: string[];
  badgeFile?: string; // opcional; default -> `${code.toLowerCase()}.png`
};

/* ─────────────── 🇪🇸 SPAIN ─────────────── */
const TEAMS_ES: TeamInput[] = [
  {
    code: "1K",
    name: "1K FC",
    aliases: ["1K", "1K FC", "1KFC"],
    badgeFile: "1k.png",
  },
  {
    code: "ELB",
    name: "El Barrio",
    aliases: ["El Barrio", "Barrio", "ELB"],
    badgeFile: "elbarrio.png",
  },
  {
    code: "JFC",
    name: "Jijantes FC",
    aliases: ["Jijantes", "Jijantes FC", "JFC"],
    badgeFile: "jijantes.png",
  },
  {
    code: "LCA",
    name: "La Capital CF",
    aliases: ["La Capital", "La Capital CF", "LCA"],
    badgeFile: "lacapital.png",
  },
  {
    code: "TFC",
    name: "Los Troncos FC",
    aliases: ["Los Troncos", "Troncos", "TFC"],
    badgeFile: "lostroncos.png",
  },
  {
    code: "PIO",
    name: "PIO FC",
    aliases: ["PIO", "PIO FC"],
    badgeFile: "pio.png",
  },
  {
    code: "POR",
    name: "Porcinos FC",
    aliases: ["Porcinos", "Porcinos FC", "POR"],
    badgeFile: "porcinos.png",
  },
  {
    code: "RDB",
    name: "Rayo de Barcelona",
    aliases: ["Rayo de Barcelona", "Rayo", "RDB"],
    badgeFile: "rayodebarcelona.png",
  },
  {
    code: "SAI",
    name: "Saiyans FC",
    aliases: ["Saiyans", "Saiyans FC", "SAI"],
    badgeFile: "saiyans.png",
  },
  {
    code: "SKU",
    name: "Skull FC",
    aliases: ["Skull", "Skull FC", "SKU"],
    badgeFile: "skull.png",
  },
  {
    code: "ULT",
    name: "Ultimate Móstoles",
    aliases: ["Ultimate Móstoles", "Ultimate Mostoles", "UM", "ULT"],
    badgeFile: "ultimatemostoles.png",
  },
  {
    code: "XBU",
    name: "xBuyer Team",
    aliases: ["xBuyer", "xBuyer Team", "XBuyer Team", "XBU"],
    badgeFile: "xbuyerteam.png",
  },
];

/* ─────────────── 🇲🇽 MEXICO ─────────────── */
const TEAMS_MX: TeamInput[] = [
  {
    code: "ANI",
    name: "Aniquiladores FC",
    aliases: ["Aniquiladores", "Aniquiladores FC", "ANI"],
    badgeFile: "aniquiladores.png",
  },
  {
    code: "APF",
    name: "Atlético Parceros FC",
    aliases: ["Atlético Parceros", "Atletico Parceros", "Parceros", "APF"],
    badgeFile: "atleticoparceros.png",
  },
  {
    code: "CDC",
    name: "Club de Cuervos",
    aliases: ["Club de Cuervos", "Cuervos", "CDC"],
    badgeFile: "clubdecuervos.png",
  },
  {
    code: "GDC",
    name: "Galácticos del Caribe",
    aliases: ["Galácticos del Caribe", "Galacticos del Caribe", "GDC"],
    badgeFile: "galacticosdelcaribe.png",
  },
  {
    code: "GUE",
    name: "Guerrilla FC",
    aliases: ["Guerrilla", "Guerrilla FC", "GUE"],
    badgeFile: "guerrillafc.png",
  },
  {
    code: "KRU",
    name: "KRÜ FC",
    aliases: ["KRÜ", "KRU", "KRÜ FC", "KRU FC"],
    badgeFile: "kru.png",
  },
  {
    code: "LAI",
    name: "Los Aliens FC",
    aliases: ["Los Aliens", "Aliens", "LAI"],
    badgeFile: "losaliens.png",
  },
  {
    code: "CHA",
    name: "Los Chamos FC",
    aliases: ["Los Chamos", "Chamos", "CHA"],
    badgeFile: "loschamos.png",
  },
  {
    code: "PLC",
    name: "Peluche Caligari",
    aliases: ["Peluche Caligari", "PLC"],
    badgeFile: "peluchecaligari.png",
  },
  {
    code: "PRS",
    name: "Persas FC",
    aliases: ["Persas", "Persas FC", "PRS"],
    badgeFile: "persas.png",
  },
  {
    code: "RAN",
    name: "Raniza FC",
    aliases: ["Raniza", "Raniza FC", "RAN"],
    badgeFile: "raniza.png",
  },
  {
    code: "SIM",
    name: "Simios FC",
    aliases: ["Simios", "Simios FC", "SIM"],
    badgeFile: "simios.png",
  },
];

/* ─────────────── 🇮🇹 ITALY ─────────────── */
const TEAMS_IT: TeamInput[] = [
  {
    code: "APK",
    name: "Alpak FC",
    aliases: ["Alpak", "Alpak FC", "APK"],
    badgeFile: "alpak.png",
  },
  {
    code: "BBR",
    name: "BIGBRO",
    aliases: ["BIGBRO", "BBR"],
    badgeFile: "bigbro.png",
  },
  {
    code: "BMR",
    name: "Boomers",
    aliases: ["Boomers", "BMR"],
    badgeFile: "boomers.png",
  },
  {
    code: "CIR",
    name: "Circus FC",
    aliases: ["Circus", "Circus FC", "CIR"],
    badgeFile: "circus.png",
  },
  {
    code: "DPW",
    name: "D-Power",
    aliases: ["D-Power", "DPower", "DPW"],
    badgeFile: "dpower.png",
  },
  {
    code: "FCA",
    name: "FC Caesar",
    aliases: ["FC Caesar", "Caesar", "FCA"],
    badgeFile: "fccaesar.png",
  },
  {
    code: "ZTA",
    name: "FC Zeta",
    aliases: ["FC Zeta", "Zeta", "ZTA"],
    badgeFile: "fczeta.png",
  },
  {
    code: "GR7",
    name: "Gear 7 FC",
    aliases: ["Gear 7", "Gear7", "Gear 7 FC", "GR7"],
    badgeFile: "gear7fc.png",
  },
  {
    code: "STL",
    name: "Stallions",
    aliases: ["Stallions", "STL"],
    badgeFile: "stallions.png",
  },
  {
    code: "TRM",
    name: "TRM FC",
    aliases: ["TRM", "TRM FC"],
    badgeFile: "trmfc.png",
  },
  {
    code: "UND",
    name: "Underdogs FC",
    aliases: ["Underdogs", "Underdogs FC", "UND"],
    badgeFile: "underdogsfc.png",
  },
  {
    code: "ZEB",
    name: "Zebras FC",
    aliases: ["Zebras", "Zebras FC", "ZEB"],
    badgeFile: "zebrasfc.png",
  },
];

/* ─────────────── 🇧🇷 BRAZIL ─────────────── */
const TEAMS_BR: TeamInput[] = [
  {
    code: "CAP",
    name: "Capim FC",
    aliases: ["Capim", "Capim FC", "CAP"],
    badgeFile: "capimfc.png",
  },
  {
    code: "DDL",
    name: "Dendele FC",
    aliases: ["Dendele", "Dendele FC", "DDL"],
    badgeFile: "dendele.png",
  },
  {
    code: "DSM",
    name: "Desimpedidos",
    aliases: ["Desimpedidos", "DSM"],
    badgeFile: "desimpedidos.png",
  },
  {
    code: "ELT",
    name: "FC Real Elite",
    aliases: ["Real Elite", "FC Real Elite", "ELT"],
    badgeFile: "realelite.png",
  },
  {
    code: "FLX",
    name: "Fluxo FC",
    aliases: ["Fluxo", "Fluxo FC", "FLX"],
    badgeFile: "fluxo.png",
  },
  {
    code: "FNK",
    name: "Funkbol Clube",
    aliases: ["Funkbol", "Funkbol Clube", "FNK"],
    badgeFile: "funkbol.png",
  },
  {
    code: "FUR",
    name: "Furia FC",
    aliases: ["Furia", "FURIA", "Furia FC", "FUR"],
    badgeFile: "furia.png",
  },
  {
    code: "G3X",
    name: "G3X FC",
    aliases: ["G3X", "G3X FC"],
    badgeFile: "g3x.png",
  },
  {
    code: "LSC",
    name: "LOUD SC",
    aliases: ["LOUD", "LOUD SC", "LSC"],
    badgeFile: "loud.png",
  },
  {
    code: "NYV",
    name: "Nyvelados FC",
    aliases: ["Nyvelados", "Nyvelados FC", "NYV"],
    badgeFile: "nyvelados.png",
  },
];

/* ─────────────── 🇫🇷 FRANCE ─────────────── */
const TEAMS_FR: TeamInput[] = [
  {
    code: "3SN",
    name: "360 Nation",
    aliases: ["360 Nation", "360Nation", "3SN"],
    badgeFile: "360nation.png",
  },
  { code: "F2R", name: "F2R", aliases: ["F2R"], badgeFile: "f2r.png" },
  {
    code: "FCS",
    name: "FC Silmi",
    aliases: ["FC Silmi", "Silmi", "FCS"],
    badgeFile: "fcs.png",
  },
  {
    code: "GN7",
    name: "Generation Seven",
    aliases: ["Generation Seven", "Gen Seven", "GN7"],
    badgeFile: "generationseven.png",
  },
  {
    code: "KRS",
    name: "Karasu",
    aliases: ["Karasu", "KRS"],
    badgeFile: "karasu.png",
  },
  {
    code: "PAS",
    name: "Panam All Starz",
    aliases: ["Panam All Starz", "Panam", "PAS"],
    badgeFile: "panamallstarz.png",
  },
  {
    code: "U3D",
    name: "Unit3d",
    aliases: ["Unit3d", "UNIT3D", "U3D"],
    badgeFile: "unit3d.png",
  },
  {
    code: "WPF",
    name: "Wolf Pack FC",
    aliases: ["Wolf Pack", "Wolf Pack FC", "WPF"],
    badgeFile: "wolfpackfc.png",
  },
];

/* ─────────────── 🇩🇪 GERMANY ─────────────── */
const TEAMS_DE: TeamInput[] = [
  {
    code: "ERA",
    name: "Era Colonia",
    aliases: ["Era Colonia", "ERA"],
    badgeFile: "eracolonia.png",
  },
  {
    code: "FLC",
    name: "Futbolistas Locos FC",
    aliases: ["Futbolistas Locos", "Futbolistas Locos FC", "FLC"],
    badgeFile: "futbolistaslocosfc.png",
  },
  {
    code: "G2F",
    name: "G2 FC",
    aliases: ["G2 FC", "G2F"],
    badgeFile: "g2f.png",
  },
  {
    code: "KKI",
    name: "Kaktus Kickers",
    aliases: ["Kaktus Kickers", "KKI"],
    badgeFile: "kaktuskickers.png",
  },
  {
    code: "NRF",
    name: "No Rules FC",
    aliases: ["No Rules", "No Rules FC", "NRF"],
    badgeFile: "norulesfc.png",
  },
  {
    code: "TTF",
    name: "Tiki Tacker Fußball Freunde",
    aliases: ["Tiki Tacker", "Fussball Freunde", "TTF"],
    badgeFile: "tikitackerfussballfreunde.png",
  },
  {
    code: "VVF",
    name: "Vice Versa FC",
    aliases: ["Vice Versa", "Vice Versa FC", "VVF"],
    badgeFile: "viceversafc.png",
  },
  {
    code: "YFC",
    name: "Youniors F.C.",
    aliases: ["Youniors", "Youniors F.C.", "YFC"],
    badgeFile: "youniorsfc.png",
  },
];

/* ─────────────── 🌍 MENA ─────────────── */
const TEAMS_MENA: TeamInput[] = [
  { code: "3BS", name: "3BS", aliases: ["3BS"], badgeFile: "3bs.png" },
  {
    code: "ABO",
    name: "ABO FC",
    aliases: ["ABO FC", "ABO"],
    badgeFile: "abofc.png",
  },
  { code: "DR7", name: "DR7", aliases: ["DR7"], badgeFile: "dr7.png" },
  { code: "FWZ", name: "FWZ", aliases: ["FWZ"], badgeFile: "fwz.png" },
  {
    code: "RZN",
    name: "Red Zone",
    aliases: ["Red Zone", "RZN"],
    badgeFile: "redzone.png",
  },
  { code: "SXB", name: "SXB", aliases: ["SXB"], badgeFile: "sxb.png" },
  {
    code: "TRB",
    name: "Turbo",
    aliases: ["Turbo", "TRB"],
    badgeFile: "turbo.png",
  },
  {
    code: "UCM",
    name: "Ultra Chmicha",
    aliases: ["Ultra Chmicha", "UCM"],
    badgeFile: "ultrachmicha.png",
  },
];

/* ─────────────── helpers ─────────────── */
async function upsertTeam(t: TeamInput, region: MatchRegion) {
  const badgeFile = t.badgeFile ?? `${t.code.toLowerCase()}.png`;

  const team = await prisma.team.upsert({
    where: { code: t.code },
    update: { name: t.name, region, badgeFile },
    create: { code: t.code, name: t.name, region, badgeFile },
  });

  // evita aliases vazios/duplicados
  for (const raw of t.aliases) {
    const alias = raw.trim();
    if (!alias) continue;
    await prisma.teamAlias.upsert({
      where: { teamId_alias: { teamId: team.id, alias } },
      update: {},
      create: { teamId: team.id, alias },
    });
  }
}

async function seedTeams() {
  // iteramos região por região
  for (const t of TEAMS_ES) await upsertTeam(t, "ES");
  for (const t of TEAMS_MX) await upsertTeam(t, "MX");
  for (const t of TEAMS_IT) await upsertTeam(t, "IT");
  for (const t of TEAMS_BR) await upsertTeam(t, "BR");
  for (const t of TEAMS_FR) await upsertTeam(t, "FR");
  for (const t of TEAMS_DE) await upsertTeam(t, "DE");
  for (const t of TEAMS_MENA) await upsertTeam(t, "MENA");
}

async function main() {
  console.log("🌱 Seeding Kings League – todas as ligas…");
  await seedTeams();
  console.log("✅ Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });