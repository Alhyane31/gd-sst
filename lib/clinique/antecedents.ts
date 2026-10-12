// Antécédents (§3) : familiaux, professionnels et génération de la synthèse.

export type PathologieCodee = {
  cim11Code: string;
  cim11Libelle: string;
  commentaire?: string;
};

export type MembreFamille = {
  id: string;
  lien: "PERE" | "MERE" | "FRATRIE";
  libelle: string;
  pathologies: PathologieCodee[];
};

/** Père, mère, frère/sœur 1 et 2 : affichés par défaut */
export function membresParDefaut(): MembreFamille[] {
  return [
    { id: "PERE", lien: "PERE", libelle: "Père", pathologies: [] },
    { id: "MERE", lien: "MERE", libelle: "Mère", pathologies: [] },
    { id: "FRATRIE_1", lien: "FRATRIE", libelle: "Frère/sœur 1", pathologies: [] },
    { id: "FRATRIE_2", lien: "FRATRIE", libelle: "Frère/sœur 2", pathologies: [] },
  ];
}

export function ajouterMembreFratrie(membres: MembreFamille[]): MembreFamille[] {
  const n = membres.filter((m) => m.lien === "FRATRIE").length + 1;
  let index = n;
  while (membres.some((m) => m.id === `FRATRIE_${index}`)) index++;
  return [...membres, { id: `FRATRIE_${index}`, lien: "FRATRIE", libelle: `Frère/sœur ${n}`, pathologies: [] }];
}

/**
 * Clés des antécédents professionnels (3.3), partagées par la config d'écran et la synthèse.
 * Chaque bloc : <prefixe> = "OUI" | "NON", puis ses champs de détail.
 */
export const AP = {
  AT: "at",
  AT_DATE: "at_date",
  AT_DECLARE: "at_declare",
  AT_DETAILS: "at_details",
  AT_SEQUELLES: "at_sequelles",
  AT_SEQUELLES_DETAILS: "at_sequelles_details",

  MP: "mp",
  MP_DECLAREE: "mp_declaree",
  MP_DATE_DECLARATION: "mp_date_declaration",
  MP_MALADIE: "mp_maladie",
  MP_SEQUELLES: "mp_sequelles",
  MP_SEQUELLES_DETAILS: "mp_sequelles_details",
  MP_REPAREE: "mp_reparee",
  MP_DATE_REPARATION: "mp_date_reparation",

  TRAJET: "trajet",
  TRAJET_DATE: "trajet_date",
  TRAJET_DECLARE: "trajet_declare",
  TRAJET_DATE_DECLARATION: "trajet_date_declaration",
  TRAJET_DETAILS: "trajet_details",
  TRAJET_SEQUELLES: "trajet_sequelles",
  TRAJET_SEQUELLES_DETAILS: "trajet_sequelles_details",

  AMENAGEMENT: "amenagement",
  AMENAGEMENT_MOTIF: "amenagement_motif",
  AMENAGEMENT_DATE: "amenagement_date",
  AMENAGEMENT_RECOMMANDATIONS: "amenagement_recommandations",

  RECLASSEMENT: "reclassement",
  RECLASSEMENT_DATE: "reclassement_date",
  RECLASSEMENT_TYPE: "reclassement_type",
  RECLASSEMENT_MOTIF: "reclassement_motif",
} as const;

export type AntecedentsProfessionnels = Record<string, unknown>;

function dateFr(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) return "";
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function txt(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function ouiNon(value: unknown, oui: string, non: string): string {
  return value === "OUI" ? oui : value === "NON" ? non : "";
}

/** Assemble des morceaux non vides : "a, b" ; ajoute " : détail" si présent */
function joindre(parts: string[], sep = ", "): string {
  return parts.filter(Boolean).join(sep);
}

function sequelles(v: AntecedentsProfessionnels, cle: string, details: string): string {
  if (v[cle] === "OUI") return txt(v[details]) ? `séquelles : ${txt(v[details])}` : "avec séquelles";
  if (v[cle] === "NON") return "sans séquelles";
  return "";
}

export function syntheseProfessionnelle(v: AntecedentsProfessionnels | undefined): string[] {
  if (!v) return [];
  const lignes: string[] = [];

  if (v[AP.AT] === "OUI") {
    const date = dateFr(v[AP.AT_DATE]);
    lignes.push(
      joindre([
        `accident de travail${date ? ` le ${date}` : ""}`,
        ouiNon(v[AP.AT_DECLARE], "déclaré", "non déclaré"),
        txt(v[AP.AT_DETAILS]),
        sequelles(v, AP.AT_SEQUELLES, AP.AT_SEQUELLES_DETAILS),
      ])
    );
  }

  if (v[AP.MP] === "OUI") {
    const dateDecl = dateFr(v[AP.MP_DATE_DECLARATION]);
    const dateRep = dateFr(v[AP.MP_DATE_REPARATION]);
    lignes.push(
      joindre([
        `maladie professionnelle${txt(v[AP.MP_MALADIE]) ? ` (${txt(v[AP.MP_MALADIE])})` : ""}`,
        v[AP.MP_DECLAREE] === "OUI" ? `déclarée${dateDecl ? ` le ${dateDecl}` : ""}` : ouiNon(v[AP.MP_DECLAREE], "", "non déclarée"),
        sequelles(v, AP.MP_SEQUELLES, AP.MP_SEQUELLES_DETAILS),
        v[AP.MP_REPAREE] === "OUI" ? `réparée${dateRep ? ` le ${dateRep}` : ""}` : ouiNon(v[AP.MP_REPAREE], "", "non réparée"),
      ])
    );
  }

  if (v[AP.TRAJET] === "OUI") {
    const date = dateFr(v[AP.TRAJET_DATE]);
    const dateDecl = dateFr(v[AP.TRAJET_DATE_DECLARATION]);
    lignes.push(
      joindre([
        `accident de trajet${date ? ` le ${date}` : ""}`,
        v[AP.TRAJET_DECLARE] === "OUI" ? `déclaré${dateDecl ? ` le ${dateDecl}` : ""}` : ouiNon(v[AP.TRAJET_DECLARE], "", "non déclaré"),
        txt(v[AP.TRAJET_DETAILS]),
        sequelles(v, AP.TRAJET_SEQUELLES, AP.TRAJET_SEQUELLES_DETAILS),
      ])
    );
  }

  if (v[AP.AMENAGEMENT] === "OUI") {
    const date = dateFr(v[AP.AMENAGEMENT_DATE]);
    lignes.push(
      joindre([
        `aménagement de poste${date ? ` le ${date}` : ""}`,
        txt(v[AP.AMENAGEMENT_MOTIF]) && `motif : ${txt(v[AP.AMENAGEMENT_MOTIF])}`,
        txt(v[AP.AMENAGEMENT_RECOMMANDATIONS]) && `recommandations : ${txt(v[AP.AMENAGEMENT_RECOMMANDATIONS])}`,
      ])
    );
  }

  if (v[AP.RECLASSEMENT] === "OUI") {
    const date = dateFr(v[AP.RECLASSEMENT_DATE]);
    lignes.push(
      joindre([
        `reclassement professionnel${date ? ` le ${date}` : ""}`,
        txt(v[AP.RECLASSEMENT_TYPE]),
        txt(v[AP.RECLASSEMENT_MOTIF]) && `motif : ${txt(v[AP.RECLASSEMENT_MOTIF])}`,
      ])
    );
  }

  return lignes;
}

function libellePathologie(p: { cim11Code?: string; cim11Libelle?: string }): string {
  const lib = txt(p.cim11Libelle);
  const code = txt(p.cim11Code);
  return lib ? (code ? `${lib} (${code})` : lib) : code;
}

export type EntreeSynthese = {
  pathologies?: { cim11Code?: string; cim11Libelle?: string }[];
  chirurgicaux?: string;
  familiaux?: MembreFamille[];
  professionnels?: AntecedentsProfessionnels;
};

/**
 * Synthèse des antécédents, générée à partir des champs saisis.
 * Le médecin peut ensuite la modifier librement.
 */
export function genererSyntheseAntecedents(e: EntreeSynthese): string {
  const lignes: string[] = [];

  const vus = new Set<string>();
  const medicaux = (e.pathologies ?? [])
    .filter((p) => {
      const cle = txt(p.cim11Code) || txt(p.cim11Libelle);
      if (!cle || vus.has(cle)) return false;
      vus.add(cle);
      return true;
    })
    .map(libellePathologie);
  if (medicaux.length) lignes.push(`Antécédents médicaux : ${medicaux.join(", ")}.`);

  if (txt(e.chirurgicaux)) lignes.push(`Antécédents chirurgicaux : ${txt(e.chirurgicaux)}.`);

  const familiaux = (e.familiaux ?? [])
    .map((m) => {
      const patho = m.pathologies.map(libellePathologie).filter(Boolean);
      return patho.length ? `${m.libelle.toLowerCase()} : ${patho.join(", ")}` : "";
    })
    .filter(Boolean);
  if (familiaux.length) lignes.push(`Antécédents familiaux : ${familiaux.join(" ; ")}.`);

  const pro = syntheseProfessionnelle(e.professionnels);
  if (pro.length) lignes.push(`Antécédents professionnels : ${pro.join(" ; ")}.`);

  return lignes.length ? lignes.join("\n") : "Aucun antécédent renseigné.";
}
