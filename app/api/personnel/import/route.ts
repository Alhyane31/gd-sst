import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateMatricule } from "@/lib/generate-matricule";

type ImportRow = {
  matricule?: string; nom: string; prenom: string; email?: string;
  dateNaissance?: string; statutSocial?: string;
  codePoste: string; codeFormation: string; codeService: string;
  categorie?: string; dateAffectation?: string;
};

function parseDate(s?: string): Date | null {
  if (!s) return null;
  // DD/MM/YYYY
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00.000Z`);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows }: { rows: ImportRow[] } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Aucune ligne à importer" }, { status: 400 });
  }

  // Précharger les référentiels
  const [postes, formations, services] = await Promise.all([
    prisma.poste.findMany({ select: { id: true, code: true } }),
    prisma.formation.findMany({ select: { id: true, code: true } }),
    prisma.service.findMany({ select: { id: true, code: true, formationId: true } }),
  ]);
  const posteMap = new Map(postes.map((p) => [p.code.trim().toLowerCase(), p.id]));
  const formationMap = new Map(formations.map((f) => [f.code.trim().toLowerCase(), f.id]));
  const serviceMap = new Map(services.map((s) => [s.code.trim().toLowerCase(), { id: s.id, formationId: s.formationId }]));

  // Matricules / emails existants
  const existingMatricules = new Set(
    (await prisma.personnel.findMany({ select: { matricule: true }, where: { matricule: { not: null } } }))
      .map((p) => p.matricule!.toLowerCase())
  );
  const existingEmails = new Set(
    (await prisma.personnel.findMany({ select: { email: true }, where: { email: { not: null } } }))
      .map((p) => p.email!.toLowerCase())
  );

  type OkItem = { ligne: number; nom: string; prenom: string; matricule?: string };
  type ErrItem = { ligne: number; nom: string; prenom: string; raison: string };

  const ok: OkItem[] = [];
  const errors: ErrItem[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const ligne = i + 2; // 1 = header
    const nom = (r.nom ?? "").trim();
    const prenom = (r.prenom ?? "").trim();
    const tag = `Ligne ${ligne} — ${nom} ${prenom}`;

    if (!nom || !prenom) { errors.push({ ligne, nom, prenom, raison: "Nom et prénom obligatoires" }); continue; }

    const codePoste     = (r.codePoste ?? "").trim().toLowerCase();
    const codeFormation = (r.codeFormation ?? "").trim().toLowerCase();
    const codeService   = (r.codeService ?? "").trim().toLowerCase();

    if (!codePoste)     { errors.push({ ligne, nom, prenom, raison: "Code poste manquant" }); continue; }
    if (!codeFormation) { errors.push({ ligne, nom, prenom, raison: "Code formation manquant" }); continue; }
    if (!codeService)   { errors.push({ ligne, nom, prenom, raison: "Code service manquant" }); continue; }

    const posteId     = posteMap.get(codePoste);
    const formationId = formationMap.get(codeFormation);
    const svcEntry    = serviceMap.get(codeService);

    if (!posteId)     { errors.push({ ligne, nom, prenom, raison: `Poste "${r.codePoste}" introuvable` }); continue; }
    if (!formationId) { errors.push({ ligne, nom, prenom, raison: `Formation "${r.codeFormation}" introuvable` }); continue; }
    if (!svcEntry)    { errors.push({ ligne, nom, prenom, raison: `Service "${r.codeService}" introuvable` }); continue; }
    if (svcEntry.formationId !== formationId) {
      errors.push({ ligne, nom, prenom, raison: `Le service "${r.codeService}" n'appartient pas à la formation "${r.codeFormation}"` }); continue;
    }

    let matricule = (r.matricule ?? "").trim() || null;
    const email = (r.email ?? "").trim() || null;

    // Auto-génération si matricule absent
    if (!matricule) {
      matricule = generateMatricule(nom, prenom, existingMatricules);
    } else if (existingMatricules.has(matricule.toLowerCase())) {
      errors.push({ ligne, nom, prenom, raison: `Matricule "${matricule}" déjà utilisé` }); continue;
    }
    if (email && existingEmails.has(email.toLowerCase())) {
      errors.push({ ligne, nom, prenom, raison: `Email "${email}" déjà utilisé` }); continue;
    }

    const statuts = ["CELIBATAIRE", "MARIE", "DIVORCE", "VEUF"];
    const statutSocial = statuts.includes((r.statutSocial ?? "").toUpperCase())
      ? (r.statutSocial!.toUpperCase() as any)
      : null;

    try {
      await prisma.personnel.create({
        data: {
          firstName: prenom, lastName: nom,
          matricule,
          email,
          dateNaissance: parseDate(r.dateNaissance),
          statutSocial,
          posteId, serviceId: svcEntry.id, formationId,
          categorie: r.categorie?.toUpperCase() === "SMR" ? "SMR" : "VP",
          dateAffectation: parseDate(r.dateAffectation),
        },
      });
      if (matricule) existingMatricules.add(matricule.toLowerCase());
      if (email)     existingEmails.add(email);
      ok.push({ ligne, nom, prenom, matricule: matricule });
    } catch {
      errors.push({ ligne, nom, prenom, raison: "Erreur lors de l'insertion" });
    }
  }

  return NextResponse.json({ ok, errors, totalImported: ok.length });
}
