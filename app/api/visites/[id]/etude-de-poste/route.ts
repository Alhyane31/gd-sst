import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: visiteId } = await params;
  const visite = await prisma.visite.findUnique({
    where: { id: visiteId },
    include: { etudeDePoste: true, personnel: true },
  });
  if (!visite) return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });

  return NextResponse.json({
    visiteStatut: visite.statut,
    personnelId: visite.personnelId,
    etudeDePoste: visite.etudeDePoste ?? null,
  });
}

export async function POST(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: visiteId } = await params;
  const visite = await prisma.visite.findUnique({ where: { id: visiteId } });
  if (!visite) return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });
  if (visite.statut === "CLOTUREE") return NextResponse.json({ message: "Visite clôturée" }, { status: 400 });

  const existing = await prisma.etudeDePoste.findUnique({ where: { visiteId } });
  if (existing) return NextResponse.json(existing);

  const etude = await prisma.etudeDePoste.create({
    data: { visiteId, personnelId: visite.personnelId },
  });
  return NextResponse.json(etude, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: visiteId } = await params;
  const visite = await prisma.visite.findUnique({ where: { id: visiteId } });
  if (!visite) return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });
  if (visite.statut === "CLOTUREE") return NextResponse.json({ message: "Visite clôturée" }, { status: 400 });

  const body = await req.json();

  const data = {
    etudeEnvisagee:           body.etudeEnvisagee   ?? null,
    dateEnvoiDemande:         body.dateEnvoiDemande  ? new Date(body.dateEnvoiDemande) : null,
    dureeCycleMinutes:        body.dureeCycleMinutes != null ? Number(body.dureeCycleMinutes) : null,
    descriptionCycle:         body.descriptionCycle  ?? null,
    nombrePatientsActes:      body.nombrePatientsActes != null ? Number(body.nombrePatientsActes) : null,
    niveauBruitDb:            body.niveauBruitDb     != null ? Number(body.niveauBruitDb) : null,
    humiditeRelative:         body.humiditeRelative  != null ? Number(body.humiditeRelative) : null,
    ventilation:              body.ventilation       ?? null,
    commentaireEnvironnement: body.commentaireEnvironnement ?? null,
    eclairageType:            body.eclairageType     ?? null,
    eclairageSuffisance:      body.eclairageSuffisance ?? null,
    eclairementLux:           body.eclairementLux    != null ? Number(body.eclairementLux) : null,
    chargePhysiqueUrl:        body.chargePhysiqueUrl ?? null,
    chargeMentaleUrl:         body.chargeMentaleUrl  ?? null,
    commentaireFinal:         body.commentaireFinal  ?? null,
    updatedAt:                new Date(),
  };

  const etude = await prisma.etudeDePoste.upsert({
    where:  { visiteId },
    create: { visiteId, personnelId: visite.personnelId, ...data },
    update: data,
  });

  return NextResponse.json(etude);
}
