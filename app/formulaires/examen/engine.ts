// Fonctions pures du moteur d'examen (conditions, anomalies, validation) — testables sans React
import { validerMesure } from "@/lib/clinique/mesures";
import type { ExamCtx, FieldDef, SectionDef, SectionValues } from "./types";

export const NON_FAIT = "NON_FAIT";

export function isVisible(field: FieldDef, values: SectionValues, ctx: ExamCtx): boolean {
  return field.showIf ? field.showIf(values, ctx) : true;
}

export function visibleSections(sections: SectionDef[], ctx: ExamCtx): SectionDef[] {
  return sections.filter((s) => (s.showIf ? s.showIf(ctx) : true));
}

/**
 * Nombre de réponses anormales d'une section :
 * ligne de grille ou choix renseigné avec une option non « normale » (hors « Non fait »).
 * Ne compte que les champs dont au moins une option est marquée normale.
 */
export function countAnomalies(section: SectionDef, values: SectionValues, ctx: ExamCtx = {}): number {
  let count = 0;
  for (const field of section.fields) {
    if (!isVisible(field, values, ctx)) continue;

    if (field.kind === "grid") {
      const normals = field.columns.filter((c) => c.normal).map((c) => c.value);
      if (normals.length === 0) continue;
      const grid = (values[field.id] ?? {}) as Record<string, unknown>;
      for (const row of field.rows) {
        const v = grid[row.value];
        if (typeof v === "string" && v && v !== NON_FAIT && !normals.includes(v)) count++;
      }
    }

    if (field.kind === "choice") {
      const normals = field.options.filter((o) => o.normal).map((o) => o.value);
      const v = values[field.id];
      if (normals.length && typeof v === "string" && v && v !== NON_FAIT && !normals.includes(v)) count++;
    }
  }
  return count;
}

/** Erreurs de saisie (bornes, entier) des mesures et mobilités visibles : { [cheminChamp]: message } */
export function sectionErrors(section: SectionDef, values: SectionValues, ctx: ExamCtx = {}): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of section.fields) {
    if (!isVisible(field, values, ctx)) continue;

    if (field.kind === "measure") {
      const err = validerMesure(values[field.id], field);
      if (err) errors[field.id] = err;
    }

    if (field.kind === "mobility") {
      const table = (values[field.id] ?? {}) as Record<string, Record<string, unknown>>;
      for (const mov of field.movements) {
        for (const [col, v] of Object.entries(table[mov.id] ?? {})) {
          const err = validerMesure(v, { min: 0, max: field.max ?? 180, integer: true });
          if (err) errors[`${field.id}.${mov.id}.${col}`] = err;
        }
      }
    }
  }
  return errors;
}

/** Retire de l'objet les valeurs des champs masqués par une condition (« si oui » repassé à « non ») */
export function pruneHidden(section: SectionDef, values: SectionValues, ctx: ExamCtx): SectionValues {
  const next = { ...values };
  for (const field of section.fields) {
    if (field.kind !== "heading" && !isVisible(field, values, ctx)) delete next[field.id];
  }
  return next;
}
