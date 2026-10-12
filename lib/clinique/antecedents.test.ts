import { describe, expect, it } from "vitest";
import {
  AP,
  ajouterMembreFratrie,
  genererSyntheseAntecedents,
  membresParDefaut,
} from "./antecedents";

describe("membres de la famille", () => {
  it("père, mère, frère/sœur 1 et 2 par défaut", () => {
    expect(membresParDefaut().map((m) => m.libelle)).toEqual(["Père", "Mère", "Frère/sœur 1", "Frère/sœur 2"]);
  });

  it("« Ajouter un membre de la fratrie » numérote à la suite", () => {
    const m = ajouterMembreFratrie(membresParDefaut());
    expect(m).toHaveLength(5);
    expect(m[4]).toMatchObject({ lien: "FRATRIE", libelle: "Frère/sœur 3", pathologies: [] });
    expect(new Set(ajouterMembreFratrie(m).map((x) => x.id)).size).toBe(6);
  });
});

describe("synthèse des antécédents", () => {
  it("indique l'absence d'antécédent", () => {
    expect(genererSyntheseAntecedents({})).toBe("Aucun antécédent renseigné.");
  });

  it("liste les antécédents médicaux sans doublon de code", () => {
    const s = genererSyntheseAntecedents({
      pathologies: [
        { cim11Code: "5A11", cim11Libelle: "Diabète de type 2" },
        { cim11Code: "5A11", cim11Libelle: "Diabète de type 2" },
        { cim11Code: "BA00", cim11Libelle: "Hypertension essentielle" },
        { cim11Code: "", cim11Libelle: "" },
      ],
    });
    expect(s).toBe("Antécédents médicaux : Diabète de type 2 (5A11), Hypertension essentielle (BA00).");
  });

  it("reprend chirurgicaux et familiaux (membres renseignés seulement)", () => {
    const familiaux = membresParDefaut();
    familiaux[0].pathologies.push({ cim11Code: "BA00", cim11Libelle: "Hypertension essentielle" });
    const s = genererSyntheseAntecedents({ chirurgicaux: "Appendicectomie 2010", familiaux });
    expect(s).toContain("Antécédents chirurgicaux : Appendicectomie 2010.");
    expect(s).toContain("Antécédents familiaux : père : Hypertension essentielle (BA00).");
    expect(s).not.toContain("mère");
  });

  it("résume les antécédents professionnels avec dates au format français", () => {
    const s = genererSyntheseAntecedents({
      professionnels: {
        [AP.AT]: "OUI",
        [AP.AT_DATE]: "2024-03-15",
        [AP.AT_DECLARE]: "OUI",
        [AP.AT_SEQUELLES]: "OUI",
        [AP.AT_SEQUELLES_DETAILS]: "raideur du poignet",
        [AP.MP]: "OUI",
        [AP.MP_MALADIE]: "Syndrome du canal carpien",
        [AP.MP_DECLAREE]: "OUI",
        [AP.MP_DATE_DECLARATION]: "2023-01-10",
        [AP.MP_REPAREE]: "NON",
        [AP.TRAJET]: "NON",
      },
    });
    expect(s).toBe(
      "Antécédents professionnels : accident de travail le 15/03/2024, déclaré, séquelles : raideur du poignet ; " +
        "maladie professionnelle (Syndrome du canal carpien), déclarée le 10/01/2023, non réparée."
    );
  });

  it("ignore un bloc répondu « Non »", () => {
    expect(genererSyntheseAntecedents({ professionnels: { [AP.RECLASSEMENT]: "NON" } })).toBe("Aucun antécédent renseigné.");
  });
});
