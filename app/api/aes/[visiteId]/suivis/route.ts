import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BILANS, SUIVI_CODES, SUIVI_STATUTS } from "@/lib/aes/codes";
import { genererCalendrier } from "@/lib/aes/calendrier";
import { chargerContexte, includeDeclaration, utilisateurCourant } from "@/lib/aes/serveur";

type Params = { params: Promise<{ visiteId: string }> };

type SuiviSaisi = { code: string; datePrevue: string; statut: string; bilans: string[] };

// PUT /api/aes/[visiteId]/suivis — { suivis } : dates, statuts et bilans prévus (modifiables)
// ou { action: "regenerer" } : recalcule le calendrier depuis la déclaration (remplace dates et bilans)
export async function PUT(req: NextRequest, { params }: Params) {
  const user = await utilisateurCourant();
  if (!user) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const { visiteId } = await params;
  const { declaration, ref } = await chargerContexte(visiteId);
  if (!declaration) return NextResponse.json({ message: "Déclaration AES introuvable" }, { status: 404 });
  if (declaration.statut === "BROUILLON") {
    return NextResponse.json({ message: "Le calendrier est créé à la validation de la déclaration" }, { status: 409 });
  }
  if (declaration.statut === "CLOTUREE") return NextResponse.json({ message: "Dossier AES clôturé" }, { status: 409 });

  const body = await req.json().catch(() => null);

  let suivis: SuiviSaisi[];
  if (body?.action === "regenerer") {
    suivis = genererCalendrier((declaration.data ?? {}) as Record<string, unknown>, ref) ?? [];
  } else if (Array.isArray(body?.suivis)) {
    suivis = body.suivis;
  } else {
    return NextResponse.json({ message: "Données manquantes" }, { status: 400 });
  }

  for (const s of suivis) {
    const valide =
      (SUIVI_CODES as readonly string[]).includes(s.code) &&
      (SUIVI_STATUTS as readonly string[]).includes(s.statut) &&
      /^\d{4}-\d{2}-\d{2}$/.test(s.datePrevue) &&
      Array.isArray(s.bilans) &&
      s.bilans.every((b) => (BILANS as readonly string[]).includes(b));
    if (!valide) return NextResponse.json({ message: `Visite de suivi invalide : ${s.code}` }, { status: 400 });
  }

  await prisma.$transaction([
    ...suivis.map((s) =>
      prisma.aesSuiviVisite.upsert({
        where: { declarationId_code: { declarationId: declaration.id, code: s.code as (typeof SUIVI_CODES)[number] } },
        update: { datePrevue: new Date(`${s.datePrevue}T00:00:00Z`), statut: s.statut as (typeof SUIVI_STATUTS)[number], bilans: s.bilans },
        create: {
          declarationId: declaration.id,
          code: s.code as (typeof SUIVI_CODES)[number],
          datePrevue: new Date(`${s.datePrevue}T00:00:00Z`),
          statut: s.statut as (typeof SUIVI_STATUTS)[number],
          bilans: s.bilans,
        },
      })
    ),
    prisma.aesDeclaration.update({ where: { id: declaration.id }, data: { updatedById: user.id } }),
  ]);

  const maj = await prisma.aesDeclaration.findUnique({ where: { id: declaration.id }, include: includeDeclaration });
  return NextResponse.json({ declaration: maj });
}
