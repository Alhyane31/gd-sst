// Colonnes et options réutilisées par les grilles d'examen (valeurs par défaut du PDF)
import type { Option } from "../types";

const NON_FAIT: Option = { value: "NON_FAIT", label: "Non fait" };

/** Liste "A, B, C" → options { value: "A", label } avec identifiants stables */
export function opts(...items: [value: string, label: string, normal?: boolean][]): Option[] {
  return items.map(([value, label, normal]) => ({ value, label, ...(normal ? { normal } : {}) }));
}

/** Duplique chaque ligne en « … D » et « … G » (grilles « chacun D et G ») */
export function dg(rows: Option[]): Option[] {
  return rows.flatMap((r) => [
    { value: `${r.value}_D`, label: `${r.label} — D` },
    { value: `${r.value}_G`, label: `${r.label} — G` },
  ]);
}

/** Normal / Anormal D / Anormal G / Bilatéral / Non fait — colonnes par défaut des tests */
export const COL_TESTS = opts(["NORMAL", "Normal", true], ["ANORMAL_D", "Anormal D"], ["ANORMAL_G", "Anormal G"], ["BILATERAL", "Bilatéral"], ["NON_FAIT", "Non fait"]);

/** Absent / Présent D / Présent G / Bilatéral — inspection */
export const COL_PRESENCE_DG = opts(["ABSENT", "Absent", true], ["PRESENT_D", "Présent D"], ["PRESENT_G", "Présent G"], ["BILATERAL", "Bilatéral"]);

export const COL_PRESENCE_DG_NF = [...COL_PRESENCE_DG, NON_FAIT];

/** Absent / Présent D / Présent G / Médian-bilatéral — inspection rachis */
export const COL_PRESENCE_MEDIAN = opts(["ABSENT", "Absent", true], ["PRESENT_D", "Présent D"], ["PRESENT_G", "Présent G"], ["MEDIAN_BILATERAL", "Médian-bilatéral"]);

/** Indolore / Douloureux D / Douloureux G / Bilatéral / Non fait — palpation */
export const COL_PALPATION = opts(["INDOLORE", "Indolore", true], ["DOULOUREUX_D", "Douloureux D"], ["DOULOUREUX_G", "Douloureux G"], ["BILATERAL", "Bilatéral"], ["NON_FAIT", "Non fait"]);

/** Indolore / Douloureux D / Douloureux G / Médian-bilatéral / Non fait — palpation rachis */
export const COL_PALPATION_MEDIAN = opts(["INDOLORE", "Indolore", true], ["DOULOUREUX_D", "Douloureux D"], ["DOULOUREUX_G", "Douloureux G"], ["MEDIAN_BILATERAL", "Médian-bilatéral"], ["NON_FAIT", "Non fait"]);

/** Indolore-absent / Présent D / Présent G / Bilatéral / Non fait — inspection-palpation genou, cheville */
export const COL_INSPECTION_PALPATION = opts(["INDOLORE_ABSENT", "Indolore-absent", true], ["PRESENT_D", "Présent D"], ["PRESENT_G", "Présent G"], ["BILATERAL", "Bilatéral"], ["NON_FAIT", "Non fait"]);

/** Négatif / Positif D / Positif G / Bilatéral / Non fait — tests radiculaires */
export const COL_RADICULAIRE = opts(["NEGATIF", "Négatif", true], ["POSITIF_D", "Positif D"], ["POSITIF_G", "Positif G"], ["BILATERAL", "Bilatéral"], ["NON_FAIT", "Non fait"]);

/** Non / Oui D / Oui G / Bilatéral — douleur à la mobilisation (membres) */
export const COL_DOULEUR_MOBILISATION = opts(["NON", "Non", true], ["OUI_D", "Oui D"], ["OUI_G", "Oui G"], ["BILATERAL", "Bilatéral"]);

/** Réflexes ostéotendineux */
export const COL_REFLEXES = opts(["ABOLI", "Aboli"], ["DIMINUE", "Diminué"], ["NORMAL", "Normal", true], ["VIF", "Vif"], ["POLYCINETIQUE", "Polycinétique"], ["NON_FAIT", "Non fait"]);

/** Cotation MRC 0 à 5 */
export const COL_MRC = opts(["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5", true], ["NON_FAIT", "Non fait"]);

/** Sensibilité 0 abolie / 1 altérée / 2 normale */
export const COL_SENSIBILITE = opts(["0", "0 abolie"], ["1", "1 altérée"], ["2", "2 normale", true], ["NON_FAIT", "Non fait"]);

/** Absent / Présent (sans côté) */
export const COL_ABSENT_PRESENT = opts(["ABSENT", "Absent", true], ["PRESENT", "Présent"]);

/** Normal / Anormal / Non fait (sans côté) */
export const COL_NORMAL_ANORMAL = opts(["NORMAL", "Normal", true], ["ANORMAL", "Anormal"], ["NON_FAIT", "Non fait"]);

/** Normal / Anormal D / Anormal G / Bilatéral (sans « Non fait ») */
export const COL_NORMAL_DG = opts(["NORMAL", "Normal", true], ["ANORMAL_D", "Anormal D"], ["ANORMAL_G", "Anormal G"], ["BILATERAL", "Bilatéral"]);

export const OUI_NON = opts(["OUI", "Oui"], ["NON", "Non"]);

export const NORMAL_ANORMAL = opts(["NORMAL", "Normal", true], ["ANORMAL", "Anormal"]);

export const NORMALE_ANORMALE = opts(["NORMALE", "Normale", true], ["ANORMALE", "Anormale"]);

export const NORMALE_ANORMALE_NF = opts(["NORMALE", "Normale", true], ["ANORMALE", "Anormale"], ["NON_FAIT", "Non fait"]);

/** Non / Oui D / Oui G / Bilatéral(e) — choix simples latéralisés */
export const NON_OUI_DG = (bilateral = "Bilatéral") =>
  opts(["NON", "Non", true], ["OUI_D", "Oui D"], ["OUI_G", "Oui G"], ["BILATERAL", bilateral]);

export const SI_OUI = (field: string) => (v: Record<string, unknown>) => v[field] === "OUI";
