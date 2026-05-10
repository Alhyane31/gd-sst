import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formations = await prisma.formation.findMany({
    orderBy: { libelle: "asc" },
    include: { _count: { select: { services: true, personnels: true } } },
  });
  return NextResponse.json(formations);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, libelle } = await req.json();
  if (!code || !libelle) return NextResponse.json({ error: "Code et libellé obligatoires" }, { status: 400 });

  try {
    const formation = await prisma.formation.create({ data: { code, libelle } });
    return NextResponse.json(formation, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Code déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
