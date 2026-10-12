import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [
    totalActif,
    byFormationRaw,
    byServiceRaw,
    byPosteRaw,
    byCategorieRaw,
    formations,
    services,
    postes,
  ] = await Promise.all([
    prisma.personnel.count({ where: { isActive: true } }),
    prisma.personnel.groupBy({ by: ["formationId"], where: { isActive: true }, _count: { _all: true } }),
    prisma.personnel.groupBy({ by: ["serviceId", "formationId"], where: { isActive: true }, _count: { _all: true } }),
    prisma.personnel.groupBy({ by: ["posteId", "formationId"], where: { isActive: true }, _count: { _all: true } }),
    prisma.personnel.groupBy({ by: ["categorie", "formationId", "serviceId"], where: { isActive: true }, _count: { _all: true } }),
    prisma.formation.findMany({ select: { id: true, libelle: true }, orderBy: { libelle: "asc" } }),
    prisma.service.findMany({ select: { id: true, libelle: true, formationId: true }, orderBy: { libelle: "asc" } }),
    prisma.poste.findMany({ select: { id: true, libelle: true }, orderBy: { libelle: "asc" } }),
  ]);

  const formationMap = new Map(formations.map((f) => [f.id, f.libelle]));
  const serviceMap = new Map(services.map((s) => [s.id, s.libelle]));
  const posteMap = new Map(postes.map((p) => [p.id, p.libelle]));

  const byFormation = formations
    .map((f) => ({
      formationId: f.id,
      formation: f.libelle,
      count: byFormationRaw.find((r) => r.formationId === f.id)?._count._all ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const byService = byServiceRaw
    .map((r) => ({
      serviceId: r.serviceId,
      service: serviceMap.get(r.serviceId) ?? "Inconnu",
      formationId: r.formationId,
      formation: formationMap.get(r.formationId) ?? "Inconnue",
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const byPoste = byPosteRaw
    .map((r) => ({
      posteId: r.posteId,
      poste: posteMap.get(r.posteId) ?? "Inconnu",
      formationId: r.formationId,
      formation: formationMap.get(r.formationId) ?? "Inconnue",
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const CATEGORIE_LABELS: Record<string, string> = { VP: "VP", SMR: "SMR" };
  const byCategorieDetail = byCategorieRaw.map((r) => ({
    categorie: CATEGORIE_LABELS[r.categorie] ?? r.categorie,
    formationId: r.formationId,
    serviceId: r.serviceId,
    count: r._count._all,
  }));

  return NextResponse.json({
    totalActif,
    formations: formations.map((f) => ({ id: f.id, libelle: f.libelle })),
    services: services.map((s) => ({ id: s.id, libelle: s.libelle, formationId: s.formationId })),
    postes: postes.map((p) => ({ id: p.id, libelle: p.libelle })),
    byFormation,
    byService,
    byPoste,
    byCategorieDetail,
  });
}
