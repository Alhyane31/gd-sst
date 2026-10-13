// Contexte des formulaires AES (listes paramétrables + données de suivi), partagé client / serveur.
import type { ExamCtx } from "@/app/formulaires/examen/types";
import type { SuiviCode, SuiviStatut } from "./codes";
import type { ReferentielAes } from "./referentiel";
import { declarationAtFaite } from "./suivi";

/** Forme minimale d'une déclaration (Prisma côté serveur, JSON côté client) */
export type DeclarationPourContexte = {
  data?: unknown;
  suivis?: { code: string; datePrevue: string | Date; statut: string; bilans: string[] }[];
  consultations?: { data?: unknown }[];
} | null;

export function suivisPourRegles(d: DeclarationPourContexte) {
  return (d?.suivis ?? []).map((s) => ({
    code: s.code as SuiviCode,
    datePrevue: (typeof s.datePrevue === "string" ? s.datePrevue : s.datePrevue.toISOString()).slice(0, 10),
    statut: s.statut as SuiviStatut,
    bilans: s.bilans,
  }));
}

export function contexteAes(d: DeclarationPourContexte, ref: ReferentielAes, readOnly = false): ExamCtx {
  const data = (d?.data ?? {}) as Record<string, unknown>;
  const consultations = (d?.consultations ?? []).map((c) => (c.data ?? {}) as Record<string, unknown>);
  const suivis = suivisPourRegles(d);
  return {
    readOnly,
    options: {
      schemasTpe: ref.schemasTpe.filter((s) => s.actif).map((s) => ({ value: s.code, label: `${s.libelle} — ${s.molecules}` })),
    },
    extra: {
      referentiel: ref,
      tpeAccepte: data.tpe === "ACCEPTE",
      atFaite: declarationAtFaite(data, consultations),
      bilansParVisite: Object.fromEntries(suivis.map((s) => [s.code, s.bilans])),
      suivis,
    },
  };
}
