import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import  prisma  from "@/lib/prisma";
import { Prisma, VisiteType, VisiteStatut } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);

    const nom          = searchParams.get("nom")?.trim() ?? "";
    const prenom       = searchParams.get("prenom")?.trim() ?? "";
    const type         = searchParams.get("type")?.trim() ?? "";
    const statut       = searchParams.get("statut")?.trim() ?? "";
    const dateDebutFrom = searchParams.get("dateDebutFrom")?.trim() ?? "";
    const dateDebutTo   = searchParams.get("dateDebutTo")?.trim() ?? "";
    const page         = Math.max(0, Number(searchParams.get("page") ?? "0"));
    const pageSize     = Math.min(500, Math.max(1, Number(searchParams.get("pageSize") ?? "10")));

    const where: Prisma.VisiteWhereInput = {};

    // Filtre personnel (nom / prénom)
    if (nom || prenom) {
      where.personnel = {
        ...(nom    && { lastName:  { contains: nom,    mode: "insensitive" } }),
        ...(prenom && { firstName: { contains: prenom, mode: "insensitive" } }),
      };
    }

    if (type)   where.type   = type   as VisiteType;
    if (statut) where.statut = statut as VisiteStatut;

    if (dateDebutFrom || dateDebutTo) {
      where.dateDebut = {
        ...(dateDebutFrom && { gte: new Date(dateDebutFrom) }),
        ...(dateDebutTo   && { lte: new Date(dateDebutTo + "T23:59:59.999Z") }),
      };
    }

    const skip = page * pageSize;

    const [items, total] = await Promise.all([
      prisma.visite.findMany({
        where,
        include: {
          personnel:   { select: { id: true, firstName: true, lastName: true } },
          convocation: { select: { id: true, datePrevue: true } },
          createdBy:   { select: { id: true, lastName :true, firstName:true} },
        },
        orderBy: { dateDebut: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.visite.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}