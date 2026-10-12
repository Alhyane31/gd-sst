import { describe, expect, it } from "vitest";
import { countAnomalies, isVisible, pruneHidden, sectionErrors, visibleSections } from "./engine";
import { COL_TESTS, opts, SI_OUI } from "./config/presets";
import type { SectionDef } from "./types";

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
