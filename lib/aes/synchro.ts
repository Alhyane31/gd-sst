// Enregistrement de la déclaration AES, partagé par :
//  - le formulaire de visite (PUT /api/visites/[id]/formulaire, sections AES du stepper),
//  - la page dossier AES (PUT /api/aes/[visiteId]).
import type { Prisma } from "@prisma/client";
import { libellesManquants, manquantsDeclaration, nettoyerDeclaration } from "@/app/aes/validation";
import { genererCalendrier } from "./calendrier";
import type { ReferentielAes } from "./referentiel";
import { chargerContexte, colonnesDeclaration, type DeclarationComplete } from "./serveur";

export type PreparationAes =
  | { ok: false; status: number; body: { message: string; manquants?: Record<string, string[]> } }
  | { ok: true; data: Record<string, unknown>; valider: boolean; declaration: DeclarationComplete | null; ref: ReferentielAes };

/**
 * Nettoie les réponses et applique la validation bloquante :
 * à la validation, puis à chaque enregistrement d'une déclaration déjà validée.
 */
export async function preparerDeclarationAes(
  visiteId: string,
  brut: unknown,
  action: "brouillon" | "valider"
): Promise<PreparationAes> {
  if (!brut || typeof brut !== "object") return { ok: false, status: 400, body: { message: "Données AES manquantes" } };

  const { declaration, ref, ctx } = await chargerContexte(visiteId);
  if (declaration?.statut === "CLOTUREE") {
    return { ok: false, status: 409, body: { message: "Dossier AES clôturé : modification impossible" } };
  }

  const data = nettoyerDeclaration(brut as Record<string, unknown>, ctx);
  const valider = action === "valider" || declaration?.statut === "VALIDEE";
  if (valider) {
    const manquants = manquantsDeclaration(data, ctx);
    if (Object.keys(manquants).length) {
      return {
        ok: false,
        status: 422,
        body: { message: `AES — champs obligatoires manquants : ${libellesManquants(manquants).join(", ")}`, manquants },
      };
    }
  }
  return { ok: true, data, valider, declaration, ref };
}

/** Crée ou met à jour la déclaration ; génère le calendrier à la première validation */
export async function ecrireDeclarationAes(
  tx: Prisma.TransactionClient,
  p: { visiteId: string; personnelId: string; userId: string; prep: Extract<PreparationAes, { ok: true }> }
): Promise<string> {
  const { data, valider, declaration, ref } = p.prep;
  const colonnes = colonnesDeclaration(data);
  const premiereValidation = valider && declaration?.statut !== "VALIDEE";
  const validation = premiereValidation ? { statut: "VALIDEE" as const, validatedAt: new Date(), validatedById: p.userId } : {};

  const d = declaration
    ? await tx.aesDeclaration.update({
        where: { id: declaration.id },
        data: { data: data as Prisma.InputJsonValue, ...colonnes, updatedById: p.userId, ...validation },
      })
    : await tx.aesDeclaration.create({
        data: {
          visiteId: p.visiteId,
          personnelId: p.personnelId,
          data: data as Prisma.InputJsonValue,
          ...colonnes,
          createdById: p.userId,
          ...validation,
        },
      });

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
  return d.id;
}
