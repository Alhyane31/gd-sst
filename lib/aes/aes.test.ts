import { describe, expect, it } from "vitest";
import { bilansPrevus, genererCalendrier } from "./calendrier";
import { ajouterJours, combinerDateHeure, heuresEntre, parseDateHeure, tranche, TRANCHES_DECLARATION, TRANCHES_P23 } from "./delais";
import { REFERENTIEL_AES_DEFAUT as REF, fusionnerReferentiel } from "./referentiel";
import {
  alertesTpe,
  alertesVhb,
  alerteSaignementProvoque,
  delaiDeclarationHeures,
  statutVhbVictime,
  suggererNiveauRisque,
  suggererProphylaxieVhb,
  suggererTpe,
} from "./regles";
import { alertesConsultation, declarationAtFaite, peutCloturer, prochaineVisite } from "./suivi";

const source = (vih: string, hbs = "NEGATIF") => ({ statutSource: { VIH: vih, AG_HBS: hbs, ANTI_HBC: "NEGATIF", VHC: "NEGATIF" } });

describe("délais (champs 4, 48)", () => {
  it("tranches AES → déclaration, borne basse incluse", () => {
    expect(tranche(0.5, TRANCHES_DECLARATION)).toBe("< 1 h");
    expect(tranche(1, TRANCHES_DECLARATION)).toBe("1–4 h");
    expect(tranche(4, TRANCHES_DECLARATION)).toBe("4–24 h");
    expect(tranche(72, TRANCHES_DECLARATION)).toBe("> 72 h");
    expect(tranche(71.9, TRANCHES_DECLARATION)).toBe("48–72 h");
  });

  it("tranches AES → P23", () => {
    expect(tranche(3, TRANCHES_P23)).toBe("< 4 h");
    expect(tranche(30, TRANCHES_P23)).toBe("24–48 h");
  });

  it("délai négatif ou incomplet : pas de tranche", () => {
    expect(tranche(-2, TRANCHES_DECLARATION)).toBeNull();
    expect(tranche(null, TRANCHES_DECLARATION)).toBeNull();
  });

  it("calcule le délai AES → déclaration à partir des champs 1, 2 et 3", () => {
    expect(delaiDeclarationHeures({ dateAes: "2026-10-12", heureAes: "08:00", dateHeureDeclaration: "2026-10-12T11:30" })).toBe(3.5);
    expect(delaiDeclarationHeures({ dateAes: "2026-10-12" })).toBeNull();
  });

  it("dates de suivi : J0 + n jours, jour civil", () => {
    expect(ajouterJours(new Date(2026, 9, 12, 23, 30), 7)).toBe("2026-10-19");
    expect(ajouterJours(new Date(2026, 11, 20), 14)).toBe("2027-01-03");
  });

  it("combine date et heure, refuse les saisies incomplètes", () => {
    expect(combinerDateHeure("2026-10-12", "14:30")?.getHours()).toBe(14);
    expect(combinerDateHeure("2026-10-12", "")).toBeNull();
    expect(heuresEntre(parseDateHeure("2026-10-12T10:00"), parseDateHeure("2026-10-13T10:00"))).toBe(24);
  });
});

describe("annexe A : niveau de risque suggéré", () => {
  it("piqûre profonde → important", () => {
    expect(suggererNiveauRisque({ typeExposition: "PIQURE", profondeur: "PROFONDE" })?.niveau).toBe("IMPORTANT");
  });
  it("aiguille creuse intravasculaire ou souillée → important", () => {
    expect(suggererNiveauRisque({ typeExposition: "PIQURE", materiel: "AIGUILLE_CREUSE", intravasculaire: "OUI" })?.niveau).toBe("IMPORTANT");
    expect(suggererNiveauRisque({ typeExposition: "PIQURE", materiel: "AIGUILLE_CREUSE", materielSouille: "OUI" })?.niveau).toBe("IMPORTANT");
  });
  it("bistouri, IM/SC, aiguille pleine, contact > 15 min → intermédiaire", () => {
    expect(suggererNiveauRisque({ typeExposition: "COUPURE", materiel: "BISTOURI" })?.niveau).toBe("INTERMEDIAIRE");
    expect(suggererNiveauRisque({ typeExposition: "PIQURE", geste: "INJECTION_IM_SC", materiel: "AIGUILLE_CREUSE" })?.niveau).toBe("INTERMEDIAIRE");
    expect(suggererNiveauRisque({ typeExposition: "PIQURE", materiel: "AIGUILLE_PLEINE" })?.niveau).toBe("INTERMEDIAIRE");
    expect(suggererNiveauRisque({ typeExposition: "PROJ_MUQUEUSE", dureeContact: "PLUS_15" })?.niveau).toBe("INTERMEDIAIRE");
  });
  it("morsure, projection brève → minime ; peau saine → pas de risque", () => {
    expect(suggererNiveauRisque({ typeExposition: "MORSURE_GRIFFURE", profondeur: "PROFONDE" })?.niveau).toBe("MINIME");
    expect(suggererNiveauRisque({ typeExposition: "PROJ_PEAU_LESEE", dureeContact: "MOINS_5" })?.niveau).toBe("MINIME");
    expect(suggererNiveauRisque({ typeExposition: "PROJ_PEAU_SAINE" })?.niveau).toBe("PAS_DE_RISQUE");
    expect(suggererNiveauRisque({})).toBeNull();
  });
});

describe("annexe B : TPE VIH", () => {
  it("source VIH positive → recommandé quel que soit le risque", () => {
    expect(suggererTpe({ ...source("POSITIF"), niveauRisque: "MINIME" })).toBe("RECOMMANDE");
  });
  it("source inconnue + risque important + facteur de risque → à proposer", () => {
    expect(suggererTpe({ ...source("INCONNU"), niveauRisque: "IMPORTANT", facteursRisque: ["DROGUES_IV"] })).toBe("A_PROPOSER");
    expect(suggererTpe({ ...source("EN_ATTENTE"), niveauRisque: "IMPORTANT", facteursRisque: ["PARTENAIRES_HSH"] })).toBe("A_PROPOSER");
  });
  it("source inconnue sans facteur ou risque non important → non indiqué", () => {
    expect(suggererTpe({ ...source("INCONNU"), niveauRisque: "IMPORTANT", facteursRisque: ["AUCUN"] })).toBe("NON_INDIQUE");
    expect(suggererTpe({ ...source("INCONNU"), niveauRisque: "INTERMEDIAIRE", facteursRisque: ["DROGUES_IV"] })).toBe("NON_INDIQUE");
  });
  it("source négative → pas de TPE", () => {
    expect(suggererTpe(source("NEGATIF"))).toBe("NON_INDIQUE");
  });
  it("délai > 72 h → alerte hors délai", () => {
    const a = alertesTpe({ dateAes: "2026-10-01", heureAes: "08:00", dateHeureDeclaration: "2026-10-05T08:00" }, REF);
    expect(a[0].message).toContain("hors délai");
  });
  it("source devenue négative sous TPE → arrêt du TPE suggéré", () => {
    expect(alertesTpe({ ...source("NEGATIF"), tpe: "ACCEPTE", bilanInitial: ["CREATININE", "BHCG"] }, REF).map((a) => a.message).join()).toContain("arrêt du TPE");
  });
  it("TPE accepté → créatinine et β-hCG proposés au bilan initial (sans les imposer)", () => {
    const a = alertesTpe({ ...source("POSITIF"), tpe: "ACCEPTE", bilanInitial: ["ALAT"] }, REF).find((x) => x.appliquer);
    expect(a?.appliquer?.valeurs).toEqual({ bilanInitial: ["ALAT", "CREATININE", "BHCG"] });
  });
  it("CV indétectable : décision partagée avec l'expert", () => {
    const a = alertesTpe({ ...source("POSITIF"), vihPositifDetails: ["CV_INDETECTABLE"] }, REF);
    expect(a.map((x) => x.message).join()).toContain("décision partagée");
  });
});

describe("annexe C : prophylaxie VHB", () => {
  const victime = (v: Record<string, unknown>) => v;
  it("répondeur → rien", () => {
    expect(suggererProphylaxieVhb({ ...victime({ vaccinationVhb: "COMPLETE", resultatAntiHbs: "REPONDEUR" }), ...source("NEGATIF", "POSITIF") }, REF)).toEqual(["NON_INDIQUEE"]);
  });
  it("seuil répondeur ≥ 10 mUI/mL (titre)", () => {
    expect(statutVhbVictime({ vaccinationVhb: "COMPLETE", titreAntiHbs: "10" }, REF)).toBe("REPONDEUR");
    expect(statutVhbVictime({ vaccinationVhb: "COMPLETE", titreAntiHbs: "9,9" }, REF)).toBe("NON_REPONDEUR");
  });
  it("non répondeur : Ig si source +, rien si inconnue", () => {
    const nr = { vaccinationVhb: "COMPLETE", resultatAntiHbs: "NON_REPONDEUR" };
    expect(suggererProphylaxieVhb({ ...nr, ...source("NEGATIF", "POSITIF") }, REF)).toEqual(["IMMUNOGLOBULINES"]);
    expect(suggererProphylaxieVhb({ ...nr, ...source("NEGATIF", "INCONNU") }, REF)).toEqual(["NON_INDIQUEE"]);
  });
  it("non vacciné (ou incomplet / inconnu) : Ig + vaccin si source +, vaccin si inconnue", () => {
    expect(suggererProphylaxieVhb({ vaccinationVhb: "NON_VACCINE", ...source("NEGATIF", "POSITIF") }, REF)).toEqual(["IMMUNOGLOBULINES", "SCHEMA_VACCINAL"]);
    expect(suggererProphylaxieVhb({ vaccinationVhb: "INCOMPLETE", ...source("NEGATIF", "EN_ATTENTE") }, REF)).toEqual(["SCHEMA_VACCINAL"]);
    expect(suggererProphylaxieVhb({ vaccinationVhb: "INCONNUE", ...source("NEGATIF", "NEGATIF") }, REF)).toEqual(["NON_INDIQUEE"]);
  });
  it("réponse inconnue : pas de suggestion automatique, renvoi à l'annexe C", () => {
    expect(suggererProphylaxieVhb({ vaccinationVhb: "COMPLETE" }, REF)).toBeNull();
    expect(alertesVhb({ vaccinationVhb: "COMPLETE" }, REF)[0].message).toContain("annexe C");
  });
  it("la suggestion s'applique sur demande et disparaît une fois appliquée", () => {
    const d = { vaccinationVhb: "NON_VACCINE", ...source("NEGATIF", "POSITIF") };
    expect(alertesVhb(d, REF)[0].appliquer?.valeurs).toEqual({ prophylaxieVhb: ["IMMUNOGLOBULINES", "SCHEMA_VACCINAL"] });
    expect(alertesVhb({ ...d, prophylaxieVhb: ["IMMUNOGLOBULINES", "SCHEMA_VACCINAL"] }, REF)).toHaveLength(0);
  });
});

describe("annexe E : bilans pré-cochés et calendrier", () => {
  const base = { dateAes: "2026-10-12", heureAes: "10:00", ...source("NEGATIF", "NEGATIF") };

  it("J1–J7 pour tous : VIH, VHC, ALAT", () => {
    expect(bilansPrevus("J1_J7", { ...base, vaccinationVhb: "COMPLETE", resultatAntiHbs: "REPONDEUR" }, REF)).toEqual(["VIH", "VHC", "ALAT"]);
  });
  it("vacciné, titre inconnu → anti-HBs ; non vacciné → Ag HBs, anti-HBc, anti-HBs", () => {
    expect(bilansPrevus("J1_J7", { ...base, vaccinationVhb: "COMPLETE" }, REF)).toContain("ANTI_HBS");
    expect(bilansPrevus("J1_J7", { ...base, vaccinationVhb: "NON_VACCINE" }, REF)).toEqual(["VIH", "VHC", "ALAT", "AG_HBS", "ANTI_HBC", "ANTI_HBS"]);
  });
  it("TPE accepté → créatinine et β-hCG à J1–J7 ; S2 seulement si comorbidité", () => {
    const tpe = { ...base, vaccinationVhb: "COMPLETE", resultatAntiHbs: "REPONDEUR", tpe: "ACCEPTE" };
    expect(bilansPrevus("J1_J7", tpe, REF)).toEqual(expect.arrayContaining(["CREATININE", "BHCG"]));
    expect(bilansPrevus("S2", tpe, REF)).toEqual([]);
    expect(bilansPrevus("S2", { ...tpe, comorbiditeIatrogenie: "OUI" }, REF)).toEqual(["ALAT", "CREATININE"]);
  });
  it("S6 : VIH si TPE ou source VIH inconnue ; ALAT + ARN VHC si ARN VHC source positif", () => {
    expect(bilansPrevus("S6", base, REF)).toEqual([]);
    expect(bilansPrevus("S6", { ...base, ...source("INCONNU") }, REF)).toEqual(["VIH"]);
    expect(bilansPrevus("S6", { ...base, ...source("POSITIF"), vihPositifDetails: ["CV_DETECTABLE"] }, REF)).toEqual(["VIH"]);
    expect(bilansPrevus("S6", { ...base, arnVhc: "POSITIF" }, REF)).toEqual(["ALAT", "ARN_VHC"]);
  });
  it("S12 : VIH, VHC pour tous ; hépatite B si non immunisé et source HBs + ou inconnue", () => {
    expect(bilansPrevus("S12", { ...base, vaccinationVhb: "COMPLETE", resultatAntiHbs: "REPONDEUR" }, REF)).toEqual(["VIH", "VHC"]);
    expect(bilansPrevus("S12", { ...base, ...source("NEGATIF", "INCONNU"), vaccinationVhb: "NON_VACCINE" }, REF)).toEqual(["VIH", "VHC", "AG_HBS", "ANTI_HBC", "ANTI_HBS"]);
  });
  it("dates J0 + 7, 14, 42, 84 ; visite sans bilan = non indiquée", () => {
    const cal = genererCalendrier({ ...base, vaccinationVhb: "COMPLETE", resultatAntiHbs: "REPONDEUR" }, REF)!;
    expect(cal.map((c) => [c.code, c.datePrevue, c.statut])).toEqual([
      ["J1_J7", "2026-10-19", "PREVUE"],
      ["S2", "2026-10-26", "NON_INDIQUEE"],
      ["S6", "2026-11-23", "NON_INDIQUEE"],
      ["S12", "2027-01-04", "PREVUE"],
    ]);
  });
  it("décalages paramétrables (référentiel)", () => {
    const ref = fusionnerReferentiel({ calendrier: REF.calendrier.map((v) => (v.code === "J1_J7" ? { ...v, decalageJours: 3 } : v)) });
    expect(genererCalendrier(base, ref)![0].datePrevue).toBe("2026-10-15");
  });
  it("pas de calendrier sans date d'AES", () => {
    expect(genererCalendrier({}, REF)).toBeNull();
  });
});

describe("partie 2 : autres règles", () => {
  it("saignement provoqué ou compression → geste déconseillé", () => {
    expect(alerteSaignementProvoque({ saignementProvoque: "COMPRESSION" })[0].message).toContain("déconseillé");
    expect(alerteSaignementProvoque({ saignementProvoque: "NON" })).toHaveLength(0);
  });
});

describe("section 11 : consultations et clôture", () => {
  it("résultat positif → alerte + orientation P23 proposée", () => {
    const a = alertesConsultation({ resultats: { VIH: "NEGATIF", ALAT: "POSITIF" }, declarationAT: "FAITE" }, { atFaite: true });
    expect(a[0].message).toContain("ALAT");
    expect(a[0].appliquer?.valeurs).toEqual({ conduite: ["ORIENTATION_P23"] });
  });
  it("signe de primo-infection → alerte", () => {
    expect(alertesConsultation({ primoInfection: ["FIEVRE"] }, { atFaite: true })[0].severite).toBe("error");
    expect(alertesConsultation({ primoInfection: ["AUCUN"] }, { atFaite: true })).toHaveLength(0);
  });
  it("rappel AT à chaque visite tant que non faite", () => {
    expect(alertesConsultation({}, { atFaite: false })[0].message).toContain("accident du travail");
    expect(declarationAtFaite({ declarationAT: "NON_FAITE" }, [{ declarationAT: "FAITE" }])).toBe(true);
  });
  it("clôture bloquée avant S12", () => {
    expect(peutCloturer([{ code: "S12", statut: "PREVUE" }], [{ visite: "S6" }]).ok).toBe(false);
  });
  it("clôture permise après S12 faite ou consultation S12", () => {
    expect(peutCloturer([{ code: "S12", statut: "FAITE" }], []).ok).toBe(true);
    expect(peutCloturer([], [{ visite: "S12" }]).ok).toBe(true);
  });
  it("arrêt justifié : conduite d'arrêt + motif obligatoire", () => {
    const c = [{ visite: "J1_J7", conduite: ["FIN_SUIVI"] }];
    expect(peutCloturer([], c).ok).toBe(false);
    expect(peutCloturer([], c, "Source négative sur tous les marqueurs").ok).toBe(true);
  });
  it("prochaine consultation proposée selon le calendrier", () => {
    const suivis = [
      { code: "J1_J7" as const, datePrevue: "2026-10-19", statut: "FAITE" as const },
      { code: "S2" as const, datePrevue: "2026-10-26", statut: "NON_INDIQUEE" as const },
      { code: "S6" as const, datePrevue: "2026-11-23", statut: "PREVUE" as const },
    ];
    expect(prochaineVisite(suivis, "2026-10-19")).toEqual(suivis[2]);
  });
});
