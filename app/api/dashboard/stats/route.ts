import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Fenêtre des 6 derniers mois (du 1er du mois M-5 à aujourd'hui)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    personnelActif,
    visitesMonth,
    convocationsEnAttente,
    formulairesDraft,
    visitesByType,
    visitesParMois,
    convocationsParStatut,
  ] = await Promise.all([
    // KPI 1 — Personnel actif
    prisma.personnel.count({ where: { isActive: true } }),

    // KPI 2 — Visites ce mois
    prisma.visite.count({
      where: { dateDebut: { gte: startOfMonth, lte: endOfMonth } },
    }),

    // KPI 3 — Convocations en attente (à convoquer + à traiter + à relancer)
    prisma.convocation.count({
      where: { statut: { in: ["A_CONVOQUER", "A_TRAITER", "A_RELANCER"] } },
    }),

    // KPI 4 — Formulaires non soumis (DRAFT)
    prisma.formulaire.count({ where: { statut: "DRAFT" } }),

    // Graphe 1 — Répartition des visites par type (toutes)
    prisma.visite.groupBy({ by: ["type"], _count: { _all: true } }),

    // Graphe 2 — Visites par mois sur 6 mois (raw pour éviter groupBy sur date)
    prisma.visite.findMany({
      where: { dateDebut: { gte: sixMonthsAgo } },
      select: { dateDebut: true },
    }),

    // Graphe 3 — Convocations par statut
    prisma.convocation.groupBy({ by: ["statut"], _count: { _all: true } }),
  ]);

  // Agrégation visites par mois côté serveur
  const monthCounts: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthCounts[key] = 0;
  }
  for (const v of visitesParMois) {
    const d = new Date(v.dateDebut);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthCounts) monthCounts[key]++;
  }

  const MOIS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const visitesParMoisData = Object.entries(monthCounts).map(([key, count]) => {
    const [, month] = key.split("-");
    return { mois: MOIS_FR[parseInt(month, 10) - 1], count };
  });

  const TYPE_LABELS: Record<string, string> = {
    ANNUELLE: "Annuelle", RAPPROCHEE: "Rapprochée", SPONTANNE: "Spontanée",
    CM: "CM", EXPERTISE: "Expertise", ETUDEP: "Étude de poste",
    LD: "LD", MD: "MD", AUTRE: "Autre",
  };
  const STATUT_LABELS: Record<string, string> = {
    A_CONVOQUER: "À convoquer", CONVOCATION_GENEREE: "Générée",
    A_TRAITER: "À traiter", A_RELANCER: "À relancer",
    RELANCEE: "Relancée", REALISEE: "Réalisée", ANNULEE: "Annulée",
  };

  return NextResponse.json({
    kpis: { personnelActif, visitesMonth, convocationsEnAttente, formulairesDraft },
    visitesByType: visitesByType.map((r) => ({
      name: TYPE_LABELS[r.type] ?? r.type,
      value: r._count._all,
    })),
    visitesParMois: visitesParMoisData,
    convocationsParStatut: convocationsParStatut
      .filter((r) => r.statut !== "ANNULEE")
      .map((r) => ({
        name: STATUT_LABELS[r.statut] ?? r.statut,
        count: r._count._all,
      }))
      .sort((a, b) => b.count - a.count),
  });
}
