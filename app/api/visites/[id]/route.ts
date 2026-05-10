// GET /api/visites/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import  prisma  from "@/lib/prisma";

export async function GET(
req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params; 
  const visite = await prisma.visite.findUnique({
    where: { id },
    include: {
      personnel: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          matricule: true,
          poste:     { select: { libelle: true } },
          service:   { select: { libelle: true } },
          formation: { select: { libelle: true } },
        },
      },
      convocation: {
        select: {
          id: true,
          datePrevue: true,
          dateRealisee: true,
          statut: true,
          convocationType: true,
          commentaire: true,
          bordereau: { select: { id: true, serialNumber: true } },
        },
      },
      formulaire: {
        select: {
          id: true,
          statut: true,
          createdAt: true,
          submittedAt: true,
          verifiedAt: true,
          filledBy:     { select: { firstName: true, lastName: true } },
          submittedBy:  { select: { firstName: true, lastName: true } },
          verifiedBy:   { select: { firstName: true, lastName: true } },
        },
      },
      etudeDePoste: { select: { id: true, createdAt: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      updatedBy: { select: { firstName: true, lastName: true } },
    },
  });

  if (!visite) {
    return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });
  }

  return NextResponse.json(visite);
}