// Tableau de bord AES : AES par service, par geste, par cause ; taux de déclaration AT ; taux de suivi complet.

export type DeclarationStat = {
  /** service saisi (champ 6), à défaut service d'affectation du personnel */
  service: string | null;
  geste: string | null;
  causes: string[];
  declarationAT: string | null;
  statut: string;
  suivis: { code: string; statut: string; datePrevue: string }[];
  consultations: { visite: string }[];
  /** « Pas d'AES » : pas de suivi, exclu du taux de suivi complet */
  pasDAes?: boolean;
};

export type Comptage = { cle: string; libelle: string; nombre: number };

export type StatistiquesAes = {
  total: number;
  parService: Comptage[];
  parGeste: Comptage[];
  parCause: Comptage[];
  /** déclarations AT faites / déclarations */
  tauxDeclarationAT: number | null;
  declarationsATFaites: number;
  /** suivis complets (S12 faite) / suivis arrivés à échéance (S12 prévue passée ou dossier clôturé), hors « pas d'AES » */
  tauxSuiviComplet: number | null;
  suivisComplets: number;
  suivisEchus: number;
};

function compter(valeurs: string[], libelles: Record<string, string> = {}): Comptage[] {
  const m = new Map<string, number>();
  for (const v of valeurs) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()]
    .map(([cle, nombre]) => ({ cle, libelle: libelles[cle] ?? cle, nombre }))
    .sort((a, b) => b.nombre - a.nombre || a.libelle.localeCompare(b.libelle));
}

const taux = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null);

export function s12Faite(d: DeclarationStat): boolean {
  return d.suivis.some((s) => s.code === "S12" && s.statut === "FAITE") || d.consultations.some((c) => c.visite === "S12");
}

export function calculerStatistiques(
  declarations: DeclarationStat[],
  aujourdhui: string,
  libelles: { gestes?: Record<string, string>; causes?: Record<string, string> } = {}
): StatistiquesAes {
  const echus = declarations.filter((d) => {
    if (d.pasDAes) return false;
    const s12 = d.suivis.find((s) => s.code === "S12");
    return d.statut === "CLOTUREE" || (s12 ? s12.datePrevue <= aujourdhui : false);
  });
  const complets = echus.filter(s12Faite);
  const atFaites = declarations.filter((d) => d.declarationAT === "FAITE").length;

  return {
    total: declarations.length,
    parService: compter(declarations.map((d) => d.service?.trim() || "Non renseigné")),
    parGeste: compter(declarations.map((d) => d.geste ?? "NON_RENSEIGNE"), { NON_RENSEIGNE: "Non renseigné", ...libelles.gestes }),
    parCause: compter(declarations.flatMap((d) => d.causes), libelles.causes),
    tauxDeclarationAT: taux(atFaites, declarations.length),
    declarationsATFaites: atFaites,
    tauxSuiviComplet: taux(complets.length, echus.length),
    suivisComplets: complets.length,
    suivisEchus: echus.length,
  };
}
