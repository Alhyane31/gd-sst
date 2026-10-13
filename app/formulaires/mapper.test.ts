import { describe, expect, it } from "vitest";
import { mapApiToFormData } from "./mapper";

const base = {
  visite: { type: "ANNUELLE" },
  personnel: { firstName: "Ali", lastName: "Test", pathologies: [] },
};

describe("mapApiToFormData", () => {
  it("relit les champs enregistrés dans raw (renvoyé par le GET)", () => {
    const f = mapApiToFormData({
      ...base,
      formulaire: { raw: { grade: "GRADE_1", nombreEnfants: "2", anneeEtude: "3" } },
    });
    expect(f.grade).toBe("GRADE_1");
    expect(f.nombreEnfants).toBe("2");
    expect(f.anneeEtude).toBe("3");
  });

  it("reste compatible avec l'ancien format data.raw", () => {
    const f = mapApiToFormData({ ...base, formulaire: { data: { raw: { grade: "HORS_GRADE" } } } });
    expect(f.grade).toBe("HORS_GRADE");
  });
});

describe("compatibilité des dossiers v1", () => {
  const v1 = {
    ...base,
    formulaire: {
      antecedents: "HTA connue",
      activitesContraintes: { posturesPredominantes: "ASSISE_PROLONGEE", presenceAideTechnique: "oui", nombrePersonnelsEquipe: "4" },
      examenClinique: { examenCliniqueComplet: "Examen normal", examensPracliniques: "Radio normale" },
      raw: {},
    },
  };

  it("conserve les champs retirés de l'écran (réécrits tels quels à la sauvegarde)", () => {
    const f = mapApiToFormData(v1);
    expect(f.posturesPredominantes).toBe("ASSISE_PROLONGEE");
    expect(f.presenceAideTechnique).toBe("oui");
    expect(f.examenCliniqueComplet).toBe("Examen normal");
    expect(f.examensPracliniques).toBe("Radio normale");
  });

  it("reprend le texte libre des antécédents comme synthèse", () => {
    expect(mapApiToFormData(v1).antecedents).toBe("HTA connue");
  });

  it("initialise les nouveaux blocs à vide", () => {
    const f = mapApiToFormData(v1);
    expect(f.examen).toEqual({});
    expect(f.paraclinique).toEqual({});
    expect(f.antecedentsFamiliaux).toEqual([]);
    expect(f.antecedentsProfessionnels).toEqual({});
  });
});

describe("visite AES : déclaration et dernières données renseignées", () => {
  const precedentRaw = {
    antecedents: "HTA",
    antecedentsChirurgicaux: "Appendicectomie",
    antecedentsFamiliaux: [{ id: "PERE", lien: "PERE", libelle: "Père", pathologies: [] }],
    antecedentsProfessionnels: { at: "OUI" },
  };

  it("pré-remplit les antécédents depuis le formulaire précédent (nouveau formulaire)", () => {
    const f = mapApiToFormData({ ...base, visite: { type: "AES" }, formulaire: { raw: {}, precedentRaw, aes: { typeExposition: "PIQURE" }, aesStatut: "BROUILLON" } });
    expect(f.antecedents).toBe("HTA");
    expect(f.antecedentsChirurgicaux).toBe("Appendicectomie");
    expect(f.antecedentsProfessionnels).toEqual({ at: "OUI" });
    expect(f.aes).toEqual({ typeExposition: "PIQURE" });
    expect(f.aesStatut).toBe("BROUILLON");
  });

  it("une saisie déjà faite dans ce formulaire n'est pas écrasée", () => {
    const f = mapApiToFormData({ ...base, visite: { type: "AES" }, formulaire: { raw: { antecedentsChirurgicaux: "" }, precedentRaw } });
    expect(f.antecedentsChirurgicaux).toBe("");
  });

  it("autres types de visite : pas de reprise du formulaire précédent", () => {
    const f = mapApiToFormData({ ...base, visite: { type: "ANNUELLE" }, formulaire: { raw: {}, precedentRaw } });
    expect(f.antecedentsChirurgicaux).toBe("");
    expect(f.aes).toEqual({});
  });
});
