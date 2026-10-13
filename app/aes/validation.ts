// Validation et nettoyage des formulaires AES — partagés par l'interface et l'API.
import { isVisible, missingRequired, pruneHidden } from "@/app/formulaires/examen/engine";
import type { ExamCtx, SectionDef, SectionValues } from "@/app/formulaires/examen/types";
import { CONSULTATION_AES } from "./config/consultation";
import { DECLARATION_AES, sectionVisible } from "./config/declaration";

export type Manquants = Record<string, string[]>; // { [sectionId]: champIds }

/** Champs obligatoires manquants de la déclaration, par section visible */
export function manquantsDeclaration(data: SectionValues, ctx: ExamCtx = {}): Manquants {
  const res: Manquants = {};
  for (const s of DECLARATION_AES) {
    const m = missingRequired(s, data, ctx);
    if (m.length) res[s.id] = m;
  }
  return res;
}

export function manquantsConsultation(data: SectionValues, ctx: ExamCtx = {}): string[] {
  return missingRequired(CONSULTATION_AES, data, ctx);
}

/** Libellés des champs manquants, pour les messages d'erreur */
export function libellesManquants(manquants: Manquants | string[], sections: SectionDef[] = [...DECLARATION_AES, CONSULTATION_AES]): string[] {
  const ids = Array.isArray(manquants) ? manquants : Object.values(manquants).flat();
  const champs = sections.flatMap((s) => s.fields);
  return ids.map((id) => champs.find((f) => f.id === id)?.label ?? id);
}

/**
 * Retire les réponses des sections masquées (ex. plaie après passage à « projection »)
 * et des champs masqués par une condition. Deux passes : un retrait peut en masquer d'autres.
 */
export function nettoyerDeclaration(data: SectionValues, ctx: ExamCtx = {}): SectionValues {
  let v = { ...data };
  for (let passe = 0; passe < 2; passe++) {
    for (const s of DECLARATION_AES) {
      if (!sectionVisible(s, v, ctx)) {
        for (const f of s.fields) delete v[f.id];
      } else {
        v = pruneHidden(s, v, ctx);
      }
    }
  }
  return v;
}

export function nettoyerConsultation(data: SectionValues, ctx: ExamCtx = {}): SectionValues {
  const v = pruneHidden(CONSULTATION_AES, data, ctx);
  // lignes de résultats non prévues pour la visite
  const resultats = v.resultats as Record<string, string> | undefined;
  const grille = CONSULTATION_AES.fields.find((f) => f.id === "resultats");
  if (resultats && grille?.kind === "grid" && grille.rowsFilter) {
    v.resultats = Object.fromEntries(Object.entries(resultats).filter(([b]) => grille.rowsFilter!({ value: b, label: b }, v, ctx)));
  }
  return v;
}

export { isVisible };
