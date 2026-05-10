import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { code, libelle, categorieForm, isActive } = await req.json();

  if (!code || !libelle) return NextResponse.json({ error: "Code et libellé obligatoires" }, { status: 400 });

  try {
    const poste = await prisma.poste.update({
      where: { id },
      data: { code, libelle, categorieForm: categorieForm || null, isActive: isActive ?? true },
    });
    return NextResponse.json(poste);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Code déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  try {
    await prisma.poste.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Poste utilisé, impossible de supprimer" }, { status: 409 });
  }
}
