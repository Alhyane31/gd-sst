// app/api/bordereaux/route.ts
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

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function pad4(n: number) {
  return String(n).padStart(4, "0");
}

/**
 * Serial format: BDR-YYYY-MM-DD-SRVxxxxx-0001
 * - si tu as un code de service => remplace serviceKey par service.code
 */
async function generateBordereauSerial(serviceId: string, dateEdition: Date) {
  const y = dateEdition.getFullYear();
  const m = pad2(dateEdition.getMonth() + 1);
  const d = pad2(dateEdition.getDate());

  const from = startOfDay(dateEdition);
  const to = endOfDay(dateEdition);

  const countToday = await prisma.bordereau.count({
    where: {
      serviceId,
      dateEdition: { gte: from, lte: to },
    },
  });

  const seq = countToday + 1;
  const serviceKey = serviceId.slice(0, 6).toUpperCase();

  return `BDR-${y}-${m}-${d}-SRV${serviceKey}-${pad4(seq)}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  // pagination
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));

  // filtres
  const serviceId = (searchParams.get("serviceId") ?? "").trim();
  const statut = (searchParams.get("statut") ?? "").trim(); // "NOUVEAU" | "GENERE"
  const q = (searchParams.get("q") ?? "").trim(); // serial contient

  const dateFrom = (searchParams.get("dateFrom") ?? "").trim(); // YYYY-MM-DD (ou ISO)
  const dateTo = (searchParams.get("dateTo") ?? "").trim();

  const where: any = { AND: [] };

  if (serviceId) where.AND.push({ serviceId });

  if (statut) where.AND.push({ statut });

  if (q) {
    where.AND.push({
      serialNumber: { contains: q, mode: "insensitive" },
    });
  }

  // dateEdition range
  const dFrom = toDateOrNull(dateFrom);
  const dTo = toDateOrNull(dateTo);

  if (dFrom || dTo) {
    const range: any = {};
    if (dFrom) range.gte = startOfDay(dFrom);
    if (dTo) range.lte = endOfDay(dTo);
    where.AND.push({ dateEdition: range });
  }

  if (where.AND.length === 0) delete where.AND;

  const [total, items] = await Promise.all([
    prisma.bordereau.count({ where }),
    prisma.bordereau.findMany({
      where,
      orderBy: [{ dateEdition: "desc" }, { createdAt: "desc" }],
      skip: page * pageSize,
      take: pageSize,
      include: {
        service: true,
        _count: { select: { convocations: true } },
      },
    }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const serviceId = String(body.serviceId ?? "").trim();
    if (!serviceId) return badRequest("serviceId obligatoire");

    const dateEdition = body.dateEdition ? toDateOrNull(body.dateEdition) : new Date();
    if (!dateEdition) return badRequest("dateEdition invalide");

    // vérifier que service existe
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: "Service introuvable" }, { status: 404 });

    const created = await prisma.$transaction(async (tx) => {
      // serial unique
      let serialNumber = await generateBordereauSerial(serviceId, dateEdition);

      // (très rare) si collision => retry
      for (let i = 0; i < 3; i++) {
        const exists = await tx.bordereau.findUnique({ where: { serialNumber } });
        if (!exists) break;
        serialNumber = await generateBordereauSerial(serviceId, new Date(dateEdition.getTime() + (i + 1)));
      }

      // 1) créer bordereau
      const b = await tx.bordereau.create({
        data: {
          serviceId,
          dateEdition,
          serialNumber,
          statut: "NOUVEAU",
        },
      });

      // 2) auto attach : toutes les convocations A_CONVOQUER du même service, non attachées
      // relation via convocation.personnel.serviceId
      await tx.convocation.updateMany({
        where: {
          bordereauId: null,
          statut: "A_CONVOQUER",
          personnel: { serviceId },
        },
        data: { bordereauId: b.id },
      });

      // 3) renvoyer bordereau + compte convocations attachées
      const b2 = await tx.bordereau.findUnique({
        where: { id: b.id },
        include: {
          service: true,
          _count: { select: { convocations: true } },
        },
      });

      return b2!;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/bordereaux error", e);

    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Conflit (serialNumber déjà utilisé)" }, { status: 409 });
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
