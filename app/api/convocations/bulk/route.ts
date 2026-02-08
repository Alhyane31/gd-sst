// app/api/convocations/bulk/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const badRequest = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });

type RowInput = { personnelId: string; datePrevue: string };

function toDate(v: unknown) {
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const statut = body.statut ?? "A_CONVOQUER";
    const convocationType = body.convocationType ?? "INITIALE";
    const dateConvocation = body.dateConvocation ? toDate(body.dateConvocation) : new Date();
    const commentaire = body.commentaire ?? null;

    // ✅ NOUVEAU MODE: rows = [{personnelId, datePrevue}]
    const rows: RowInput[] = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length > 0) {
      const clean = rows
        .map((r) => ({
          personnelId: String(r.personnelId ?? "").trim(),
          datePrevue: toDate(r.datePrevue),
        }))
        .filter((r) => r.personnelId && r.datePrevue);

      if (clean.length === 0) return badRequest("rows invalides");

      const personnelIds = Array.from(new Set(clean.map((r) => r.personnelId)));
      const found = await prisma.personnel.count({ where: { id: { in: personnelIds } } });
      if (found !== personnelIds.length) return badRequest("Un ou plusieurs personnels sont introuvables");

      await prisma.convocation.createMany({
        data: clean.map((r) => ({
          personnelId: r.personnelId,
          statut,
          convocationType,
          datePrevue: r.datePrevue!, // Date
          dateConvocation: dateConvocation ?? new Date(),
          commentaire,
        })),
      });

      return NextResponse.json({ ok: true, count: clean.length });
    }

    // 🔁 ANCIEN MODE (optionnel): personnelIds + datePrevue
    const personnelIds: string[] = body.personnelIds ?? [];
    if (!Array.isArray(personnelIds) || personnelIds.length === 0) return badRequest("personnelIds obligatoire");

    const datePrevue = body.datePrevue ? toDate(body.datePrevue) : null;
    if (!datePrevue) return badRequest("datePrevue obligatoire / invalide");

    const found = await prisma.personnel.count({ where: { id: { in: personnelIds } } });
    if (found !== personnelIds.length) return badRequest("Un ou plusieurs personnels sont introuvables");

    await prisma.convocation.createMany({
      data: personnelIds.map((pid) => ({
        personnelId: pid,
        statut,
        convocationType,
        datePrevue,
        dateConvocation: dateConvocation ?? new Date(),
        commentaire,
      })),
    });

    return NextResponse.json({ ok: true, count: personnelIds.length });
  } catch (e) {
    console.error("bulk convocations error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
