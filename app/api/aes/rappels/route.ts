import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { SuiviCode } from "@/lib/aes/codes";
import { chargerReferentiel } from "@/lib/aes/referentielDb";
import { canalNotification, messageRappel, visitesARappeler, type RappelAes } from "@/lib/aes/rappels";
import { utilisateurCourant } from "@/lib/aes/serveur";

// GET /api/aes/rappels?jours=n — rappels dus (visites prévues dans les n prochains jours).
// Point d'extension : aucun envoi tant qu'aucun canal (e-mail / SMS) n'est configuré (lib/aes/rappels.ts).
export async function GET(req: NextRequest) {
  const user = await utilisateurCourant();
  if (!user) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const ref = await chargerReferentiel(prisma);
  const jours = Number(req.nextUrl.searchParams.get("jours") ?? ref.seuils.rappelJoursAvant);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const declarations = await prisma.aesDeclaration.findMany({
    where: { statut: "VALIDEE" },
    select: {
      id: true,
      visiteId: true,
      personnel: { select: { firstName: true, lastName: true, email: true } },
      suivis: { select: { code: true, statut: true, datePrevue: true } },
    },
  });

  const rappels: RappelAes[] = declarations.flatMap((d) =>
    visitesARappeler(
      d.suivis.map((s) => ({ code: s.code, statut: s.statut, datePrevue: s.datePrevue.toISOString().slice(0, 10) })),
      aujourdhui,
      Number.isFinite(jours) && jours >= 0 ? jours : 3
    ).map((s) => ({
      declarationId: d.id,
      visiteId: d.visiteId,
      personnel: { nom: `${d.personnel.lastName} ${d.personnel.firstName}`, email: d.personnel.email, telephone: null },
      visite: s.code as SuiviCode,
      datePrevue: s.datePrevue,
      message: messageRappel(s.code as SuiviCode, s.datePrevue),
    }))
  );

  return NextResponse.json({ canal: canalNotification?.nom ?? null, envoiActif: canalNotification !== null, rappels });
}
