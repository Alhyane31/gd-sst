import { describe, expect, it } from "vitest";
import { countAnomalies, isVisible, missingRequired, pruneHidden, resolveOptions, sectionErrors, visibleSections } from "./engine";
import { COL_TESTS, opts, SI_OUI } from "./config/presets";
import type { SectionDef, SelectFieldDef } from "./types";

const section: SectionDef = {
  id: "test",
  title: "Test",
  fields: [
    { kind: "choice", id: "accident", label: "Accident", options: opts(["OUI", "Oui"], ["NON", "Non"]) },
    { kind: "date", id: "date", label: "Date", showIf: SI_OUI("accident") },
    { kind: "grid", id: "tests", label: "Tests", rows: opts(["NEER", "Neer"], ["HAWKINS", "Hawkins"], ["YOCUM", "Yocum"]), columns: COL_TESTS },
    { kind: "measure", id: "fc", label: "FC", min: 30, max: 220, integer: true },
    { kind: "mobility", id: "mob", label: "Mobilité", movements: [{ id: "FLEX", label: "Flexion" }], max: 180 },
  ],
};

describe("logique conditionnelle", () => {
  it("affiche les détails seulement si la réponse est Oui", () => {
    const date = section.fields[1];
    expect(isVisible(date, { accident: "OUI" }, {})).toBe(true);
    expect(isVisible(date, { accident: "NON" }, {})).toBe(false);
    expect(isVisible(date, {}, {})).toBe(false);
  });

  it("efface les détails quand la réponse repasse à Non", () => {
    const pruned = pruneHidden(section, { accident: "NON", date: "2026-01-01", fc: "70" }, {});
    expect(pruned).toEqual({ accident: "NON", fc: "70" });
  });

  it("filtre les sections selon le type de visite", () => {
    const embauche: SectionDef = { id: "e", title: "E", fields: [], showIf: (ctx) => ctx.visiteType === "EMBAUCHE" };
    expect(visibleSections([section, embauche], { visiteType: "ANNUELLE" })).toHaveLength(1);
    expect(visibleSections([section, embauche], { visiteType: "EMBAUCHE" })).toHaveLength(2);
  });
});

describe("anomalies", () => {
  it("compte les lignes de grille non normales, hors Non fait", () => {
    const n = countAnomalies(section, { tests: { NEER: "NORMAL", HAWKINS: "ANORMAL_D", YOCUM: "NON_FAIT" } });
    expect(n).toBe(1);
  });

  it("zéro si rien n'est saisi", () => {
    expect(countAnomalies(section, {})).toBe(0);
  });
});

describe("erreurs de saisie", () => {
  it("signale les mesures hors bornes et les mobilités > max", () => {
    const errors = sectionErrors(section, { fc: "300", mob: { FLEX: { AD: "200", AG: "90" } } });
    expect(errors.fc).toBe("Maximum 220");
    expect(errors["mob.FLEX.AD"]).toBe("Maximum 180");
    expect(errors["mob.FLEX.AG"]).toBeUndefined();
  });
});

describe("champs obligatoires et options paramétrables", () => {
  const s: SectionDef = {
    id: "req",
    title: "Req",
    fields: [
      { kind: "date", id: "date", label: "Date", required: true },
      { kind: "choice", id: "type", label: "Type", options: opts(["A", "A"], ["B", "B"]), required: true },
      { kind: "text", id: "detail", label: "Détail", required: true, showIf: (v) => v.type === "B" },
      { kind: "checkboxes", id: "zones", label: "Zones", options: opts(["X", "X"]), required: true },
      { kind: "grid", id: "statut", label: "Statut", rows: opts(["VIH", "VIH"], ["VHC", "VHC"]), columns: COL_TESTS, required: true },
      { kind: "select", id: "schema", label: "Schéma", options: [], optionsKey: "schemas" },
    ],
  };

  it("liste les obligatoires vides ; la grille exige toutes ses lignes", () => {
    expect(missingRequired(s, {})).toEqual(["date", "type", "zones", "statut"]);
    expect(missingRequired(s, { date: "2026-01-01", type: "A", zones: ["X"], statut: { VIH: "NORMAL" } })).toEqual(["statut"]);
  });

  it("un champ obligatoire masqué n'est pas exigé", () => {
    expect(missingRequired(s, { date: "d", type: "A", zones: ["X"], statut: { VIH: "NORMAL", VHC: "NORMAL" } })).toEqual([]);
    expect(missingRequired(s, { date: "d", type: "B", zones: ["X"], statut: { VIH: "NORMAL", VHC: "NORMAL" } })).toEqual(["detail"]);
  });

  it("une section masquée (when) n'exige rien", () => {
    expect(missingRequired({ ...s, when: () => false }, {})).toEqual([]);
  });

  it("les options paramétrables viennent du contexte", () => {
    const f = s.fields[5] as SelectFieldDef;
    expect(resolveOptions(f, { options: { schemas: opts(["S1", "Schéma 1"]) } })).toEqual([{ value: "S1", label: "Schéma 1" }]);
    expect(resolveOptions(f, {})).toEqual([]);
  });
});

describe("lignes filtrées et obligatoire conditionnel", () => {
  const s: SectionDef = {
    id: "consult",
    title: "Consultation",
    fields: [
      {
        kind: "grid",
        id: "resultats",
        label: "Résultats",
        required: true,
        rows: opts(["VIH", "VIH"], ["VHC", "VHC"], ["ALAT", "ALAT"]),
        columns: COL_TESTS,
        rowsFilter: (r, _v, ctx) => ((ctx.extra?.bilans as string[]) ?? []).includes(r.value),
      },
      { kind: "choice", id: "at", label: "AT", options: opts(["FAITE", "Faite"]), requiredIf: (_v, ctx) => !ctx.extra?.atFaite },
    ],
  };

  it("n'exige que les lignes prévues pour la visite", () => {
    const ctx = { extra: { bilans: ["VIH"], atFaite: true } };
    expect(missingRequired(s, { resultats: { VIH: "NORMAL" } }, ctx)).toEqual([]);
    expect(missingRequired(s, { resultats: {} }, ctx)).toEqual(["resultats"]);
  });

  it("obligatoire tant que la condition est vraie", () => {
    const grilleOk = { resultats: { VIH: "NORMAL" } };
    expect(missingRequired(s, grilleOk, { extra: { bilans: ["VIH"], atFaite: false } })).toEqual(["at"]);
    expect(missingRequired(s, grilleOk, { extra: { bilans: ["VIH"], atFaite: true } })).toEqual([]);
  });

  it("les anomalies ne comptent que les lignes visibles", () => {
    const v = { resultats: { VIH: "ANORMAL_D", VHC: "ANORMAL_D" } };
    expect(countAnomalies(s, v, { extra: { bilans: ["VIH"] } })).toBe(1);
  });
});
