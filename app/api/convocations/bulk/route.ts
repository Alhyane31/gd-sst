// app/api/convocations/bulk/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const badRequest = (msg: string, details?: any) =>
  NextResponse.json({ error: msg, details }, { status: 400 });

type RowInput = { personnelId: string; datePrevue: string };

function toDate(v: unknown) {
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

// YYYY-MM-DD (UTC) pour comparer proprement
function ymdUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isWeekend(d: Date) {
  const day = d.getDay(); // 0=dimanche,6=samedi
  return day === 0 || day === 6;
}

// Récupère tous les jours fériés dans un range min..max (1 seule requête)
async function getJourFerieMap(dates: Date[]) {
  if (dates.length === 0) return new Map<string, { label: string | null; date: Date }>();

  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.getTime())));

  const start = new Date(min);
  start.setHours(0, 0, 0, 0);

  const end = new Date(max);
  end.setHours(23, 59, 59, 999);

  const feries = await prisma.jourFerie.findMany({
    where: { date: { gte: start, lte: end } },
    select: { date: true, label: true },
  });

  const map = new Map<string, { label: string | null; date: Date }>();
  feries.forEach((jf) => map.set(ymdUTC(jf.date), jf));
  return map;
}

export async function POST(req: Request) {
  // ✅ Auth (comme tes autres routes)
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        .filter((r) => r.personnelId && r.datePrevue) as Array<{ personnelId: string; datePrevue: Date }>;

      if (clean.length === 0) return badRequest("rows invalides");

      // ✅ Vérifier existence personnels
      const personnelIds = Array.from(new Set(clean.map((r) => r.personnelId)));
      const found = await prisma.personnel.count({ where: { id: { in: personnelIds } } });
      if (found !== personnelIds.length) return badRequest("Un ou plusieurs personnels sont introuvables");

      // ✅ Vérifier week-end
      const weekendErrors = clean
        .filter((r) => isWeekend(r.datePrevue))
        .map((r) => ({ personnelId: r.personnelId, datePrevue: ymdUTC(r.datePrevue) }));

      if (weekendErrors.length > 0) {
        return badRequest("Une ou plusieurs dates prévues tombent sur un week-end", weekendErrors);
      }

      // ✅ Vérifier jours fériés (1 seule requête)
      const ferieMap = await getJourFerieMap(clean.map((r) => r.datePrevue));
      const ferieErrors = clean
        .map((r) => {
          const jf = ferieMap.get(ymdUTC(r.datePrevue));
          return jf
            ? { personnelId: r.personnelId, datePrevue: ymdUTC(r.datePrevue), label: jf.label ?? "Jour férié" }
            : null;
        })
        .filter(Boolean);

      if (ferieErrors.length > 0) {
        return badRequest("Une ou plusieurs dates prévues tombent sur un jour férié", ferieErrors);
      }

      await prisma.convocation.createMany({
        data: clean.map((r) => ({
          personnelId: r.personnelId,
          statut,
          convocationType,
          datePrevue: r.datePrevue, // Date
          dateConvocation: dateConvocation ?? new Date(),
          commentaire,
        })),
      });

      return NextResponse.json({ ok: true, count: clean.length });
    }

    // 🔁 ANCIEN MODE: personnelIds + datePrevue
    const personnelIds: string[] = body.personnelIds ?? [];
    if (!Array.isArray(personnelIds) || personnelIds.length === 0) return badRequest("personnelIds obligatoire");

    const datePrevue = body.datePrevue ? toDate(body.datePrevue) : null;
    if (!datePrevue) return badRequest("datePrevue obligatoire / invalide");

    // ✅ Check week-end (ancien mode)
    if (isWeekend(datePrevue)) return badRequest("Date Prévue tombe sur un week-end");

    // ✅ Check jour férié (ancien mode)
    const ferieMap = await getJourFerieMap([datePrevue]);
    const jf = ferieMap.get(ymdUTC(datePrevue));
    if (jf) return badRequest(`Date Prévue tombe sur un jour férié : ${jf.label ?? "jour férié"}`);

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
