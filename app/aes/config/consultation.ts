// Section 11 – Consultation de résultats (répétable), champs 64 à 77.
import { opts } from "@/app/formulaires/examen/config/presets";
import type { ExamCtx, SectionDef, SectionValues } from "@/app/formulaires/examen/types";
import type { Alerte } from "@/lib/clinique/mesures";
import { BILAN_LIBELLES, BILANS, SUIVI_LIBELLES, type SuiviCode, type SuiviStatut } from "@/lib/aes/codes";
import { alertesConsultation, prochaineVisite } from "@/lib/aes/suivi";

/** Contexte d'une consultation (ctx.extra) */
export type ContexteConsultation = {
  tpeAccepte: boolean;
  atFaite: boolean;
  /** bilans prévus par visite du calendrier */
  bilansParVisite: Partial<Record<SuiviCode, string[]>>;
  suivis: { code: SuiviCode; datePrevue: string; statut: SuiviStatut }[];
};

const extra = (ctx: ExamCtx) => (ctx.extra ?? {}) as Partial<ContexteConsultation>;

/** Lignes de la grille Résultats : bilans prévus pour la visite (toutes si non programmée ou sans bilan prévu) */
function bilanPrevu(bilan: string, v: SectionValues, ctx: ExamCtx): boolean {
  const prevus = extra(ctx).bilansParVisite?.[v.visite as SuiviCode];
  return !prevus || prevus.length === 0 ? true : prevus.includes(bilan);
}

const tpe = (_v: SectionValues, ctx: ExamCtx) => !!extra(ctx).tpeAccepte;

export const CONSULTATION_AES: SectionDef = {
  id: "consultation",
  title: "11. Consultation de résultats",
  fields: [
    {
      kind: "choice",
      id: "visite",
      label: "Visite concernée",
      required: true,
      options: opts(["J1_J7", SUIVI_LIBELLES.J1_J7], ["S2", "S2"], ["S6", "S6"], ["S12", "S12"], ["NON_PROGRAMMEE", "Non programmée"]),
    },
    { kind: "date", id: "dateConsultation", label: "Date de la consultation", required: true },
    {
      kind: "grid",
      id: "resultats",
      label: "Résultats",
      help: "Lignes affichées selon les bilans prévus pour la visite",
      rows: BILANS.map((b) => ({ value: b, label: BILAN_LIBELLES[b] })),
      columns: opts(["NEGATIF", "Négatif/Normal", true], ["POSITIF", "Positif/Anormal"], ["NON_FAIT", "Non fait"], ["EN_ATTENTE", "En attente"]),
      rowsFilter: (row, v, ctx) => bilanPrevu(row.value, v, ctx),
    },
    { kind: "measure", id: "titreAntiHbs", label: "Titre anti-HBs", unit: "mUI/mL", min: 0 },
    {
      kind: "choice",
      id: "observanceTpe",
      label: "Observance du TPE",
      options: opts(["BONNE", "Bonne"], ["DOSES_OUBLIEES", "Doses oubliées"], ["ARRET_PREMATURE", "Arrêt prématuré"], ["NON_CONCERNE", "Non concerné"]),
      showIf: tpe,
    },
    {
      kind: "checkboxes",
      id: "effetsSecondaires",
      label: "Effets secondaires",
      exclusive: "AUCUN",
      options: opts(
        ["AUCUN", "Aucun"],
        ["NAUSEES", "Nausées, vomissements"],
        ["DIARRHEE", "Diarrhée"],
        ["CEPHALEES", "Céphalées"],
        ["FATIGUE", "Fatigue"],
        ["ERUPTION", "Éruption"],
        ["AUTRE", "Autre"]
      ),
      showIf: tpe,
    },
    {
      kind: "checkboxes",
      id: "primoInfection",
      label: "Signes de primo-infection",
      exclusive: "AUCUN",
      options: opts(["AUCUN", "Aucun"], ["FIEVRE", "Fièvre"], ["ERUPTION", "Éruption"], ["ADENOPATHIES", "Adénopathies"], ["ANGINE", "Angine"], ["ICTERE", "Ictère"]),
    },
    {
      kind: "choice",
      id: "retentissementPsy",
      label: "Retentissement psychologique",
      options: opts(["AUCUN", "Aucun"], ["ANXIETE_MODEREE", "Anxiété modérée"], ["ANXIETE_IMPORTANTE", "Anxiété importante, soutien proposé"]),
    },
    {
      kind: "choice",
      id: "declarationAT",
      label: "Déclaration en accident du travail",
      options: opts(["FAITE", "Faite"], ["EN_COURS", "En cours"], ["NON_FAITE", "Non faite"]),
      // obligatoire à chaque visite tant que la déclaration n'est pas faite
      requiredIf: (_v, ctx) => !extra(ctx).atFaite,
    },
    {
      kind: "select",
      id: "motifNonFaite",
      label: "Motif si non faite",
      options: opts(
        ["OUBLI", "Oubli ou méconnaissance"],
        ["DELAI_DEPASSE", "Délai dépassé"],
        ["REFUS", "Refus de la victime"],
        ["EN_ATTENTE", "Démarche en attente"],
        ["AUTRE", "Autre"]
      ),
      showIf: (v) => v.declarationAT === "NON_FAITE",
    },
    { kind: "choice", id: "certificatInitial", label: "Certificat médical initial établi", options: opts(["OUI", "Oui"], ["NON", "Non"]) },
    {
      kind: "checkboxes",
      id: "conduite",
      label: "Conduite à tenir",
      options: opts(
        ["POURSUITE", "Poursuite du suivi"],
        ["ARRET_TPE", "Arrêt du TPE (source négative)"],
        ["ADAPTATION_TPE", "Adaptation du TPE"],
        ["VACCINATION_VHB", "Vaccination VHB"],
        ["ORIENTATION_P23", "Orientation P23 ou infectiologie"],
        ["FIN_SUIVI", "Fin du suivi"]
      ),
    },
    { kind: "date", id: "prochaineConsultation", label: "Prochaine consultation", help: "Proposée selon le calendrier" },
    {
      kind: "checkboxes",
      id: "objetProchaine",
      label: "Objet de la prochaine consultation",
      options: opts(
        ["RESULTATS", "Résultats"],
        ["TOLERANCE", "Tolérance et observance"],
        ["VACCINATION", "Vaccination VHB"],
        ["SOUTIEN", "Soutien psychologique"],
        ["CLOTURE", "Clôture du dossier"]
      ),
    },
  ],
  alerts: (v, ctx) => {
    const e = extra(ctx);
    const alertes: Alerte[] = alertesConsultation(v, { atFaite: !!e.atFaite });
    // prochaine consultation proposée selon le calendrier (modifiable)
    if (!v.prochaineConsultation && typeof v.dateConsultation === "string" && e.suivis?.length) {
      const prochaine = prochaineVisite(e.suivis, v.dateConsultation);
      if (prochaine) {
        const [y, m, d] = prochaine.datePrevue.split("-");
        alertes.push({
          severite: "info",
          message: `Prochaine visite du calendrier : ${SUIVI_LIBELLES[prochaine.code]} le ${d}/${m}/${y}.`,
          appliquer: { libelle: "Reprendre", valeurs: { prochaineConsultation: prochaine.datePrevue } },
        });
      }
    }
    return alertes;
  },
};
