import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import {
  cheminAbsolu,
  TAILLE_MAX_PIECE_JOINTE,
  TYPES_PIECE_JOINTE,
} from "@/lib/piecesJointes";

// POST /api/visites/[id]/pieces-jointes — multipart : file, champ
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: visiteId } = await params;

  const [visite, user] = await Promise.all([
    prisma.visite.findUnique({ where: { id: visiteId }, select: { id: true, statut: true } }),
    prisma.user.findUnique({ where: { email: session.user?.email ?? "" }, select: { id: true } }),
  ]);
  if (!visite) return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });
  if (!user) return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });
  if (visite.statut === "CLOTUREE") {
    return NextResponse.json({ message: "Visite clôturée : ajout impossible" }, { status: 409 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const champ = String(form?.get("champ") ?? "").slice(0, 200);
  if (!(file instanceof File)) return NextResponse.json({ message: "Aucun fichier reçu" }, { status: 400 });
  if (!champ) return NextResponse.json({ message: "Champ manquant" }, { status: 400 });

  const ext = TYPES_PIECE_JOINTE[file.type];
  if (!ext) return NextResponse.json({ message: "Format non accepté (PDF, JPEG, PNG, WebP)" }, { status: 400 });
  if (file.size > TAILLE_MAX_PIECE_JOINTE) {
    return NextResponse.json({ message: "Fichier trop lourd (20 Mo maximum)" }, { status: 400 });
  }

  const chemin = path.join(visiteId, `${randomUUID()}.${ext}`);
  const abs = cheminAbsolu(chemin);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, Buffer.from(await file.arrayBuffer()));

  const piece = await prisma.pieceJointe.create({
    data: {
      visiteId,
      champ,
      nomOriginal: file.name.slice(0, 255) || `piece.${ext}`,
      chemin,
      mimeType: file.type,
      taille: file.size,
      uploadedById: user.id,
    },
  });

  return NextResponse.json({ id: piece.id, nom: piece.nomOriginal }, { status: 201 });
}

// GET /api/visites/[id]/pieces-jointes — liste des pièces de la visite
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: visiteId } = await params;
  const pieces = await prisma.pieceJointe.findMany({
    where: { visiteId },
    select: { id: true, champ: true, nomOriginal: true, mimeType: true, taille: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ items: pieces });
}
