import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { chargerContexte, includeDeclaration, suivisPourRegles, utilisateurCourant } from "@/lib/aes/serveur";
import { peutCloturer } from "@/lib/aes/suivi";
import { estPasDAes } from "@/lib/aes/codes";

type Params = { params: Promise<{ visiteId: string }> };

// POST /api/aes/[visiteId]/cloture — { motifArretSuivi? }
// Possible seulement après la visite S12, ou après un arrêt justifié du suivi ; clôture aussi la visite.
export async function POST(req: NextRequest, { params }: Params) {
  const user = await utilisateurCourant();
  if (!user) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const { visiteId } = await params;
  const { declaration } = await chargerContexte(visiteId);
  if (!declaration) return NextResponse.json({ message: "Déclaration AES introuvable" }, { status: 404 });
  if (declaration.statut === "CLOTUREE") return NextResponse.json({ message: "Dossier déjà clôturé" }, { status: 409 });
  if (declaration.statut === "BROUILLON") {
    return NextResponse.json({ message: "La déclaration n'est pas validée" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const motif = typeof body?.motifArretSuivi === "string" ? body.motifArretSuivi.trim() : "";

  const verif = peutCloturer(
    suivisPourRegles(declaration),
    declaration.consultations.map((c) => ({ visite: c.visite, conduite: (c.data as Record<string, unknown> | null)?.conduite })),
    motif || declaration.motifArretSuivi,
    estPasDAes((declaration.data ?? {}) as Record<string, unknown>)
  );
  if (!verif.ok) return NextResponse.json({ message: verif.raison }, { status: 409 });

  await prisma.$transaction([
    prisma.aesDeclaration.update({
      where: { id: declaration.id },
      data: {
        statut: "CLOTUREE",
        clotureAt: new Date(),
        clotureById: user.id,
        updatedById: user.id,
        ...(motif ? { motifArretSuivi: motif } : {}),
      },
    }),
    prisma.visite.update({ where: { id: visiteId }, data: { statut: "CLOTUREE", dateFin: new Date() } }),
  ]);

  const maj = await prisma.aesDeclaration.findUnique({ where: { id: declaration.id }, include: includeDeclaration });
  return NextResponse.json({ declaration: maj });
}
