import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { mkdir, readdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

// Photos du personnel : <PHOTOS_DIR>/<PPR>.<ext> (hors de public/, servies uniquement aux utilisateurs connectés)
const PHOTOS_DIR = process.env.PHOTOS_DIR ?? path.join(process.cwd(), "photos");

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

// PPR nettoyé, ou null s'il contient autre chose que lettres/chiffres/-/_ (empêche ../ etc.)
function normalizePpr(ppr?: string) {
  const name = (ppr ?? "").trim().toLowerCase();
  return /^[a-z0-9_-]+$/.test(name) ? name : null;
}

// Fichiers photo existants pour ce PPR (extension et casse indifférentes)
async function findPhotos(name: string) {
  let files: string[];
  try {
    files = await readdir(PHOTOS_DIR);
  } catch {
    return [];
  }
  return files.filter((f) => {
    const ext = path.extname(f);
    return (
      path.basename(f, ext).toLowerCase() === name &&
      MIME_TYPES[ext.slice(1).toLowerCase()] !== undefined
    );
  });
}

// POST /api/photos/[ppr] — multipart, champ "file" : ajoute ou remplace la photo
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ppr: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { ppr } = await params;
  const name = normalizePpr(ppr);
  if (!name) return NextResponse.json({ message: "PPR invalide" }, { status: 400 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Aucun fichier reçu" }, { status: 400 });
  }

  const ext = path.extname(file.name).slice(1).toLowerCase();
  if (!MIME_TYPES[ext] || !file.type.startsWith("image/")) {
    return NextResponse.json(
      { message: "Format non accepté (jpg, jpeg, png, webp, gif, bmp)" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ message: "Photo trop lourde (5 Mo maximum)" }, { status: 400 });
  }

  await mkdir(PHOTOS_DIR, { recursive: true });

  // Supprime l'ancienne photo (éventuellement dans une autre extension)
  for (const old of await findPhotos(name)) {
    await unlink(path.join(PHOTOS_DIR, old)).catch(() => {});
  }

  await writeFile(path.join(PHOTOS_DIR, `${name}.${ext}`), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ ok: true });
}

// GET /api/photos/[ppr]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ppr: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { ppr } = await params;
  const name = normalizePpr(ppr);
  if (!name) {
    return NextResponse.json({ message: "PPR invalide" }, { status: 400 });
  }

  const [file] = await findPhotos(name);

  if (!file) {
    return NextResponse.json({ message: "Photo introuvable" }, { status: 404 });
  }

  const buffer = await readFile(path.join(PHOTOS_DIR, file));
  const ext = path.extname(file).slice(1).toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": MIME_TYPES[ext],
      "Cache-Control": "private, max-age=300",
    },
  });
}
