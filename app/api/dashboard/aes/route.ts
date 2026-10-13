import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { utilisateurCourant } from "@/lib/aes/serveur";
import { calculerStatistiques } from "@/lib/aes/statistiques";
import { S2_GESTE, S9_PRISE_EN_CHARGE } from "@/app/aes/config/declaration";

/** Libellés des options d'un champ de la config, pour les graphiques */
function libelles(section: { fields: { id: string; kind: string }[] }, champ: string): Record<string, string> {
  const f = section.fields.find((x) => x.id === champ) as { options?: { value: string; label: string }[] } | undefined;
  return Object.fromEntries((f?.options ?? []).map((o) => [o.value, o.label]));
}

// GET /api/dashboard/aes — déclarations validées ou clôturées (les brouillons ne sont pas comptés)
export async function GET() {
  const user = await utilisateurCourant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const declarations = await prisma.aesDeclaration.findMany({
    where: { statut: { in: ["VALIDEE", "CLOTUREE"] } },
    select: {
      service: true,
      geste: true,
      causes: true,
      declarationAT: true,
      statut: true,
      personnel: { select: { service: { select: { libelle: true } } } },
      suivis: { select: { code: true, statut: true, datePrevue: true } },
      consultations: { select: { visite: true } },
    },
  });

  const stats = calculerStatistiques(
    declarations.map((d) => ({
      service: d.service || d.personnel.service?.libelle || null,
      geste: d.geste,
      causes: d.causes,
      declarationAT: d.declarationAT,
      statut: d.statut,
      suivis: d.suivis.map((s) => ({ code: s.code, statut: s.statut, datePrevue: s.datePrevue.toISOString().slice(0, 10) })),
      consultations: d.consultations,
    })),
    new Date().toISOString().slice(0, 10),
    { gestes: libelles(S2_GESTE, "geste"), causes: libelles(S9_PRISE_EN_CHARGE, "causes") }
  );
  return NextResponse.json(stats);
}
