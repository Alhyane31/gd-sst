import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);

  const nom = (searchParams.get("nom") ?? "").trim();
  const prenom = (searchParams.get("prenom") ?? "").trim();
  const posteId = (searchParams.get("posteId") ?? "").trim();
  const serviceId = (searchParams.get("serviceId") ?? "").trim();
  const formationId = (searchParams.get("formationId") ?? "").trim();
   
  // ✅ nouveaux params
  const categorie = (searchParams.get("categorie") ?? "").trim(); // "SMR" | "VP"
  const tag = (searchParams.get("tag") ?? "").trim(); // ex: "Femme enceinte"
const statutConvocation = (searchParams.get("statutConvocation") ?? "").trim();
const datePrevueFrom = (searchParams.get("datePrevueFrom") ?? "").trim();
const datePrevueTo = (searchParams.get("datePrevueTo") ?? "").trim();
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));

  const where: any = {
    // si tu veux afficher aussi les inactifs quand pas de filtre -> adapte
    // ici tu avais forcé isActive: true
    isActive: true,
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
  if (serviceId) where.AND.push({ serviceId });
  if (formationId) where.AND.push({ formationId });
// ✅ filtre convocation (sur datePrevue + statut) en excluant ANNULEE
if (statutConvocation || datePrevueFrom || datePrevueTo) {
  const dateFilter: any = {};
  if (datePrevueFrom) dateFilter.gte = new Date(`${datePrevueFrom}T00:00:00.000Z`);
  if (datePrevueTo) dateFilter.lte = new Date(`${datePrevueTo}T23:59:59.999Z`);

  where.AND.push({
    convocations: {
      some: {
        statut: { not: "ANNULEE", ...(statutConvocation ? { equals: statutConvocation } : {}) },
        ...(Object.keys(dateFilter).length ? { datePrevue: dateFilter } : {}),
      },
    },
  });
}
  // ✅ filtre categorie
  if (categorie === "SMR" || categorie === "VP") {
    where.AND.push({ categorie });
  }

  // ✅ filtre tag (match EXACT dans le tableau tags)
  if (tag) {
    where.AND.push({ tags: { has: tag } });
  }

  // si AND est vide, Prisma accepte, mais on peut nettoyer
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
    where: { statut: { not: "ANNULEE" } },
    orderBy: [{ datePrevue: "desc" }, { createdAt: "desc" }],
    take: 1,
    select: {
      id: true,
      datePrevue: true,
      statut: true,
      
    },
    
    
  },
},
    }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}
