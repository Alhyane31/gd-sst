// 5. Examen paraclinique. 5.1 à 5.5 : toutes les visites ; 5.6 : visite d'embauche uniquement.
// Le type de visite est celui de la visite (pas de question redondante).
import { formatNombre, nombreOuNull } from "@/lib/clinique/mesures";
import type { ExamCtx, SectionDef, SectionValues } from "../types";
import { NORMALE_ANORMALE, opts, OUI_NON, NON_OUI_DG } from "./presets";

const egal = (champ: string, valeur: string) => (v: SectionValues) => v[champ] === valeur;
const oui = (champ: string) => egal(champ, "OUI");

/** Postes soignants (biologie ciblée 5.4) : infirmier, médecin, sage-femme, technicien de santé, professeur, rééducateur */
export const POSTES_SOIGNANTS = ["INF", "MED", "SAGF", "TECS", "PRO", "REE"];
export const estSoignant = (ctx: ExamCtx) => POSTES_SOIGNANTS.includes(ctx.posteCode ?? "");
export const estEmbauche = (ctx: ExamCtx) => ctx.visiteType === "EMBAUCHE";

const LIGNES_ACUITE = opts(
  ["OD_SANS", "OD sans correction"],
  ["OG_SANS", "OG sans correction"],
  ["OD_AVEC", "OD avec correction"],
  ["OG_AVEC", "OG avec correction"]
);

const NORMAL_ANORMAL_NF = (normal: string, anormal: string) => opts(["NORMAL", normal, true], ["ANORMAL", anormal], ["NON_FAIT", "Non fait"]);

export const BANDELETTE_URINAIRE: SectionDef = {
  id: "bandeletteUrinaire",
  title: "Bandelette urinaire",
  fields: [
    {
      kind: "choice",
      id: "aspect",
      label: "Aspect des urines",
      options: opts(["CLAIRES", "Claires", true], ["TROUBLES", "Troubles"], ["FONCEES", "Foncées"], ["HEMATIQUES", "Hématiques"], ["AUTRE", "Autre"]),
    },
    { kind: "choice", id: "modeRecueil", label: "Mode de recueil", options: opts(["MILIEU_JET", "Milieu de jet"], ["PREMIER_JET", "Premier jet"], ["AUTRE", "Autre"]) },
    { kind: "choice", id: "momentRecueil", label: "Moment du recueil", options: opts(["PREMIERE_MICTION", "Première miction du matin"], ["ALEATOIRE", "Aléatoire"]) },
    {
      kind: "checkboxes",
      id: "facteursFaussant",
      label: "Facteurs pouvant fausser le résultat",
      exclusive: "AUCUN",
      options: opts(
        ["MENSTRUATIONS", "Menstruations"],
        ["EFFORT", "Effort physique intense récent"],
        ["FIEVRE", "Fièvre"],
        ["VITAMINE_C", "Prise de vitamine C"],
        ["MEDICAMENTS", "Médicaments"],
        ["HYDRATATION", "Hydratation excessive ou insuffisante"],
        ["DELAI_LECTURE", "Délai de lecture non respecté"],
        ["PERIMEE", "Bandelette périmée"],
        ["AUCUN", "Aucun"]
      ),
    },
    {
      kind: "grid",
      id: "resultats",
      label: "Résultats en croix",
      columns: opts(["0", "0", true], ["TRACES", "Traces"], ["1", "+"], ["2", "++"], ["3", "+++"], ["NON_FAIT", "Non fait"]),
      rows: opts(
        ["GLUCOSE", "Glucose"],
        ["PROTEINES", "Protéines"],
        ["SANG", "Sang (hématies)"],
        ["LEUCOCYTES", "Leucocytes"],
        ["CETONES", "Corps cétoniques"],
        ["BILIRUBINE", "Bilirubine"],
        ["UROBILINOGENE", "Urobilinogène"]
      ),
    },
    { kind: "choice", id: "nitrites", label: "Nitrites", options: opts(["NEGATIFS", "Négatifs", true], ["POSITIFS", "Positifs"]) },
    {
      kind: "select",
      id: "ph",
      label: "pH",
      options: ["5,0", "5,5", "6,0", "6,5", "7,0", "7,5", "8,0", "8,5", "9,0"].map((x) => ({ value: x, label: x })),
    },
    {
      kind: "select",
      id: "densite",
      label: "Densité",
      options: ["1,000", "1,005", "1,010", "1,015", "1,020", "1,025", "1,030"].map((x) => ({ value: x, label: x })),
    },
    { kind: "choice", id: "conclusion", label: "Conclusion", options: NORMALE_ANORMALE },
    { kind: "textarea", id: "conclusionPrecisions", label: "Précisions", showIf: egal("conclusion", "ANORMALE") },
  ],
};

export const ACUITE_VISUELLE: SectionDef = {
  id: "acuiteVisuelle",
  title: "Acuité visuelle",
  fields: [
    { kind: "choice", id: "correction", label: "Port d'une correction", options: opts(["NON", "Non"], ["LUNETTES", "Lunettes"], ["LENTILLES", "Lentilles"]) },
    {
      kind: "grid",
      id: "visionLoin",
      label: "Vision de loin (échelle de Monoyer)",
      rows: LIGNES_ACUITE,
      columns: [...Array.from({ length: 10 }, (_, i) => ({ value: `${i + 1}`, label: `${i + 1}/10` })), { value: "NON_FAIT", label: "Non fait" }],
    },
    {
      kind: "grid",
      id: "visionPres",
      label: "Vision de près (échelle de Parinaud)",
      rows: LIGNES_ACUITE,
      columns: opts(["P2", "P2"], ["P3", "P3"], ["P4", "P4"], ["P5", "P5"], ["P6", "P6"], ["P8", "P8"], ["P10", "P10"], ["P14", "P14"], ["P20", "P20"], ["NON_FAIT", "Non fait"]),
    },
    { kind: "choice", id: "ergovision", label: "Ergovision réalisée", options: OUI_NON },
    { kind: "attachment", id: "ergovisionFichiers", label: "Résultats de l'ergovision (pièce jointe)", showIf: oui("ergovision") },
    { kind: "textarea", id: "ergovisionResultats", label: "Résultats de l'ergovision (texte libre)", showIf: oui("ergovision") },
    { kind: "heading", id: "h_autres", label: "Autres tests visuels" },
    { kind: "choice", id: "ishihara", label: "Vision des couleurs (Ishihara)", options: NORMAL_ANORMAL_NF("Normale", "Dyschromatopsie") },
    { kind: "choice", id: "stereoscopie", label: "Vision du relief (stéréoscopie)", options: NORMAL_ANORMAL_NF("Normale", "Anormale") },
    { kind: "choice", id: "champVisuel", label: "Champ visuel", options: NORMAL_ANORMAL_NF("Normal", "Anormal") },
    { kind: "choice", id: "phories", label: "Phories", options: NORMAL_ANORMAL_NF("Normales", "Anormales") },
  ],
};

export const EXPLORATIONS_FONCTIONNELLES: SectionDef = {
  id: "explorationsFonctionnelles",
  title: "Explorations fonctionnelles (selon le poste)",
  fields: [
    { kind: "heading", id: "h_audio", label: "Audiométrie" },
    { kind: "choice", id: "audiometrie", label: "Audiométrie tonale réalisée", options: OUI_NON },
    { kind: "attachment", id: "audiometrieCompteRendu", label: "Compte rendu d'audiométrie", showIf: oui("audiometrie") },
    {
      kind: "measure",
      id: "perteAuditiveD",
      label: "Perte auditive moyenne — D",
      unit: "dB HL",
      min: -10,
      max: 120,
      help: "Moyenne 500, 1000, 2000, 4000 Hz",
      showIf: oui("audiometrie"),
    },
    {
      kind: "measure",
      id: "perteAuditiveG",
      label: "Perte auditive moyenne — G",
      unit: "dB HL",
      min: -10,
      max: 120,
      help: "Moyenne 500, 1000, 2000, 4000 Hz",
      showIf: oui("audiometrie"),
    },
    { kind: "choice", id: "encoche4000", label: "Encoche à 4000 Hz (atteinte au bruit)", options: NON_OUI_DG("Bilatérale"), showIf: oui("audiometrie") },

    { kind: "heading", id: "h_spiro", label: "Spirométrie" },
    { kind: "choice", id: "spirometrie", label: "Spirométrie réalisée", options: OUI_NON },
    { kind: "attachment", id: "spirometrieCompteRendu", label: "Compte rendu de spirométrie", showIf: oui("spirometrie") },
    { kind: "measure", id: "vemsL", label: "VEMS", unit: "L", min: 0, max: 8, showIf: oui("spirometrie") },
    { kind: "measure", id: "vemsPct", label: "VEMS", unit: "% prédit", integer: true, min: 0, max: 200, showIf: oui("spirometrie") },
    { kind: "measure", id: "cvfL", label: "CVF", unit: "L", min: 0, max: 10, showIf: oui("spirometrie") },
    { kind: "measure", id: "cvfPct", label: "CVF", unit: "% prédit", integer: true, min: 0, max: 200, showIf: oui("spirometrie") },
    { kind: "measure", id: "rapportVemsCvf", label: "Rapport VEMS/CVF", unit: "%", integer: true, min: 0, max: 100, help: "Normal ≥ 70 %", showIf: oui("spirometrie") },
    {
      kind: "computed",
      id: "rapportCalcule",
      label: "Rapport VEMS/CVF calculé",
      help: "renseignez VEMS et CVF en litres",
      showIf: oui("spirometrie"),
      compute: (v) => {
        const vems = nombreOuNull(v.vemsL);
        const cvf = nombreOuNull(v.cvfL);
        if (!vems || !cvf) return null;
        const r = Math.round((vems / cvf) * 100);
        return { text: `${formatNombre(r)} %${r < 70 ? " — < 70 % : trouble ventilatoire obstructif ?" : ""}`, severite: r < 70 ? "warning" : "success" };
      },
    },
    {
      kind: "choice",
      id: "spirometrieConclusion",
      label: "Conclusion spirométrique",
      options: opts(["NORMALE", "Normale", true], ["OBSTRUCTIF", "Trouble ventilatoire obstructif"], ["RESTRICTIF", "Restrictif suspecté"], ["MIXTE", "Mixte"]),
      showIf: oui("spirometrie"),
    },

    { kind: "heading", id: "h_ecg", label: "ECG" },
    { kind: "choice", id: "ecg", label: "ECG réalisé", options: OUI_NON },
    { kind: "attachment", id: "ecgTrace", label: "Tracé / compte rendu ECG", showIf: oui("ecg") },
    { kind: "choice", id: "ecgConclusion", label: "Conclusion ECG", options: opts(["NORMAL", "Normal", true], ["ANORMAL", "Anormal"]), showIf: oui("ecg") },
    { kind: "textarea", id: "ecgAnomalies", label: "Anomalies ECG", showIf: (v) => v.ecg === "OUI" && v.ecgConclusion === "ANORMAL" },
  ],
};

export const BIOLOGIE_CIBLEE: SectionDef = {
  id: "biologieCiblee",
  title: "Biologie ciblée (personnel soignant)",
  showIf: estSoignant,
  fields: [
    { kind: "measure", id: "antiHBs", label: "Anticorps anti-HBs", unit: "mUI/mL", min: 0, max: 100000, help: "Immunisé si ≥ 10 mUI/mL" },
    {
      kind: "computed",
      id: "immunisationHB",
      label: "Immunisation hépatite B",
      help: "renseignez le taux d'anti-HBs",
      compute: (v) => {
        const taux = nombreOuNull(v.antiHBs);
        if (taux === null) return null;
        return taux >= 10
          ? { text: "Immunisé (≥ 10 mUI/mL)", severite: "success" }
          : { text: "Non immunisé (< 10 mUI/mL)", severite: "warning" };
      },
    },
    {
      kind: "choice",
      id: "tuberculose",
      label: "Dépistage de la tuberculose latente (IGRA ou IDR)",
      options: opts(["NEGATIF", "Négatif", true], ["POSITIF", "Positif"], ["INDETERMINE", "Indéterminé"], ["NON_FAIT", "Non fait"]),
    },
    { kind: "attachment", id: "resultats", label: "Résultats biologiques (pièces jointes)" },
  ],
};

export const AUTRES_EXAMENS: SectionDef = {
  id: "autresExamens",
  title: "Autres examens paracliniques",
  fields: [
    { kind: "textarea", id: "bilanRadiologique", label: "Bilan radiologique demandé" },
    { kind: "textarea", id: "bilanBiologique", label: "Bilan biologique demandé" },
    { kind: "attachment", id: "resultats", label: "Résultats (pièces jointes facultatives)" },
  ],
};

export const EMBAUCHE: SectionDef = {
  id: "embauche",
  title: "Visite d'embauche",
  showIf: estEmbauche,
  fields: [
    { kind: "attachment", id: "radioThorax", label: "Radiographie thoracique de face" },
    { kind: "choice", id: "radioResultat", label: "Résultat de la radiographie", options: NORMALE_ANORMALE },
    { kind: "textarea", id: "radioAnomalies", label: "Anomalies de la radiographie", showIf: egal("radioResultat", "ANORMALE") },

    { kind: "choice", id: "posteRadioExpose", label: "Poste radio-exposé", options: OUI_NON },
    { kind: "attachment", id: "nfs", label: "NFS", showIf: oui("posteRadioExpose") },
    { kind: "choice", id: "nfsNormale", label: "NFS normale", options: OUI_NON, showIf: oui("posteRadioExpose") },
    {
      kind: "checkboxes",
      id: "nfsAnomalies",
      label: "Anomalies de la NFS",
      showIf: (v) => v.posteRadioExpose === "OUI" && v.nfsNormale === "NON",
      options: opts(
        ["ANEMIE", "Anémie"],
        ["POLYGLOBULIE", "Polyglobulie"],
        ["LEUCOPENIE", "Leucopénie"],
        ["HYPERLEUCOCYTOSE", "Hyperleucocytose"],
        ["NEUTROPENIE", "Neutropénie"],
        ["LYMPHOPENIE", "Lymphopénie"],
        ["THROMBOPENIE", "Thrombopénie"],
        ["THROMBOCYTOSE", "Thrombocytose"],
        ["AUTRE", "Autre"]
      ),
    },
    {
      kind: "textarea",
      id: "nfsPrecisions",
      label: "Précisions NFS (valeurs anormales et unités)",
      showIf: (v) => v.posteRadioExpose === "OUI" && v.nfsNormale === "NON",
    },
  ],
};

export const EXAMEN_PARACLINIQUE = [
  {
    groupe: "Toutes les visites",
    sections: [BANDELETTE_URINAIRE, ACUITE_VISUELLE, EXPLORATIONS_FONCTIONNELLES, BIOLOGIE_CIBLEE, AUTRES_EXAMENS],
  },
  { groupe: "Visite d'embauche uniquement", sections: [EMBAUCHE] },
];
