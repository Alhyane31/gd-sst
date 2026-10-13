// Fonctions serveur du module AES : utilisateur courant, chargement du dossier, contexte des règles.
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import type { ExamCtx } from "@/app/formulaires/examen/types";
import type { SuiviCode, SuiviStatut } from "./codes";
import { combinerDateHeure, parseDateHeure } from "./delais";
import type { ReferentielAes } from "./referentiel";
import { chargerReferentiel } from "./referentielDb";
import { declarationAtFaite } from "./suivi";

/** Utilisateur connecté (même contrôle que le reste du dossier : session obligatoire) */
export async function utilisateurCourant(): Promise<{ id: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
}

export const includeDeclaration = {
  suivis: { orderBy: { datePrevue: "asc" } },
  consultations: { orderBy: [{ dateConsultation: "asc" }, { createdAt: "asc" }] },
} satisfies Prisma.AesDeclarationInclude;

export type DeclarationComplete = Prisma.AesDeclarationGetPayload<{ include: typeof includeDeclaration }>;

export function suivisPourRegles(d: DeclarationComplete | null) {
  return (d?.suivis ?? []).map((s) => ({
    code: s.code as SuiviCode,
    datePrevue: s.datePrevue.toISOString().slice(0, 10),
    statut: s.statut as SuiviStatut,
    bilans: s.bilans,
  }));
}

/** Contexte des formulaires (listes paramétrables + données de suivi) */
export function contexteAes(d: DeclarationComplete | null, ref: ReferentielAes): ExamCtx {
  const data = (d?.data ?? {}) as Record<string, unknown>;
  const consultations = (d?.consultations ?? []).map((c) => (c.data ?? {}) as Record<string, unknown>);
  const suivis = suivisPourRegles(d);
  return {
    options: {
      schemasTpe: ref.schemasTpe.filter((s) => s.actif).map((s) => ({ value: s.code, label: `${s.libelle} — ${s.molecules}` })),
    },
    extra: {
      referentiel: ref,
      tpeAccepte: data.tpe === "ACCEPTE",
      atFaite: declarationAtFaite(data, consultations),
      bilansParVisite: Object.fromEntries(suivis.map((s) => [s.code, s.bilans])),
      suivis,
    },
  };
}

export async function chargerContexte(visiteId: string) {
  const [declaration, ref] = await Promise.all([
    prisma.aesDeclaration.findUnique({ where: { visiteId }, include: includeDeclaration }),
    chargerReferentiel(prisma),
  ]);
  return { declaration, ref, ctx: contexteAes(declaration, ref) };
}

/** Colonnes dédiées (tableau de bord, règles) extraites des réponses */
export function colonnesDeclaration(data: Record<string, unknown>) {
  const texte = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    dateHeureAes: combinerDateHeure(data.dateAes, data.heureAes),
    dateHeureDeclaration: parseDateHeure(data.dateHeureDeclaration),
    lieu: texte(data.lieu),
    service: texte(data.service),
    geste: texte(data.geste),
    typeExposition: texte(data.typeExposition),
    niveauRisque: texte(data.niveauRisque),
    tpe: texte(data.tpe),
    declarationAT: texte(data.declarationAT),
    causes: Array.isArray(data.causes) ? (data.causes as string[]) : [],
  };
}
