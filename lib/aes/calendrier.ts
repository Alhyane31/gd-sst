// Section 10 : calendrier de suivi (champ 62) et bilans pré-cochés par visite (annexe E).
import type { Bilan, DeclarationData, SuiviCode, SuiviStatut } from "./codes";
import { liste, SOURCE, sourceInconnue, statutSource } from "./codes";
import { combinerDateHeure, ajouterJours } from "./delais";
import type { ConditionBilan, ReferentielAes } from "./referentiel";
import { statutHbsSource, statutVhbVictime } from "./regles";

export type SuiviPrevu = {
  code: SuiviCode;
  datePrevue: string; // yyyy-mm-dd
  statut: SuiviStatut;
  bilans: Bilan[];
};

/** Évalue une condition de l'annexe E à partir de la déclaration */
export function conditionVraie(condition: ConditionBilan, d: DeclarationData, ref: ReferentielAes): boolean {
  const tpe = d.tpe === "ACCEPTE";
  const vih = statutSource(d, "VIH");
  const victime = statutVhbVictime(d, ref);
  switch (condition) {
    case "TOUS":
      return true;
    case "VACCINE_TITRE_INCONNU":
      return victime === "REPONSE_INCONNUE";
    case "NON_VACCINE":
      return victime === "NON_VACCINE";
    case "TPE":
      return tpe;
    case "TPE_COMORBIDITE":
      return tpe && d.comorbiditeIatrogenie === "OUI";
    case "S6_VIH":
      return (
        tpe ||
        sourceInconnue(vih) ||
        (vih === SOURCE.POSITIF && liste(d.vihPositifDetails).includes("CV_DETECTABLE"))
      );
    case "SOURCE_ARN_VHC_POSITIF":
      return d.arnVhc === "POSITIF";
    case "NON_IMMUNISE_SOURCE_HBS":
      return victime !== "REPONDEUR" && statutHbsSource(d) !== "NEGATIF";
  }
}

/** Bilans prévus d'une visite, sans doublon, dans l'ordre du référentiel */
export function bilansPrevus(code: SuiviCode, d: DeclarationData, ref: ReferentielAes): Bilan[] {
  const visite = ref.calendrier.find((v) => v.code === code);
  if (!visite) return [];
  const bilans: Bilan[] = [];
  for (const { bilan, condition } of visite.bilans) {
    if (conditionVraie(condition, d, ref) && !bilans.includes(bilan)) bilans.push(bilan);
  }
  return bilans;
}

/**
 * Calendrier généré à la validation : J0 = date de l'AES, dates J0 + décalage (modifiables ensuite).
 * Une visite sans bilan prévu est « Non indiquée ».
 */
export function genererCalendrier(d: DeclarationData, ref: ReferentielAes): SuiviPrevu[] | null {
  const j0 = combinerDateHeure(d.dateAes, d.heureAes ?? "00:00");
  if (!j0) return null;
  return ref.calendrier.map((v) => {
    const bilans = bilansPrevus(v.code, d, ref);
    return {
      code: v.code,
      datePrevue: ajouterJours(j0, v.decalageJours),
      statut: bilans.length ? "PREVUE" : "NON_INDIQUEE",
      bilans,
    };
  });
}
