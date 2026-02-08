// app/personnel/recherche/components/buildPersonnelQuery.ts
export type PersonnelCategorie = "SMR" | "VP";

export type Filters = {
  nom: string;
  prenom: string;
  poste: string;
  service: string;
  formation: string;
  categorie: "" | PersonnelCategorie;
  tag: string; // exact
};

export function buildPersonnelQuery(f: Filters, page: number, pageSize: number) {
  const params = new URLSearchParams();

  if (f.prenom) params.set("prenom", f.prenom);
  if (f.nom) params.set("nom", f.nom);
  if (f.poste) params.set("posteId", f.poste);
  if (f.formation) params.set("formationId", f.formation);
  if (f.service) params.set("serviceId", f.service);
  if (f.categorie) params.set("categorie", f.categorie);
  if (f.tag) params.set("tag", f.tag);

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return params.toString();
}
