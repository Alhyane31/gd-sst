// PATCH /api/visites/[id]/cloturer/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import  prisma  from "@/lib/prisma";

export async function PATCH(
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
    select: { id: true, statut: true, convocationId: true, type: true },
  });

  if (!visite) {
    return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });
  }

  if (visite.statut === "CLOTUREE") {
    return NextResponse.json({ message: "Visite déjà clôturée" }, { status: 400 });
  }

  // visite AES : clôture uniquement depuis le dossier AES (après S12 ou arrêt justifié du suivi)
  if (visite.type === "AES") {
    return NextResponse.json(
      { message: "Visite AES : la clôture se fait depuis le dossier AES, après la visite S12 ou un arrêt justifié du suivi." },
      { status: 409 }
    );
  }
  if (visite.statut === "ANNULEE") {
    return NextResponse.json({ message: "Impossible de clôturer une visite annulée" }, { status: 400 });
  }

  const now = new Date();

  // Transaction : clôture visite + mise à jour convocation si liée
  const updated = await prisma.$transaction(async (tx) => {
    const v = await tx.visite.update({
      where: { id },
      data: {
        statut:     "CLOTUREE",
        dateFin:    now,
        updatedById: session.user.id,
      },
    });

    if (visite.convocationId) {
      await tx.convocation.update({
        where: { id: visite.convocationId },
        data: {
          statut:       "REALISEE",
          dateRealisee: now,
        },
      });
    }

    return v;
  });

  return NextResponse.json(updated);
}