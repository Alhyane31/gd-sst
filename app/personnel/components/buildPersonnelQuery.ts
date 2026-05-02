export type PersonnelCategorie = "SMR" | "VP";

export type Filters = {
  nom: string;
  prenom: string;
  poste: string;
  service: string;
  formation: string;
  categorie: "" | PersonnelCategorie;
  prochaineVisiteFrom: string; // YYYY-MM-DD
  prochaineVisiteTo: string;
  convocFrom: string;          // YYYY-MM-DD
  convocTo: string;
  derniereVisiteFrom: string;  // YYYY-MM-DD
  derniereVisiteTo: string;
};

export function buildPersonnelQuery(f: Filters, page: number, pageSize: number) {
  const params = new URLSearchParams();

  if (f.prenom) params.set("prenom", f.prenom);
  if (f.nom) params.set("nom", f.nom);
  if (f.poste) params.set("posteId", f.poste);
  if (f.formation) params.set("formationId", f.formation);
  if (f.service) params.set("serviceId", f.service);
  if (f.categorie) params.set("categorie", f.categorie);
  if (f.prochaineVisiteFrom) params.set("prochaineVisiteFrom", f.prochaineVisiteFrom);
  if (f.prochaineVisiteTo)   params.set("prochaineVisiteTo",   f.prochaineVisiteTo);
  if (f.convocFrom) params.set("convocFrom", f.convocFrom);
  if (f.convocTo)   params.set("convocTo",   f.convocTo);
  if (f.derniereVisiteFrom) params.set("derniereVisiteFrom", f.derniereVisiteFrom);
  if (f.derniereVisiteTo)   params.set("derniereVisiteTo",   f.derniereVisiteTo);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return params.toString();
}
