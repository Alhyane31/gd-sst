// Réponses en texte lisible (compte rendu imprimable).
import { isVisible, resolveOptions, visibleRows } from "@/app/formulaires/examen/engine";
import type { ExamCtx, FieldDef, SectionDef, SectionValues } from "@/app/formulaires/examen/types";

function dateFr(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/);
  if (!m) return v;
  return `${m[3]}/${m[2]}/${m[1]}${m[4] ? ` à ${m[4]}` : ""}`;
}

/** Valeur d'un champ en texte, ou null si non renseigné */
export function valeurLisible(f: FieldDef, values: SectionValues, ctx: ExamCtx): string | null {
  const v = values[f.id];
  switch (f.kind) {
    case "heading":
      return null;
    case "computed":
      return f.compute(values, ctx)?.text ?? null;
    case "choice":
    case "select": {
      if (typeof v !== "string" || !v) return null;
      return resolveOptions(f, ctx).find((o) => o.value === v)?.label ?? v;
    }
    case "checkboxes": {
      if (!Array.isArray(v) || v.length === 0) return null;
      const opts = resolveOptions(f, ctx);
      return v.map((x) => opts.find((o) => o.value === x)?.label ?? x).join(", ");
    }
    case "grid": {
      const g = (v ?? {}) as Record<string, string>;
      const lignes = visibleRows(f, values, ctx)
        .filter((r) => g[r.value])
        .map((r) => `${r.label} : ${f.columns.find((c) => c.value === g[r.value])?.label ?? g[r.value]}`);
      return lignes.length ? lignes.join(" ; ") : null;
    }
    case "measure":
      return v === undefined || v === "" ? null : `${v}${f.unit ? ` ${f.unit}` : ""}`;
    case "date":
    case "datetime":
      return typeof v === "string" && v ? dateFr(v) : null;
    case "eva":
      return typeof v === "number" ? `${v}/10` : null;
    case "attachment":
      return Array.isArray(v) && v.length ? `${v.length} pièce(s) jointe(s)` : null;
    default:
      return typeof v === "string" && v.trim() ? v : null;
  }
}

/** Lignes « libellé : valeur » des champs visibles et renseignés d'une section */
export function lignesSection(s: SectionDef, values: SectionValues, ctx: ExamCtx): { label: string; valeur: string }[] {
  return s.fields
    .filter((f) => f.kind !== "heading" && isVisible(f, values, ctx))
    .map((f) => ({ label: f.label, valeur: valeurLisible(f, values, ctx) }))
    .filter((l): l is { label: string; valeur: string } => l.valeur !== null);
}
