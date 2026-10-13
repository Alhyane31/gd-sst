// Rappels à la victime avant chaque visite de suivi (SMS ou e-mail) — POINT D'EXTENSION.
// La plateforme n'a pas encore d'infrastructure d'envoi (ni e-mail ni SMS) et la fiche Personnel
// n'a pas de téléphone : aucun rappel n'est envoyé. Pour l'activer :
//   1. implémenter CanalNotification (ex. SMTP via nodemailer, ou fournisseur SMS) ;
//   2. l'affecter à `canalNotification` ;
//   3. appeler `rappelsAEnvoyer` chaque jour (tâche planifiée) et `canal.envoyer` pour chaque rappel.
import { SUIVI_LIBELLES, type SuiviCode } from "./codes";

export type RappelAes = {
  declarationId: string;
  visiteId: string;
  personnel: { nom: string; email: string | null; telephone: string | null };
  visite: SuiviCode;
  datePrevue: string; // yyyy-mm-dd
  message: string;
};

export interface CanalNotification {
  nom: string;
  envoyer(rappel: RappelAes): Promise<void>;
}

/** Aucun canal configuré : les rappels sont seulement listés (GET /api/aes/rappels) */
export const canalNotification: CanalNotification | null = null;

type SuiviRappel = { code: string; statut: string; datePrevue: string };

/** Visites prévues dans les `joursAvant` prochains jours (aujourd'hui inclus) */
export function visitesARappeler(suivis: SuiviRappel[], aujourdhui: string, joursAvant: number): SuiviRappel[] {
  const fin = new Date(`${aujourdhui}T00:00:00Z`);
  fin.setUTCDate(fin.getUTCDate() + joursAvant);
  const limite = fin.toISOString().slice(0, 10);
  return suivis.filter((s) => s.statut === "PREVUE" && s.datePrevue >= aujourdhui && s.datePrevue <= limite);
}

export function messageRappel(visite: SuiviCode, datePrevue: string): string {
  const [y, m, d] = datePrevue.split("-");
  return `Rappel : visite de suivi AES (${SUIVI_LIBELLES[visite]}) prévue le ${d}/${m}/${y} au service de médecine du travail.`;
}
