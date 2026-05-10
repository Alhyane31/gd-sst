import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ConvocationStatut } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateMatricule } from "@/lib/generate-matricule";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);

  const nom = (searchParams.get("nom") ?? "").trim();
  const prenom = (searchParams.get("prenom") ?? "").trim();
  const posteId = (searchParams.get("posteId") ?? "").trim();
  const serviceIdsRaw = (searchParams.get("serviceIds") ?? "").trim();
  const serviceIdList = serviceIdsRaw ? serviceIdsRaw.split(",").filter(Boolean) : [];
  const formationId = (searchParams.get("formationId") ?? "").trim();
   
  const categorie            = (searchParams.get("categorie")          ?? "").trim();
  const prochaineVisiteFrom  = (searchParams.get("prochaineVisiteFrom") ?? "").trim();
  const prochaineVisiteTo    = (searchParams.get("prochaineVisiteTo")   ?? "").trim();
  const convocFrom           = (searchParams.get("convocFrom")          ?? "").trim();
  const convocTo             = (searchParams.get("convocTo")            ?? "").trim();
  const derniereVisiteFrom   = (searchParams.get("derniereVisiteFrom")  ?? "").trim();
  const derniereVisiteTo     = (searchParams.get("derniereVisiteTo")    ?? "").trim();
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));
  const showInactif = searchParams.get("showInactif") === "true";

  const where: any = {
    ...(showInactif ? {} : { isActive: true }),
    AND: [],
  };

  // ✅ texte nom/prénom (ne pas écraser OR)
  if (prenom) {
    where.AND.push({
      firstName: { contains: prenom, mode: "insensitive" },
    });
  }

  if (nom) {
    where.AND.push({
      lastName: { contains: nom, mode: "insensitive" },
    });
  }

  if (posteId) where.AND.push({ posteId });
  if (serviceIdList.length) where.AND.push({ serviceId: { in: serviceIdList } });
  if (formationId) where.AND.push({ formationId });
  if (categorie === "SMR" || categorie === "VP") {
    where.AND.push({ categorie });
  }

  if (prochaineVisiteFrom || prochaineVisiteTo) {
    const df: any = {};
    if (prochaineVisiteFrom) df.gte = new Date(`${prochaineVisiteFrom}T00:00:00.000Z`);
    if (prochaineVisiteTo)   df.lte = new Date(`${prochaineVisiteTo}T23:59:59.999Z`);
    where.AND.push({ dateProchainVisite: df });
  }

  if (convocFrom || convocTo) {
    const df: any = {};
    if (convocFrom) df.gte = new Date(`${convocFrom}T00:00:00.000Z`);
    if (convocTo)   df.lte = new Date(`${convocTo}T23:59:59.999Z`);
    where.AND.push({
      convocations: {
        some: { statut: ConvocationStatut.ENVOYEE, datePrevue: df },
      },
    });
  }

  if (derniereVisiteFrom || derniereVisiteTo) {
    const df: any = {};
    if (derniereVisiteFrom) df.gte = new Date(`${derniereVisiteFrom}T00:00:00.000Z`);
    if (derniereVisiteTo)   df.lte = new Date(`${derniereVisiteTo}T23:59:59.999Z`);
    where.AND.push({ visites: { some: { dateDebut: df } } });
  }

  if (where.AND.length === 0) delete where.AND;

  const [total, items] = await Promise.all([
    prisma.personnel.count({ where }),
    prisma.personnel.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: page * pageSize,
      take: pageSize,
      include: {
        poste: true,
        service: true,
        formation: true,
        convocations: {
          where: { statut: ConvocationStatut.ENVOYEE },
          orderBy: [{ datePrevue: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: { id: true, datePrevue: true },
        },
        visites: {
          orderBy: { dateDebut: "desc" },
          take: 1,
          select: { id: true, dateDebut: true, statut: true },
        },
      },
    }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      firstName, lastName, matricule, email, dateNaissance, statutSocial,
      posteId, posteDetailId, serviceId, formationId,
      categorie, dateAffectation, dateProchainVisite,
    } = body;

    if (!firstName || !lastName || !posteId || !serviceId || !formationId) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    // Auto-génération du matricule si absent
    let finalMatricule = (matricule ?? "").trim() || null;
    if (!finalMatricule) {
      const existing = new Set(
        (await prisma.personnel.findMany({ select: { matricule: true }, where: { matricule: { not: null } } }))
          .map((p) => p.matricule!.toLowerCase())
      );
      finalMatricule = generateMatricule(lastName, firstName, existing);
    }

    const personnel = await prisma.personnel.create({
      data: {
        firstName, lastName,
        matricule: finalMatricule,
        email: email || null,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        statutSocial: statutSocial || null,
        posteId,
        posteDetailId: posteDetailId || null,
        serviceId, formationId,
        categorie: (categorie === "SMR" ? "SMR" : "VP"),
        dateAffectation: dateAffectation ? new Date(dateAffectation) : null,
        dateProchainVisite: dateProchainVisite ? new Date(dateProchainVisite) : null,
      },
    });
    return NextResponse.json(personnel, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Matricule ou email déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
