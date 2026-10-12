import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { readFile, unlink } from "fs/promises";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { cheminAbsolu } from "@/lib/piecesJointes";

// GET /api/pieces-jointes/[id] — affiche / télécharge la pièce (session requise)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const piece = await prisma.pieceJointe.findUnique({ where: { id } });
  if (!piece) return NextResponse.json({ message: "Pièce jointe introuvable" }, { status: 404 });

  let buffer: Buffer;
  try {
    buffer = await readFile(cheminAbsolu(piece.chemin));
  } catch {
    return NextResponse.json({ message: "Fichier introuvable sur le serveur" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": piece.mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(piece.nomOriginal)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

// DELETE /api/pieces-jointes/[id] — retire une pièce d'une visite non clôturée
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const piece = await prisma.pieceJointe.findUnique({
    where: { id },
    include: { visite: { select: { statut: true } } },
  });
  if (!piece) return NextResponse.json({ ok: true });
  if (piece.visite.statut === "CLOTUREE") {
    return NextResponse.json({ message: "Visite clôturée : suppression impossible" }, { status: 409 });
  }

  await prisma.pieceJointe.delete({ where: { id } });
  await unlink(cheminAbsolu(piece.chemin)).catch(() => {});
  return NextResponse.json({ ok: true });
}
