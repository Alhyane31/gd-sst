// app/personnel/recherche/components/buildPersonnelQuery.ts
export type PersonnelCategorie = "SMR" | "VP";
import { ConvocationStatut } from "@prisma/client";
export type Filters = {
  nom: string;
  prenom: string;
  poste: string;
  service: string;
  formation: string;
  categorie: "" | PersonnelCategorie;
  tag: string; // exact
   // 🔽 Filtres convocation (dernière convocation)
  convStatut: "" | ConvocationStatut; // ex: "CONVOQUE" | "PRESENT" | ...
  datePrevueFrom: string; // YYYY-MM-DD
  datePrevueTo: string;   // YYYY-MM-DD
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
  if (f.convStatut) params.set("statutConvocation", f.convStatut);
  if (f.datePrevueFrom) params.set("datePrevueFrom", f.datePrevueFrom);
  if (f.datePrevueTo) params.set("datePrevueTo", f.datePrevueTo);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return params.toString();
}
