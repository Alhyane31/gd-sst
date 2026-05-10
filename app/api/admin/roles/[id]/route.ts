import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json();
  const { name, description, menuAccess, canValidateForms } = body;

  if (!name) return NextResponse.json({ error: "Nom obligatoire" }, { status: 400 });

  try {
    const role = await prisma.appRole.update({
      where: { id },
      data: { name, description: description || null, menuAccess: menuAccess ?? [], canValidateForms: canValidateForms ?? false },
    });
    return NextResponse.json(role);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Nom de rôle déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  try {
    await prisma.appRole.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Rôle utilisé par des utilisateurs, impossible de supprimer" }, { status: 409 });
  }
}
