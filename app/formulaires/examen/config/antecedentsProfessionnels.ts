// 3.3 Antécédents professionnels : chaque « Oui » ouvre son bloc de détails
import { AP } from "@/lib/clinique/antecedents";
import type { SectionDef, SectionValues } from "../types";
import { OUI_NON } from "./presets";

const oui = (cle: string) => (v: SectionValues) => v[cle] === "OUI";
const ouiEt = (cle: string, sous: string) => (v: SectionValues) => v[cle] === "OUI" && v[sous] === "OUI";

export const ANTECEDENTS_PROFESSIONNELS: SectionDef = {
  id: "antecedentsProfessionnels",
  title: "Antécédents professionnels",
  fields: [
    // Accident de travail
    { kind: "choice", id: AP.AT, label: "Accident de travail", options: OUI_NON },
    { kind: "date", id: AP.AT_DATE, label: "Date", showIf: oui(AP.AT) },
    { kind: "choice", id: AP.AT_DECLARE, label: "Déclaré", options: OUI_NON, showIf: oui(AP.AT) },
    { kind: "textarea", id: AP.AT_DETAILS, label: "Détails", showIf: oui(AP.AT) },
    { kind: "choice", id: AP.AT_SEQUELLES, label: "Séquelles", options: OUI_NON, showIf: oui(AP.AT) },
    { kind: "textarea", id: AP.AT_SEQUELLES_DETAILS, label: "Détails des séquelles", showIf: ouiEt(AP.AT, AP.AT_SEQUELLES) },

    // Maladie professionnelle
    { kind: "choice", id: AP.MP, label: "Maladie professionnelle", options: OUI_NON },
    { kind: "text", id: AP.MP_MALADIE, label: "Maladie", showIf: oui(AP.MP) },
    { kind: "choice", id: AP.MP_DECLAREE, label: "Déclarée", options: OUI_NON, showIf: oui(AP.MP) },
    { kind: "date", id: AP.MP_DATE_DECLARATION, label: "Date de déclaration", showIf: ouiEt(AP.MP, AP.MP_DECLAREE) },
    { kind: "choice", id: AP.MP_SEQUELLES, label: "Séquelles", options: OUI_NON, showIf: oui(AP.MP) },
    { kind: "textarea", id: AP.MP_SEQUELLES_DETAILS, label: "Précisions sur les séquelles", showIf: ouiEt(AP.MP, AP.MP_SEQUELLES) },
    { kind: "choice", id: AP.MP_REPAREE, label: "Réparée", options: OUI_NON, showIf: oui(AP.MP) },
    { kind: "date", id: AP.MP_DATE_REPARATION, label: "Date de réparation", showIf: ouiEt(AP.MP, AP.MP_REPAREE) },

    // Accident de trajet (date de l'accident et date de déclaration ajoutées)
    { kind: "choice", id: AP.TRAJET, label: "Accident de trajet", options: OUI_NON },
    { kind: "date", id: AP.TRAJET_DATE, label: "Date de l'accident", showIf: oui(AP.TRAJET) },
    { kind: "choice", id: AP.TRAJET_DECLARE, label: "Déclaré", options: OUI_NON, showIf: oui(AP.TRAJET) },
    { kind: "date", id: AP.TRAJET_DATE_DECLARATION, label: "Date de déclaration", showIf: ouiEt(AP.TRAJET, AP.TRAJET_DECLARE) },
    { kind: "textarea", id: AP.TRAJET_DETAILS, label: "Détails", showIf: oui(AP.TRAJET) },
    { kind: "choice", id: AP.TRAJET_SEQUELLES, label: "Séquelles", options: OUI_NON, showIf: oui(AP.TRAJET) },
    { kind: "textarea", id: AP.TRAJET_SEQUELLES_DETAILS, label: "Détails des séquelles", showIf: ouiEt(AP.TRAJET, AP.TRAJET_SEQUELLES) },

    // Aménagement de poste
    { kind: "choice", id: AP.AMENAGEMENT, label: "Aménagement de poste", options: OUI_NON },
    { kind: "date", id: AP.AMENAGEMENT_DATE, label: "Date", showIf: oui(AP.AMENAGEMENT) },
    { kind: "textarea", id: AP.AMENAGEMENT_MOTIF, label: "Motif", showIf: oui(AP.AMENAGEMENT) },
    { kind: "textarea", id: AP.AMENAGEMENT_RECOMMANDATIONS, label: "Recommandations", showIf: oui(AP.AMENAGEMENT) },

    // Reclassement professionnel
    { kind: "choice", id: AP.RECLASSEMENT, label: "Reclassement professionnel", options: OUI_NON },
    { kind: "date", id: AP.RECLASSEMENT_DATE, label: "Date", showIf: oui(AP.RECLASSEMENT) },
    { kind: "text", id: AP.RECLASSEMENT_TYPE, label: "Type de reclassement", showIf: oui(AP.RECLASSEMENT) },
    { kind: "textarea", id: AP.RECLASSEMENT_MOTIF, label: "Motif", showIf: oui(AP.RECLASSEMENT) },
  ],
};
