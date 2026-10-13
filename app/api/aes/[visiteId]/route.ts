import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { genererCalendrier } from "@/lib/aes/calendrier";
import { chargerContexte, colonnesDeclaration, includeDeclaration, utilisateurCourant } from "@/lib/aes/serveur";
import { libellesManquants, manquantsDeclaration, nettoyerDeclaration } from "@/app/aes/validation";

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

  const { declaration, ref, ctx } = await chargerContexte(visiteId);
  if (declaration?.statut === "CLOTUREE") {
    return NextResponse.json({ message: "Dossier AES clôturé : modification impossible" }, { status: 409 });
  }

  const data = nettoyerDeclaration(body.data as Record<string, unknown>, ctx);
  const valider = body.action === "valider" || declaration?.statut === "VALIDEE";

  if (valider) {
    const manquants = manquantsDeclaration(data, ctx);
    if (Object.keys(manquants).length) {
      return NextResponse.json(
        { message: `Champs obligatoires manquants : ${libellesManquants(manquants).join(", ")}`, manquants },
        { status: 422 }
      );
    }
  }

  const colonnes = colonnesDeclaration(data);
  const premiereValidation = valider && declaration?.statut !== "VALIDEE";

  const resultat = await prisma.$transaction(async (tx) => {
    const d = declaration
      ? await tx.aesDeclaration.update({
          where: { id: declaration.id },
          data: {
            data: data as Prisma.InputJsonValue,
            ...colonnes,
            updatedById: user.id,
            ...(premiereValidation ? { statut: "VALIDEE", validatedAt: new Date(), validatedById: user.id } : {}),
          },
        })
      : await tx.aesDeclaration.create({
          data: {
            visiteId,
            personnelId: visite.personnelId,
            data: data as Prisma.InputJsonValue,
            ...colonnes,
            createdById: user.id,
            ...(premiereValidation ? { statut: "VALIDEE", validatedAt: new Date(), validatedById: user.id } : {}),
          },
        });

    // calendrier de suivi généré à la première validation (dates et bilans modifiables ensuite)
    if (premiereValidation && (declaration?.suivis.length ?? 0) === 0) {
      const calendrier = genererCalendrier(data, ref) ?? [];
      await tx.aesSuiviVisite.createMany({
        data: calendrier.map((s) => ({
          declarationId: d.id,
          code: s.code,
          datePrevue: new Date(`${s.datePrevue}T00:00:00Z`),
          statut: s.statut,
          bilans: s.bilans,
        })),
      });
    }

    if (visite.statut === "BROUILLON") {
      await tx.visite.update({ where: { id: visiteId }, data: { statut: "EN_COURS" } });
    }

    return tx.aesDeclaration.findUnique({ where: { id: d.id }, include: includeDeclaration });
  });

  return NextResponse.json({ declaration: resultat });
}
