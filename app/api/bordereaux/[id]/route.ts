import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

const badRequest = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });

function toDateOrNull(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * ✅ IMPORTANT (Next App Router):
 * la signature correcte = (req, { params })
 * et params est DISPONIBLE via le 2e argument.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ✅ Compat: Next peut te donner params sync ou Promise selon version
  const { id } = await Promise.resolve(ctx.params);

  if (!id) return badRequest("id manquant");

  try {
    const b = await prisma.bordereau.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            formation: true, // ✅ pour ton header Formation
          },
        },
        _count: { select: { convocations: true } },
        convocations: {
          orderBy: [{ datePrevue: "asc" }, { createdAt: "asc" }],
          include: {
            personnel: {
              include: {
                poste: true,
                service: true,
                formation: true,
              },
            },
          },
        },
      },
    });

    if (!b) return NextResponse.json({ error: "Bordereau introuvable" }, { status: 404 });

    // ✅ Format simple pour ton UI
    return NextResponse.json(b);
  } catch (e) {
    console.error("GET /api/bordereaux/[id] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await Promise.resolve(ctx.params);
  if (!id) return badRequest("id manquant");

  try {
    const body = await req.json();

    const existing = await prisma.bordereau.findUnique({
      where: { id },
      select: { id: true, statut: true },
    });
    if (!existing) return NextResponse.json({ error: "Bordereau introuvable" }, { status: 404 });

    if (existing.statut !== "NOUVEAU") {
      return badRequest("Modification interdite: bordereau non NOUVEAU");
    }

    const dateEdition = toDateOrNull(body.dateEdition);

    const updated = await prisma.bordereau.update({
      where: { id },
      data: {
        ...(dateEdition !== null ? { dateEdition } : {}),
      },
      include: {
        service: { include: { formation: true } },
        _count: { select: { convocations: true } },
        convocations: {
          orderBy: [{ datePrevue: "asc" }, { createdAt: "asc" }],
          include: {
            personnel: { include: { poste: true, service: true, formation: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("PUT /api/bordereaux/[id] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE optionnel :
 * - seulement si NOUVEAU
 * - détache les convocations (bordereauId=null)
 * - supprime le bordereau
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await Promise.resolve(ctx.params);
  if (!id) return badRequest("id manquant");

  try {
    const existing = await prisma.bordereau.findUnique({
      where: { id },
      select: { id: true, statut: true },
    });
    if (!existing) return NextResponse.json({ error: "Bordereau introuvable" }, { status: 404 });

    if (existing.statut !== "NOUVEAU") return badRequest("Suppression interdite: bordereau non NOUVEAU");

    await prisma.$transaction([
      prisma.convocation.updateMany({
        where: { bordereauId: id },
        data: { bordereauId: null },
      }),
      prisma.bordereau.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/bordereaux/[id] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
