/**
 * pricing.ts · Moteur de tarification côté client (recalcul live du simulateur).
 *
 * ⚠️ MIROIR de lib/calculer_devis.js (le moteur canonical, exposé via /api/devis
 * et appelé par l'agent n8n). Les valeurs DOIVENT rester identiques : même grille,
 * mêmes coefficients, même ordre de cascade. Toute évolution tarifaire se fait
 * d'abord dans calculer_devis.js, puis ici.
 *
 * Depuis le branchement backend, le simulateur appelle directement /api/devis :
 *  - urgencyMeta() / capacityLabel() servent à l'affichage (badge, graduations)
 *    et à déduire le code d'urgence DD_* envoyé au backend ;
 *  - compute() reste un MIROIR de référence (parité vérifiable en test), il n'est
 *    plus la source des montants affichés.
 */

export type Trip = "simple" | "ar";

export interface SimInput {
  passengers: number;
  distanceKm: number;
  date: string; // YYYY-MM-DD (date de départ)
  roundTrip: boolean;
  guides: number;
  guideDays: number;
  driverNights: number;
  tollsIncluded: boolean;
}

export interface LedgerLine {
  key: string;
  label: string;
  sub: string;
  op: string; // ex: "+ 15 %", "× 2"
  hasOp: boolean;
  delta: string; // montant signé formaté
  running: string; // total courant formaté
}

export interface OptionLine {
  key: string;
  label: string;
  sub: string;
  delta: string;
  running: string;
}

export interface Computed {
  lines: LedgerLine[];
  options: OptionLine[];
  hasOptions: boolean;
  transport: string;
  ht: string;
  tva: string;
  ttc: string;
  urg: { coef: number; label: string; note: string };
  cap: { coef: number; label: string };
  p: number;
  dist: number;
}

// Date de référence pour le calcul d'urgence (= "aujourd'hui").
export const TODAY = "2026-06-25";

const GRILLE: Record<number, number> = {
  30: 250, 40: 320, 50: 350, 60: 390, 70: 430, 80: 500, 90: 540,
  100: 580, 110: 620, 120: 660, 130: 700, 140: 740, 150: 780,
  160: 820, 170: 860, 180: 900,
};

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function baseFor(distanceKm: number): { base: number; label: string } {
  const d = Math.max(10, Math.ceil(distanceKm / 10) * 10);
  if (d <= 30) return { base: 250, label: "≤ 30 km · forfait" };
  if (d <= 180) return { base: GRILLE[d], label: `${d} km · grille forfaitaire` };
  return { base: distanceKm * 2 * 2.5, label: `${distanceKm} km · 2,50 €/km longue distance` };
}

function seasonFor(m: number): number {
  return [-0.07, -0.07, 0.1, 0.1, 0.15, 0.15, 0.1, -0.07, 0, 0, -0.07, 0][m];
}

function urgencyFor(date: string): Computed["urg"] {
  const today = new Date(`${TODAY}T00:00:00`);
  const dep = new Date(`${date}T00:00:00`);
  const days = Math.round((dep.getTime() - today.getTime()) / 86_400_000);
  if (isNaN(days)) return { coef: -0.05, label: "Normal", note: "départ dans moins de 3 mois" };
  if (days < 2) return { coef: 0.1, label: "Prioritaire", note: "départ dans moins de 48 h" };
  if (days < 7) return { coef: 0.05, label: "Urgent", note: "départ dans moins de 7 jours" };
  if (days < 90) return { coef: -0.05, label: "Normal", note: "départ dans moins de 3 mois" };
  return { coef: -0.1, label: "Anticipé", note: "départ dans plus de 3 mois" };
}

function capacityFor(p: number): Computed["cap"] {
  if (p <= 19) return { coef: -0.05, label: "1–19 pers. · −5 %" };
  if (p <= 53) return { coef: 0, label: "20–53 pers. · 0 %" };
  if (p <= 63) return { coef: 0.15, label: "54–63 pers. · +15 %" };
  if (p <= 67) return { coef: 0.2, label: "64–67 pers. · +20 %" };
  return { coef: 0.4, label: "68–85 pers. · +40 %" };
}

const fmt = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fmtSigned = (n: number) =>
  (n >= 0 ? "+ " : "− ") +
  Math.abs(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
  " €";
const pct = (c: number) =>
  (c >= 0 ? "+ " : "− ") +
  Math.abs(c * 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) +
  " %";

export function compute(s: SimInput): Computed {
  const p = Math.min(85, Math.max(1, Math.trunc(s.passengers) || 1));
  const dist = Math.max(1, Math.trunc(s.distanceKm) || 1);
  const month = new Date(`${s.date}T00:00:00`).getMonth();
  const safeMonth = isNaN(month) ? 8 : month;
  const baseInfo = baseFor(dist);
  const base = baseInfo.base;
  const urg = urgencyFor(s.date);
  const cap = capacityFor(p);
  const season = seasonFor(safeMonth);

  const lines: LedgerLine[] = [];
  let run = base;
  lines.push({ key: "base", label: "Tarif de base", sub: baseInfo.label, op: "", hasOp: false, delta: fmt(base), running: fmt(run) });

  if (s.roundTrip) {
    const before = run;
    run = base * 2;
    lines.push({ key: "rt", label: "Aller-retour", sub: "sur la base", op: "× 2", hasOp: true, delta: fmtSigned(run - before), running: fmt(run) });
  }
  {
    const d = run * 0.15;
    run += d;
    lines.push({ key: "marge", label: "Marge commerciale", sub: "sur le montant courant", op: "+ 15 %", hasOp: true, delta: fmtSigned(d), running: fmt(run) });
  }
  {
    const d = run * season;
    run += d;
    lines.push({ key: "saison", label: "Saisonnalité", sub: `départ en ${MOIS[safeMonth]}`, op: pct(season), hasOp: true, delta: fmtSigned(d), running: fmt(run) });
  }
  {
    const d = run * urg.coef;
    run += d;
    lines.push({ key: "urg", label: `Urgence — ${urg.label}`, sub: urg.note, op: pct(urg.coef), hasOp: true, delta: fmtSigned(d), running: fmt(run) });
  }
  {
    const d = run * cap.coef;
    run += d;
    lines.push({ key: "cap", label: "Capacité", sub: cap.label, op: pct(cap.coef), hasOp: true, delta: fmtSigned(d), running: fmt(run) });
  }
  const transport = run;

  const options: OptionLine[] = [];
  const guides = Math.max(0, Math.trunc(s.guides) || 0);
  const gdays = Math.max(0, Math.trunc(s.guideDays) || 0);
  const nights = Math.max(0, Math.trunc(s.driverNights) || 0);

  const guideCost = 80 * guides * gdays;
  if (guideCost > 0) {
    run += guideCost;
    options.push({ key: "g", label: "Guides", sub: `${guides} guide${guides > 1 ? "s" : ""} × ${gdays} j × 80 €`, delta: fmtSigned(guideCost), running: fmt(run) });
  }
  const nightCost = 120 * nights;
  if (nightCost > 0) {
    run += nightCost;
    options.push({ key: "n", label: "Nuits chauffeur", sub: `${nights} nuit${nights > 1 ? "s" : ""} × 120 €`, delta: fmtSigned(nightCost), running: fmt(run) });
  }
  if (s.tollsIncluded) {
    options.push({ key: "t", label: "Péages inclus", sub: "refacturés au réel selon trajet", delta: "0,00 €", running: fmt(run) });
  }

  const ht = run;
  const tva = ht * 0.1;
  const ttc = ht * 1.1;

  return {
    lines,
    options,
    hasOptions: options.length > 0,
    transport: fmt(transport),
    ht: fmt(ht),
    tva: fmt(tva),
    ttc: fmt(ttc),
    urg,
    cap,
    p,
    dist,
  };
}

/** Code d'urgence backend (DD_*) + libellés, déduits de la date de départ.
 *  Utilisé pour ENVOYER le bon code à /api/devis et afficher le badge. */
export function urgencyMeta(date: string): { code: string; label: string; note: string } {
  const u = urgencyFor(date);
  const code =
    u.label === "Prioritaire"
      ? "DD_PRIORITAIRE"
      : u.label === "Urgent"
        ? "DD_URGENT"
        : u.label === "Anticipé"
          ? "DD_3MOISETPLUS"
          : "DD_NORMAL";
  return { code, label: u.label, note: u.note };
}

/** Libellé de tranche de capacité (affichage des graduations du slider). */
export function capacityLabel(passengers: number): string {
  return capacityFor(Math.min(85, Math.max(1, Math.trunc(passengers) || 1))).label;
}

export const DEFAULT_SIM: SimInput = {
  passengers: 49,
  distanceKm: 320,
  date: "2026-09-18",
  roundTrip: true,
  guides: 1,
  guideDays: 2,
  driverNights: 1,
  tollsIncluded: true,
};
