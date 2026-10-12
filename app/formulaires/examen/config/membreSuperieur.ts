// 4.1 Appareil locomoteur — membre supérieur (épaules, coudes, poignets et mains).
// Ordre : inspection → palpation → mobilité → tests. Neurologique C5–T1 : voir 4.2 (rachis cervical).
import type { SectionDef } from "../types";
import {
  COL_DOULEUR_MOBILISATION,
  COL_PALPATION,
  COL_PRESENCE_DG,
  COL_SENSIBILITE,
  COL_TESTS,
  dg,
  NON_OUI_DG,
  opts,
} from "./presets";

const ROTATION_INTERNE = opts(["FESSE", "Fesse"], ["SACRUM", "Sacrum"], ["L5", "L5"], ["L3", "L3"], ["T12", "T12"], ["T7", "T7"]);

const KAPANDJI = Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) }));

export const EPAULES: SectionDef = {
  id: "epaules",
  title: "Épaules",
  intro: "Examen neurologique C5–T1 : voir Rachis cervical (4.2).",
  fields: [
    {
      kind: "choice",
      id: "coteDominant",
      label: "Côté dominant",
      options: opts(["DROITIER", "Droitier"], ["GAUCHER", "Gaucher"], ["AMBIDEXTRE", "Ambidextre"]),
    },
    { kind: "eva", id: "evaD", label: "Douleur épaule droite (EVA)" },
    { kind: "eva", id: "evaG", label: "Douleur épaule gauche (EVA)" },

    {
      kind: "grid",
      id: "inspection",
      label: "Inspection",
      columns: COL_PRESENCE_DG,
      rows: opts(
        ["ASYMETRIE_RELIEFS", "Asymétrie des reliefs"],
        ["AMYO_SUS_EPINEUX", "Amyotrophie sus-épineux"],
        ["AMYO_SOUS_EPINEUX", "Amyotrophie sous-épineux"],
        ["AMYO_DELTOIDE", "Amyotrophie deltoïde"],
        ["SAILLIE_AC", "Saillie acromio-claviculaire"],
        ["POPEYE", "Signe de Popeye"],
        ["TUMEFACTION", "Tuméfaction"],
        ["CICATRICE", "Cicatrice"]
      ),
    },
    {
      kind: "grid",
      id: "palpation",
      label: "Palpation",
      columns: COL_PALPATION,
      rows: opts(
        ["SILLON_BICIPITAL", "Sillon bicipital"],
        ["ARTICULATION_AC", "Articulation acromio-claviculaire"],
        ["TROCHITER", "Trochiter"],
        ["SOUS_ACROMIALE", "Région sous-acromiale"]
      ),
    },

    {
      kind: "mobility",
      id: "mobilite",
      label: "Mobilité active et passive",
      max: 180,
      movements: [
        { id: "ANTEPULSION", label: "Antépulsion", normal: "N 180°" },
        { id: "RETROPULSION", label: "Rétropulsion", normal: "N 50°" },
        { id: "ABDUCTION", label: "Abduction", normal: "N 180°" },
        { id: "RE1", label: "Rotation externe coude au corps (RE1)", normal: "N 60–90°" },
      ],
    },
    { kind: "select", id: "rotationInterneD", label: "Rotation interne main-dos — D", options: ROTATION_INTERNE },
    { kind: "select", id: "rotationInterneG", label: "Rotation interne main-dos — G", options: ROTATION_INTERNE },
    {
      kind: "grid",
      id: "douleurMobilisation",
      label: "Douleur à la mobilisation",
      columns: COL_DOULEUR_MOBILISATION,
      rows: opts(
        ["ANTEPULSION", "Antépulsion"],
        ["RETROPULSION", "Rétropulsion"],
        ["ABDUCTION", "Abduction"],
        ["RE1", "Rotation externe (RE1)"],
        ["ROTATION_INTERNE", "Rotation interne"]
      ),
      help: "Limitation active seule → plutôt coiffe ; limitation passive associée → plutôt raideur (capsulite).",
    },

    {
      kind: "grid",
      id: "testsCoiffe",
      label: "Tests — Coiffe des rotateurs",
      columns: COL_TESTS,
      rows: opts(
        ["JOBE", "Jobe (empty can) [sus-épineux]"],
        ["FULL_CAN", "Full can [sus-épineux]"],
        ["PATTE", "Patte [sous-épineux]"],
        ["RE_CONTRARIEE", "Rotation externe contrariée [sous-épineux]"],
        ["LAG_SIGN_RE", "Lag sign RE [sous-épineux]"],
        ["CLAIRON", "Signe du clairon [petit rond]"],
        ["LIFT_OFF", "Lift-off [sous-scapulaire]"],
        ["BELLY_PRESS", "Belly press [sous-scapulaire]"],
        ["BEAR_HUG", "Bear hug [sous-scapulaire]"]
      ),
    },
    {
      kind: "grid",
      id: "testsConflit",
      label: "Tests — Conflit sous-acromial",
      columns: COL_TESTS,
      rows: opts(["NEER", "Neer"], ["HAWKINS", "Hawkins-Kennedy"], ["YOCUM", "Yocum"]),
    },
    {
      kind: "grid",
      id: "testsBiceps",
      label: "Tests — Long biceps, acromio-claviculaire, labrum",
      columns: COL_TESTS,
      rows: opts(["PALM_UP", "Palm-up (Speed)"], ["YERGASON", "Yergason"], ["OBRIEN", "O'Brien"], ["CROSS_ARM", "Cross-arm"]),
    },
    {
      kind: "grid",
      id: "testsInstabilite",
      label: "Tests — Instabilité",
      columns: COL_TESTS,
      rows: opts(
        ["APPREHENSION", "Appréhension"],
        ["RELOCATION", "Relocation"],
        ["TIROIR_ANTERIEUR", "Tiroir antérieur"],
        ["TIROIR_POSTERIEUR", "Tiroir postérieur"],
        ["SULCUS", "Sulcus sign"]
      ),
    },
    { kind: "textarea", id: "precisions", label: "Précisions des anomalies" },
  ],
};

export const COUDES: SectionDef = {
  id: "coudes",
  title: "Coudes",
  fields: [
    { kind: "eva", id: "evaD", label: "Douleur coude droit (EVA)" },
    { kind: "eva", id: "evaG", label: "Douleur coude gauche (EVA)" },

    {
      kind: "grid",
      id: "inspection",
      label: "Inspection",
      columns: COL_PRESENCE_DG,
      rows: opts(
        ["TUMEFACTION", "Tuméfaction"],
        ["HYGROMA", "Hygroma olécrânien"],
        ["DEFORMATION", "Déformation"],
        ["VALGUS", "Cubitus valgus excessif"],
        ["VARUS", "Cubitus varus"],
        ["AMYOTROPHIE", "Amyotrophie"],
        ["NODULES", "Nodules"],
        ["CICATRICE", "Cicatrice"]
      ),
    },
    {
      kind: "grid",
      id: "palpation",
      label: "Palpation",
      columns: COL_PALPATION,
      rows: opts(
        ["EPICONDYLE_LATERAL", "Épicondyle latéral"],
        ["EPICONDYLE_MEDIAL", "Épicondyle médial (épitrochlée)"],
        ["OLECRANE", "Olécrâne"],
        ["TETE_RADIALE", "Tête radiale"],
        ["GOUTTIERE_ULNAIRE", "Gouttière du nerf ulnaire"],
        ["PLI_COUDE", "Pli du coude (tendon distal du biceps)"],
        ["ARCADE_FROHSE", "Arcade de Fröhse"]
      ),
    },

    {
      kind: "mobility",
      id: "mobilite",
      label: "Mobilité",
      max: 180,
      movements: [
        { id: "FLEXION", label: "Flexion", normal: "N 140–150°" },
        { id: "EXTENSION", label: "Extension", normal: "N 0°" },
        { id: "FLESSUM", label: "Flessum", normal: "N 0°" },
        { id: "RECURVATUM", label: "Recurvatum", normal: "N 0°" },
        { id: "PRONATION", label: "Pronation", normal: "N 80–90°" },
        { id: "SUPINATION", label: "Supination", normal: "N 80–90°" },
      ],
    },

    {
      kind: "grid",
      id: "testsEpicondyliteLaterale",
      label: "Tests — Épicondylite latérale",
      columns: COL_TESTS,
      rows: opts(
        ["COZEN", "Cozen (extension contrariée du poignet)"],
        ["MILL", "Mill (étirement passif)"],
        ["MAUDSLEY", "Maudsley (extension contrariée du majeur)"],
        ["PALPATION_EPICONDYLE", "Palpation de l'épicondyle latéral"]
      ),
    },
    {
      kind: "grid",
      id: "testsEpicondyliteMediale",
      label: "Tests — Épicondylite médiale",
      columns: COL_TESTS,
      rows: opts(["FLEXION_CONTRARIEE", "Flexion contrariée du poignet"], ["PRONATION_CONTRARIEE", "Pronation contrariée"]),
    },
    {
      kind: "grid",
      id: "testsNerfUlnaire",
      label: "Tests — Nerf ulnaire au coude",
      columns: COL_TESTS,
      rows: opts(
        ["TINEL_GOUTTIERE", "Tinel à la gouttière ulnaire"],
        ["FLEXION_PROLONGEE", "Test de flexion prolongée du coude"],
        ["LUXATION", "Luxation du nerf ulnaire"]
      ),
    },
    {
      kind: "grid",
      id: "testsNerfRadial",
      label: "Tests — Nerf radial (tunnel radial)",
      columns: COL_TESTS,
      rows: opts(["SUPINATION_CONTRARIEE", "Supination contrariée"], ["PALPATION_FROHSE", "Palpation de l'arcade de Fröhse"]),
    },
    {
      kind: "grid",
      id: "testsStabilite",
      label: "Tests — Stabilité et tendon distal du biceps",
      columns: COL_TESTS,
      rows: opts(["VALGUS", "Stress en valgus"], ["VARUS", "Stress en varus"], ["HOOK", "Hook test"]),
    },
    { kind: "textarea", id: "precisions", label: "Précisions" },
  ],
};

export const POIGNETS_MAINS: SectionDef = {
  id: "poignetsMains",
  title: "Poignets et mains",
  fields: [
    { kind: "eva", id: "evaD", label: "Douleur poignet-main droit (EVA)" },
    { kind: "eva", id: "evaG", label: "Douleur poignet-main gauche (EVA)" },
    { kind: "choice", id: "paresthesiesNocturnes", label: "Paresthésies nocturnes des doigts", options: NON_OUI_DG("Bilatérales") },

    {
      kind: "grid",
      id: "inspection",
      label: "Inspection",
      columns: COL_PRESENCE_DG,
      rows: opts(
        ["TUMEFACTION", "Tuméfaction"],
        ["KYSTE", "Kyste synovial"],
        ["DEFORMATION", "Déformation"],
        ["AMYO_THENAR", "Amyotrophie thénarienne"],
        ["AMYO_HYPOTHENAR", "Amyotrophie hypothénarienne"],
        ["AMYO_INTEROSSEUX", "Amyotrophie des interosseux"],
        ["HEBERDEN", "Nodules d'Heberden"],
        ["BOUCHARD", "Nodules de Bouchard"],
        ["DUPUYTREN", "Maladie de Dupuytren"],
        ["DOIGT_RESSAUT", "Doigt à ressaut"],
        ["GRIFFE", "Griffe"],
        ["TROUBLES_TROPHIQUES", "Troubles trophiques"],
        ["RAYNAUD", "Phénomène de Raynaud"],
        ["CICATRICE", "Cicatrice"]
      ),
    },
    {
      kind: "grid",
      id: "palpation",
      label: "Palpation",
      columns: COL_PALPATION,
      rows: opts(
        ["STYLOIDE_RADIALE", "Styloïde radiale"],
        ["STYLOIDE_ULNAIRE", "Styloïde ulnaire"],
        ["TABATIERE", "Tabatière anatomique (scaphoïde)"],
        ["COMPARTIMENT_1", "1er compartiment des extenseurs"],
        ["TFCC", "Complexe triangulaire (TFCC)"],
        ["TRAPEZO_METACARPIENNE", "Articulation trapézo-métacarpienne"],
        ["POULIES_A1", "Poulies A1 des fléchisseurs"],
        ["MCP", "MCP"],
        ["IPP", "IPP"],
        ["IPD", "IPD"]
      ),
    },

    {
      kind: "mobility",
      id: "mobilite",
      label: "Mobilité du poignet",
      max: 180,
      movements: [
        { id: "FLEXION", label: "Flexion", normal: "N 80°" },
        { id: "EXTENSION", label: "Extension", normal: "N 70°" },
        { id: "INCLINAISON_RADIALE", label: "Inclinaison radiale", normal: "N 20°" },
        { id: "INCLINAISON_ULNAIRE", label: "Inclinaison ulnaire", normal: "N 30°" },
      ],
    },
    { kind: "measure", id: "pulpePaumeD", label: "Distance pulpe-paume — D", unit: "cm", min: 0, max: 15, help: "Fermeture du poing, N = 0 cm" },
    { kind: "measure", id: "pulpePaumeG", label: "Distance pulpe-paume — G", unit: "cm", min: 0, max: 15, help: "Fermeture du poing, N = 0 cm" },
    { kind: "select", id: "kapandjiD", label: "Opposition du pouce (Kapandji) — D", options: KAPANDJI, help: "N = 10" },
    { kind: "select", id: "kapandjiG", label: "Opposition du pouce (Kapandji) — G", options: KAPANDJI, help: "N = 10" },
    { kind: "measure", id: "jamarD", label: "Force de préhension (Jamar) — D", unit: "kg", min: 0, max: 100 },
    {
      kind: "measure",
      id: "jamarG",
      label: "Force de préhension (Jamar) — G",
      unit: "kg",
      min: 0,
      max: 100,
      help: "Comparer au côté opposé : le côté dominant est environ 10 % plus fort",
    },

    {
      kind: "grid",
      id: "testsCanalCarpien",
      label: "Tests — Canal carpien (nerf médian)",
      columns: COL_TESTS,
      rows: opts(["TINEL", "Tinel au poignet"], ["PHALEN", "Phalen"], ["DURKAN", "Durkan (compression carpienne)"]),
    },
    {
      kind: "grid",
      id: "testsGuyon",
      label: "Tests — Nerf ulnaire au poignet (loge de Guyon)",
      columns: COL_TESTS,
      rows: opts(["TINEL_GUYON", "Tinel à la loge de Guyon"], ["FROMENT", "Signe de Froment"], ["WARTENBERG", "Signe de Wartenberg"]),
    },
    {
      kind: "grid",
      id: "testsTendons",
      label: "Tests — Tendons",
      columns: COL_TESTS,
      rows: opts(
        ["FINKELSTEIN", "Finkelstein / Eichhoff (De Quervain)"],
        ["DOIGT_RESSAUT", "Doigt à ressaut (ressaut au passage de la poulie A1)"],
        ["FLECHISSEUR_PROFOND", "Test du fléchisseur profond"],
        ["FLECHISSEUR_SUPERFICIEL", "Test du fléchisseur superficiel"]
      ),
    },
    {
      kind: "grid",
      id: "testsArticulaires",
      label: "Tests — Articulaires et instabilité",
      columns: COL_TESTS,
      rows: opts(
        ["GRIND", "Grind test trapézo-métacarpien"],
        ["WATSON", "Watson (scapho-lunaire)"],
        ["BALLOTTEMENT", "Ballottement luno-triquétral"],
        ["ULNAR_FOVEA", "Ulnar fovea sign (TFCC)"]
      ),
    },
    {
      kind: "grid",
      id: "testAllen",
      label: "Test d'Allen (vascularisation)",
      columns: COL_TESTS,
      rows: opts(["RADIALE", "Artère radiale"], ["ULNAIRE", "Artère ulnaire"]),
    },
    {
      kind: "grid",
      id: "sensibiliteTerritoires",
      label: "Sensibilité par territoire nerveux",
      columns: COL_SENSIBILITE,
      rows: dg(
        opts(
          ["MEDIAN", "Médian (pulpe de l'index)"],
          ["ULNAIRE", "Ulnaire (pulpe de l'auriculaire)"],
          ["RADIAL", "Radial (face dorsale de la 1re commissure)"]
        )
      ),
    },
    { kind: "measure", id: "deuxPointsD", label: "Discrimination de deux points — index D", unit: "mm", integer: true, min: 1, max: 30, help: "N < 6 mm" },
    { kind: "measure", id: "deuxPointsG", label: "Discrimination de deux points — index G", unit: "mm", integer: true, min: 1, max: 30, help: "N < 6 mm" },
    { kind: "textarea", id: "precisions", label: "Précisions" },
  ],
};
