// 4.6 à 4.14 : appareils cardiovasculaire, digestif, pleuropulmonaire, neurologique général,
// téguments, ORL, ophtalmologie, cou-thyroïde-ganglions, bucco-dentaire.
import type { SectionDef, SectionValues } from "../types";
import {
  COL_ABSENT_PRESENT,
  COL_NORMAL_ANORMAL,
  COL_NORMAL_DG,
  COL_PRESENCE_DG,
  COL_PRESENCE_DG_NF,
  COL_TESTS,
  opts,
} from "./presets";

const egal = (champ: string, valeur: string) => (v: SectionValues) => v[champ] === valeur;

export const CARDIOVASCULAIRE: SectionDef = {
  id: "cardiovasculaire",
  title: "Appareil cardiovasculaire",
  fields: [
    {
      kind: "grid",
      id: "inspection",
      label: "Inspection",
      columns: COL_PRESENCE_DG,
      rows: opts(
        ["CYANOSE", "Cyanose"],
        ["TURGESCENCE_JUGULAIRE", "Turgescence jugulaire"],
        ["OEDEMES_MI", "Œdèmes des membres inférieurs (signe du godet)"],
        ["VARICES", "Varices"],
        ["TROUBLES_TROPHIQUES", "Troubles trophiques"]
      ),
    },
    { kind: "choice", id: "rythme", label: "Rythme cardiaque", options: opts(["REGULIER", "Régulier", true], ["IRREGULIER", "Irrégulier"]) },
    {
      kind: "choice",
      id: "bruits",
      label: "Bruits du cœur",
      options: opts(["B1B2", "B1 B2 bien perçus", true], ["ASSOURDIS", "Assourdis"], ["SURAJOUTE", "Bruit surajouté (B3, B4)"]),
    },
    { kind: "choice", id: "souffle", label: "Souffle cardiaque", options: opts(["ABSENT", "Absent", true], ["PRESENT", "Présent"]) },
    {
      kind: "grid",
      id: "souffleFoyers",
      label: "Précisions du souffle",
      columns: opts(["SYSTOLIQUE", "Systolique"], ["DIASTOLIQUE", "Diastolique"], ["CONTINU", "Continu"]),
      rows: opts(["AORTIQUE", "Foyer aortique"], ["PULMONAIRE", "Foyer pulmonaire"], ["TRICUSPIDE", "Foyer tricuspide"], ["MITRAL", "Foyer mitral"]),
      showIf: egal("souffle", "PRESENT"),
    },
    {
      kind: "select",
      id: "souffleIntensite",
      label: "Intensité du souffle",
      options: opts(["1", "1/6"], ["2", "2/6"], ["3", "3/6"], ["4", "4/6"], ["5", "5/6"], ["6", "6/6"]),
      showIf: egal("souffle", "PRESENT"),
    },
    {
      kind: "grid",
      id: "poulsPeripheriques",
      label: "Pouls périphériques",
      columns: opts(["PERCUS", "Perçus bilatéralement", true], ["ABSENT_D", "Absent D"], ["ABSENT_G", "Absent G"], ["ABSENT_BILATERAL", "Absent bilatéral"], ["NON_FAIT", "Non fait"]),
      rows: opts(["RADIAL", "Radial"], ["FEMORAL", "Fémoral"], ["POPLITE", "Poplité"], ["PEDIEUX", "Pédieux"], ["TIBIAL_POSTERIEUR", "Tibial postérieur"]),
    },
    {
      kind: "grid",
      id: "soufflesVasculaires",
      label: "Souffles vasculaires",
      columns: COL_PRESENCE_DG_NF,
      rows: opts(["CAROTIDIEN", "Carotidien"], ["FEMORAL", "Fémoral"], ["ABDOMINAL", "Abdominal"]),
    },
    { kind: "textarea", id: "precisions", label: "Précisions" },
  ],
};

export const DIGESTIF: SectionDef = {
  id: "digestif",
  title: "Appareil digestif (abdomen)",
  fields: [
    {
      kind: "grid",
      id: "inspection",
      label: "Inspection",
      columns: COL_ABSENT_PRESENT,
      rows: opts(["DISTENSION", "Distension"], ["CICATRICES", "Cicatrices"], ["CVC", "Circulation veineuse collatérale"], ["VOUSSURE", "Voussure"]),
    },
    {
      kind: "choice",
      id: "palpationGlobale",
      label: "Palpation globale",
      options: opts(["SOUPLE", "Souple et indolore", true], ["DEFENSE", "Défense"], ["CONTRACTURE", "Contracture"]),
    },
    {
      kind: "grid",
      id: "palpationRegions",
      label: "Sensibilité par région",
      columns: opts(["INDOLORE", "Indolore", true], ["DOULOUREUX", "Douloureux"], ["NON_FAIT", "Non fait"]),
      rows: opts(
        ["EPIGASTRE", "Épigastre"],
        ["HYPOCHONDRE_D", "Hypochondre D"],
        ["HYPOCHONDRE_G", "Hypochondre G"],
        ["FLANC_D", "Flanc D"],
        ["FLANC_G", "Flanc G"],
        ["OMBILICALE", "Région ombilicale"],
        ["FID", "Fosse iliaque D"],
        ["FIG", "Fosse iliaque G"],
        ["HYPOGASTRE", "Hypogastre"]
      ),
    },
    {
      kind: "grid",
      id: "organomegalie",
      label: "Organomégalie, masse",
      columns: COL_ABSENT_PRESENT,
      rows: opts(["HEPATOMEGALIE", "Hépatomégalie"], ["SPLENOMEGALIE", "Splénomégalie"], ["MASSE", "Masse palpable"]),
    },
    {
      kind: "grid",
      id: "orificesHerniaires",
      label: "Orifices herniaires",
      columns: opts(["LIBRES", "Libres", true], ["HERNIE_D", "Hernie D"], ["HERNIE_G", "Hernie G"], ["BILATERALE_MEDIANE", "Bilatérale-médiane"], ["NON_FAIT", "Non fait"]),
      rows: opts(["INGUINAL", "Inguinal"], ["CRURAL", "Crural"], ["OMBILICAL", "Ombilical"], ["LIGNE_BLANCHE", "Ligne blanche"]),
    },
    {
      kind: "choice",
      id: "percussion",
      label: "Percussion",
      options: opts(["NORMALE", "Normale", true], ["MATITE_DECLIVE", "Matité déclive"], ["TYMPANISME", "Tympanisme excessif"]),
    },
    {
      kind: "choice",
      id: "bruitsHydroAeriques",
      label: "Bruits hydro-aériques",
      options: opts(["PRESENTS", "Présents", true], ["DIMINUES", "Diminués"], ["ABSENTS", "Absents"], ["AUGMENTES", "Augmentés"]),
    },
    {
      kind: "choice",
      id: "fossesLombaires",
      label: "Fosses lombaires (ébranlement)",
      options: opts(["INDOLORES", "Indolores", true], ["DOULOUREUSE_D", "Douloureuse D"], ["DOULOUREUSE_G", "Douloureuse G"], ["BILATERALE", "Bilatérale"]),
    },
    { kind: "textarea", id: "precisions", label: "Précisions" },
  ],
};

const HEMITHORAX = opts(["D", "Hémithorax D"], ["G", "Hémithorax G"]);

export const PLEUROPULMONAIRE: SectionDef = {
  id: "pleuropulmonaire",
  title: "Appareil pleuropulmonaire",
  fields: [
    {
      kind: "grid",
      id: "inspection",
      label: "Inspection",
      columns: COL_ABSENT_PRESENT,
      rows: opts(
        ["DEFORMATION", "Déformation thoracique"],
        ["TIRAGE", "Tirage"],
        ["POLYPNEE", "Polypnée"],
        ["CYANOSE", "Cyanose"],
        ["HIPPOCRATISME", "Hippocratisme digital"]
      ),
    },
    {
      kind: "grid",
      id: "vibrationsVocales",
      label: "Vibrations vocales",
      columns: opts(["NORMALES", "Normales", true], ["AUGMENTEES", "Augmentées"], ["DIMINUEES", "Diminuées"], ["NON_FAIT", "Non fait"]),
      rows: HEMITHORAX,
    },
    {
      kind: "grid",
      id: "percussion",
      label: "Percussion",
      columns: opts(["SONORITE_NORMALE", "Sonorité normale", true], ["MATITE", "Matité"], ["TYMPANISME", "Tympanisme"], ["NON_FAIT", "Non fait"]),
      rows: HEMITHORAX,
    },
    {
      kind: "grid",
      id: "murmureVesiculaire",
      label: "Murmure vésiculaire",
      columns: opts(["NORMAL", "Normal", true], ["DIMINUE", "Diminué"], ["ABOLI", "Aboli"], ["NON_FAIT", "Non fait"]),
      rows: HEMITHORAX,
    },
    {
      kind: "grid",
      id: "bruitsSurajoutes",
      label: "Bruits surajoutés",
      columns: COL_PRESENCE_DG,
      rows: opts(["CREPITANTS", "Crépitants"], ["SIBILANTS", "Sibilants"], ["RONCHI", "Ronchi"], ["FROTTEMENT", "Frottement pleural"]),
    },
    { kind: "textarea", id: "precisions", label: "Précisions" },
  ],
};

export const NEUROLOGIQUE: SectionDef = {
  id: "neurologique",
  title: "Examen neurologique général",
  intro: "Complète les examens radiculaires des rachis (4.2 et 4.4).",
  fields: [
    {
      kind: "choice",
      id: "conscience",
      label: "Conscience et orientation",
      options: opts(["CONSCIENT_ORIENTE", "Conscient, orienté", true], ["ANOMALIE", "Anomalie"]),
    },
    { kind: "text", id: "conscienceAnomalie", label: "Préciser l'anomalie", showIf: egal("conscience", "ANOMALIE") },
    {
      kind: "grid",
      id: "examen",
      label: "Examen neurologique",
      columns: COL_NORMAL_ANORMAL,
      rows: opts(
        ["FONCTIONS_SUPERIEURES", "Fonctions supérieures"],
        ["NERFS_CRANIENS", "Nerfs crâniens"],
        ["MOTRICITE", "Motricité globale"],
        ["SENSIBILITE", "Sensibilité globale"],
        ["TONUS", "Tonus"],
        ["MOUVEMENTS_ANORMAUX", "Mouvements anormaux (tremblement)"]
      ),
    },
    {
      kind: "grid",
      id: "coordination",
      label: "Coordination et équilibre",
      columns: COL_TESTS,
      rows: opts(["ROMBERG", "Romberg"], ["DOIGT_NEZ", "Épreuve doigt-nez"], ["TALON_GENOU", "Épreuve talon-genou"], ["TANDEM", "Marche en tandem"]),
    },
    { kind: "choice", id: "signesMeninges", label: "Signes méningés", options: opts(["ABSENTS", "Absents", true], ["PRESENTS", "Présents"]) },
    { kind: "textarea", id: "precisions", label: "Précisions" },
  ],
};

export const TEGUMENTS: SectionDef = {
  id: "teguments",
  title: "Téguments et phanères",
  fields: [
    {
      kind: "grid",
      id: "peau",
      label: "Peau",
      columns: COL_ABSENT_PRESENT,
      rows: opts(
        ["PALEUR", "Pâleur"],
        ["ICTERE", "Ictère"],
        ["CYANOSE", "Cyanose"],
        ["ERUPTION", "Éruption"],
        ["ECZEMA", "Eczéma"],
        ["DERMITE_MAINS", "Dermite des mains (irritation, allergie aux gants)"],
        ["PLAIES", "Plaies"],
        ["CICATRICES", "Cicatrices"],
        ["LESIONS_PIGMENTEES", "Lésions pigmentées suspectes"],
        ["MYCOSE", "Mycose cutanée"]
      ),
    },
    {
      kind: "grid",
      id: "phaneres",
      label: "Phanères",
      columns: opts(["NORMAL", "Normal", true], ["ANORMAL", "Anormal"]),
      rows: opts(["ONGLES", "Ongles (onychomycose, hippocratisme, autre)"], ["CHEVEUX", "Cheveux (alopécie, autre)"]),
    },
    { kind: "textarea", id: "description", label: "Localisation et description" },
  ],
};

export const ORL: SectionDef = {
  id: "orl",
  title: "Examen ORL",
  fields: [
    {
      kind: "grid",
      id: "otoscopie",
      label: "Otoscopie",
      columns: COL_TESTS,
      rows: opts(["CONDUIT", "Conduit auditif (bouchon, otite externe)"], ["TYMPAN", "Tympan (perforation, rétraction, épanchement)"]),
    },
    {
      kind: "grid",
      id: "acoumetrie",
      label: "Acoumétrie au diapason",
      columns: opts(["NORMAL", "Normal", true], ["ANORMAL_D", "Anormal D"], ["ANORMAL_G", "Anormal G"], ["NON_FAIT", "Non fait"]),
      rows: opts(["WEBER", "Weber (latéralisé ?)"], ["RINNE", "Rinne"]),
    },
    {
      kind: "checkboxes",
      id: "plaintesAuditives",
      label: "Plaintes auditives",
      exclusive: "AUCUNE",
      options: opts(["BAISSE_AUDITION", "Baisse d'audition"], ["ACOUPHENES", "Acouphènes"], ["HYPERACOUSIE", "Hyperacousie"], ["VERTIGES", "Vertiges"], ["AUCUNE", "Aucune"]),
    },
    {
      kind: "grid",
      id: "rhinoscopie",
      label: "Rhinoscopie et oropharynx",
      columns: COL_NORMAL_ANORMAL,
      rows: opts(["FOSSES_NASALES", "Fosses nasales (rhinite, irritation)"], ["OROPHARYNX", "Oropharynx"]),
    },
    { kind: "textarea", id: "precisions", label: "Précisions" },
  ],
};

export const OPHTALMOLOGIE: SectionDef = {
  id: "ophtalmologie",
  title: "Examen ophtalmologique clinique",
  fields: [
    {
      kind: "grid",
      id: "inspection",
      label: "Inspection",
      columns: COL_NORMAL_DG,
      rows: opts(
        ["PAUPIERES", "Paupières"],
        ["CONJONCTIVES", "Conjonctives (rougeur, irritation)"],
        ["CORNEE", "Cornée"],
        ["SCLEROTIQUES", "Sclérotiques (ictère)"]
      ),
    },
    {
      kind: "grid",
      id: "pupilles",
      label: "Pupilles et réflexe photomoteur",
      columns: COL_NORMAL_DG,
      rows: opts(["TAILLE", "Taille"], ["SYMETRIE", "Symétrie"], ["PHOTOMOTEUR", "Réflexe photomoteur"]),
    },
    {
      kind: "choice",
      id: "oculomotricite",
      label: "Oculomotricité",
      options: opts(["NORMALE", "Normale", true], ["STRABISME", "Strabisme"], ["DIPLOPIE", "Diplopie"], ["NYSTAGMUS", "Nystagmus"]),
    },
    {
      kind: "checkboxes",
      id: "plaintesVisuelles",
      label: "Plaintes visuelles",
      exclusive: "AUCUNE",
      options: opts(["FATIGUE", "Fatigue visuelle"], ["SECHERESSE", "Sécheresse oculaire"], ["FLOU", "Flou"], ["PHOTOPHOBIE", "Photophobie"], ["AUCUNE", "Aucune"]),
    },
  ],
};

const ADENOPATHIE = ["ADENOPATHIE_D", "ADENOPATHIE_G", "BILATERALE"];

export const COU_THYROIDE: SectionDef = {
  id: "couThyroide",
  title: "Cou, thyroïde et aires ganglionnaires",
  fields: [
    {
      kind: "choice",
      id: "thyroide",
      label: "Thyroïde",
      options: opts(["NON_PALPABLE", "Non palpable", true], ["GOITRE", "Goitre homogène"], ["NODULES", "Nodule(s)"]),
    },
    {
      kind: "grid",
      id: "airesGanglionnaires",
      label: "Aires ganglionnaires",
      columns: opts(["LIBRES", "Libres", true], ["ADENOPATHIE_D", "Adénopathie D"], ["ADENOPATHIE_G", "Adénopathie G"], ["BILATERALE", "Bilatérale"], ["NON_FAIT", "Non fait"]),
      rows: opts(["CERVICALES", "Cervicales"], ["SUS_CLAVICULAIRES", "Sus-claviculaires"], ["AXILLAIRES", "Axillaires"], ["INGUINALES", "Inguinales"]),
    },
    {
      kind: "textarea",
      id: "caracteristiquesAdenopathies",
      label: "Caractéristiques des adénopathies (taille en cm, consistance, mobilité, sensibilité)",
      showIf: (v) => Object.values((v.airesGanglionnaires ?? {}) as Record<string, string>).some((x) => ADENOPATHIE.includes(x)),
    },
  ],
};

export const BUCCO_DENTAIRE: SectionDef = {
  id: "buccoDentaire",
  title: "Examen bucco-dentaire",
  fields: [
    {
      kind: "grid",
      id: "examen",
      label: "Examen",
      columns: COL_NORMAL_ANORMAL,
      rows: opts(["ETAT_DENTAIRE", "État dentaire (caries, absences)"], ["GENCIVES", "Gencives"], ["MUQUEUSE", "Muqueuse buccale"], ["LANGUE", "Langue"]),
    },
    { kind: "textarea", id: "precisions", label: "Précisions" },
  ],
};
