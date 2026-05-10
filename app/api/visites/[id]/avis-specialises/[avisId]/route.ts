import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string; avisId: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: visiteId, avisId } = await params;
  const visite = await prisma.visite.findUnique({ where: { id: visiteId } });
  if (!visite || visite.statut === "CLOTUREE")
    return NextResponse.json({ message: "Non modifiable" }, { status: 400 });

  const body = await req.json();
  const avis = await prisma.avisSpecialise.update({
    where: { id: avisId },
    data: {
      nomPrenom:  body.nomPrenom,
      dateAvis:   new Date(body.dateAvis),
      contenu:    body.contenu,
      rapportUrl: body.rapportUrl ?? null,
      updatedAt:  new Date(),
    },
  });
  return NextResponse.json(avis);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: visiteId, avisId } = await params;
  const visite = await prisma.visite.findUnique({ where: { id: visiteId } });
  if (!visite || visite.statut === "CLOTUREE")
    return NextResponse.json({ message: "Non modifiable" }, { status: 400 });

  await prisma.avisSpecialise.delete({ where: { id: avisId } });
  return NextResponse.json({ ok: true });
}
