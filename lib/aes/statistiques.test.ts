import { describe, expect, it } from "vitest";
import { calculerStatistiques, type DeclarationStat } from "./statistiques";

const decl = (patch: Partial<DeclarationStat>): DeclarationStat => ({
  service: "Urgences",
  geste: "RECAPUCHONNAGE",
  causes: [],
  declarationAT: "NON_FAITE",
  statut: "VALIDEE",
  suivis: [{ code: "S12", statut: "PREVUE", datePrevue: "2027-01-04" }],
  consultations: [],
  ...patch,
});

describe("tableau de bord AES", () => {
  const stats = calculerStatistiques(
    [
      decl({ causes: ["RECAPUCHONNAGE", "URGENCE"], declarationAT: "FAITE" }),
      decl({ service: "Bloc", geste: "SUTURE", causes: ["URGENCE"] }),
      decl({ service: "", geste: null, suivis: [{ code: "S12", statut: "FAITE", datePrevue: "2026-09-01" }] }),
      decl({ statut: "CLOTUREE", consultations: [{ visite: "J1_J7" }], suivis: [{ code: "S12", statut: "NON_FAITE", datePrevue: "2026-08-01" }] }),
    ],
    "2026-10-13",
    { gestes: { RECAPUCHONNAGE: "Recapuchonnage", SUTURE: "Suture" }, causes: { URGENCE: "Urgence" } }
  );

  it("compte les AES par service, par geste et par cause", () => {
    expect(stats.total).toBe(4);
    expect(stats.parService).toEqual([
      { cle: "Urgences", libelle: "Urgences", nombre: 2 },
      { cle: "Bloc", libelle: "Bloc", nombre: 1 },
      { cle: "Non renseigné", libelle: "Non renseigné", nombre: 1 },
    ]);
    expect(stats.parGeste[0]).toEqual({ cle: "RECAPUCHONNAGE", libelle: "Recapuchonnage", nombre: 2 });
    expect(stats.parCause).toEqual([
      { cle: "URGENCE", libelle: "Urgence", nombre: 2 },
      { cle: "RECAPUCHONNAGE", libelle: "RECAPUCHONNAGE", nombre: 1 },
    ]);
  });

  it("taux de déclaration AT", () => {
    expect(stats.tauxDeclarationAT).toBe(25);
    expect(stats.declarationsATFaites).toBe(1);
  });

  it("taux de suivi complet : S12 faite parmi les suivis échus ou clôturés", () => {
    expect(stats.suivisEchus).toBe(2);
    expect(stats.suivisComplets).toBe(1);
    expect(stats.tauxSuiviComplet).toBe(50);
  });

  it("aucune déclaration : taux non calculés", () => {
    const vide = calculerStatistiques([], "2026-10-13");
    expect(vide.tauxDeclarationAT).toBeNull();
    expect(vide.tauxSuiviComplet).toBeNull();
  });
});
