import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

const badRequest = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });

function normalizeIds(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ✅ compat Next "params Promise"
  const params = await (ctx.params as any);
  const bordereauId = params?.id;

  if (!bordereauId) return badRequest("id bordereau manquant");

  try {
    const body = await req.json().catch(() => ({}));
    const convocationIds = normalizeIds(body.convocationIds);
    if (convocationIds.length === 0) return badRequest("convocationIds obligatoire");

    const result = await prisma.$transaction(async (tx) => {
      const b = await tx.bordereau.findUnique({ where: { id: bordereauId } });
      if (!b) throw new Error("NOT_FOUND");
      if (b.statut !== "NOUVEAU") return { ok: false, error: "Ajout impossible : bordereau déjà généré" };

      // ✅ Attacher seulement des convocations A_CONVOQUER du même service et non attachées
      const updated = await tx.convocation.updateMany({
        where: {
          id: { in: convocationIds },
          statut: "A_CONVOQUER",
          bordereauId: null,
          personnel: { serviceId: b.serviceId },
        },
        data: { bordereauId },
      });

      return { ok: true, count: updated.count };
    });

    if (!result.ok) return badRequest((result as any).error);
    return NextResponse.json({ ok: true, count: (result as any).count });
  } catch (e: any) {
    console.error("POST /api/bordereaux/[id]/convocations error", e);
    if (String(e?.message) === "NOT_FOUND") {
      return NextResponse.json({ error: "Bordereau introuvable" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ✅ compat Next “params Promise”
  const params = await (ctx.params as any);
  const bordereauId = params?.id;

  console.log("🧩 DELETE params.id =", bordereauId, "url=", req.url);

  if (!bordereauId) return badRequest("id bordereau manquant");

  const body = await req.json().catch(() => ({}));
  const convocationIds = normalizeIds(body.convocationIds);
  if (convocationIds.length === 0) return badRequest("convocationIds obligatoire");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const b = await tx.bordereau.findUnique({ where: { id: bordereauId } });
      if (!b) return NextResponse.json({ error: "Bordereau introuvable" }, { status: 404 });
      if (b.statut !== "NOUVEAU") return badRequest("Retrait impossible : bordereau déjà généré");

      await tx.convocation.updateMany({
        where: { id: { in: convocationIds }, bordereauId },
        data: { bordereauId: null },
      });

      return NextResponse.json({ ok: true, count: convocationIds.length });
    });

    return result;
  } catch (e) {
    console.error("DELETE /api/bordereaux/[id]/convocations error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}