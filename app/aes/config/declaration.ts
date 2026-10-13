// Déclaration AES — sections 1 à 9 (champs 1 à 61 de la spécification V2).
// Libellés, options, ordre et conditions repris de docs/Module_AES_specifications_V2.md (seule référence).
// Ajouts (règles de la partie 2 sans champ de saisie) : date et heure de la consultation P23 (pour le champ 48),
// comorbidité / crainte de iatrogénie (visite S2).
import { opts } from "@/app/formulaires/examen/config/presets";
import type { ExamCtx, SectionDef, SectionValues } from "@/app/formulaires/examen/types";
import type { Alerte } from "@/lib/clinique/mesures";
import { EXPOSITION, EXPOSITIONS_PLAIE, EXPOSITIONS_PROJECTION, liste, MATERIEL_AIGUILLE, SOURCE, statutSource } from "@/lib/aes/codes";
import { formatDuree, heuresEntre, parseDateHeure, tranche, TRANCHES_DELAI, combinerDateHeure } from "@/lib/aes/delais";
import { REFERENTIEL_AES_DEFAUT, type ReferentielAes } from "@/lib/aes/referentiel";
import {
  alerteDeclarationAt,
  alerteNiveauRisque,
  alertePasDAes,
  alerteSaignementProvoque,
  alertesDelaiPriseEnCharge,
  alertesDureesConduite,
  alerteSourceVhc,
  alertesTpe,
  alertesVhb,
  delaiDeclarationHeures,
} from "@/lib/aes/regles";

export const referentielDuContexte = (ctx: ExamCtx): ReferentielAes =>
  (ctx.extra?.referentiel as ReferentielAes | undefined) ?? REFERENTIEL_AES_DEFAUT;

const OUI_NON = opts(["OUI", "Oui"], ["NON", "Non"]);
const OUI_NON_NSP = opts(["OUI", "Oui"], ["NON", "Non"], ["NSP", "Ne sait pas"]);

const type = (v: SectionValues) => v.typeExposition as string | undefined;
const estMuqueuse = (v: SectionValues) => type(v) === EXPOSITION.PROJ_MUQUEUSE;
const vih = (v: SectionValues) => statutSource(v, "VIH");
const tpeAccepte = (v: SectionValues) => v.tpe === "ACCEPTE";

// ─── Section 1 – Circonstances ──────────────────────────────────────────────────
export const S1_CIRCONSTANCES: SectionDef = {
  id: "circonstances",
  title: "1. Circonstances",
  fields: [
    { kind: "date", id: "dateAes", label: "Date de l'AES", required: true },
    { kind: "time", id: "heureAes", label: "Heure de l'AES", required: true },
    { kind: "datetime", id: "dateHeureDeclaration", label: "Date et heure de la déclaration au service", required: true },
    {
      kind: "computed",
      id: "delaiDeclaration",
      label: "Délai AES → déclaration",
      help: "calculé à partir des champs 1 à 3",
      compute: (v, ctx) => {
        const h = delaiDeclarationHeures(v);
        if (h === null) return null;
        if (h < 0) return { text: "La déclaration précède l'AES : vérifier les dates.", severite: "error" };
        const t = tranche(h, TRANCHES_DELAI)!;
        const seuil = referentielDuContexte(ctx).seuils.delaiDeclarationHeures;
        return { text: `${t} (${formatDuree(h)})`, severite: h > seuil ? "warning" : "info" };
      },
    },
    {
      kind: "select",
      id: "lieu",
      label: "Lieu",
      options: opts(
        ["CHAMBRE", "Chambre du patient"],
        ["BLOC", "Bloc opératoire"],
        ["URGENCES", "Urgences"],
        ["REANIMATION", "Réanimation"],
        ["LABORATOIRE", "Laboratoire"],
        ["SALLE_SOINS", "Salle de soins"],
        ["AUTRE", "Autre"]
      ),
    },
    { kind: "text", id: "service", label: "Service" },
  ],
  alerts: (v, ctx) => {
    const h = delaiDeclarationHeures(v);
    const seuil = referentielDuContexte(ctx).seuils.delaiDeclarationHeures;
    return h !== null && h > seuil
      ? [{ severite: "warning", message: `Délai AES → déclaration > ${seuil} h : la déclaration doit être faite dans les ${seuil} h.` }]
      : [];
  },
};

// ─── Section 2 – Le geste en cause ──────────────────────────────────────────────
export const S2_GESTE: SectionDef = {
  id: "geste",
  title: "2. Le geste en cause",
  fields: [
    {
      kind: "select",
      id: "geste",
      label: "Geste en cours",
      required: true,
      options: opts(
        ["PRELEVEMENT_VEINEUX", "Prélèvement veineux"],
        ["PRELEVEMENT_ARTERIEL", "Prélèvement artériel"],
        ["HEMOCULTURE", "Hémoculture"],
        ["PRELEVEMENT_CAPILLAIRE", "Prélèvement capillaire (glycémie)"],
        ["PRELEVEMENT_INTRA_TUBULAIRE", "Prélèvement intra-tubulaire"],
        ["POSE_PERFUSION", "Pose ou dépose de perfusion"],
        ["VOIE_CENTRALE", "Pose ou retrait de voie centrale"],
        ["INJECTION_IV", "Injection IV"],
        ["INJECTION_IM_SC", "Injection IM ou SC"],
        ["SUTURE", "Suture"],
        ["PLAIE_PEROPERATOIRE", "Plaie peropératoire (instrument chirurgical)"],
        ["PONCTION", "Ponction"],
        ["RECAPUCHONNAGE", "Recapuchonnage"],
        ["ELIMINATION", "Élimination du matériel"],
        ["NETTOYAGE", "Nettoyage ou rangement"],
        ["LINGE_DECHETS", "Manipulation de linge ou déchets"],
        ["AUTRE", "Autre"]
      ),
    },
    {
      kind: "choice",
      id: "momentGeste",
      label: "Moment par rapport au geste",
      options: opts(
        ["PENDANT", "Pendant le geste"],
        ["JUSTE_APRES", "Juste après"],
        ["ELIMINATION", "Lors de l'élimination"],
        ["DIFFERE", "Différé (matériel traînant, linge, déchets)"]
      ),
    },
    { kind: "textarea", id: "descriptionGeste", label: "Description du geste et du déroulement" },
    { kind: "choice", id: "patientAgite", label: "Patient agité ou mouvement brusque", options: OUI_NON },
  ],
};

// ─── Section 3 – Type d'exposition ──────────────────────────────────────────────
export const S3_EXPOSITION: SectionDef = {
  id: "exposition",
  title: "3. Type d'exposition",
  fields: [
    {
      kind: "choice",
      id: "typeExposition",
      label: "Type d'exposition",
      required: true,
      options: opts(
        [EXPOSITION.PIQURE, "Piqûre"],
        [EXPOSITION.COUPURE, "Coupure"],
        [EXPOSITION.PROJ_MUQUEUSE, "Projection sur muqueuse"],
        [EXPOSITION.PROJ_PEAU_LESEE, "Projection sur peau lésée"],
        [EXPOSITION.PROJ_PEAU_SAINE, "Projection sur peau saine"],
        [EXPOSITION.MORSURE_GRIFFURE, "Morsure ou griffure"]
      ),
    },
    {
      kind: "choice",
      id: "liquide",
      label: "Liquide en cause",
      required: true,
      options: opts(
        ["SANG", "Sang"],
        ["SOUILLE_SANG", "Liquide biologique contenant du sang"],
        ["AUTRE_LIQUIDE", "Autre liquide à risque possible (sperme, sécrétions vaginales, LCR, liquide d'ascite, liquide amniotique, LBA)"],
        ["SALIVE_LARMES", "Salive ou larmes non souillées de sang (risque nul VIH et VHC ; salive : risque VHB possible)"],
        ["URINES_SELLES", "Urines ou selles non souillées de sang (risque nul)"],
        ["INCONNU", "Inconnu"]
      ),
    },
  ],
  alerts: (v) => alertePasDAes(v),
};

// ─── Section 4 – Description de la plaie ────────────────────────────────────────
export const S4_PLAIE: SectionDef = {
  id: "plaie",
  title: "4. Description de la plaie",
  intro: "Piqûre, coupure, morsure ou griffure.",
  when: (v) => EXPOSITIONS_PLAIE.includes(type(v) ?? ""),
  fields: [
    {
      kind: "choice",
      id: "materiel",
      label: "Matériel en cause",
      options: opts(
        ["AIGUILLE_CREUSE", "Aiguille creuse"],
        ["AIGUILLE_PLEINE", "Aiguille pleine"],
        ["BISTOURI", "Lame de bistouri"],
        ["LANCETTE", "Lancette"],
        ["VERRE", "Verre cassé"],
        ["AUTRE", "Autre"]
      ),
    },
    {
      kind: "measure",
      id: "calibre",
      label: "Calibre de l'aiguille",
      unit: "G",
      integer: true,
      min: 1,
      showIf: (v) => MATERIEL_AIGUILLE.includes(v.materiel as string),
    },
    { kind: "choice", id: "materielSouille", label: "Matériel visiblement souillé de sang", options: OUI_NON_NSP },
    {
      kind: "choice",
      id: "intravasculaire",
      label: "Aiguille utilisée en intravasculaire",
      options: OUI_NON_NSP,
      showIf: (v) => MATERIEL_AIGUILLE.includes(v.materiel as string),
    },
    { kind: "choice", id: "gants", label: "Gants portés", options: opts(["AUCUN", "Aucun"], ["UNE_PAIRE", "Une paire"], ["DEUX_PAIRES", "Deux paires"]) },
    {
      kind: "select",
      id: "localisation",
      label: "Localisation",
      options: opts(
        ["DOIGT_D", "Doigt main droite"],
        ["DOIGT_G", "Doigt main gauche"],
        ["PAUME_D", "Paume droite"],
        ["PAUME_G", "Paume gauche"],
        ["DOS_MAIN", "Dos de la main"],
        ["AVANT_BRAS", "Avant-bras"],
        ["AUTRE", "Autre"]
      ),
    },
    {
      kind: "choice",
      id: "profondeur",
      label: "Profondeur",
      required: true,
      options: opts(
        ["SUPERFICIELLE", "Superficielle (pas de saignement)"],
        ["SAIGNEMENT_SPONTANE", "Saignement spontané"],
        ["PROFONDE", "Profonde (pénétration nette)"]
      ),
    },
    {
      kind: "checkboxes",
      id: "aspect",
      label: "Aspect",
      options: opts(
        ["PUNCTIFORME", "Punctiforme"],
        ["LINEAIRE", "Linéaire"],
        ["DELABREE", "Délabrée"],
        ["SAIGNEMENT_ACTIF", "Saignement actif"],
        ["PAS_DE_PLAIE", "Pas de plaie visible"]
      ),
    },
    { kind: "measure", id: "longueur", label: "Longueur", unit: "mm", min: 0, showIf: (v) => type(v) === EXPOSITION.COUPURE },
  ],
};

// ─── Section 5 – Description de la projection ──────────────────────────────────
export const S5_PROJECTION: SectionDef = {
  id: "projection",
  title: "5. Description de la projection",
  when: (v) => EXPOSITIONS_PROJECTION.includes(type(v) ?? ""),
  fields: [
    {
      kind: "checkboxes",
      id: "zonesAtteintes",
      label: "Zone atteinte",
      required: true,
      options: opts(
        ["OEIL_D", "Œil droit"],
        ["OEIL_G", "Œil gauche"],
        ["BOUCHE", "Bouche"],
        ["NEZ", "Nez"],
        ["PEAU_LESEE", "Peau lésée"],
        ["PEAU_SAINE", "Peau saine"]
      ),
    },
    {
      kind: "choice",
      id: "volume",
      label: "Volume projeté",
      options: opts(["QUELQUES_GOUTTES", "Quelques gouttes"], ["ABONDANTE", "Projection abondante"], ["NSP", "Ne sait pas"]),
    },
    {
      kind: "choice",
      id: "dureeContact",
      label: "Durée du contact avant lavage",
      options: opts(["MOINS_5", "< 5 min"], ["DE_5_A_15", "5–15 min"], ["PLUS_15", "> 15 min"]),
    },
    {
      kind: "checkboxes",
      id: "protection",
      label: "Protection portée",
      exclusive: "AUCUNE",
      options: opts(["AUCUNE", "Aucune"], ["LUNETTES", "Lunettes"], ["VISIERE", "Visière"], ["MASQUE", "Masque"]),
    },
    {
      kind: "choice",
      id: "natureLesion",
      label: "Nature de la lésion cutanée",
      options: opts(["PLAIE_RECENTE", "Plaie récente"], ["ECZEMA", "Eczéma ou dermatose"], ["GERCURES", "Gerçures"], ["AUTRE", "Autre"]),
      showIf: (v) => type(v) === EXPOSITION.PROJ_PEAU_LESEE || liste(v.zonesAtteintes).includes("PEAU_LESEE"),
    },
  ],
};

// ─── Section 6 – Conduite immédiate ─────────────────────────────────────────────
export const S6_CONDUITE: SectionDef = {
  id: "conduite",
  title: "6. Conduite immédiate",
  fields: [
    {
      kind: "choice",
      id: "saignementProvoque",
      label: "Saignement provoqué ou compression",
      options: opts(["NON", "Non (conforme)", true], ["SAIGNEMENT_PROVOQUE", "Oui, saignement provoqué"], ["COMPRESSION", "Oui, compression"]),
    },
    {
      kind: "choice",
      id: "lavage",
      label: "Lavage",
      required: true,
      options: opts(
        ["NON_FAIT", "Non fait"],
        ["EAU_SAVON", "Eau courante et savon"],
        ["EAU_SEULE", "Eau seule"],
        ["RINCAGE", "Rinçage eau ou sérum physiologique (muqueuse)"]
      ),
    },
    { kind: "choice", id: "dureeLavage", label: "Durée du lavage ou rinçage", options: opts(["MOINS_5", "< 5 min"], ["CINQ_PLUS", "≥ 5 min"]) },
    {
      kind: "select",
      id: "antisepsie",
      label: "Antisepsie",
      help: "Masquée si projection sur muqueuse (rinçage seul)",
      options: opts(
        ["NON_FAITE", "Non faite"],
        ["DAKIN", "Dakin"],
        ["JAVEL", "Eau de Javel diluée (12° au 1/10e ou 9° au 1/5e)"],
        ["POLYVIDONE", "Polyvidone iodée en solution dermique"],
        ["ALCOOL_70", "Alcool à 70° (à défaut)"],
        ["AUTRE", "Autre"]
      ),
      showIf: (v) => !estMuqueuse(v),
    },
    {
      kind: "choice",
      id: "dureeAntiseptique",
      label: "Durée de contact de l'antiseptique",
      options: opts(["MOINS_5", "< 5 min"], ["CINQ_PLUS", "≥ 5 min"], ["NON_PRECISEE", "Non précisée"]),
      showIf: (v) => !estMuqueuse(v),
    },
    { kind: "choice", id: "pansement", label: "Pansement", options: OUI_NON, showIf: (v) => !estMuqueuse(v) },
  ],
  alerts: (v) => [...alerteSaignementProvoque(v), ...alertesDureesConduite(v)],
};

// ─── Section 7 – Patient source ─────────────────────────────────────────────────
const STATUT_SOURCE_COLONNES = opts(
  [SOURCE.NEGATIF, "Négatif"],
  [SOURCE.POSITIF, "Positif"],
  [SOURCE.INCONNU, "Inconnu"],
  [SOURCE.EN_ATTENTE, "Prélevé, en attente"]
);
const LIGNES_SOURCE = opts(["VIH", "VIH"], ["AG_HBS", "Ag HBs"], ["ANTI_HBC", "Anti-HBc"], ["VHC", "VHC"]);

export const S7_SOURCE: SectionDef = {
  id: "source",
  title: "7. Patient source",
  fields: [
    {
      kind: "choice",
      id: "patientSource",
      label: "Patient source",
      required: true,
      options: opts(["IDENTIFIE", "Identifié"], ["NON_IDENTIFIE", "Non identifié"], ["NON_ATTRIBUABLE", "Matériel non attribuable"]),
    },
    { kind: "grid", id: "statutSource", label: "Statut sérologique connu", required: true, rows: LIGNES_SOURCE, columns: STATUT_SOURCE_COLONNES },
    {
      kind: "checkboxes",
      id: "vihPositifDetails",
      label: "Si VIH positif",
      options: opts(
        ["SOUS_ARV", "Sous ARV"],
        ["CV_INDETECTABLE", "Charge virale indétectable"],
        ["CV_DETECTABLE", "Charge virale détectable"],
        ["RESISTANCES", "Résistances connues"],
        ["SITUATION_INCONNUE", "Situation inconnue"]
      ),
      showIf: (v) => vih(v) === SOURCE.POSITIF,
    },
    { kind: "measure", id: "chargeVirale", label: "Charge virale VIH", unit: "copies/mL", integer: true, min: 0, showIf: (v) => vih(v) === SOURCE.POSITIF },
    {
      kind: "choice",
      id: "arnVhc",
      label: "ARN VHC",
      options: opts(["POSITIF", "Positif"], ["NEGATIF", "Négatif"], ["INCONNU", "Inconnu"]),
      showIf: (v) => statutSource(v, "VHC") === SOURCE.POSITIF,
    },
    {
      kind: "checkboxes",
      id: "facteursRisque",
      label: "Facteurs de risque si statut inconnu",
      exclusive: "AUCUN",
      options: opts(
        ["OPPORTUNISTE", "Affection opportuniste majeure ou signes évocateurs (diarrhée chronique, amaigrissement > 10 %, fièvre au long cours)"],
        ["PARTENAIRES_HSH", "Partenaires sexuels multiples, homo- ou bisexuel"],
        ["DROGUES_IV", "Usage de drogues IV"],
        ["POLYTRANSFUSION", "Polytransfusion"],
        ["ENFANT_MERE_VIH", "Enfant né de mère séropositive au VIH"],
        ["ZONE_ENDEMIE", "Originaire d'une zone d'endémie VHB"],
        ["AUCUN", "Aucun connu"]
      ),
      // VIH ou Ag HBs inconnu (« Prélevé, en attente » : statut encore inconnu)
      showIf: (v) => [vih(v), statutSource(v, "AG_HBS")].some((s) => s === SOURCE.INCONNU || s === SOURCE.EN_ATTENTE),
    },
    {
      kind: "checkboxes",
      id: "serologiesDemandees",
      label: "Sérologies demandées (avec consentement)",
      options: opts(
        ["NON_DEMANDEES", "Non demandées"],
        ["REFUS", "Refus"],
        ["TEST_RAPIDE_VIH", "Test rapide VIH"],
        ["VIH", "VIH"],
        ["AG_HBS", "Ag HBs"],
        ["ANTI_HBC", "Anti-HBc"],
        ["ANTI_VHC", "Anti-VHC"],
        ["ARN_VHC", "ARN VHC"],
        ["ALAT", "ALAT"]
      ),
    },
  ],
  alerts: (v) => {
    const alertes: Alerte[] = [];
    const grille = (v.statutSource ?? {}) as Record<string, string>;
    // source non identifiée : statut pré-rempli « Inconnu » sur proposition (modifiable)
    if ((v.patientSource === "NON_IDENTIFIE" || v.patientSource === "NON_ATTRIBUABLE") && LIGNES_SOURCE.some((l) => !grille[l.value])) {
      const valeurs = Object.fromEntries(LIGNES_SOURCE.map((l) => [l.value, grille[l.value] ?? SOURCE.INCONNU]));
      alertes.push({
        severite: "info",
        message: "Source non identifiée : statut sérologique inconnu.",
        appliquer: { libelle: "Remplir « Inconnu »", valeurs: { statutSource: valeurs } },
      });
    }
    return [...alertes, ...alerteSourceVhc(v)];
  },
};

// ─── Section 8 – Statut vaccinal VHB de la victime ──────────────────────────────
const serologieFaite = (v: SectionValues) => v.serologieAntiHbsFaite === "OUI";

export const S8_VHB: SectionDef = {
  id: "vhb",
  title: "8. Statut vaccinal VHB de la victime",
  fields: [
    {
      kind: "choice",
      id: "vaccinationVhb",
      label: "Vaccination hépatite B",
      required: true,
      aide: "D",
      options: opts(["COMPLETE", "Complète"], ["INCOMPLETE", "Incomplète"], ["NON_VACCINE", "Non vacciné"], ["INCONNUE", "Inconnue"]),
    },
    {
      kind: "choice",
      id: "nombreDoses",
      label: "Nombre de doses",
      options: opts(["1", "1"], ["2", "2"], ["3", "3"], ["4_PLUS", "4 ou plus"], ["INCONNU", "Inconnu"]),
    },
    { kind: "date", id: "dateDerniereDose", label: "Date de la dernière dose ou du dernier rappel" },
    { kind: "choice", id: "serologieAntiHbsFaite", label: "Sérologie anti-HBs déjà faite", options: OUI_NON_NSP },
    {
      kind: "choice",
      id: "resultatAntiHbs",
      label: "Résultat",
      options: opts(
        ["REPONDEUR", "Répondeur : > 10 mUI/mL, ou > 100 mUI/mL dans les antécédents"],
        ["NON_REPONDEUR", "Non-répondeur : < 10 mUI/mL sans anti-HBc ni notion d'anti-HBs > 100 mUI/mL dans le passé"],
        ["INCONNU", "Inconnu"]
      ),
      showIf: serologieFaite,
    },
    { kind: "measure", id: "titreAntiHbs", label: "Titre anti-HBs", unit: "mUI/mL", min: 0, showIf: serologieFaite },
    { kind: "date", id: "dateSerologie", label: "Date de la sérologie", showIf: serologieFaite },
  ],
};

// ─── Section 9 – Prise en charge ────────────────────────────────────────────────
export const S9_PRISE_EN_CHARGE: SectionDef = {
  id: "priseEnCharge",
  title: "9. Prise en charge",
  fields: [
    {
      kind: "choice",
      id: "consultationP23",
      label: "Consultation du médecin référent (P23)",
      required: true,
      help: "Au mieux dans les 4 h",
      options: opts(["FAITE", "Faite"], ["NON_FAITE", "Non faite"], ["PROGRAMMEE", "Programmée"]),
    },
    {
      kind: "datetime",
      id: "dateHeureP23",
      label: "Date et heure de la consultation P23",
      help: "Nécessaire au calcul du délai AES → P23",
      showIf: (v) => v.consultationP23 === "FAITE",
    },
    {
      kind: "computed",
      id: "delaiP23",
      label: "Délai AES → consultation P23",
      help: "renseignez la date et l'heure de la consultation",
      showIf: (v) => v.consultationP23 === "FAITE",
      compute: (v, ctx) => {
        const h = heuresEntre(combinerDateHeure(v.dateAes, v.heureAes), parseDateHeure(v.dateHeureP23));
        if (h === null) return null;
        if (h < 0) return { text: "La consultation précède l'AES : vérifier les dates.", severite: "error" };
        const s = referentielDuContexte(ctx).seuils;
        return {
          text: `${tranche(h, TRANCHES_DELAI)} (${formatDuree(h)})`,
          severite: h > s.delaiTpeHeures ? "error" : h > s.delaiOptimalHeures ? "warning" : "success",
        };
      },
    },
    {
      kind: "choice",
      id: "niveauRisque",
      label: "Niveau de risque retenu",
      required: true,
      aide: "A",
      options: opts(["IMPORTANT", "Important"], ["INTERMEDIAIRE", "Intermédiaire"], ["MINIME", "Minime"], ["PAS_D_AES", "Pas d'AES"]),
    },
    {
      kind: "grid",
      id: "serologiesVictime",
      label: "Sérologies initiales de la victime",
      rows: opts(["VIH", "VIH"], ["VHC", "VHC"], ["AG_HBS", "Ag HBs"], ["ANTI_HBC", "Anti-HBc"], ["ANTI_HBS", "Anti-HBs"]),
      columns: opts(["NEGATIF", "Négatif"], ["POSITIF", "Positif"], ["NON_FAIT", "Non fait"], ["EN_ATTENTE", "En attente"]),
    },
    {
      kind: "checkboxes",
      id: "bilanInitial",
      label: "Bilan initial",
      exclusive: "NON_FAIT",
      help: "Créatinine et β-hCG proposés si TPE",
      options: opts(["ALAT", "ALAT"], ["CREATININE", "Créatinine"], ["BHCG", "β-hCG"], ["NFS", "NFS"], ["NON_FAIT", "Non fait"]),
    },
    {
      kind: "choice",
      id: "tpe",
      label: "TPE VIH",
      required: true,
      aide: "B",
      options: opts(["NON_INDIQUE", "Non indiqué"], ["ACCEPTE", "Proposé et accepté"], ["REFUSE", "Proposé et refusé"]),
    },
    { kind: "select", id: "schemaTpe", label: "Schéma prescrit", optionsKey: "schemasTpe", options: [], showIf: tpeAccepte, help: "Selon protocole du P23 (liste paramétrable)", aide: "B" },
    { kind: "datetime", id: "dateHeurePremierePrise", label: "Date et heure de la première prise", showIf: tpeAccepte },
    {
      kind: "computed",
      id: "delaiPremierePrise",
      label: "Délai AES → première prise",
      help: "renseignez la date et l'heure de la première prise",
      showIf: tpeAccepte,
      compute: (v, ctx) => {
        const h = heuresEntre(combinerDateHeure(v.dateAes, v.heureAes), parseDateHeure(v.dateHeurePremierePrise));
        if (h === null) return null;
        if (h < 0) return { text: "La première prise précède l'AES : vérifier les dates.", severite: "error" };
        const s = referentielDuContexte(ctx).seuils;
        return { text: formatDuree(h), severite: h > s.delaiTpeHeures ? "error" : h > s.delaiOptimalHeures ? "warning" : "success" };
      },
    },
    {
      kind: "choice",
      id: "comorbiditeIatrogenie",
      label: "Comorbidité ou crainte de iatrogénie",
      help: "Active la visite S2 (ALAT, créatinine)",
      options: OUI_NON,
      showIf: tpeAccepte,
    },
    {
      kind: "checkboxes",
      id: "prophylaxieVhb",
      label: "Prophylaxie VHB",
      exclusive: "NON_INDIQUEE",
      aide: "C",
      options: opts(
        ["NON_INDIQUEE", "Non indiquée"],
        ["IMMUNOGLOBULINES", "Immunoglobulines anti-VHB"],
        ["DOSE_VACCIN", "Dose de vaccin"],
        ["SCHEMA_VACCINAL", "Schéma vaccinal à débuter"]
      ),
    },
    {
      kind: "choice",
      id: "declarationAT",
      label: "Déclaration en accident du travail",
      required: true,
      help: "Dans les 24 h",
      options: opts(["FAITE", "Faite"], ["EN_COURS", "En cours"], ["NON_FAITE", "Non faite"]),
    },
    { kind: "choice", id: "certificatInitial", label: "Certificat médical initial", options: OUI_NON },
    { kind: "choice", id: "arretTravail", label: "Arrêt de travail", options: OUI_NON },
    {
      kind: "checkboxes",
      id: "causes",
      label: "Cause principale identifiée",
      options: opts(
        ["RECAPUCHONNAGE", "Recapuchonnage"],
        ["NON_RESPECT_PS", "Non-respect des précautions standard"],
        ["COLLECTEUR", "Collecteur absent, éloigné ou plein"],
        ["MATERIEL_NON_SECURISE", "Absence de matériel sécurisé"],
        ["ABSENCE_EPI", "Absence de gants ou d'EPI"],
        ["URGENCE", "Urgence"],
        ["PATIENT_AGITE", "Patient agité"],
        ["CHARGE_TRAVAIL", "Charge de travail, fatigue"],
        ["FORMATION", "Manque de formation"],
        ["AUTRE", "Autre"]
      ),
    },
    { kind: "textarea", id: "mesuresPrevention", label: "Mesures de prévention proposées" },
    { kind: "textarea", id: "commentaire", label: "Commentaire" },
  ],
  alerts: (v, ctx) => {
    const ref = referentielDuContexte(ctx);
    const maintenant = (ctx.extra?.maintenant as Date | undefined) ?? new Date();
    const alertes: Alerte[] = [
      ...alertePasDAes(v),
      ...alertesDelaiPriseEnCharge(v, ref, maintenant),
      ...alerteNiveauRisque(v),
      ...alertesTpe(v),
      ...alertesVhb(v, ref),
      ...alerteDeclarationAt(v, ref, maintenant),
    ];
    return alertes;
  },
};

/** Sections de la déclaration, dans l'ordre ; elles partagent les mêmes valeurs */
export const DECLARATION_AES: SectionDef[] = [
  S1_CIRCONSTANCES,
  S2_GESTE,
  S3_EXPOSITION,
  S4_PLAIE,
  S5_PROJECTION,
  S6_CONDUITE,
  S7_SOURCE,
  S8_VHB,
  S9_PRISE_EN_CHARGE,
];

export const sectionVisible = (s: SectionDef, v: SectionValues, ctx: ExamCtx) => (s.when ? s.when(v, ctx) : true);
