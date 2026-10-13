// Délais AES (champs 4, 48, 54) et dates de suivi (champ 62).

export type Tranche = { max: number; libelle: string };

/** Champ 4 : délai AES → déclaration */
export const TRANCHES_DECLARATION: Tranche[] = [
  { max: 1, libelle: "< 1 h" },
  { max: 4, libelle: "1–4 h" },
  { max: 24, libelle: "4–24 h" },
  { max: 48, libelle: "24–48 h" },
  { max: 72, libelle: "48–72 h" },
  { max: Infinity, libelle: "> 72 h" },
];

/** Champ 48 : délai AES → consultation P23 */
export const TRANCHES_P23: Tranche[] = [
  { max: 4, libelle: "< 4 h" },
  { max: 24, libelle: "4–24 h" },
  { max: 48, libelle: "24–48 h" },
  { max: 72, libelle: "48–72 h" },
  { max: Infinity, libelle: "> 72 h" },
];

/** "2026-10-12" + "14:30" → Date locale ; null si incomplet ou invalide */
export function combinerDateHeure(date: unknown, heure: unknown): Date | null {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (typeof heure !== "string" || !/^\d{2}:\d{2}/.test(heure)) return null;
  const d = new Date(`${date}T${heure.slice(0, 5)}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Valeur d'un champ date + heure ("2026-10-12T14:30") → Date */
export function parseDateHeure(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;
  const d = new Date(value.slice(0, 16));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function heuresEntre(debut: Date | null, fin: Date | null): number | null {
  if (!debut || !fin) return null;
  return (fin.getTime() - debut.getTime()) / 3_600_000;
}

/** Tranche d'un délai en heures (borne basse incluse : 4 h exactement → « 4–24 h ») */
export function tranche(heures: number | null, tranches: Tranche[]): string | null {
  if (heures === null || heures < 0) return null;
  return tranches.find((t) => heures < t.max)?.libelle ?? null;
}

export function formatDuree(heures: number): string {
  const totalMin = Math.round(heures * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 48) return `${Math.floor(h / 24)} j ${h % 24} h`;
  return m ? `${h} h ${String(m).padStart(2, "0")} min` : `${h} h`;
}

/** Date + n jours, au format yyyy-mm-dd (jour civil, sans effet des fuseaux) */
export function ajouterJours(date: Date, jours: number): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + jours));
  return d.toISOString().slice(0, 10);
}
