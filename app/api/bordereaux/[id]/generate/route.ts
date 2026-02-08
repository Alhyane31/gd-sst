// app/api/bordereaux/[id]/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

const badRequest = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });

export async function POST(
  _: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ✅ compat Next "params Promise"
  const params = await (ctx.params as any);
  const bordereauId = params?.id;

  if (!bordereauId) return badRequest("id bordereau manquant");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const b = await tx.bordereau.findUnique({
        where: { id: bordereauId },
        include: { _count: { select: { convocations: true } } },
      });

      if (!b) throw new Error("NOT_FOUND");
      if (b.statut !== "NOUVEAU") return badRequest("Bordereau déjà généré");
      if (b._count.convocations === 0) return badRequest("Bordereau vide : aucune convocation");

      // (optionnel) sécurité : s'assurer que toutes les convocations du bordereau sont A_CONVOQUER
      const notAConvoquer = await tx.convocation.count({
        where: { bordereauId, NOT: { statut: "A_CONVOQUER" } },
      });
      if (notAConvoquer > 0) {
        return badRequest("Impossible : certaines convocations du bordereau ne sont pas en A_CONVOQUER");
      }

      // 1) bordereau => GENERE
      await tx.bordereau.update({
        where: { id: bordereauId },
        data: { statut: "GENERE" },
      });

      // 2) convocations => CONVOCATION_GENEREE (+ dateConvocation now)
      const updated = await tx.convocation.updateMany({
        where: { bordereauId },
        data: {
          statut: "CONVOCATION_GENEREE",
          dateConvocation: new Date(),
        },
      });

      return { ok: true, updatedConvocations: updated.count };
    });

    if (result instanceof NextResponse) return result;
    return NextResponse.json(result);
  } catch (e: any) {
    if (String(e?.message) === "NOT_FOUND") {
      return NextResponse.json({ error: "Bordereau introuvable" }, { status: 404 });
    }
    console.error("POST /api/bordereaux/[id]/generate error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
