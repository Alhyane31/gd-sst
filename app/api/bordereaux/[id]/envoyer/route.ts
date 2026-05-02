import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await Promise.resolve(ctx.params);
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const dateRaw = body?.dateAccuseReception;
  if (!dateRaw) return NextResponse.json({ error: "dateAccuseReception requise" }, { status: 400 });

  const dateAccuseReception = new Date(dateRaw);
  if (isNaN(dateAccuseReception.getTime()))
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });

  const bordereau = await prisma.bordereau.findUnique({
    where: { id },
    select: { id: true, statut: true },
  });

  if (!bordereau) return NextResponse.json({ error: "Bordereau introuvable" }, { status: 404 });
  if (bordereau.statut !== "GENERE")
    return NextResponse.json({ error: "Le bordereau doit être à l'état GENERE" }, { status: 409 });

  await prisma.$transaction([
    prisma.bordereau.update({
      where: { id },
      data: { statut: "ENVOYE", dateAccuseReception },
    }),
    prisma.convocation.updateMany({
      where: { bordereauId: id },
      data: { statut: "ENVOYEE" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
