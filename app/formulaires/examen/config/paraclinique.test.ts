import { describe, expect, it } from "vitest";
import { isVisible, visibleSections } from "../engine";
import type { ComputedFieldDef, SectionDef } from "../types";
import {
  BIOLOGIE_CIBLEE,
  EMBAUCHE,
  EXAMEN_PARACLINIQUE,
  EXPLORATIONS_FONCTIONNELLES,
} from "./paraclinique";

const toutes = EXAMEN_PARACLINIQUE.flatMap((g) => g.sections);
const ids = (ctx: Parameters<typeof visibleSections>[1]) => visibleSections(toutes, ctx).map((s) => s.id);
const f = (s: SectionDef, id: string) => s.fields.find((x) => x.id === id)!;

describe("5. Examen paraclinique : sections selon le type de visite", () => {
  it("visite périodique : 5.1, 5.2, 5.3, 5.5 (sans 5.6 ni biologie si non soignant)", () => {
    expect(ids({ visiteType: "ANNUELLE", posteCode: "ADM" })).toEqual([
      "bandeletteUrinaire",
      "acuiteVisuelle",
      "explorationsFonctionnelles",
      "autresExamens",
    ]);
  });

  it("personnel soignant : + biologie ciblée (5.4)", () => {
    expect(ids({ visiteType: "ANNUELLE", posteCode: "INF" })).toContain("biologieCiblee");
    expect(ids({ visiteType: "ANNUELLE", posteCode: "MED" })).toContain("biologieCiblee");
  });

  it("embauche : ouvre en plus la section 5.6", () => {
    expect(ids({ visiteType: "EMBAUCHE", posteCode: "ADM" })).toContain("embauche");
    expect(ids({ visiteType: "SPONTANNE" })).not.toContain("embauche");
  });
});

describe("5.6 : NFS conditionnée au poste radio-exposé", () => {
  it("NFS et « NFS normale » seulement si radio-exposé = Oui", () => {
    expect(isVisible(f(EMBAUCHE, "nfs"), { posteRadioExpose: "NON" }, {})).toBe(false);
    expect(isVisible(f(EMBAUCHE, "nfs"), { posteRadioExpose: "OUI" }, {})).toBe(true);
    expect(isVisible(f(EMBAUCHE, "nfsNormale"), { posteRadioExpose: "OUI" }, {})).toBe(true);
  });

  it("anomalies de la NFS seulement si NFS anormale", () => {
    expect(isVisible(f(EMBAUCHE, "nfsAnomalies"), { posteRadioExpose: "OUI", nfsNormale: "OUI" }, {})).toBe(false);
    expect(isVisible(f(EMBAUCHE, "nfsAnomalies"), { posteRadioExpose: "OUI", nfsNormale: "NON" }, {})).toBe(true);
  });
});

describe("5.3 et 5.4 : champs et calculs", () => {
  it("les mesures de spirométrie n'apparaissent que si elle est réalisée", () => {
    expect(isVisible(f(EXPLORATIONS_FONCTIONNELLES, "vemsL"), {}, {})).toBe(false);
    expect(isVisible(f(EXPLORATIONS_FONCTIONNELLES, "vemsL"), { spirometrie: "OUI" }, {})).toBe(true);
  });

  it("calcule le rapport VEMS/CVF et signale < 70 %", () => {
    const r = f(EXPLORATIONS_FONCTIONNELLES, "rapportCalcule") as ComputedFieldDef;
    expect(r.compute({ vemsL: "3,2", cvfL: "4" }, {})).toEqual({ text: "80 %", severite: "success" });
    expect(r.compute({ vemsL: "2", cvfL: "4" }, {})?.severite).toBe("warning");
  });

  it("anti-HBs : immunisé si ≥ 10 mUI/mL", () => {
    const c = f(BIOLOGIE_CIBLEE, "immunisationHB") as ComputedFieldDef;
    expect(c.compute({ antiHBs: "10" }, {})?.text).toContain("Immunisé");
    expect(c.compute({ antiHBs: "9,5" }, {})?.text).toContain("Non immunisé");
  });

  it("pH et densité : listes exactes du PDF", () => {
    const bu = toutes[0];
    const ph = f(bu, "ph");
    const densite = f(bu, "densite");
    expect(ph.kind === "select" && ph.options.map((o) => o.label)).toEqual(["5,0", "5,5", "6,0", "6,5", "7,0", "7,5", "8,0", "8,5", "9,0"]);
    expect(densite.kind === "select" && densite.options.length).toBe(7);
  });
});
