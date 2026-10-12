// Alertes neurologiques des examens rachidiens (4.2 et 4.4)
import type { Alerte } from "./mesures";

/** Valeurs « positives » des grilles de tests (Négatif / Positif D / Positif G / Bilatéral / Non fait) */
export const VALEURS_POSITIVES = ["POSITIF_D", "POSITIF_G", "BILATERAL"];

export function estPositif(value: unknown): boolean {
  return typeof value === "string" && VALEURS_POSITIVES.includes(value);
}

/** Hoffmann positif ou Lhermitte → atteinte médullaire possible, avis spécialisé */
export function alertesRachisCervical(tests: Record<string, unknown> | undefined): Alerte[] {
  const signes: string[] = [];
  if (estPositif(tests?.HOFFMANN)) signes.push("signe de Hoffmann");
  if (estPositif(tests?.LHERMITTE)) signes.push("signe de Lhermitte");
  if (signes.length === 0) return [];
  return [
    {
      severite: "error",
      message: `${signes.join(" et ")} positif${signes.length > 1 ? "s" : ""} : atteinte médullaire possible, avis spécialisé.`,
    },
  ];
}

/** Toute case cochée (hors « Aucun ») → orientation en urgence */
export function alerteQueueDeCheval(signes: unknown): Alerte | null {
  const liste = Array.isArray(signes) ? signes.filter((s) => s !== "AUCUN") : [];
  if (liste.length === 0) return null;
  return {
    severite: "error",
    message: "Signe(s) d'alerte de syndrome de la queue de cheval : orientation en URGENCE.",
  };
}
