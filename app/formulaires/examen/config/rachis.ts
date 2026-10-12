// 4.2 à 4.4 Rachis, avec l'examen neurologique radiculaire
// (C5–T1 au rachis cervical, L2–S1 au rachis lombaire).
import { formatNombre, nombreOuNull, type Alerte } from "@/lib/clinique/mesures";
import { alerteQueueDeCheval, alertesRachisCervical } from "@/lib/clinique/neuro";
import type { SectionDef, SectionValues } from "../types";
import {
  COL_MRC,
  COL_PALPATION_MEDIAN,
  COL_PRESENCE_MEDIAN,
  COL_RADICULAIRE,
  COL_REFLEXES,
  COL_SENSIBILITE,
  dg,
  NON_OUI_DG,
  opts,
} from "./presets";

const TYPES_ANOMALIE_SENSITIVE = opts(
  ["HYPOESTHESIE", "Hypoesthésie"],
  ["HYPERESTHESIE", "Hyperesthésie"],
  ["PARESTHESIES", "Paresthésies"],
  ["DYSESTHESIES", "Dysesthésies"],
  ["ALLODYNIE", "Allodynie"],
  ["AUTRE", "Autre"]
);

/** Au moins un territoire coté « 1 altérée » dans la grille de sensibilité */
const sensibiliteAlteree = (champ: string) => (v: SectionValues) =>
  Object.values((v[champ] ?? {}) as Record<string, string>).includes("1");

export const RACHIS_CERVICAL: SectionDef = {
  id: "rachisCervical",
  title: "Rachis cervical (avec neurologique C5–T1)",
  fields: [
    { kind: "eva", id: "eva", label: "Douleur cervicale (EVA)" },

    {
      kind: "grid",
      id: "inspection",
      label: "Inspection",
      columns: COL_PRESENCE_MEDIAN,
      rows: opts(
        ["ATTITUDE_ANTALGIQUE", "Attitude antalgique / torticolis"],
        ["LORDOSE", "Perte ou accentuation de la lordose"],
        ["CONTRACTURE", "Contracture paravertébrale"],
        ["AMYO_TRAPEZE", "Amyotrophie trapèze"]
      ),
    },
    {
      kind: "grid",
      id: "palpation",
      label: "Palpation",
      columns: COL_PALPATION_MEDIAN,
      rows: opts(
        ["EPINEUSES", "Épineuses"],
        ["PARAVERTEBRAUX", "Muscles paravertébraux"],
        ["TRAPEZES", "Trapèzes"],
        ["SONNETTE", "Signe de la sonnette (pression paravertébrale reproduisant la douleur radiculaire)"]
      ),
    },

    {
      kind: "mobility",
      id: "mobilite",
      label: "Mobilité active",
      mode: "actif",
      max: 90,
      movements: [
        { id: "FLEXION", label: "Flexion", normal: "N 45°" },
        { id: "EXTENSION", label: "Extension", normal: "N 70°" },
        { id: "INCLINAISON", label: "Inclinaison", normal: "N 45°", bilateral: true },
        { id: "ROTATION", label: "Rotation", normal: "N 70–80°", bilateral: true },
      ],
    },
    { kind: "measure", id: "mentonSternum", label: "Distance menton-sternum en flexion", unit: "cm", min: 0, max: 30, help: "N = 0 cm" },
    {
      kind: "grid",
      id: "douleurMobilisation",
      label: "Douleur à la mobilisation",
      columns: opts(["NON", "Non", true], ["LOCALE", "Oui, locale"], ["IRRADIANT_D", "Oui, irradiant D"], ["IRRADIANT_G", "Oui, irradiant G"]),
      rows: opts(
        ["FLEXION", "Flexion"],
        ["EXTENSION", "Extension"],
        ["INCLINAISON_D", "Inclinaison D"],
        ["INCLINAISON_G", "Inclinaison G"],
        ["ROTATION_D", "Rotation D"],
        ["ROTATION_G", "Rotation G"]
      ),
    },

    {
      kind: "grid",
      id: "testsRadiculaires",
      label: "Tests radiculaires et médullaires",
      columns: COL_RADICULAIRE,
      rows: opts(
        ["SPURLING", "Spurling"],
        ["DISTRACTION", "Test de distraction (soulagement)"],
        ["BAKODY", "Signe de Bakody (abduction d'épaule qui soulage)"],
        ["ULTT", "ULTT (tension neurale du membre supérieur)"],
        ["LHERMITTE", "Signe de Lhermitte"],
        ["HOFFMANN", "Signe de Hoffmann"]
      ),
    },
    {
      kind: "grid",
      id: "reflexes",
      label: "Réflexes",
      columns: COL_REFLEXES,
      rows: dg(opts(["BICIPITAL", "Bicipital C5"], ["STYLO_RADIAL", "Stylo-radial C6"], ["TRICIPITAL", "Tricipital C7"], ["CUBITO_PRONATEUR", "Cubito-pronateur C8"])),
      help: "Pas de réflexe ostéotendineux fiable pour T1 : les réflexes s'arrêtent à C8.",
    },
    {
      kind: "grid",
      id: "forceMRC",
      label: "Force musculaire (MRC)",
      columns: COL_MRC,
      rows: dg(
        opts(
          ["C5", "C5 abduction épaule"],
          ["C6", "C6 flexion coude"],
          ["C7", "C7 extension coude"],
          ["C8", "C8 flexion des doigts"],
          ["T1", "T1 abduction des doigts"]
        )
      ),
    },
    {
      kind: "grid",
      id: "sensibilite",
      label: "Sensibilité (ASIA)",
      columns: COL_SENSIBILITE,
      rows: dg(
        opts(
          ["C5", "C5 face latérale du bras"],
          ["C6", "C6 pouce"],
          ["C7", "C7 majeur"],
          ["C8", "C8 auriculaire"],
          ["T1", "T1 face médiale de l'avant-bras"]
        )
      ),
    },
    {
      kind: "checkboxes",
      id: "typeAnomalieSensitive",
      label: "Type d'anomalie sensitive (cote 1)",
      options: TYPES_ANOMALIE_SENSITIVE,
      showIf: sensibiliteAlteree("sensibilite"),
    },
    { kind: "textarea", id: "precisions", label: "Précisions (localisation, anomalies)" },
  ],
  alerts: (v) => alertesRachisCervical(v.testsRadiculaires as Record<string, unknown>),
};

export const RACHIS_DORSAL: SectionDef = {
  id: "rachisDorsal",
  title: "Rachis dorsal",
  fields: [
    { kind: "eva", id: "eva", label: "Douleur dorsale (EVA)" },

    {
      kind: "grid",
      id: "inspection",
      label: "Inspection (debout, de dos et de profil)",
      columns: COL_PRESENCE_MEDIAN,
      rows: opts(
        ["HYPERCYPHOSE", "Hypercyphose"],
        ["DOS_PLAT", "Dos plat"],
        ["ATTITUDE_SCOLIOTIQUE", "Attitude scoliotique"],
        ["ASYMETRIE_EPAULES", "Asymétrie des épaules"],
        ["ASYMETRIE_OMOPLATES", "Asymétrie des omoplates"],
        ["CONTRACTURE", "Contracture paravertébrale"]
      ),
    },
    {
      kind: "choice",
      id: "adams",
      label: "Test d'Adams (antéflexion) : gibbosité",
      options: opts(["ABSENTE", "Absente", true], ["GIBBOSITE_D", "Gibbosité D"], ["GIBBOSITE_G", "Gibbosité G"]),
    },
    {
      kind: "grid",
      id: "palpation",
      label: "Palpation-percussion",
      columns: COL_PALPATION_MEDIAN,
      rows: opts(["EPINEUSES", "Épineuses"], ["PARAVERTEBRAUX", "Muscles paravertébraux"], ["COSTO_VERTEBRALES", "Articulations costo-vertébrales"]),
    },

    { kind: "measure", id: "rotationD", label: "Rotation thoracique assis — D", unit: "°", integer: true, min: 0, max: 90, help: "N ≈ 30–40°" },
    { kind: "measure", id: "rotationG", label: "Rotation thoracique assis — G", unit: "°", integer: true, min: 0, max: 90, help: "N ≈ 30–40°" },
    { kind: "measure", id: "occiputMur", label: "Distance occiput-mur", unit: "cm", min: 0, max: 30, help: "N = 0 cm" },
    { kind: "measure", id: "ampliation", label: "Ampliation thoracique", unit: "cm", min: 0, max: 20, help: "Au 4e espace intercostal ; N ≥ 5 cm" },
    { kind: "choice", id: "douleurIntercostale", label: "Douleur intercostale irradiée", options: NON_OUI_DG("Bilatérale") },
    { kind: "textarea", id: "precisions", label: "Précisions" },
  ],
  alerts: (v) => {
    const occiput = nombreOuNull(v.occiputMur);
    const ampliation = nombreOuNull(v.ampliation);
    const signes: string[] = [];
    if (occiput !== null && occiput > 0) signes.push(`distance occiput-mur ${formatNombre(occiput)} cm`);
    if (ampliation !== null && ampliation < 5) signes.push(`ampliation thoracique ${formatNombre(ampliation)} cm`);
    const alertes: Alerte[] = [];
    if (signes.length) {
      alertes.push({
        severite: "info",
        message: `${signes.join(" et ")} : oriente vers une raideur thoracique (cyphose fixée, spondyloarthrite).`,
      });
    }
    return alertes;
  },
};

export const RACHIS_LOMBAIRE: SectionDef = {
  id: "rachisLombaire",
  title: "Rachis lombaire et sacro-iliaques (avec neurologique L2–S1)",
  fields: [
    { kind: "eva", id: "eva", label: "Douleur lombaire (EVA)" },
    {
      kind: "choice",
      id: "irradiation",
      label: "Irradiation",
      options: opts(["AUCUNE", "Aucune", true], ["FESSE", "Fesse"], ["CUISSE", "Cuisse"], ["PIED", "Jusqu'au pied"]),
    },
    {
      kind: "choice",
      id: "irradiationCote",
      label: "Côté de l'irradiation",
      options: opts(["D", "Droit"], ["G", "Gauche"], ["BILATERAL", "Bilatéral"]),
      showIf: (v) => !!v.irradiation && v.irradiation !== "AUCUNE",
    },

    {
      kind: "grid",
      id: "inspection",
      label: "Inspection",
      columns: COL_PRESENCE_MEDIAN,
      rows: opts(
        ["ATTITUDE_ANTALGIQUE", "Attitude antalgique (inflexion latérale)"],
        ["HYPERLORDOSE", "Hyperlordose"],
        ["EFFACEMENT_LORDOSE", "Effacement de la lordose"],
        ["ATTITUDE_SCOLIOTIQUE", "Attitude scoliotique"],
        ["BASSIN_OBLIQUE", "Bassin oblique"],
        ["CONTRACTURE", "Contracture paravertébrale"]
      ),
    },
    {
      kind: "grid",
      id: "palpation",
      label: "Palpation",
      columns: COL_PALPATION_MEDIAN,
      rows: opts(["EPINEUSES", "Épineuses"], ["PARAVERTEBRAUX", "Muscles paravertébraux"], ["SONNETTE", "Signe de la sonnette"], ["SACRO_ILIAQUES", "Sacro-iliaques"]),
    },

    { kind: "measure", id: "doigtsSol", label: "Distance doigts-sol", unit: "cm", min: 0, max: 100, help: "N ≈ 0–10 cm" },
    { kind: "measure", id: "schober", label: "Indice de Schober (en flexion)", unit: "cm", min: 10, max: 30, help: "Repère L5 + 10 cm ; N ≥ 15 cm (gain ≥ 5 cm)" },
    {
      kind: "mobility",
      id: "mobilite",
      label: "Mobilité active",
      mode: "actif",
      max: 90,
      movements: [
        { id: "EXTENSION", label: "Extension", normal: "N 30°" },
        { id: "INCLINAISON", label: "Inclinaison", normal: "N 30°", bilateral: true },
        { id: "ROTATION", label: "Rotation", normal: "N 30°", bilateral: true },
      ],
    },

    {
      kind: "grid",
      id: "testsRadiculaires",
      label: "Tests radiculaires",
      columns: COL_RADICULAIRE,
      rows: opts(["LASEGUE", "Lasègue"], ["LASEGUE_CROISE", "Lasègue croisé"], ["LERI", "Léri (étirement crural)"], ["SLUMP", "Slump test"]),
    },
    { kind: "measure", id: "angleLasegueD", label: "Angle de Lasègue — D", unit: "°", integer: true, min: 0, max: 90, help: "Positif si douleur radiculaire avant 70°" },
    { kind: "measure", id: "angleLasegueG", label: "Angle de Lasègue — G", unit: "°", integer: true, min: 0, max: 90, help: "Positif si douleur radiculaire avant 70°" },
    {
      kind: "grid",
      id: "testsSacroIliaques",
      label: "Tests sacro-iliaques",
      columns: COL_RADICULAIRE,
      rows: opts(["FABER", "FABER (Patrick)"], ["GAENSLEN", "Gaenslen"], ["COMPRESSION", "Compression"], ["ECARTEMENT", "Écartement"], ["THIGH_THRUST", "Thigh thrust"]),
    },

    {
      kind: "grid",
      id: "reflexes",
      label: "Réflexes",
      columns: COL_REFLEXES,
      rows: dg(opts(["ROTULIEN", "Rotulien L4"], ["ACHILLEEN", "Achilléen S1"])),
    },
    {
      kind: "grid",
      id: "cutanePlantaire",
      label: "Réflexe cutané plantaire",
      columns: opts(["FLEXION", "Normal (en flexion)", true], ["BABINSKI", "Babinski"], ["NON_FAIT", "Non fait"]),
      rows: opts(["D", "Droit"], ["G", "Gauche"]),
    },
    {
      kind: "grid",
      id: "forceMRC",
      label: "Force musculaire (MRC)",
      columns: COL_MRC,
      rows: dg(
        opts(
          ["L2", "L2 flexion hanche"],
          ["L3", "L3 extension genou"],
          ["L4", "L4 flexion dorsale cheville"],
          ["L5", "L5 extension du gros orteil"],
          ["S1", "S1 flexion plantaire"]
        )
      ),
    },
    {
      kind: "grid",
      id: "marcheTalonsPointes",
      label: "Marche sur talons (L5) et sur pointes (S1)",
      columns: opts(["POSSIBLE", "Possible", true], ["IMPOSSIBLE_D", "Impossible D"], ["IMPOSSIBLE_G", "Impossible G"], ["NON_FAIT", "Non fait"]),
      rows: opts(["TALONS", "Talons"], ["POINTES", "Pointes"]),
    },
    {
      kind: "grid",
      id: "sensibilite",
      label: "Sensibilité (ASIA)",
      columns: COL_SENSIBILITE,
      rows: dg(
        opts(
          ["L1", "L1 pli inguinal"],
          ["L2", "L2 face antérieure de la cuisse"],
          ["L3", "L3 face interne du genou"],
          ["L4", "L4 malléole interne"],
          ["L5", "L5 dos du pied"],
          ["S1", "S1 bord externe du pied"]
        )
      ),
    },
    {
      kind: "checkboxes",
      id: "typeAnomalieSensitive",
      label: "Type d'anomalie sensitive (cote 1)",
      options: TYPES_ANOMALIE_SENSITIVE,
      showIf: sensibiliteAlteree("sensibilite"),
    },
    {
      kind: "checkboxes",
      id: "queueDeCheval",
      label: "Signes d'alerte (queue de cheval)",
      exclusive: "AUCUN",
      options: opts(
        ["ANESTHESIE_SELLE", "Anesthésie en selle"],
        ["URINAIRES", "Troubles urinaires"],
        ["ANAUX", "Troubles anaux"],
        ["SEXUELS", "Troubles sexuels"],
        ["AUCUN", "Aucun"]
      ),
    },
    { kind: "textarea", id: "precisions", label: "Précisions (type d'anomalie sensitive, localisation)" },
  ],
  alerts: (v) => {
    const a = alerteQueueDeCheval(v.queueDeCheval);
    return a ? [a] : [];
  },
};
