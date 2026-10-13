// Fonctions pures du moteur d'examen (conditions, anomalies, validation) — testables sans React
import { validerMesure } from "@/lib/clinique/mesures";
import type { ExamCtx, FieldDef, GridFieldDef, Option, SectionDef, SectionValues } from "./types";

export const NON_FAIT = "NON_FAIT";

export function isVisible(field: FieldDef, values: SectionValues, ctx: ExamCtx): boolean {
  return field.showIf ? field.showIf(values, ctx) : true;
}

/** Obligatoire, de façon fixe ou selon les réponses / le contexte */
export function isRequired(field: FieldDef, values: SectionValues, ctx: ExamCtx): boolean {
  if (field.kind === "heading") return false;
  return !!field.required || !!field.requiredIf?.(values, ctx);
}

/** Lignes visibles d'une grille (filtre éventuel selon le contexte) */
export function visibleRows(field: GridFieldDef, values: SectionValues, ctx: ExamCtx): Option[] {
  return field.rowsFilter ? field.rows.filter((r) => field.rowsFilter!(r, values, ctx)) : field.rows;
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
      for (const row of visibleRows(field, values, ctx)) {
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

/** Options d'un champ : liste paramétrable du contexte si `optionsKey`, sinon options de la config */
export function resolveOptions(field: { options: Option[]; optionsKey?: string }, ctx: ExamCtx): Option[] {
  return field.optionsKey ? ctx.options?.[field.optionsKey] ?? field.options : field.options;
}

function estVide(field: FieldDef, value: unknown, values: SectionValues, ctx: ExamCtx): boolean {
  if (field.kind === "grid") {
    const grid = (value ?? {}) as Record<string, unknown>;
    return visibleRows(field, values, ctx).some((r) => !grid[r.value]);
  }
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Champs obligatoires visibles non renseignés (validation bloquante).
 * Grille : toutes les lignes ; cases à cocher : au moins une.
 */
export function missingRequired(section: SectionDef, values: SectionValues, ctx: ExamCtx = {}): string[] {
  if (section.when && !section.when(values, ctx)) return [];
  return section.fields
    .filter((f) => isRequired(f, values, ctx) && isVisible(f, values, ctx))
    .filter((f) => estVide(f, values[f.id], values, ctx))
    .map((f) => f.id);
}
