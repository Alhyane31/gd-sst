import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { BILANS, SUIVI_CODES } from "@/lib/aes/codes";
import { CONDITIONS_BILAN, type ReferentielAes } from "@/lib/aes/referentiel";
import { chargerReferentiel, CLES_REFERENTIEL, type CleReferentiel } from "@/lib/aes/referentielDb";
import { utilisateurCourant } from "@/lib/aes/serveur";

// GET /api/aes/referentiel — référentiel effectif (base + valeurs par défaut de la spécification)
export async function GET() {
  const user = await utilisateurCourant();
  if (!user) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await chargerReferentiel(prisma));
}

/** Contrôle de structure : une erreur de paramétrage ne doit pas casser les règles */
function verifier(cle: CleReferentiel, valeur: unknown): string | null {
  if (cle === "schemasTpe") {
    if (!Array.isArray(valeur)) return "schemasTpe : liste attendue";
    const codes = new Set<string>();
    for (const s of valeur as ReferentielAes["schemasTpe"]) {
      if (!s?.code || !s?.libelle) return "schemasTpe : code et libellé obligatoires";
      if (codes.has(s.code)) return `schemasTpe : code en double (${s.code})`;
      codes.add(s.code);
    }
  }
  if (cle === "calendrier") {
    if (!Array.isArray(valeur)) return "calendrier : liste attendue";
    for (const v of valeur as ReferentielAes["calendrier"]) {
      if (!(SUIVI_CODES as readonly string[]).includes(v?.code)) return `calendrier : visite inconnue (${v?.code})`;
      if (!Number.isInteger(v.decalageJours) || v.decalageJours < 0) return `calendrier : décalage invalide (${v.code})`;
      for (const b of v.bilans ?? []) {
        if (!(BILANS as readonly string[]).includes(b.bilan)) return `calendrier : bilan inconnu (${b.bilan})`;
        if (!(b.condition in CONDITIONS_BILAN)) return `calendrier : condition inconnue (${b.condition})`;
      }
    }
  }
  if (cle === "seuils") {
    const s = valeur as ReferentielAes["seuils"];
    if (!(s?.delaiTpeHeures > 0) || !(s?.antiHbsRepondeur > 0)) return "seuils : valeurs positives attendues";
  }
  if (cle === "annexes" && (typeof valeur !== "object" || valeur === null)) return "annexes : objet attendu";
  return null;
}

// PUT /api/aes/referentiel — { [cle]: valeur } (cles : schemasTpe, calendrier, seuils, annexes)
export async function PUT(req: NextRequest) {
  const user = await utilisateurCourant();
  if (!user) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ message: "Données manquantes" }, { status: 400 });

  const cles = Object.keys(body).filter((k): k is CleReferentiel => (CLES_REFERENTIEL as readonly string[]).includes(k));
  if (cles.length === 0) return NextResponse.json({ message: "Aucune clé de référentiel reconnue" }, { status: 400 });
  for (const cle of cles) {
    const erreur = verifier(cle, body[cle]);
    if (erreur) return NextResponse.json({ message: erreur }, { status: 400 });
  }

  await prisma.$transaction(
    cles.map((cle) =>
      prisma.aesReferentiel.upsert({
        where: { cle },
        update: { valeur: body[cle] as Prisma.InputJsonValue, updatedById: user.id },
        create: { cle, valeur: body[cle] as Prisma.InputJsonValue, updatedById: user.id },
      })
    )
  );
  return NextResponse.json(await chargerReferentiel(prisma));
}
