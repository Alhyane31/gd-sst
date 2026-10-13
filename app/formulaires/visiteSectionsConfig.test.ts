import { describe, expect, it } from "vitest";
import { DECLARATION_AES } from "@/app/aes/config/declaration";
import type { FormData } from "./components/types";
import { AES_SECTION_PAR_ETAPE, getSectionsForVisiteType, getVisibleSections } from "./visiteSectionsConfig";

const form = (patch: Partial<FormData>) => patch as FormData;
const cles = (data: FormData) => getVisibleSections(data).map((s) => s.key);

describe("formulaire de visite : sections AES", () => {
  it("visite AES : sections standard (modifiables) puis sections AES", () => {
    expect(cles(form({ typeVisite: "AES", aes: {} }))).toEqual([
      "INFORMATIONS_GENERALES",
      "INFORMATIONS_PROFESSIONNELLES",
      "ANTECEDENTS",
      "AES_CIRCONSTANCES",
      "AES_GESTE",
      "AES_EXPOSITION",
      "AES_CONDUITE",
      "AES_SOURCE",
      "AES_VHB",
      "AES_PRISE_EN_CHARGE",
      "AES_CALENDRIER",
      "AES_CONSULTATIONS",
    ]);
  });

  it("plaie pour piqûre / coupure / morsure, projection pour les projections", () => {
    expect(cles(form({ typeVisite: "AES", aes: { typeExposition: "PIQURE" } }))).toContain("AES_PLAIE");
    expect(cles(form({ typeVisite: "AES", aes: { typeExposition: "PIQURE" } }))).not.toContain("AES_PROJECTION");
    expect(cles(form({ typeVisite: "AES", aes: { typeExposition: "PROJ_PEAU_LESEE" } }))).toContain("AES_PROJECTION");
  });

  it("les autres types de visite sont inchangés (aucune section AES)", () => {
    for (const type of ["ANNUELLE", "EMBAUCHE", "CM", "EXPERTISE"] as const) {
      expect(getSectionsForVisiteType(type).some((s) => s.key.startsWith("AES_"))).toBe(false);
    }
  });

  it("chaque étape AES de déclaration correspond à une section de la config", () => {
    const ids = DECLARATION_AES.map((s) => s.id);
    expect(Object.values(AES_SECTION_PAR_ETAPE).sort()).toEqual([...ids].sort());
  });
});
