// app/api/personnel/[id]/start-visit/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // ✅ récupérer id depuis URL
    const pathname = req.nextUrl.pathname;
    // /api/personnel/{id}/start-visit
    const parts = pathname.split("/").filter(Boolean);
    const id = parts[2];

    if (!id) {
      return NextResponse.json({ message: "id manquant" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const dateDebut = body?.dateDebut;
    const type = body?.type;
    const autreType = body?.autreType;

    if (!dateDebut) {
      return NextResponse.json({ message: "Date début requise" }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ message: "Type requis" }, { status: 400 });
    }

    const userId = session.user?.id;

    // ✅ récupérer personnel
    const personnel = await prisma.personnel.findUnique({
      where: { id },
    });

    if (!personnel) {
      return NextResponse.json({ message: "Personnel introuvable" }, { status: 404 });
    }

    // 🔥 (optionnel mais conseillé)
    // éviter plusieurs visites EN_COURS
    const existingVisite = await prisma.visite.findFirst({
      where: {
        personnelId: id,
        statut: "EN_COURS",
      },
    });

    if (existingVisite) {
      return NextResponse.json(
        { message: "Une visite est déjà en cours pour ce personnel" },
        { status: 409 }
      );
    }

    // ✅ transaction
    const result = await prisma.$transaction(async (tx) => {
      const visite = await tx.visite.create({
        data: {
          statut: "EN_COURS",
          dateDebut: new Date(dateDebut),
          type: type,
          typeAutre: type === "AUTRE" ? autreType : null,

          personnelId: personnel.id,

          // ❌ pas de convocationId ici
          convocationId: null,

          createdById: userId,
          updatedById: userId,
        },
      });

      const formulaire = await tx.formulaire.create({
        data: {
          visiteId: visite.id,
          personnelId: personnel.id,

          statut: "DRAFT",
          schemaVersion: 1,

          // ✅ snapshot
          snapshotFirstName: personnel.firstName,
          snapshotLastName: personnel.lastName,

          formationId: personnel.formationId,
          serviceId: personnel.serviceId,
          dateAffectation: personnel.dateAffectation ?? null,

          createdById: userId,
          filledById: userId,
        },
      });

      return {
        visiteId: visite.id,
        formulaireId: formulaire.id,
      };
    });

    return NextResponse.json(result);

  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}