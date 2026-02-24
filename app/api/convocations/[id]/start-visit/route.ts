// app/api/convocations/[id]/start-visit/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth"; // si tu utilises
import { authOptions } from "@/lib/auth-options";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
 try {
    // ✅ récupérer id depuis l’URL (évite le problème params Promise)
    const pathname = req.nextUrl.pathname; 
    // /api/convocations/{id}/start-visit
    const parts = pathname.split("/").filter(Boolean);
    const id = parts[2]; // ["api","convocations","{id}","start-visit"]

    if (!id) {
      return NextResponse.json({ message: "id manquant dans l'URL" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const dateDebut = body?.dateDebut;

    if (!dateDebut) {
      return NextResponse.json({ message: "dateDebut requis" }, { status: 400 });
    }

    // ⚠️ remplace par l'id user connecté
    // const session = await getServerSession(authOptions);
    // const userId = session?.user?.id;
    const userId = session?.user?.id;

    const convocation = await prisma.convocation.findUnique({
      where: { id },
      include: { personnel: true, visite: true },
    });

    if (!convocation) {
      return NextResponse.json({ message: "Convocation introuvable" }, { status: 404 });
    }

    if (convocation.visite?.id) {
      return NextResponse.json({ message: "Visite déjà créée" }, { status: 409 });
    }

    // ✅ transaction pour éviter demi-création
    const result = await prisma.$transaction(async (tx) => {
      const visite = await tx.visite.create({
        data: {
          type: "ANNUELLE", // adapte si besoin
          statut: "EN_COURS",
          dateDebut: new Date(dateDebut),
          personnelId: convocation.personnelId,
          convocationId: convocation.id,
          createdById: userId,
          updatedById: userId,
        },
      });

      const p = convocation.personnel;

      const formulaire = await tx.formulaire.create({
        data: {
          visiteId: visite.id,
          personnelId: p.id,
          statut: "DRAFT",
          schemaVersion: 1,

          // snapshot init depuis personnel (adapte à tes champs existants)
          snapshotFirstName: p.firstName,
          snapshotLastName: p.lastName,

          formationId: p.formationId,
          serviceId: p.serviceId,
          dateAffectation: p.dateAffectation ?? null,

          createdById: userId,
          filledById: userId,
        },
      });

      return { visiteId: visite.id, formulaireId: formulaire.id };
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? "Erreur serveur" }, { status: 500 });
  }}