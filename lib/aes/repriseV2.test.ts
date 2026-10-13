import { describe, expect, it } from "vitest";
import { migrerDeclarationV2 } from "./repriseV2";

describe("reprise des dossiers AES V1 → V2", () => {
  it("options renommées reprises automatiquement", () => {
    const { data, changements } = migrerDeclarationV2({ geste: "GLYCEMIE", dureeLavage: "DIX_PLUS", niveauRisque: "PAS_DE_RISQUE" });
    expect(data).toMatchObject({ geste: "PRELEVEMENT_CAPILLAIRE", dureeLavage: "CINQ_PLUS", niveauRisque: "PAS_D_AES" });
    expect(changements.every((c) => c.automatique)).toBe(true);
  });

  it("rapprochements à vérifier signalés (VVP, geste chirurgical, chlorhexidine)", () => {
    const { data, changements } = migrerDeclarationV2({ geste: "VVP", antisepsie: "CHLORHEXIDINE" });
    expect(data).toMatchObject({ geste: "POSE_PERFUSION", antisepsie: "AUTRE" });
    expect(changements.filter((c) => !c.automatique).map((c) => c.champ)).toEqual(["geste", "antisepsie"]);
  });

  it("ténofovir retiré de la prophylaxie VHB, ancienne valeur archivée", () => {
    const { data } = migrerDeclarationV2({ prophylaxieVhb: ["SCHEMA_VACCINAL", "TENOFOVIR"] });
    expect(data.prophylaxieVhb).toEqual(["SCHEMA_VACCINAL"]);
    expect((data.repriseV2 as { anciennesValeurs: Record<string, unknown> }).anciennesValeurs.prophylaxieVhb).toEqual(["SCHEMA_VACCINAL", "TENOFOVIR"]);
  });

  it("valeurs déjà conformes : aucun changement, pas d'archive", () => {
    const { data, changements } = migrerDeclarationV2({ geste: "SUTURE", liquide: "SOUILLE_SANG" });
    expect(changements).toHaveLength(0);
    expect(data.repriseV2).toBeUndefined();
  });
});
