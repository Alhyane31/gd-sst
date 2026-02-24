import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// /api/visites/{id}/formulaire
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const parts = req.nextUrl.pathname.split("/").filter(Boolean);
    const visiteId = parts[2]; // ["api","visites","{id}","formulaire"]

    if (!visiteId) return NextResponse.json({ message: "visiteId manquant" }, { status: 400 });

    const v = await prisma.visite.findUnique({
      where: { id: visiteId },
      include: {
        personnel: {
          include: { poste: true, service: true, formation: true },
        },
        formulaire: {
          include: {
            formation: true,
            service: true,
            pathologies: {
              include: { cim11: true },
              orderBy: { date: "desc" },
            },
          },
        },
      },
    });

    if (!v) return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });
    if (!v.formulaire) return NextResponse.json({ message: "Aucun formulaire pour cette visite" }, { status: 404 });

    return NextResponse.json({
      visite: {
        id: v.id,
        statut: v.statut,
        type: v.type,
        dateDebut: v.dateDebut,
        dateFin: v.dateFin,
      },
      personnel: v.personnel,
      formulaire: v.formulaire,
    });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}