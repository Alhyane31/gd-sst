import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { chargerContexte, includeDeclaration, utilisateurCourant } from "@/lib/aes/serveur";
import { ecrireDeclarationAes, preparerDeclarationAes } from "@/lib/aes/synchro";

type Params = { params: Promise<{ visiteId: string }> };

async function chargerVisite(visiteId: string) {
  return prisma.visite.findUnique({
    where: { id: visiteId },
    select: {
      id: true,
      type: true,
      statut: true,
      dateDebut: true,
      personnelId: true,
      personnel: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          matricule: true,
          dateNaissance: true,
          sexe: true,
          statutSocial: true,
          poste: { select: { libelle: true } },
          service: { select: { libelle: true } },
          formation: { select: { libelle: true } },
        },
      },
    },
  });
}

/**
 * Parties déjà construites, affichées en lecture seule : renseignements personnels et
 * antécédents (dernières données renseignées = dernier formulaire du personnel + pathologies).
 */
async function dossierLectureSeule(personnelId: string) {
  const [dernier, pathologies] = await Promise.all([
    prisma.formulaire.findFirst({
      where: { personnelId },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true, data: true },
    }),
    prisma.personnelPathologie.findMany({
      where: { personnelId },
      include: { cim11: { select: { code: true, libelle: true } } },
      orderBy: { date: "desc" },
    }),
  ]);
  const raw = ((dernier?.data as Prisma.JsonObject | null)?.raw ?? {}) as Record<string, unknown>;
  return {
    formulaireDu: dernier?.updatedAt ?? null,
    pathologies: pathologies.map((p) => ({ code: p.cim11.code, libelle: p.cim11.libelle, date: p.date, commentaire: p.commentaire })),
    synthese: raw.antecedents ?? "",
    antecedentsChirurgicaux: raw.antecedentsChirurgicaux ?? "",
    antecedentsFamiliaux: raw.antecedentsFamiliaux ?? [],
    antecedentsProfessionnels: raw.antecedentsProfessionnels ?? {},
    nombreEnfants: raw.nombreEnfants ?? "",
  };
}

// GET /api/aes/[visiteId] — visite, dossier en lecture seule, déclaration, calendrier, consultations, référentiel
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await utilisateurCourant();
  if (!user) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const { visiteId } = await params;
  const visite = await chargerVisite(visiteId);
  if (!visite) return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });
  if (visite.type !== "AES") return NextResponse.json({ message: "Cette visite n'est pas une visite AES" }, { status: 400 });

  const [{ declaration, ref }, dossier] = await Promise.all([chargerContexte(visiteId), dossierLectureSeule(visite.personnelId)]);
  return NextResponse.json({ visite, dossier, declaration, referentiel: ref });
}

// PUT /api/aes/[visiteId] — { data, action: "brouillon" | "valider" }
// Une déclaration validée reste modifiable (ex. statut de la source), mais chaque enregistrement est alors validé.
export async function PUT(req: NextRequest, { params }: Params) {
  const user = await utilisateurCourant();
  if (!user) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const { visiteId } = await params;
  const visite = await chargerVisite(visiteId);
  if (!visite) return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });
  if (visite.type !== "AES") return NextResponse.json({ message: "Cette visite n'est pas une visite AES" }, { status: 400 });
  if (visite.statut === "ANNULEE") return NextResponse.json({ message: "Visite annulée" }, { status: 409 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.data !== "object" || body.data === null) {
    return NextResponse.json({ message: "Données manquantes" }, { status: 400 });
  }

  const prep = await preparerDeclarationAes(visiteId, body.data, body.action === "valider" ? "valider" : "brouillon");
  if (!prep.ok) return NextResponse.json(prep.body, { status: prep.status });

  const resultat = await prisma.$transaction(async (tx) => {
    const id = await ecrireDeclarationAes(tx, { visiteId, personnelId: visite.personnelId, userId: user.id, prep });
    if (visite.statut === "BROUILLON") {
      await tx.visite.update({ where: { id: visiteId }, data: { statut: "EN_COURS" } });
    }
    return tx.aesDeclaration.findUnique({ where: { id }, include: includeDeclaration });
  });

  return NextResponse.json({ declaration: resultat });
}
