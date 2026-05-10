import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const badRequest = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });

function toYMD(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function POST(req: Request) {
  try {
    const { date, label } = await req.json();
    if (!date) return badRequest("date obligatoire");
    const d = new Date(date);
    if (isNaN(d.getTime())) return badRequest("date invalide");
    const jf = await prisma.jourFerie.create({
      data: { date: d, label: label?.trim() || null },
    });
    return NextResponse.json({ id: jf.id, date: toYMD(jf.date), label: jf.label }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Ce jour est déjà enregistré" }, { status: 409 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let where: any = {};

    // ✅ si from/to fournis -> filtrer (recommandé)
    if (from || to) {
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;

      if (fromDate && Number.isNaN(fromDate.getTime())) return badRequest("from invalide");
      if (toDate && Number.isNaN(toDate.getTime())) return badRequest("to invalide");

      where.date = {};
      if (fromDate) where.date.gte = fromDate;
      if (toDate) where.date.lte = toDate;
    }

    const rows = await prisma.jourFerie.findMany({
      where,
      orderBy: { date: "asc" },
      select: { id: true, date: true, label: true },
    });

    const items = rows.map((h) => ({
      id:    h.id,
      date:  toYMD(h.date),
      label: h.label ?? null,
    }));

    return NextResponse.json(items); // <-- simple : array direct
    // si tu préfères : return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/jours-feries error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
