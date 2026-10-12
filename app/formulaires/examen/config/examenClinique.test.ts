import { describe, expect, it } from "vitest";
import { isVisible } from "../engine";
import type { FieldDef, GridFieldDef, SectionDef } from "../types";
import { EXAMEN_CLINIQUE } from "./examenClinique";
import { CARDIOVASCULAIRE, COU_THYROIDE, NEUROLOGIQUE } from "./appareils";
import { EPAULES } from "./membreSuperieur";
import { RACHIS_CERVICAL, RACHIS_LOMBAIRE } from "./rachis";

const sections: SectionDef[] = EXAMEN_CLINIQUE.flatMap((g) => g.sections);
const grid = (s: SectionDef, id: string) => s.fields.find((f) => f.id === id) as GridFieldDef;
const rowLabels = (s: SectionDef, id: string) => grid(s, id).rows.map((r) => r.label);

describe("intégrité des configs d'examen", () => {
  it("identifiants de sections uniques", () => {
    const ids = sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(sections.map((s) => [s.id, s] as const))("%s : champs, lignes et colonnes uniques", (_id, s) => {
    const ids = s.fields.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of s.fields) {
      if (f.kind === "grid") {
        expect(f.columns.length).toBeGreaterThan(1);
        expect(new Set(f.rows.map((r) => r.value)).size).toBe(f.rows.length);
        expect(new Set(f.columns.map((c) => c.value)).size).toBe(f.columns.length);
      }
      if (f.kind === "mobility") {
        expect(new Set(f.movements.map((m) => m.id)).size).toBe(f.movements.length);
      }
    }
  });

  it.each(sections.map((s) => [s.id, s] as const))("%s : ordre inspection → palpation → mobilité → tests", (_id, s) => {
    const premier = (pred: (f: FieldDef) => boolean) => s.fields.findIndex(pred);
    const inspection = premier((f) => /inspection|morphotype/i.test(f.id));
    const palpation = premier((f) => /palpation/i.test(f.id) && !/inspection/i.test(f.id));
    const mobilite = premier((f) => f.kind === "mobility");
    const tests = premier((f) => /^tests?|Tests$|Menisques|Croises|Collateraux|FemoroPatellaire/.test(f.id));
    const etapes = [inspection, palpation, mobilite, tests].filter((i) => i >= 0);
    expect(etapes).toEqual([...etapes].sort((a, b) => a - b));
  });
});

describe("règles cliniques", () => {
  it("le test de Patte explore le sous-épineux (pas le sous-scapulaire)", () => {
    expect(rowLabels(EPAULES, "testsCoiffe")).toContain("Patte [sous-épineux]");
  });

  it("pas d'examen neurologique radiculaire dans les sections articulaires", () => {
    for (const s of sections.filter((x) => !x.id.startsWith("rachis"))) {
      expect(s.fields.some((f) => ["reflexes", "forceMRC", "sensibilite"].includes(f.id))).toBe(false);
    }
  });

  it("rachis cervical : réflexes C5 à C8 uniquement (pas de T1), force et sensibilité C5–T1", () => {
    const reflexes = rowLabels(RACHIS_CERVICAL, "reflexes").join(" ");
    expect(reflexes).toMatch(/C5.*C6.*C7.*C8/);
    expect(reflexes).not.toContain("T1");
    expect(rowLabels(RACHIS_CERVICAL, "forceMRC").join(" ")).toContain("T1");
    expect(rowLabels(RACHIS_CERVICAL, "sensibilite").join(" ")).toContain("T1");
  });

  it("rachis lombaire : neurologique L2–S1", () => {
    const force = rowLabels(RACHIS_LOMBAIRE, "forceMRC").join(" ");
    for (const r of ["L2", "L3", "L4", "L5", "S1"]) expect(force).toContain(r);
  });

  it("Hoffmann positif → alerte « avis spécialisé »", () => {
    const a = RACHIS_CERVICAL.alerts!({ testsRadiculaires: { HOFFMANN: "POSITIF_D" } }, {});
    expect(a[0].message).toContain("avis spécialisé");
    expect(RACHIS_CERVICAL.alerts!({ testsRadiculaires: { SPURLING: "POSITIF_D" } }, {})).toHaveLength(0);
  });

  it("queue de cheval : toute case hors « Aucun » → alerte d'urgence", () => {
    expect(RACHIS_LOMBAIRE.alerts!({ queueDeCheval: ["URINAIRES"] }, {})[0].message).toContain("URGENCE");
    expect(RACHIS_LOMBAIRE.alerts!({ queueDeCheval: ["AUCUN"] }, {})).toHaveLength(0);
  });

  it("type d'anomalie sensitive affiché seulement si une cote 1 est saisie", () => {
    const f = RACHIS_CERVICAL.fields.find((x) => x.id === "typeAnomalieSensitive")!;
    expect(isVisible(f, { sensibilite: { C6_D: "2" } }, {})).toBe(false);
    expect(isVisible(f, { sensibilite: { C6_D: "1" } }, {})).toBe(true);
  });

  it("côté de l'irradiation lombaire seulement si irradiation", () => {
    const f = RACHIS_LOMBAIRE.fields.find((x) => x.id === "irradiationCote")!;
    expect(isVisible(f, { irradiation: "AUCUNE" }, {})).toBe(false);
    expect(isVisible(f, { irradiation: "CUISSE" }, {})).toBe(true);
  });
});

describe("4.6 à 4.14 : conditions d'affichage", () => {
  const f = (s: SectionDef, id: string) => s.fields.find((x) => x.id === id)!;

  it("couvre les 14 régions de l'examen clinique, dans l'ordre du PDF", () => {
    expect(sections.map((s) => s.id)).toEqual([
      "epaules", "coudes", "poignetsMains", "rachisCervical", "rachisDorsal", "rachisLombaire", "membreInferieur",
      "cardiovasculaire", "digestif", "pleuropulmonaire", "neurologique",
      "teguments", "orl", "ophtalmologie", "couThyroide", "buccoDentaire",
    ]);
  });

  it("souffle cardiaque présent → foyers et intensité", () => {
    expect(isVisible(f(CARDIOVASCULAIRE, "souffleFoyers"), { souffle: "ABSENT" }, {})).toBe(false);
    expect(isVisible(f(CARDIOVASCULAIRE, "souffleIntensite"), { souffle: "PRESENT" }, {})).toBe(true);
  });

  it("adénopathie dans une aire → caractéristiques à décrire", () => {
    const c = f(COU_THYROIDE, "caracteristiquesAdenopathies");
    expect(isVisible(c, { airesGanglionnaires: { CERVICALES: "LIBRES" } }, {})).toBe(false);
    expect(isVisible(c, { airesGanglionnaires: { AXILLAIRES: "ADENOPATHIE_G" } }, {})).toBe(true);
  });

  it("conscience : anomalie → préciser", () => {
    expect(isVisible(f(NEUROLOGIQUE, "conscienceAnomalie"), { conscience: "ANOMALIE" }, {})).toBe(true);
    expect(isVisible(f(NEUROLOGIQUE, "conscienceAnomalie"), { conscience: "CONSCIENT_ORIENTE" }, {})).toBe(false);
  });
});
