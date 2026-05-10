import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await prisma.service.findMany({
    orderBy: { libelle: "asc" },
    include: { formation: { select: { id: true, code: true, libelle: true } } },
  });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, libelle, formationId, chefDeService } = await req.json();
  if (!code || !libelle || !formationId) return NextResponse.json({ error: "Code, libellé et formation obligatoires" }, { status: 400 });

  try {
    const service = await prisma.service.create({
      data: { code, libelle, formationId, chefDeService: chefDeService || null },
    });
    return NextResponse.json(service, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Code déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
