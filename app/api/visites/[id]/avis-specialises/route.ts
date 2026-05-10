import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: visiteId } = await params;
  const avis = await prisma.avisSpecialise.findMany({
    where: { visiteId },
    orderBy: { dateAvis: "desc" },
  });
  return NextResponse.json(avis);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: visiteId } = await params;
  const visite = await prisma.visite.findUnique({ where: { id: visiteId } });
  if (!visite) return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });
  if (visite.statut === "CLOTUREE") return NextResponse.json({ message: "Visite clôturée" }, { status: 400 });

  const body = await req.json();
  if (!body.nomPrenom || !body.dateAvis || !body.contenu)
    return NextResponse.json({ message: "Champs requis manquants" }, { status: 400 });

  const avis = await prisma.avisSpecialise.create({
    data: {
      visiteId,
      nomPrenom:  body.nomPrenom,
      dateAvis:   new Date(body.dateAvis),
      contenu:    body.contenu,
      rapportUrl: body.rapportUrl ?? null,
    },
  });
  return NextResponse.json(avis, { status: 201 });
}
