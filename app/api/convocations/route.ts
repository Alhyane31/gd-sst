import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

import { NextRequest } from "next/server";
function asDateRangeYMD(from?: string | null, to?: string | null) {
  const range: { gte?: Date; lte?: Date } = {};

  // attend YYYY-MM-DD
  if (from) {
    const d = new Date(`${from}T00:00:00.000Z`);
    if (!Number.isNaN(d.getTime())) range.gte = d;
  }
  if (to) {
    const d = new Date(`${to}T23:59:59.999Z`);
    if (!Number.isNaN(d.getTime())) range.lte = d;
  }

  return Object.keys(range).length ? range : undefined;
}

function asIsoRange(from?: string | null, to?: string | null) {
  const range: { gte?: Date; lte?: Date } = {};

  // attend ISO: 2026-02-01T00:00:00.000Z
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) range.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) range.lte = d;
  }

  return Object.keys(range).length ? range : undefined;
}


async function getJourFerie(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return await prisma.jourFerie.findFirst({
    where: {
      date: { gte: start, lte: end },
    },
    select: {
      label: true,
      date: true,
    },
  });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);

  // ===== pagination
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));

  // ===== filtres personnel
  const nom = (searchParams.get("nom") ?? "").trim();
  const prenom = (searchParams.get("prenom") ?? "").trim();
  const posteId = (searchParams.get("posteId") ?? "").trim();
  const formationId = (searchParams.get("formationId") ?? "").trim();
  const categorie = (searchParams.get("categorie") ?? "").trim(); // "SMR" | "VP"
  const serviceIdsRaw = (searchParams.get("serviceIds") ?? "").trim();
  const serviceIdList = serviceIdsRaw ? serviceIdsRaw.split(",").filter(Boolean) : [];

  // ===== filtres convocation
  const visiteType = (searchParams.get("visiteType") ?? "").trim(); // "ANNUELLE" | "RAPPROCHEE"
  const statutsRaw = (searchParams.get("statuts") ?? "").trim();
  const statutList = statutsRaw ? statutsRaw.split(",").filter(Boolean) : [];
  const convocationType = (searchParams.get("convocationType") ?? "").trim(); // INITIALE, RELANCE_1...
const bordereauIdRaw = (searchParams.get("bordereauId") ?? "").trim();

  // ===== range calendrier (ISO)
  const fromIso = (searchParams.get("from") ?? "").trim();
  const toIso = (searchParams.get("to") ?? "").trim();
  const datePrevueRangeIso = asIsoRange(fromIso || null, toIso || null);

  const dateConvocFrom = (searchParams.get("dateConvocFrom") ?? "").trim();
  const dateConvocTo = (searchParams.get("dateConvocTo") ?? "").trim();
  const dateConvocationRangeYMD = asDateRangeYMD(dateConvocFrom || null, dateConvocTo || null);

  const datePrevueFrom = (searchParams.get("datePrevueFrom") ?? "").trim();
  const datePrevueTo = (searchParams.get("datePrevueTo") ?? "").trim();
  const datePrevueRangeYMD = asDateRangeYMD(datePrevueFrom || null, datePrevueTo || null);

  const dateVisiteRealiseeFrom = (searchParams.get("dateVisiteRealiseeFrom") ?? "").trim();
  const dateVisiteRealiseeTO = (searchParams.get("dateVisiteRealiseeTO") ?? "").trim();
  const dateVisiteRealiseeRange = asDateRangeYMD(dateVisiteRealiseeFrom || null, dateVisiteRealiseeTO || null);

  // ===== construction WHERE
  const where: any = { AND: [] };

  // ✅ filtre calendrier sur datePrevue (ISO)
  if (datePrevueRangeIso) where.AND.push({ datePrevue: datePrevueRangeIso });

  // Support special : "__null" => bordereauId IS NULL
  if (bordereauIdRaw === "__null") {
    where.AND.push({ bordereauId: null });
  } else if (bordereauIdRaw) {
    where.AND.push({ bordereauId: bordereauIdRaw });
  }
  // --- filtres convocation
  if (visiteType) where.AND.push({ type: visiteType });
  if (statutList.length) where.AND.push({ statut: { in: statutList } });
  if (convocationType) where.AND.push({ convocationType });

  if (dateConvocationRangeYMD) where.AND.push({ dateConvocation: dateConvocationRangeYMD });
  if (datePrevueRangeYMD) where.AND.push({ datePrevue: datePrevueRangeYMD });
  if (dateVisiteRealiseeRange) where.AND.push({ visite: { dateDebut: dateVisiteRealiseeRange } });

  // --- filtres sur PERSONNEL (relation)
  const personnelAND: any[] = [];

  if (prenom) personnelAND.push({ firstName: { contains: prenom, mode: "insensitive" } });
  if (nom) personnelAND.push({ lastName: { contains: nom, mode: "insensitive" } });
  if (posteId) personnelAND.push({ posteId });
  if (formationId) personnelAND.push({ formationId });
  if (serviceIdList.length) personnelAND.push({ serviceId: { in: serviceIdList } });

  if (categorie === "SMR" || categorie === "VP") personnelAND.push({ categorie });

  if (personnelAND.length) where.AND.push({ personnel: { AND: personnelAND } });

  if (where.AND.length === 0) delete where.AND;

  const orderDir = searchParams.get("orderDir") === "asc" ? "asc" : "desc";
  const orderByField = (searchParams.get("orderBy") ?? "datePrevue").trim();

  const orderByMap: Record<string, object> = {
    personnel:          { personnel: { lastName: orderDir } },
    poste:              { personnel: { poste: { libelle: orderDir } } },
    service:            { personnel: { service: { libelle: orderDir } } },
    formation:          { personnel: { formation: { libelle: orderDir } } },
    categorie:          { personnel: { categorie: orderDir } },
    statut:             { statut: orderDir },
    convocationType:    { convocationType: orderDir },
    dateConvocation:    { dateConvocation: orderDir },
    datePrevue:         { datePrevue: orderDir },
    dateVisiteRealisee: { visite: { dateDebut: orderDir } },
  };

  const primaryOrder = orderByMap[orderByField] ?? { datePrevue: orderDir };

  const [total, items] = await Promise.all([
    prisma.convocation.count({ where }),
prisma.convocation.findMany({
  where,
  orderBy: [primaryOrder, { createdAt: orderDir }],
  skip: page * pageSize,
  take: pageSize,
  include: {
    personnel: {
      include: {
        poste: true,
        service: true,
        formation: true,
      },
    },
    visite: { select: { dateDebut: true } },
  },
})

  ]);

  return NextResponse.json({ items, total, page, pageSize });
}


function toDateOrNull(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const personnelId = String(body.personnelId ?? "").trim();
    const type = body.type; // "ANNUELLE" | "RAPPROCHEE"
    const statut = body.statut ?? "A_CONVOQUER";
    const convocationType = body.convocationType ?? "INITIALE";

    const datePrevue = toDateOrNull(body.datePrevue);
    const dateConvocation = toDateOrNull(body.dateConvocation);
    const commentaire = body.commentaire ? String(body.commentaire).trim() : null;

    if (!personnelId) return badRequest("personnelId obligatoire");
    //if (!type) return badRequest("type obligatoire");
    if (!datePrevue) return badRequest("datePrevue invalide ou manquante");

    // Optionnel: empêcher doublon (même personnel + même datePrevue + même type)
    // (recommandé si tu veux)
    // const exists = await prisma.convocation.findFirst({
    //   where: { personnelId, type, datePrevue },
    // });
    // if (exists) return badRequest("Une convocation existe déjà pour ce personnel à cette date.");

    // Vérifier que le personnel existe
    const pers = await prisma.personnel.findUnique({ where: { id: personnelId } });
    if (!pers) return NextResponse.json({ error: "Personnel introuvable" }, { status: 404 });
if (!datePrevue) return badRequest("datePrevue obligatoire");

const d = new Date(datePrevue);
if (Number.isNaN(d.getTime()))
  return badRequest("datePrevue invalide");

// week-end
const day = d.getDay();
if (day === 0 || day === 6)
  return badRequest("Date Prévue tombe sur un week-end");

// jour férié
const jf = await getJourFerie(d);
if (jf)
  return badRequest(
    `Date Prévue tombe sur un jour férié : ${jf.label ?? "jour férié"}`
  );
    const created = await prisma.convocation.create({
      data: {
        personnelId,
        
        statut,
        convocationType,
        datePrevue,
        dateConvocation,
        commentaire,
      },
      include: {
        personnel: {
          include: { poste: true, service: true, formation: true },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/convocations error:", error);

    // Prisma errors courantes
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Conflit (doublon)" }, { status: 409 });
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}