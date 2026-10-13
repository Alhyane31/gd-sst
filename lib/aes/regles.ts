// Règles automatiques (partie 2) et aides à la décision (annexes A, B, C) — spécification V2.
// Ce sont des SUGGESTIONS : le médecin garde la main (bouton « Appliquer », valeurs modifiables).
import type { Alerte } from "@/lib/clinique/mesures";
import { nombreOuNull } from "@/lib/clinique/mesures";
import {
  estPasDAes,
  EXPOSITION,
  FACTEURS_RISQUE_VHB_IG,
  FACTEURS_RISQUE_VIH,
  liste,
  SOURCE,
  sourceInconnue,
  statutSource,
  type DeclarationData,
} from "./codes";
import { combinerDateHeure, heuresEntre, parseDateHeure } from "./delais";
import type { ReferentielAes } from "./referentiel";

export type NiveauRisque = "IMPORTANT" | "INTERMEDIAIRE" | "MINIME" | "PAS_D_AES";

export const NIVEAU_LIBELLES: Record<NiveauRisque, string> = {
  IMPORTANT: "Important",
  INTERMEDIAIRE: "Intermédiaire",
  MINIME: "Minime",
  PAS_D_AES: "Pas d'AES",
};

const dateAes = (d: DeclarationData) => combinerDateHeure(d.dateAes, d.heureAes);

/** Délai AES → déclaration, en heures (champs 1, 2, 3) */
export function delaiDeclarationHeures(d: DeclarationData): number | null {
  return heuresEntre(dateAes(d), parseDateHeure(d.dateHeureDeclaration));
}

/** Délai écoulé depuis l'AES, en heures */
export function delaiDepuisAesHeures(d: DeclarationData, maintenant: Date = new Date()): number | null {
  return heuresEntre(dateAes(d), maintenant);
}

// ─── Annexe A : niveau de risque ────────────────────────────────────────────────

/**
 * Niveau de risque suggéré (annexe A, V2).
 * Pas d'AES : projection sur peau saine, urines ou selles non souillées de sang.
 * Important : piqûre ou coupure profonde, ou aiguille creuse en dispositif intravasculaire.
 * Intermédiaire : coupure au bistouri, piqûre avec aiguille IM/SC, aiguille pleine, contact cutanéo-muqueux > 15 min.
 * Minime : autres cas, morsures ou griffures.
 */
export function suggererNiveauRisque(d: DeclarationData): { niveau: NiveauRisque; motif: string } | null {
  const type = d.typeExposition as string | undefined;
  if (type === EXPOSITION.PROJ_PEAU_SAINE) return { niveau: "PAS_D_AES", motif: "projection sur peau saine" };
  if (d.liquide === "URINES_SELLES") return { niveau: "PAS_D_AES", motif: "urines ou selles non souillées de sang" };
  if (!type) return null;

  if (type === EXPOSITION.PIQURE || type === EXPOSITION.COUPURE) {
    if (d.profondeur === "PROFONDE") return { niveau: "IMPORTANT", motif: "blessure profonde" };
    if (d.materiel === "AIGUILLE_CREUSE" && d.intravasculaire === "OUI") {
      return { niveau: "IMPORTANT", motif: "aiguille creuse, dispositif intravasculaire" };
    }
    if (type === EXPOSITION.COUPURE && d.materiel === "BISTOURI") return { niveau: "INTERMEDIAIRE", motif: "coupure avec bistouri" };
    if (type === EXPOSITION.PIQURE && d.geste === "INJECTION_IM_SC") return { niveau: "INTERMEDIAIRE", motif: "piqûre avec aiguille IM ou SC" };
    if (d.materiel === "AIGUILLE_PLEINE") return { niveau: "INTERMEDIAIRE", motif: "piqûre avec aiguille pleine" };
    return { niveau: "MINIME", motif: "autre piqûre ou coupure" };
  }

  if (type === EXPOSITION.MORSURE_GRIFFURE) return { niveau: "MINIME", motif: "morsure ou griffure" };

  // projections sur muqueuse ou peau lésée
  if (d.dureeContact === "PLUS_15") return { niveau: "INTERMEDIAIRE", motif: "exposition cutanéo-muqueuse > 15 min" };
  return { niveau: "MINIME", motif: "projection brève" };
}

export function alerteNiveauRisque(d: DeclarationData): Alerte[] {
  const s = suggererNiveauRisque(d);
  if (!s || d.niveauRisque === s.niveau) return [];
  return [
    {
      severite: "info",
      message: `Annexe A : niveau suggéré « ${NIVEAU_LIBELLES[s.niveau]} » (${s.motif}).${d.niveauRisque ? " Le niveau retenu diffère." : ""}`,
      appliquer: { libelle: "Appliquer", valeurs: { niveauRisque: s.niveau } },
    },
  ];
}

/** Projection sur peau saine, urines ou selles non souillées : ne correspond pas à la définition d'un AES */
export function alertePasDAes(d: DeclarationData): Alerte[] {
  if (d.typeExposition !== EXPOSITION.PROJ_PEAU_SAINE && d.liquide !== "URINES_SELLES") return [];
  const cause = d.typeExposition === EXPOSITION.PROJ_PEAU_SAINE ? "Projection sur peau saine" : "Urines ou selles non souillées de sang";
  return [
    {
      severite: "warning",
      message: `${cause} : ne correspond pas à la définition d'un AES. Lavage simple, pas de suivi.`,
    },
  ];
}

// ─── Délais de prise en charge ──────────────────────────────────────────────────

/**
 * Tant que la décision de TPE n'est pas renseignée et que le médecin référent n'a pas été vu :
 * > 4 h → « délai optimal dépassé, consulter sans attendre » ; > 48 h → « TPE VIH hors délai (48 h), avis du P23 ».
 */
export function alertesDelaiPriseEnCharge(d: DeclarationData, ref: ReferentielAes, maintenant: Date = new Date()): Alerte[] {
  if (d.tpe || estPasDAes(d)) return [];
  const h = delaiDepuisAesHeures(d, maintenant);
  if (h === null || h < 0) return [];
  if (h > ref.seuils.delaiTpeHeures) {
    return [{ severite: "error", message: `TPE VIH hors délai (${ref.seuils.delaiTpeHeures} h) : avis du P23.` }];
  }
  if (h > ref.seuils.delaiOptimalHeures && d.consultationP23 !== "FAITE") {
    return [{ severite: "warning", message: `Délai optimal dépassé (> ${ref.seuils.delaiOptimalHeures} h) : consulter sans attendre.` }];
  }
  return [];
}

/** Déclaration AT non faite dans les 24 h : alerte ; avant 24 h : rappel */
export function alerteDeclarationAt(d: DeclarationData, ref: ReferentielAes, maintenant: Date = new Date()): Alerte[] {
  if (!d.declarationAT || d.declarationAT === "FAITE") return [];
  const h = delaiDepuisAesHeures(d, maintenant);
  if (h !== null && h > ref.seuils.delaiDeclarationHeures) {
    return [
      {
        severite: "warning",
        message: `Déclaration en accident du travail non faite dans les ${ref.seuils.delaiDeclarationHeures} h : rappel à chaque visite jusqu'à la clôture.`,
      },
    ];
  }
  return [{ severite: "info", message: `Déclaration en accident du travail à faire dans les ${ref.seuils.delaiDeclarationHeures} h.` }];
}

// ─── Annexe B : TPE VIH ─────────────────────────────────────────────────────────

export type SuggestionTpe = "RECOMMANDE" | "A_PROPOSER" | "NON_RECOMMANDE" | "PAS_DE_TPE";

/** Niveau retenu par le médecin, à défaut le niveau suggéré */
function niveauEffectif(d: DeclarationData): NiveauRisque | undefined {
  return (d.niveauRisque as NiveauRisque | undefined) ?? suggererNiveauRisque(d)?.niveau;
}

export function suggererTpe(d: DeclarationData): SuggestionTpe | null {
  const vih = statutSource(d, "VIH");
  const niveau = niveauEffectif(d);

  if (vih === SOURCE.NEGATIF) return "PAS_DE_TPE";
  if (vih === SOURCE.POSITIF) {
    if (niveau === "IMPORTANT" || niveau === "INTERMEDIAIRE") return "RECOMMANDE";
    if (niveau === "MINIME" || niveau === "PAS_D_AES") return "NON_RECOMMANDE";
    return null;
  }
  if (!d.statutSource && !d.patientSource) return null;
  // source inconnue (ou non identifiée) : risque important ET source ou situation reconnue à risque
  if (!sourceInconnue(vih) || !niveau) return null;
  const facteurs = liste(d.facteursRisque).filter((f) => FACTEURS_RISQUE_VIH.includes(f));
  return niveau === "IMPORTANT" && facteurs.length > 0 ? "A_PROPOSER" : "NON_RECOMMANDE";
}

export function alertesTpe(d: DeclarationData): Alerte[] {
  const alertes: Alerte[] = [];
  const s = suggererTpe(d);
  const niveau = niveauEffectif(d);
  const cvIndetectable = liste(d.vihPositifDetails).includes("CV_INDETECTABLE");
  const appliquerNonIndique =
    d.tpe === "NON_INDIQUE" ? {} : { appliquer: { libelle: "Appliquer", valeurs: { tpe: "NON_INDIQUE" } } };

  if (s === "RECOMMANDE") {
    alertes.push({
      severite: "warning",
      message: `Source VIH positive, risque ${niveau === "IMPORTANT" ? "important" : "intermédiaire"} : TPE recommandé.${cvIndetectable ? " Charge virale indétectable : décision partagée avec l'expert." : ""}`,
    });
  } else if (s === "A_PROPOSER") {
    alertes.push({ severite: "warning", message: "Source VIH inconnue, risque important et situation à risque : TPE à proposer." });
  } else if (s === "NON_RECOMMANDE") {
    const motif =
      statutSource(d, "VIH") === SOURCE.POSITIF
        ? "source VIH positive, risque minime"
        : "source VIH inconnue sans risque important ou sans situation reconnue à risque";
    alertes.push({ severite: "info", message: `Annexe B : TPE non recommandé (${motif}).`, ...appliquerNonIndique });
  } else if (s === "PAS_DE_TPE" && d.tpe !== "ACCEPTE") {
    alertes.push({ severite: "info", message: "Source VIH négative : pas de TPE.", ...appliquerNonIndique });
  }

  // résultat VIH négatif chez la source sous TPE
  if (d.tpe === "ACCEPTE" && statutSource(d, "VIH") === SOURCE.NEGATIF) {
    alertes.push({
      severite: "warning",
      message: "Source VIH négative : arrêt du TPE et du suivi VIH, sauf exposition récente à risque de la source.",
    });
  }

  // TPE accepté : créatinine et β-hCG au bilan initial
  if (d.tpe === "ACCEPTE") {
    const bilan = liste(d.bilanInitial);
    const manquants = ["CREATININE", "BHCG"].filter((b) => !bilan.includes(b));
    if (manquants.length) {
      alertes.push({
        severite: "info",
        message: "TPE accepté : créatinine et β-hCG à prévoir au bilan initial.",
        appliquer: { libelle: "Cocher", valeurs: { bilanInitial: [...bilan.filter((b) => b !== "NON_FAIT"), ...manquants] } },
      });
    }
  }
  return alertes;
}

// ─── Annexe C : prophylaxie VHB ─────────────────────────────────────────────────

export type StatutVhbVictime = "REPONDEUR" | "NON_REPONDEUR" | "NON_VACCINE" | "REPONSE_INCONNUE";

/**
 * Répondeur : titre STRICTEMENT supérieur au seuil (> 10 mUI/mL) ; 10 exactement = non-répondeur (prudence).
 * Vaccination incomplète ou inconnue : traitée comme non vacciné.
 */
export function statutVhbVictime(d: DeclarationData, ref: ReferentielAes): StatutVhbVictime | null {
  if (!d.vaccinationVhb) return null;
  if (d.vaccinationVhb !== "COMPLETE") return "NON_VACCINE";
  const titre = nombreOuNull(d.titreAntiHbs);
  if (titre !== null) return titre > ref.seuils.antiHbsRepondeur ? "REPONDEUR" : "NON_REPONDEUR";
  if (d.resultatAntiHbs === "REPONDEUR") return "REPONDEUR";
  if (d.resultatAntiHbs === "NON_REPONDEUR") return "NON_REPONDEUR";
  return "REPONSE_INCONNUE";
}

/** Source Ag HBs : POSITIF, NEGATIF ou INCONNU (inconnu, en attente, source non identifiée) */
export function statutHbsSource(d: DeclarationData): "POSITIF" | "NEGATIF" | "INCONNU" {
  const s = statutSource(d, "AG_HBS");
  if (s === SOURCE.POSITIF) return "POSITIF";
  if (s === SOURCE.NEGATIF) return "NEGATIF";
  return "INCONNU";
}

export function suggererProphylaxieVhb(d: DeclarationData, ref: ReferentielAes): string[] | null {
  const victime = statutVhbVictime(d, ref);
  if (!victime || victime === "REPONSE_INCONNUE") return null;
  const source = statutHbsSource(d);
  if (victime === "REPONDEUR" || source === "NEGATIF") return ["NON_INDIQUEE"];
  if (victime === "NON_REPONDEUR") return source === "POSITIF" ? ["IMMUNOGLOBULINES"] : ["NON_INDIQUEE"];
  return source === "POSITIF" ? ["IMMUNOGLOBULINES", "SCHEMA_VACCINAL"] : ["SCHEMA_VACCINAL"];
}

const PROPHYLAXIE_LIBELLES: Record<string, string> = {
  NON_INDIQUEE: "non indiquée",
  IMMUNOGLOBULINES: "immunoglobulines anti-VHB",
  DOSE_VACCIN: "dose de vaccin",
  SCHEMA_VACCINAL: "schéma vaccinal à débuter",
};

/** TPE accepté avec un schéma contenant du ténofovir (référentiel) */
function tpeAvecTenofovir(d: DeclarationData, ref: ReferentielAes): boolean {
  return d.tpe === "ACCEPTE" && !!ref.schemasTpe.find((s) => s.code === d.schemaTpe)?.contientTenofovir;
}

export function alertesVhb(d: DeclarationData, ref: ReferentielAes): Alerte[] {
  const victime = statutVhbVictime(d, ref);
  if (!victime) return [];
  if (victime === "REPONSE_INCONNUE") {
    return [{ severite: "info", message: "Vacciné, réponse anti-HBs inconnue : doser l'anti-HBs et se référer à l'annexe C." }];
  }
  const s = suggererProphylaxieVhb(d, ref);
  if (!s) return [];

  const alertes: Alerte[] = [];
  const actuel = liste(d.prophylaxieVhb);
  const identique = actuel.length === s.length && s.every((x) => actuel.includes(x));
  const source = statutHbsSource(d);
  if (!identique) {
    alertes.push({
      severite: victime !== "REPONDEUR" && source !== "NEGATIF" ? "warning" : "info",
      message: `Annexe C : prophylaxie VHB suggérée : ${s.map((x) => PROPHYLAXIE_LIBELLES[x]).join(" + ")}.`,
      appliquer: { libelle: "Appliquer", valeurs: { prophylaxieVhb: s } },
    });
  }

  // note * : source Ag HBs+, immunoglobulines suggérées, TPE avec ténofovir
  if (s.includes("IMMUNOGLOBULINES") && tpeAvecTenofovir(d, ref)) {
    alertes.push({
      severite: "info",
      message: "Annexe C (*) : immunoglobulines non nécessaires si ADN VHB indétectable chez la source, le TPE contenant du ténofovir.",
    });
  }
  // note ** : source Ag HBs inconnue, victime non protégée, source ou situation à risque, pas de ténofovir
  const facteurs = liste(d.facteursRisque).filter((f) => FACTEURS_RISQUE_VHB_IG.includes(f));
  if (source === "INCONNU" && victime !== "REPONDEUR" && facteurs.length && !tpeAvecTenofovir(d, ref)) {
    alertes.push({
      severite: "info",
      message: "Annexe C (**) : immunoglobulines légitimes (pas de ténofovir dans le TPE ; source d'une zone d'endémie VHB, usager de drogues IV, HSH ou partenaires multiples).",
    });
  }
  return alertes;
}

// ─── Autres règles de la partie 2 ───────────────────────────────────────────────

export function alerteSaignementProvoque(d: DeclarationData): Alerte[] {
  if (d.saignementProvoque === "SAIGNEMENT_PROVOQUE" || d.saignementProvoque === "COMPRESSION") {
    return [{ severite: "warning", message: "Geste déconseillé : ne pas faire saigner ni comprimer la plaie." }];
  }
  return [];
}

/** Rinçage de muqueuse ou contact de l'antiseptique < 5 min : « 5 min au minimum » */
export function alertesDureesConduite(d: DeclarationData): Alerte[] {
  const alertes: Alerte[] = [];
  const muqueuse = d.typeExposition === EXPOSITION.PROJ_MUQUEUSE || d.lavage === "RINCAGE";
  if (muqueuse && d.dureeLavage === "MOINS_5") {
    alertes.push({ severite: "warning", message: "Rinçage de la muqueuse : 5 min au minimum." });
  }
  if (d.dureeAntiseptique === "MOINS_5") {
    alertes.push({ severite: "warning", message: "Contact de l'antiseptique : 5 min au minimum." });
  }
  return alertes;
}

/** Source VHC positive : pas de prophylaxie ; ARN VHC chez la source ; ALAT et ARN VHC à S6 */
export function alerteSourceVhc(d: DeclarationData): Alerte[] {
  if (statutSource(d, "VHC") !== SOURCE.POSITIF) return [];
  return [
    {
      severite: "info",
      message:
        "Source VHC positive : pas de prophylaxie. ARN VHC (PCR) chez la source ; ALAT et ARN VHC à S6 ; prise en charge spécialisée en cas de séroconversion.",
    },
  ];
}
