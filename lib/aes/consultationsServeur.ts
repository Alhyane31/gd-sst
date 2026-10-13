// Enregistrement d'une consultation de résultats AES (création ou mise à jour), côté serveur.
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { SUIVI_CODES } from "./codes";
import { chargerContexte, includeDeclaration, utilisateurCourant } from "./serveur";
import { libellesManquants, manquantsConsultation, nettoyerConsultation } from "@/app/aes/validation";

/**
 * Enregistre une consultation de résultats (création ou mise à jour), après validation des obligatoires.
 * Partagé par POST (création) et PUT /consultations/[id] (mise à jour).
 */
export async function enregistrerConsultation(visiteId: string, body: unknown, consultationId?: string) {
  const user = await utilisateurCourant();
  if (!user) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const { declaration, ctx } = await chargerContexte(visiteId);
  if (!declaration) return NextResponse.json({ message: "Déclaration AES introuvable" }, { status: 404 });
  if (declaration.statut === "BROUILLON") {
    return NextResponse.json({ message: "Validez d'abord la déclaration AES" }, { status: 409 });
  }
  if (declaration.statut === "CLOTUREE") return NextResponse.json({ message: "Dossier AES clôturé" }, { status: 409 });
  if (consultationId && !declaration.consultations.some((c) => c.id === consultationId)) {
    return NextResponse.json({ message: "Consultation introuvable" }, { status: 404 });
  }

  const brut = (body as { data?: unknown } | null)?.data;
  if (!brut || typeof brut !== "object") return NextResponse.json({ message: "Données manquantes" }, { status: 400 });

  const data = nettoyerConsultation(brut as Record<string, unknown>, ctx);
  const manquants = manquantsConsultation(data, ctx);
  if (manquants.length) {
    return NextResponse.json(
      { message: `Champs obligatoires manquants : ${libellesManquants(manquants).join(", ")}`, manquants },
      { status: 422 }
    );
  }
  const date = new Date(`${data.dateConsultation}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return NextResponse.json({ message: "Date de consultation invalide" }, { status: 400 });

  const visite = String(data.visite);
  await prisma.$transaction(async (tx) => {
    if (consultationId) {
      await tx.aesConsultation.update({
        where: { id: consultationId },
        data: { visite, dateConsultation: date, data: data as Prisma.InputJsonValue, updatedById: user.id },
      });
    } else {
      await tx.aesConsultation.create({
        data: { declarationId: declaration.id, visite, dateConsultation: date, data: data as Prisma.InputJsonValue, createdById: user.id },
      });
    }
    // la visite du calendrier correspondante passe à « Faite » (modifiable dans le calendrier)
    if ((SUIVI_CODES as readonly string[]).includes(visite)) {
      await tx.aesSuiviVisite.updateMany({
        where: { declarationId: declaration.id, code: visite as (typeof SUIVI_CODES)[number] },
        data: { statut: "FAITE" },
      });
    }
    // déclaration AT faite lors de la consultation : reportée sur la déclaration (tableau de bord)
    if (data.declarationAT === "FAITE") {
      await tx.aesDeclaration.update({ where: { id: declaration.id }, data: { declarationAT: "FAITE", updatedById: user.id } });
    }
  });

  const maj = await prisma.aesDeclaration.findUnique({ where: { id: declaration.id }, include: includeDeclaration });
  return NextResponse.json({ declaration: maj }, { status: consultationId ? 200 : 201 });
}
