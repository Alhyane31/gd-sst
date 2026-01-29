import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Ctx = { params: Promise<{ id?: string }> };

function normalizeId(id?: string | null) {
  if (!id || id === "undefined" || id === "null") return null;
  return id;
}

function normalizeTags(input: unknown): string[] {
  // accepte:
  // - ["Femme enceinte", "CM"]
  // - "Femme enceinte;CM"
  // - "Femme enceinte, CM"
  if (Array.isArray(input)) {
    return input
      .map((x) => String(x).trim())
      .filter(Boolean);
  }

  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return [];
    return s
      .split(/[;,]/) // ; ou ,
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeCategorie(input: unknown): "SMR" | "VP" | null {
  if (input === "SMR" || input === "VP") return input;
  return null;
}

/* =========================
   GET : détail personnel
========================= */
export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: rawId } = await ctx.params;
  const id = normalizeId(rawId) ?? normalizeId(req.nextUrl.searchParams.get("id"));

  if (!id) return NextResponse.json({ error: "ID manquant ou invalide" }, { status: 400 });

  try {
    const personnel = await prisma.personnel.findUnique({
      where: { id },
      include: { poste: true, service: true, formation: true },
      // ✅ categorie et tags sont scalaires => renvoyés automatiquement
    });

    if (!personnel) return NextResponse.json({ error: "Personnel introuvable" }, { status: 404 });

    return NextResponse.json(personnel);
  } catch (error) {
    console.error("GET personnel error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* =========================
   PUT : mise à jour
========================= */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: rawId } = await ctx.params;
  const id = normalizeId(rawId) ?? normalizeId(req.nextUrl.searchParams.get("id"));

  if (!id) return NextResponse.json({ error: "ID manquant ou invalide" }, { status: 400 });

  try {
    const body = await req.json();

    const {
      firstName,
      lastName,
      posteId,
      formationId,
      serviceId,
      isActive,

      // ✅ nouveaux champs
      categorie,
      tags,
    } = body;

    if (!firstName || !lastName || !posteId || !formationId || !serviceId) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    // ✅ validations soft
    const categorieValue = categorie !== undefined ? normalizeCategorie(categorie) : null;
    if (categorie !== undefined && !categorieValue) {
      return NextResponse.json({ error: "categorie invalide (SMR ou VP)" }, { status: 400 });
    }

    const tagsValue = tags !== undefined ? normalizeTags(tags) : null;

    const updated = await prisma.personnel.update({
      where: { id },
      data: {
        firstName,
        lastName,
        posteId,
        formationId,
        serviceId,
        isActive: Boolean(isActive),

        // ✅ on met à jour uniquement si fourni
        ...(categorie !== undefined ? { categorie: categorieValue! } : {}),
        ...(tags !== undefined ? { tags: tagsValue! } : {}),
      },
      include: { poste: true, service: true, formation: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT personnel error:", error);

    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Personnel introuvable" }, { status: 404 });
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
