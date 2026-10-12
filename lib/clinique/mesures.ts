// Saisie et validation des mesures cliniques (constantes, mobilités, paraclinique)

export type RegleMesure = {
  min?: number;
  max?: number;
  /** true → nombre entier attendu, sinon décimal autorisé */
  integer?: boolean;
};

export type Severite = "info" | "success" | "warning" | "error";

export type Alerte = { severite: Severite; message: string };

/**
 * Convertit une saisie en nombre ("36,5" et "36.5" acceptés).
 * null si vide, NaN si la saisie n'est pas un nombre.
 */
export function parseNombre(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(",", ".");
  if (s === "") return null;
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

/** Nombre valide ou null (vide / invalide) — pour les calculs */
export function nombreOuNull(value: unknown): number | null {
  const n = parseNombre(value);
  return n === null || Number.isNaN(n) ? null : n;
}

export function formatNombre(n: number, decimales = 1): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(decimales).replace(".", ",");
}

/** Message d'erreur, ou null si la saisie est vide ou valide */
export function validerMesure(value: unknown, regle: RegleMesure): string | null {
  const n = parseNombre(value);
  if (n === null) return null;
  if (Number.isNaN(n)) return "Nombre invalide";
  if (regle.integer && !Number.isInteger(n)) return "Nombre entier attendu";
  if (regle.min !== undefined && n < regle.min) return `Minimum ${formatNombre(regle.min, 2)}`;
  if (regle.max !== undefined && n > regle.max) return `Maximum ${formatNombre(regle.max, 2)}`;
  return null;
}
