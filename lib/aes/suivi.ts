// Section 11 (consultations de résultats) et clôture du dossier.
import type { Alerte } from "@/lib/clinique/mesures";
import { BILAN_LIBELLES, liste, type Bilan, type SuiviCode, type SuiviStatut } from "./codes";

export type ConsultationData = Record<string, unknown>;

/** Valeurs « Positif/Anormal » de la grille Résultats (66) */
export const RESULTAT_POSITIF = "POSITIF";

export function resultatsPositifs(c: ConsultationData): Bilan[] {
  const grille = (c.resultats ?? {}) as Record<string, string>;
  return Object.entries(grille)
    .filter(([, v]) => v === RESULTAT_POSITIF)
    .map(([b]) => b as Bilan);
}

/** Marqueurs dont la positivité chez la victime signe une séroconversion (et la sérologie initiale correspondante) */
const SEROCONVERSION: Partial<Record<Bilan, string>> = { VIH: "VIH", VHC: "VHC", ARN_VHC: "VHC", AG_HBS: "AG_HBS" };

export const MESSAGE_MALADIE_PRO =
  "déclaration en maladie professionnelle (secteur privé : VHB et VHC indemnisables, VIH maladie à caractère professionnel ; secteur public : statut de la fonction publique).";

/**
 * Alertes d'une consultation : résultat positif/anormal (orientation P23 proposée), séroconversion
 * (déclaration en maladie professionnelle), soutien psychologique, signes de primo-infection,
 * rappel de déclaration AT tant qu'elle n'est pas faite.
 */
export function alertesConsultation(
  c: ConsultationData,
  ctx: { atFaite: boolean; serologiesVictime?: Record<string, string> }
): Alerte[] {
  const alertes: Alerte[] = [];

  const positifs = resultatsPositifs(c);
  if (positifs.length) {
    const conduite = liste(c.conduite);
    alertes.push({
      severite: "error",
      message: `Résultat positif ou anormal : ${positifs.map((b) => BILAN_LIBELLES[b] ?? b).join(", ")}. Orientation au P23 proposée.`,
      ...(conduite.includes("ORIENTATION_P23")
        ? {}
        : { appliquer: { libelle: "Orienter P23", valeurs: { conduite: [...conduite, "ORIENTATION_P23"] } } }),
    });
  }

  // séroconversion : positif à une visite alors que la sérologie initiale (champ 50) ne l'était pas
  const initiales = ctx.serologiesVictime ?? {};
  const seroconversions = positifs.filter((b) => SEROCONVERSION[b] && initiales[SEROCONVERSION[b]!] !== "POSITIF");
  if (seroconversions.length) {
    alertes.push({
      severite: "error",
      message: `Séroconversion (${seroconversions.map((b) => BILAN_LIBELLES[b]).join(", ")}) : ${MESSAGE_MALADIE_PRO}`,
    });
  }

  if (c.retentissementPsy === "ANXIETE_MODEREE" || c.retentissementPsy === "ANXIETE_IMPORTANTE") {
    alertes.push({ severite: "info", message: "Prise en charge psychologique : 3 entretiens proposés au cours du premier mois." });
  }

  const signes = liste(c.primoInfection).filter((s) => s !== "AUCUN");
  if (signes.length) {
    alertes.push({ severite: "error", message: "Signe(s) évocateur(s) de primo-infection : avis du P23 ou de l'infectiologie." });
  }

  if (!ctx.atFaite && c.declarationAT !== "FAITE") {
    alertes.push({ severite: "warning", message: "Rappel : la déclaration en accident du travail n'est pas faite." });
  }
  return alertes;
}

/** Déclaration AT faite dans la déclaration initiale ou dans une consultation déjà enregistrée */
export function declarationAtFaite(declaration: Record<string, unknown>, consultations: ConsultationData[]): boolean {
  return declaration.declarationAT === "FAITE" || consultations.some((c) => c.declarationAT === "FAITE");
}

export type EtatSuivi = { code: SuiviCode; statut: SuiviStatut };
export type ConsultationResume = { visite: string; conduite?: unknown };

/** « Fin du suivi » ou « Arrêt du TPE (source négative) » cochés dans une consultation */
export const CONDUITES_ARRET = ["FIN_SUIVI", "ARRET_TPE"];

/**
 * Clôture possible seulement après la visite S12 (faite ou consultation S12 enregistrée),
 * ou en cas d'arrêt justifié du suivi (conduite d'arrêt cochée + motif renseigné).
 */
export function peutCloturer(
  suivis: EtatSuivi[],
  consultations: ConsultationResume[],
  motifArret?: string | null,
  /** « Pas d'AES » : pas de suivi, clôture possible immédiatement */
  pasDAes = false
): { ok: boolean; raison?: string } {
  if (pasDAes) return { ok: true };
  const s12Faite = suivis.some((s) => s.code === "S12" && s.statut === "FAITE") || consultations.some((c) => c.visite === "S12");
  if (s12Faite) return { ok: true };

  const arret = consultations.some((c) => liste(c.conduite).some((x) => CONDUITES_ARRET.includes(x)));
  if (arret && motifArret?.trim()) return { ok: true };

  return {
    ok: false,
    raison: arret
      ? "Arrêt du suivi : renseignez le motif pour clôturer."
      : "Clôture possible seulement après la visite S12, ou après un arrêt justifié du suivi (consultation « Fin du suivi » ou « Arrêt du TPE » + motif).",
  };
}

/** Prochaine visite du calendrier encore prévue après une date */
export function prochaineVisite(
  suivis: { code: SuiviCode; datePrevue: string; statut: SuiviStatut }[],
  apres: string
): { code: SuiviCode; datePrevue: string } | null {
  return (
    [...suivis]
      .filter((s) => s.statut === "PREVUE" && s.datePrevue > apres)
      .sort((a, b) => a.datePrevue.localeCompare(b.datePrevue))[0] ?? null
  );
}
