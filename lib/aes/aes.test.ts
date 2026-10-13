// Logique métier AES — spécification V2
import { describe, expect, it } from "vitest";
import { bilansPrevus, genererCalendrier } from "./calendrier";
import { estPasDAes } from "./codes";
import { ajouterJours, combinerDateHeure, heuresEntre, parseDateHeure, tranche, TRANCHES_DELAI } from "./delais";
import { REFERENTIEL_AES_DEFAUT as REF, fusionnerReferentiel } from "./referentiel";
import {
  alerteDeclarationAt,
  alertePasDAes,
  alerteSaignementProvoque,
  alertesDelaiPriseEnCharge,
  alertesDureesConduite,
  alerteSourceVhc,
  alertesTpe,
  alertesVhb,
  delaiDeclarationHeures,
  statutVhbVictime,
  suggererNiveauRisque,
  suggererProphylaxieVhb,
  suggererTpe,
} from "./regles";
import { alertesConsultation, declarationAtFaite, peutCloturer, prochaineVisite } from "./suivi";

const source = (vih: string, hbs = "NEGATIF", vhc = "NEGATIF") => ({ statutSource: { VIH: vih, AG_HBS: hbs, ANTI_HBC: "NEGATIF", VHC: vhc } });
const AES = { dateAes: "2026-10-12", heureAes: "08:00" };
const apres = (heures: number) => new Date(new Date("2026-10-12T08:00").getTime() + heures * 3_600_000);

describe("délais (champs 4 et 48) : tranches V2", () => {
  it("< 4 h · 4–24 h · 24–48 h · > 48 h, borne basse incluse", () => {
    expect(tranche(3.9, TRANCHES_DELAI)).toBe("< 4 h");
    expect(tranche(4, TRANCHES_DELAI)).toBe("4–24 h");
    expect(tranche(24, TRANCHES_DELAI)).toBe("24–48 h");
    expect(tranche(48, TRANCHES_DELAI)).toBe("> 48 h");
    expect(TRANCHES_DELAI.map((t) => t.libelle)).toEqual(["< 4 h", "4–24 h", "24–48 h", "> 48 h"]);
  });

  it("délai négatif ou incomplet : pas de tranche", () => {
    expect(tranche(-2, TRANCHES_DELAI)).toBeNull();
    expect(tranche(null, TRANCHES_DELAI)).toBeNull();
  });

  it("délai AES → déclaration à partir des champs 1, 2 et 3", () => {
    expect(delaiDeclarationHeures({ ...AES, dateHeureDeclaration: "2026-10-12T11:30" })).toBe(3.5);
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

describe("délai de prise en charge (partie 2)", () => {
  it("> 4 h sans consultation : délai optimal dépassé", () => {
    expect(alertesDelaiPriseEnCharge(AES, REF, apres(5))[0].message).toContain("Délai optimal dépassé");
    expect(alertesDelaiPriseEnCharge(AES, REF, apres(3))).toHaveLength(0);
    expect(alertesDelaiPriseEnCharge({ ...AES, consultationP23: "FAITE" }, REF, apres(5))).toHaveLength(0);
  });

  it("> 48 h : TPE VIH hors délai (48 h), avis du P23 — plus de seuil à 72 h", () => {
    const a = alertesDelaiPriseEnCharge(AES, REF, apres(49));
    expect(a[0]).toMatchObject({ severite: "error" });
    expect(a[0].message).toContain("hors délai (48 h)");
  });

  it("plus d'alerte une fois la décision de TPE renseignée", () => {
    expect(alertesDelaiPriseEnCharge({ ...AES, tpe: "NON_INDIQUE" }, REF, apres(60))).toHaveLength(0);
  });

  it("déclaration AT non faite dans les 24 h : alerte, sinon rappel", () => {
    expect(alerteDeclarationAt({ ...AES, declarationAT: "EN_COURS" }, REF, apres(25))[0].severite).toBe("warning");
    expect(alerteDeclarationAt({ ...AES, declarationAT: "NON_FAITE" }, REF, apres(2))[0].severite).toBe("info");
    expect(alerteDeclarationAt({ ...AES, declarationAT: "FAITE" }, REF, apres(25))).toHaveLength(0);
  });
});

describe("« pas d'AES » (V2)", () => {
  it("projection sur peau saine ou urines/selles non souillées : message et niveau « Pas d'AES »", () => {
    for (const d of [{ typeExposition: "PROJ_PEAU_SAINE" }, { typeExposition: "PIQURE", liquide: "URINES_SELLES" }]) {
      expect(alertePasDAes(d)[0].message).toContain("ne correspond pas à la définition d'un AES");
      expect(suggererNiveauRisque(d)?.niveau).toBe("PAS_D_AES");
      expect(estPasDAes(d)).toBe(true);
    }
  });

  it("salive ou larmes : pas de message « pas d'AES »", () => {
    expect(alertePasDAes({ typeExposition: "PROJ_MUQUEUSE", liquide: "SALIVE_LARMES" })).toHaveLength(0);
  });

  it("pas de calendrier de suivi et clôture possible sans S12", () => {
    expect(genererCalendrier({ ...AES, typeExposition: "PROJ_PEAU_SAINE" }, REF)).toEqual([]);
    expect(peutCloturer([], [], null, true).ok).toBe(true);
  });
});

describe("annexe A : niveau de risque suggéré (V2)", () => {
  it("piqûre profonde, ou aiguille creuse en intravasculaire → important", () => {
    expect(suggererNiveauRisque({ typeExposition: "PIQURE", profondeur: "PROFONDE" })?.niveau).toBe("IMPORTANT");
    expect(suggererNiveauRisque({ typeExposition: "PIQURE", materiel: "AIGUILLE_CREUSE", intravasculaire: "OUI" })?.niveau).toBe("IMPORTANT");
  });
  it("« matériel souillé » n'est plus un critère d'important", () => {
    expect(suggererNiveauRisque({ typeExposition: "PIQURE", materiel: "AIGUILLE_CREUSE", materielSouille: "OUI" })?.niveau).toBe("MINIME");
  });
  it("bistouri, IM/SC, aiguille pleine, contact > 15 min → intermédiaire", () => {
    expect(suggererNiveauRisque({ typeExposition: "COUPURE", materiel: "BISTOURI" })?.niveau).toBe("INTERMEDIAIRE");
    expect(suggererNiveauRisque({ typeExposition: "PIQURE", geste: "INJECTION_IM_SC", materiel: "AIGUILLE_CREUSE" })?.niveau).toBe("INTERMEDIAIRE");
    expect(suggererNiveauRisque({ typeExposition: "PIQURE", materiel: "AIGUILLE_PLEINE" })?.niveau).toBe("INTERMEDIAIRE");
    expect(suggererNiveauRisque({ typeExposition: "PROJ_MUQUEUSE", dureeContact: "PLUS_15" })?.niveau).toBe("INTERMEDIAIRE");
  });
  it("morsure, griffure, projection brève → minime", () => {
    expect(suggererNiveauRisque({ typeExposition: "MORSURE_GRIFFURE", profondeur: "PROFONDE" })?.niveau).toBe("MINIME");
    expect(suggererNiveauRisque({ typeExposition: "PROJ_PEAU_LESEE", dureeContact: "MOINS_5" })?.niveau).toBe("MINIME");
    expect(suggererNiveauRisque({})).toBeNull();
  });
});

describe("annexe B : TPE VIH (V2)", () => {
  it("source VIH positive : recommandé si risque important ou intermédiaire", () => {
    expect(suggererTpe({ ...source("POSITIF"), niveauRisque: "IMPORTANT" })).toBe("RECOMMANDE");
    expect(suggererTpe({ ...source("POSITIF"), niveauRisque: "INTERMEDIAIRE" })).toBe("RECOMMANDE");
  });
  it("source VIH positive, risque minime : TPE non recommandé", () => {
    expect(suggererTpe({ ...source("POSITIF"), niveauRisque: "MINIME" })).toBe("NON_RECOMMANDE");
    expect(alertesTpe({ ...source("POSITIF"), niveauRisque: "MINIME" })[0].message).toContain("non recommandé");
  });
  it("source inconnue + risque important + situation à risque → à proposer", () => {
    expect(suggererTpe({ ...source("INCONNU"), niveauRisque: "IMPORTANT", facteursRisque: ["DROGUES_IV"] })).toBe("A_PROPOSER");
    expect(suggererTpe({ ...source("EN_ATTENTE"), niveauRisque: "IMPORTANT", facteursRisque: ["ENFANT_MERE_VIH"] })).toBe("A_PROPOSER");
  });
  it("source inconnue sinon : TPE non recommandé ; la zone d'endémie VHB ne compte pas pour le VIH", () => {
    expect(suggererTpe({ ...source("INCONNU"), niveauRisque: "IMPORTANT", facteursRisque: ["ZONE_ENDEMIE"] })).toBe("NON_RECOMMANDE");
    expect(suggererTpe({ ...source("INCONNU"), niveauRisque: "INTERMEDIAIRE", facteursRisque: ["DROGUES_IV"] })).toBe("NON_RECOMMANDE");
  });
  it("source négative → pas de TPE", () => {
    expect(suggererTpe(source("NEGATIF"))).toBe("PAS_DE_TPE");
  });
  it("source devenue négative sous TPE → arrêt suggéré, sauf exposition récente à risque", () => {
    const m = alertesTpe({ ...source("NEGATIF"), tpe: "ACCEPTE", bilanInitial: ["CREATININE", "BHCG"] }).map((a) => a.message).join();
    expect(m).toContain("arrêt du TPE et du suivi VIH, sauf exposition récente à risque de la source");
  });
  it("TPE accepté → créatinine et β-hCG proposés au bilan initial (sans les imposer)", () => {
    const a = alertesTpe({ ...source("POSITIF"), niveauRisque: "IMPORTANT", tpe: "ACCEPTE", bilanInitial: ["ALAT"] }).find((x) => x.appliquer);
    expect(a?.appliquer?.valeurs).toEqual({ bilanInitial: ["ALAT", "CREATININE", "BHCG"] });
  });
  it("CV indétectable : décision partagée avec l'expert", () => {
    const a = alertesTpe({ ...source("POSITIF"), niveauRisque: "IMPORTANT", vihPositifDetails: ["CV_INDETECTABLE"] });
    expect(a.map((x) => x.message).join()).toContain("décision partagée");
  });
});

describe("annexe C : prophylaxie VHB (V2)", () => {
  it("répondeur → rien", () => {
    expect(suggererProphylaxieVhb({ vaccinationVhb: "COMPLETE", resultatAntiHbs: "REPONDEUR", ...source("NEGATIF", "POSITIF") }, REF)).toEqual(["NON_INDIQUEE"]);
  });
  it("répondeur si titre > 10 ; 10 exactement = non-répondeur (prudence)", () => {
    expect(statutVhbVictime({ vaccinationVhb: "COMPLETE", titreAntiHbs: "10,1" }, REF)).toBe("REPONDEUR");
    expect(statutVhbVictime({ vaccinationVhb: "COMPLETE", titreAntiHbs: "10" }, REF)).toBe("NON_REPONDEUR");
  });
  it("non répondeur : Ig si source +, rien si inconnue", () => {
    const nr = { vaccinationVhb: "COMPLETE", resultatAntiHbs: "NON_REPONDEUR" };
    expect(suggererProphylaxieVhb({ ...nr, ...source("NEGATIF", "POSITIF") }, REF)).toEqual(["IMMUNOGLOBULINES"]);
    expect(suggererProphylaxieVhb({ ...nr, ...source("NEGATIF", "INCONNU") }, REF)).toEqual(["NON_INDIQUEE"]);
  });
  it("non vacciné : Ig + vaccin si source +, vaccin si inconnue", () => {
    expect(suggererProphylaxieVhb({ vaccinationVhb: "NON_VACCINE", ...source("NEGATIF", "POSITIF") }, REF)).toEqual(["IMMUNOGLOBULINES", "SCHEMA_VACCINAL"]);
    expect(suggererProphylaxieVhb({ vaccinationVhb: "INCOMPLETE", ...source("NEGATIF", "EN_ATTENTE") }, REF)).toEqual(["SCHEMA_VACCINAL"]);
  });
  it("la suggestion s'applique sur demande et disparaît une fois appliquée", () => {
    const d = { vaccinationVhb: "NON_VACCINE", ...source("NEGATIF", "POSITIF") };
    expect(alertesVhb(d, REF)[0].appliquer?.valeurs).toEqual({ prophylaxieVhb: ["IMMUNOGLOBULINES", "SCHEMA_VACCINAL"] });
    expect(alertesVhb({ ...d, prophylaxieVhb: ["IMMUNOGLOBULINES", "SCHEMA_VACCINAL"] }, REF)).toHaveLength(0);
  });
  it("note * : Ig non nécessaires si TPE avec ténofovir", () => {
    const d = { vaccinationVhb: "NON_VACCINE", ...source("POSITIF", "POSITIF"), tpe: "ACCEPTE", schemaTpe: "OMS_2024" };
    expect(alertesVhb(d, REF).map((a) => a.message).join()).toContain("(*)");
  });
  it("note ** : Ig légitimes si source à risque et pas de ténofovir", () => {
    const d = { vaccinationVhb: "NON_VACCINE", ...source("NEGATIF", "INCONNU"), facteursRisque: ["ZONE_ENDEMIE"] };
    expect(alertesVhb(d, REF).map((a) => a.message).join()).toContain("(**)");
    expect(alertesVhb({ ...d, tpe: "ACCEPTE", schemaTpe: "OMS_2024" }, REF).map((a) => a.message).join()).not.toContain("(**)");
  });
});

describe("partie 2 : conduite immédiate, source VHC", () => {
  it("saignement provoqué ou compression → geste déconseillé", () => {
    expect(alerteSaignementProvoque({ saignementProvoque: "COMPRESSION" })[0].message).toContain("déconseillé");
    expect(alerteSaignementProvoque({ saignementProvoque: "NON" })).toHaveLength(0);
  });
  it("rinçage de muqueuse ou contact de l'antiseptique < 5 min → « 5 min au minimum »", () => {
    expect(alertesDureesConduite({ typeExposition: "PROJ_MUQUEUSE", dureeLavage: "MOINS_5" })[0].message).toContain("5 min au minimum");
    expect(alertesDureesConduite({ lavage: "RINCAGE", dureeLavage: "MOINS_5" })).toHaveLength(1);
    expect(alertesDureesConduite({ typeExposition: "PIQURE", lavage: "EAU_SAVON", dureeLavage: "MOINS_5" })).toHaveLength(0);
    expect(alertesDureesConduite({ dureeAntiseptique: "MOINS_5" })[0].message).toContain("antiseptique");
  });
  it("source VHC positive : pas de prophylaxie, ARN VHC, ALAT + ARN VHC à S6", () => {
    expect(alerteSourceVhc(source("NEGATIF", "NEGATIF", "POSITIF"))[0].message).toContain("pas de prophylaxie");
    expect(bilansPrevus("S6", { ...AES, ...source("NEGATIF", "NEGATIF", "POSITIF") }, REF)).toEqual(["ALAT", "ARN_VHC"]);
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

describe("section 11 : consultations et clôture", () => {
  it("résultat positif → alerte + orientation P23 proposée", () => {
    const a = alertesConsultation({ resultats: { VIH: "NEGATIF", ALAT: "POSITIF" }, declarationAT: "FAITE" }, { atFaite: true });
    expect(a[0].message).toContain("ALAT");
    expect(a[0].appliquer?.valeurs).toEqual({ conduite: ["ORIENTATION_P23"] });
  });
  it("séroconversion VIH, VHB ou VHC → alerte « déclaration en maladie professionnelle »", () => {
    const a = alertesConsultation({ resultats: { VHC: "POSITIF" } }, { atFaite: true, serologiesVictime: { VHC: "NEGATIF" } });
    expect(a.map((x) => x.message).join()).toContain("déclaration en maladie professionnelle");
    // déjà positif à l'inclusion : pas de séroconversion
    const b = alertesConsultation({ resultats: { VHC: "POSITIF" } }, { atFaite: true, serologiesVictime: { VHC: "POSITIF" } });
    expect(b.map((x) => x.message).join()).not.toContain("maladie professionnelle");
    // ALAT anormale : pas une séroconversion
    expect(alertesConsultation({ resultats: { ALAT: "POSITIF" } }, { atFaite: true }).map((x) => x.message).join()).not.toContain("maladie professionnelle");
  });
  it("retentissement psychologique → 3 entretiens proposés le premier mois", () => {
    expect(alertesConsultation({ retentissementPsy: "ANXIETE_MODEREE" }, { atFaite: true })[0].message).toContain("3 entretiens");
    expect(alertesConsultation({ retentissementPsy: "AUCUN" }, { atFaite: true })).toHaveLength(0);
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

describe("référentiel V2", () => {
  it("schémas : « Cours » affiché mais non proposé, « Actuel (OMS 2024) », plus de schéma US 2025", () => {
    const codes = REF.schemasTpe.map((s) => s.code);
    expect(codes).toEqual(["COURS", "OMS_2024", "ALTERNATIF", "POSSIBLE", "NEVIRAPINE"]);
    expect(REF.schemasTpe.find((s) => s.code === "COURS")?.actif).toBe(false);
    expect(REF.schemasTpe.find((s) => s.code === "OMS_2024")?.libelle).toBe("Actuel (OMS 2024)");
  });
  it("seuils : TPE 48 h, délai optimal 4 h, déclaration 24 h", () => {
    expect(REF.seuils).toMatchObject({ delaiTpeHeures: 48, delaiOptimalHeures: 4, delaiDeclarationHeures: 24, antiHbsRepondeur: 10 });
  });
  it("annexes : « Pas d'AES » (A), ligne Non-répondeur (D), 1er mois (F)", () => {
    expect(REF.annexes.A.lignes.map((l) => l[0])).toContain("Pas d'AES");
    expect(REF.annexes.D.lignes.map((l) => l[0])).toContain("Non-répondeur");
    expect(REF.annexes.F.lignes.map((l) => l[0])).toEqual(expect.arrayContaining(["J2–J3 (48–72 h)", "1er mois"]));
    expect(REF.annexes.G.lignes[0]).toEqual(["Rapports sexuels protégés", "Jusqu'au dernier test VIH"]);
  });
});

describe("rappels (point d'extension)", () => {
  it("visites prévues dans les n prochains jours, statut « Prévue » uniquement", async () => {
    const { visitesARappeler, canalNotification } = await import("./rappels");
    const suivis = [
      { code: "J1_J7", statut: "PREVUE", datePrevue: "2026-10-15" },
      { code: "S2", statut: "PREVUE", datePrevue: "2026-10-20" },
      { code: "S6", statut: "FAITE", datePrevue: "2026-10-14" },
      { code: "S12", statut: "PREVUE", datePrevue: "2026-10-12" },
    ];
    expect(visitesARappeler(suivis, "2026-10-13", 3).map((s) => s.code)).toEqual(["J1_J7"]);
    expect(canalNotification).toBeNull(); // aucun envoi tant qu'aucun canal n'est configuré
  });
});
