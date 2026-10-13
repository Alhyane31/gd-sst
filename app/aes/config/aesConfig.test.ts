import { describe, expect, it } from "vitest";
import { isVisible, visibleRows } from "@/app/formulaires/examen/engine";
import type { FieldDef, GridFieldDef, SectionDef } from "@/app/formulaires/examen/types";
import { manquantsConsultation, manquantsDeclaration, nettoyerConsultation, nettoyerDeclaration } from "../validation";
import { CONSULTATION_AES } from "./consultation";
import { DECLARATION_AES, S4_PLAIE, S5_PROJECTION, S6_CONDUITE, S7_SOURCE, S8_VHB, S9_PRISE_EN_CHARGE, sectionVisible } from "./declaration";

const champ = (s: SectionDef, id: string) => s.fields.find((f) => f.id === id) as FieldDef;
const visible = (s: SectionDef, id: string, v: Record<string, unknown>) => isVisible(champ(s, id), v, {});
const source = (vih: string, vhc = "NEGATIF") => ({ statutSource: { VIH: vih, AG_HBS: "NEGATIF", ANTI_HBC: "NEGATIF", VHC: vhc } });

describe("configuration : fidélité à la spécification", () => {
  it("61 champs numérotés + 3 éléments ajoutés, 14 champs de consultation", () => {
    const champs = DECLARATION_AES.flatMap((s) => s.fields).filter((f) => f.kind !== "heading");
    // ajouts : date P23 (pour le champ 48), délai de première prise (« délai calculé » du champ 54), comorbidité (S2)
    const ajouts = ["dateHeureP23", "delaiPremierePrise", "comorbiditeIatrogenie"];
    expect(champs.filter((f) => !ajouts.includes(f.id))).toHaveLength(61);
    expect(CONSULTATION_AES.fields).toHaveLength(14);
  });

  it("identifiants uniques", () => {
    const ids = DECLARATION_AES.flatMap((s) => s.fields.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("options exactes : type d'exposition et statut de la source", () => {
    const type = champ(DECLARATION_AES[2], "typeExposition");
    expect(type.kind === "choice" && type.options.map((o) => o.label)).toEqual([
      "Piqûre", "Coupure", "Projection sur muqueuse", "Projection sur peau lésée", "Projection sur peau saine", "Morsure ou griffure",
    ]);
    const grille = champ(S7_SOURCE, "statutSource") as GridFieldDef;
    expect(grille.rows.map((r) => r.label)).toEqual(["VIH", "Ag HBs", "Anti-HBc", "VHC"]);
    expect(grille.columns.map((c) => c.label)).toEqual(["Négatif", "Positif", "Inconnu", "Prélevé, en attente"]);
  });
});

describe("conditions d'affichage", () => {
  it("section 4 (plaie) pour piqûre, coupure, morsure ; section 5 (projection) pour les projections", () => {
    for (const t of ["PIQURE", "COUPURE", "MORSURE_GRIFFURE"]) {
      expect(sectionVisible(S4_PLAIE, { typeExposition: t }, {})).toBe(true);
      expect(sectionVisible(S5_PROJECTION, { typeExposition: t }, {})).toBe(false);
    }
    for (const t of ["PROJ_MUQUEUSE", "PROJ_PEAU_LESEE", "PROJ_PEAU_SAINE"]) {
      expect(sectionVisible(S4_PLAIE, { typeExposition: t }, {})).toBe(false);
      expect(sectionVisible(S5_PROJECTION, { typeExposition: t }, {})).toBe(true);
    }
  });

  it("calibre et intravasculaire si aiguille ; longueur si coupure", () => {
    expect(visible(S4_PLAIE, "calibre", { materiel: "AIGUILLE_CREUSE" })).toBe(true);
    expect(visible(S4_PLAIE, "calibre", { materiel: "BISTOURI" })).toBe(false);
    expect(visible(S4_PLAIE, "intravasculaire", { materiel: "AIGUILLE_PLEINE" })).toBe(true);
    expect(visible(S4_PLAIE, "longueur", { typeExposition: "COUPURE" })).toBe(true);
    expect(visible(S4_PLAIE, "longueur", { typeExposition: "PIQURE" })).toBe(false);
  });

  it("nature de la lésion si peau lésée (type ou zone atteinte)", () => {
    expect(visible(S5_PROJECTION, "natureLesion", { typeExposition: "PROJ_PEAU_LESEE" })).toBe(true);
    expect(visible(S5_PROJECTION, "natureLesion", { typeExposition: "PROJ_MUQUEUSE", zonesAtteintes: ["PEAU_LESEE"] })).toBe(true);
    expect(visible(S5_PROJECTION, "natureLesion", { typeExposition: "PROJ_MUQUEUSE", zonesAtteintes: ["BOUCHE"] })).toBe(false);
  });

  it("antisepsie et pansement masqués si projection sur muqueuse", () => {
    expect(visible(S6_CONDUITE, "antisepsie", { typeExposition: "PROJ_MUQUEUSE" })).toBe(false);
    expect(visible(S6_CONDUITE, "pansement", { typeExposition: "PROJ_MUQUEUSE" })).toBe(false);
    expect(visible(S6_CONDUITE, "antisepsie", { typeExposition: "PIQURE" })).toBe(true);
  });

  it("patient source : si VIH positif, ARN VHC, facteurs de risque si inconnu", () => {
    expect(visible(S7_SOURCE, "vihPositifDetails", source("POSITIF"))).toBe(true);
    expect(visible(S7_SOURCE, "chargeVirale", source("NEGATIF"))).toBe(false);
    expect(visible(S7_SOURCE, "arnVhc", source("NEGATIF", "POSITIF"))).toBe(true);
    expect(visible(S7_SOURCE, "facteursRisque", source("INCONNU"))).toBe(true);
    expect(visible(S7_SOURCE, "facteursRisque", source("EN_ATTENTE"))).toBe(true);
    expect(visible(S7_SOURCE, "facteursRisque", source("POSITIF"))).toBe(false);
  });

  it("résultat, titre et date de sérologie si sérologie faite", () => {
    for (const id of ["resultatAntiHbs", "titreAntiHbs", "dateSerologie"]) {
      expect(visible(S8_VHB, id, { serologieAntiHbsFaite: "OUI" })).toBe(true);
      expect(visible(S8_VHB, id, { serologieAntiHbsFaite: "NSP" })).toBe(false);
    }
  });

  it("schéma, première prise, délai et comorbidité si TPE accepté ; délai P23 si faite", () => {
    for (const id of ["schemaTpe", "dateHeurePremierePrise", "delaiPremierePrise", "comorbiditeIatrogenie"]) {
      expect(visible(S9_PRISE_EN_CHARGE, id, { tpe: "ACCEPTE" })).toBe(true);
      expect(visible(S9_PRISE_EN_CHARGE, id, { tpe: "REFUSE" })).toBe(false);
    }
    expect(visible(S9_PRISE_EN_CHARGE, "delaiP23", { consultationP23: "FAITE" })).toBe(true);
    expect(visible(S9_PRISE_EN_CHARGE, "delaiP23", { consultationP23: "PROGRAMMEE" })).toBe(false);
  });
});

describe("champs obligatoires (validation bloquante)", () => {
  it("déclaration vide : tous les obligatoires visibles", () => {
    expect(manquantsDeclaration({})).toEqual({
      circonstances: ["dateAes", "heureAes", "dateHeureDeclaration"],
      geste: ["geste"],
      exposition: ["typeExposition", "liquide"],
      conduite: ["lavage"],
      source: ["patientSource", "statutSource"],
      vhb: ["vaccinationVhb"],
      priseEnCharge: ["consultationP23", "niveauRisque", "tpe", "declarationAT"],
    });
  });

  it("profondeur obligatoire pour une piqûre, zone atteinte pour une projection", () => {
    expect(manquantsDeclaration({ typeExposition: "PIQURE" }).plaie).toEqual(["profondeur"]);
    expect(manquantsDeclaration({ typeExposition: "PROJ_MUQUEUSE" }).projection).toEqual(["zonesAtteintes"]);
  });

  it("statut sérologique : les 4 lignes sont exigées", () => {
    expect(manquantsDeclaration({ statutSource: { VIH: "NEGATIF" } }).source).toContain("statutSource");
    expect(manquantsDeclaration(source("NEGATIF")).source).toEqual(["patientSource"]);
  });

  it("consultation : visite et date ; déclaration AT tant qu'elle n'est pas faite", () => {
    expect(manquantsConsultation({}, { extra: { atFaite: false } })).toEqual(["visite", "dateConsultation", "declarationAT"]);
    expect(manquantsConsultation({}, { extra: { atFaite: true } })).toEqual(["visite", "dateConsultation"]);
  });
});

describe("nettoyage des réponses masquées", () => {
  it("passage de piqûre à projection : la section plaie est vidée", () => {
    const v = nettoyerDeclaration({ typeExposition: "PROJ_MUQUEUSE", profondeur: "PROFONDE", materiel: "AIGUILLE_CREUSE", antisepsie: "DAKIN", zonesAtteintes: ["BOUCHE"] });
    expect(v).toEqual({ typeExposition: "PROJ_MUQUEUSE", zonesAtteintes: ["BOUCHE"] });
  });
});

describe("section 11 : consultations répétables", () => {
  const ctx = {
    extra: {
      atFaite: true,
      tpeAccepte: false,
      bilansParVisite: { J1_J7: ["VIH", "VHC", "ALAT"], S12: ["VIH", "VHC"] },
      suivis: [
        { code: "J1_J7", datePrevue: "2026-10-19", statut: "FAITE" },
        { code: "S12", datePrevue: "2027-01-04", statut: "PREVUE" },
      ],
    },
  };
  const grille = champ(CONSULTATION_AES, "resultats") as GridFieldDef;

  it("lignes de résultats filtrées selon les bilans prévus pour la visite", () => {
    expect(visibleRows(grille, { visite: "S12" }, ctx).map((r) => r.value)).toEqual(["VIH", "VHC"]);
    expect(visibleRows(grille, { visite: "NON_PROGRAMMEE" }, ctx)).toHaveLength(9);
  });

  it("observance et effets secondaires seulement si TPE", () => {
    expect(isVisible(champ(CONSULTATION_AES, "observanceTpe"), {}, ctx)).toBe(false);
    expect(isVisible(champ(CONSULTATION_AES, "observanceTpe"), {}, { extra: { tpeAccepte: true } })).toBe(true);
  });

  it("propose la prochaine consultation selon le calendrier", () => {
    const a = CONSULTATION_AES.alerts!({ visite: "J1_J7", dateConsultation: "2026-10-19" }, ctx);
    expect(a.find((x) => x.appliquer)?.appliquer?.valeurs).toEqual({ prochaineConsultation: "2027-01-04" });
  });

  it("nettoyage : résultats hors bilans prévus retirés", () => {
    expect(nettoyerConsultation({ visite: "S12", resultats: { VIH: "NEGATIF", ALAT: "NEGATIF" } }, ctx).resultats).toEqual({ VIH: "NEGATIF" });
  });
});
