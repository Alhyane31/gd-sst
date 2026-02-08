import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; // adapte si besoin

type Ctx = { params: Promise<{ id?: string }> };
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
function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function normalizeId(id?: string | null) {
  if (!id || id === "undefined" || id === "null") return null;
  return id;
}

/** ⚠️ Adapte ces enums si tu les as dans Prisma */
const ALLOWED_STATUTS = [
  "A_CONVOQUER",
  "CONVOCATION_GENEREE",
  "A_TRAITER",
  "A_RELANCER",
  "RELANCEE",
  "REALISEE",
  "ANNULEE",
] as const;



const ALLOWED_CONVOCATION_TYPES = ["INITIALE", "RELANCE_1", "RELANCE_2", "RELANCE_3"] as const;

type AllowedStatut = (typeof ALLOWED_STATUTS)[number];

type AllowedConvocationType = (typeof ALLOWED_CONVOCATION_TYPES)[number];

function isAllowed<T extends readonly string[]>(arr: T, v: any): v is T[number] {
  return typeof v === "string" && (arr as readonly string[]).includes(v);
}

function parseDateOrNull(v: any): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* =========================
   GET : détail convocation
========================= */
export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: rawId } = await ctx.params;
  const id = normalizeId(rawId) ?? normalizeId(req.nextUrl.searchParams.get("id"));

  if (!id) return NextResponse.json({ error: "ID manquant ou invalide" }, { status: 400 });

  try {
    const convocation = await prisma.convocation.findUnique({
      where: { id },
      include: {
        personnel: { include: { poste: true, service: true, formation: true } },
      },
    });

    if (!convocation) {
      return NextResponse.json({ error: "Convocation introuvable" }, { status: 404 });
    }

    return NextResponse.json(convocation);
  } catch (error) {
    console.error("GET convocation error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* =========================
   PUT : mise à jour convocation
   - interdit de changer personnelId
========================= */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: rawId } = await ctx.params;
  const id = normalizeId(rawId) ?? normalizeId(req.nextUrl.searchParams.get("id"));

  if (!id) return NextResponse.json({ error: "ID manquant ou invalide" }, { status: 400 });

  try {
    const body = await req.json();

    // ❌ Interdiction de modifier le personnel
    if ("personnelId" in body) {
      return NextResponse.json(
        { error: "Modification du personnel interdite sur cette route." },
        { status: 400 }
      );
    }

    // Champs modifiables
    const {
     
      statut,
      convocationType,
     
      dateConvocation,
      datePrevue,
      commentaire,
    } = body ?? {};

   
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
    if (statut && !isAllowed(ALLOWED_STATUTS, statut)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    if (convocationType && !isAllowed(ALLOWED_CONVOCATION_TYPES, convocationType)) {
      return NextResponse.json({ error: "Type convocation invalide" }, { status: 400 });
    }

    const dPrevue = datePrevue !== undefined ? parseDateOrNull(datePrevue) : undefined;
    if (datePrevue !== undefined && dPrevue === null) {
      return NextResponse.json({ error: "datePrevue invalide" }, { status: 400 });
    }

    const dConvoc = dateConvocation !== undefined ? parseDateOrNull(dateConvocation) : undefined;
    if (dateConvocation !== undefined && dConvoc === null) {
      return NextResponse.json({ error: "dateConvocation invalide" }, { status: 400 });
    }

    const updated = await prisma.convocation.update({
      where: { id },
      data: {
        
        ...(statut !== undefined ? { statut: statut as AllowedStatut } : {}),
        ...(convocationType !== undefined ? { convocationType: convocationType as AllowedConvocationType } : {}),
        
        ...(datePrevue !== undefined ? { datePrevue: dPrevue } : {}),
        ...(dateConvocation !== undefined ? { dateConvocation: dConvoc } : {}),
        ...(commentaire !== undefined ? { commentaire: commentaire ?? null } : {}),
      },
      include: {
        personnel: { include: { poste: true, service: true, formation: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT convocation error:", error);

    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Convocation introuvable" }, { status: 404 });
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* =========================
   PATCH : annulation
   - force statut = ANNULEE
========================= */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: rawId } = await ctx.params;
  const id = normalizeId(rawId) ?? normalizeId(req.nextUrl.searchParams.get("id"));

  if (!id) return NextResponse.json({ error: "ID manquant ou invalide" }, { status: 400 });

  try {
    // optionnel : tu peux accepter un motif dans body
    let motif: string | null = null;
    try {
      const body = await req.json();
      if (body?.motif) motif = String(body.motif);
    } catch {
      // si pas de body, ok
    }

    const updated = await prisma.convocation.update({
      where: { id },
      data: {
        statut: "ANNULEE",
        // optionnel: stocker motif dans commentaire si tu veux
        ...(motif ? { commentaire: motif } : {}),
      },
      include: {
        personnel: { include: { poste: true, service: true, formation: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH convocation cancel error:", error);

    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Convocation introuvable" }, { status: 404 });
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

