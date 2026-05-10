import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 
  const { searchParams } = new URL(req.url);
  const isActive = searchParams.get("isActive");

  const postes = await prisma.poste.findMany({
    where: {
      ...(isActive === "true" ? { isActive: true } : {}),
    },
    include: {
      details: {
        where: { isActive: true },
        orderBy: { libelle: "asc" },
      },
    },
    orderBy: { libelle: "asc" },
  });

  return NextResponse.json(postes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, libelle, categorieForm, isActive } = await req.json();
  if (!code || !libelle) return NextResponse.json({ error: "Code et libellé obligatoires" }, { status: 400 });

  try {
    const poste = await prisma.poste.create({
      data: { code, libelle, categorieForm: categorieForm || null, isActive: isActive ?? true },
    });
    return NextResponse.json(poste, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Code déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
