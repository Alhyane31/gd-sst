import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

type ImportRow = {
  matricule: string;
  action: string; // A (ADD) / U (UPDATE)
  type: string; // VP / SMR -> ANNUELLE / RAPPROCHEE
  dateConvocation: string; // DD/MM/YYYY
  heureConvocation: string; // HH:MM
  present: string; // OUI / NON
  dateProchainVisite?: string; // DD/MM/YYYY, optionnel
};

const TYPE_MAP: Record<string, "ANNUELLE" | "RAPPROCHEE"> = {
  VP: "ANNUELLE",
  SMR: "RAPPROCHEE",
};

function parseDateHeure(dateStr: string, heureStr: string): Date | null {
  const dm = (dateStr ?? "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!dm) return null;
  const hm = (heureStr ?? "").trim().match(/^(\d{2}):(\d{2})$/);
  if (!hm) return null;
  const [, dd, mm, yyyy] = dm;
  const [, HH, MI] = hm;
  const d = new Date(`${yyyy}-${mm}-${dd}T${HH}:${MI}:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
}

function parseDate(dateStr?: string): Date | null {
  const dm = (dateStr ?? "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!dm) return null;
  const [, dd, mm, yyyy] = dm;
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
}

function dayRange(d: Date): { gte: Date; lte: Date } {
  const start = new Date(d); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(d); end.setUTCHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user?.id;

  const { rows }: { rows: ImportRow[] } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Aucune ligne à importer" }, { status: 400 });
  }

  type OkItem = { ligne: number; matricule: string; nom: string; action: string; statut: string; visiteCreee: boolean };
  type ErrItem = { ligne: number; matricule: string; raison: string };

  const ok: OkItem[] = [];
  const errors: ErrItem[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const ligne = i + 2;
    const matricule = (r.matricule ?? "").trim();

    if (!matricule) { errors.push({ ligne, matricule: "", raison: "Matricule manquant" }); continue; }

    const actionRaw = (r.action ?? "").trim().toUpperCase();
    if (!["A", "U"].includes(actionRaw)) {
      errors.push({ ligne, matricule, raison: `Valeur "action" invalide "${r.action}" (attendu A ou U)` });
      continue;
    }
    const isUpdate = actionRaw === "U";

    const dateHeure = parseDateHeure(r.dateConvocation, r.heureConvocation);
    if (!dateHeure) {
      errors.push({ ligne, matricule, raison: `Date/heure invalide "${r.dateConvocation} ${r.heureConvocation}" (attendu DD/MM/YYYY et HH:MM)` });
      continue;
    }

    const presentRaw = (r.present ?? "").trim().toUpperCase();
    if (!["OUI", "NON"].includes(presentRaw)) {
      errors.push({ ligne, matricule, raison: `Valeur "présent" invalide "${r.present}" (attendu OUI/NON)` });
      continue;
    }
    const present = presentRaw === "OUI";

    const typeRaw = (r.type ?? "").trim().toUpperCase();
    const visiteType = TYPE_MAP[typeRaw];
    if (present && !visiteType) {
      errors.push({ ligne, matricule, raison: `Valeur "type" invalide "${r.type}" (attendu VP ou SMR)` });
      continue;
    }

    let dateProchainVisite: Date | null | undefined = undefined; // undefined = pas de mise à jour
    if ((r.dateProchainVisite ?? "").trim()) {
      dateProchainVisite = parseDate(r.dateProchainVisite);
      if (!dateProchainVisite) {
        errors.push({ ligne, matricule, raison: `Date prochaine visite invalide "${r.dateProchainVisite}" (attendu DD/MM/YYYY)` });
        continue;
      }
    }

    const personnel = await prisma.personnel.findFirst({
      where: { matricule, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!personnel) {
      errors.push({ ligne, matricule, raison: `Matricule "${matricule}" introuvable ou inactif` });
      continue;
    }

    let existingConvocation: { id: string; visite: { id: string } | null } | null = null;
    if (isUpdate) {
      existingConvocation = await prisma.convocation.findFirst({
        where: {
          personnelId: personnel.id,
          statut: { not: "ANNULEE" },
          datePrevue: dayRange(dateHeure),
        },
        select: { id: true, visite: { select: { id: true } } },
      });
      if (!existingConvocation) {
        errors.push({ ligne, matricule, raison: `Aucune convocation non annulée trouvée pour ce matricule à la date ${r.dateConvocation}` });
        continue;
      }
    }

    try {
      await prisma.$transaction(async (tx) => {
        const convocation = isUpdate && existingConvocation
          ? await tx.convocation.update({
              where: { id: existingConvocation.id },
              data: {
                datePrevue: dateHeure,
                dateConvocation: dateHeure,
                statut: "ENVOYEE",
                dateRealisee: present ? dateHeure : null,
              },
            })
          : await tx.convocation.create({
              data: {
                personnelId: personnel.id,
                datePrevue: dateHeure,
                dateConvocation: dateHeure,
                statut: "ENVOYEE",
                dateRealisee: present ? dateHeure : null,
              },
            });

        if (present) {
          if (existingConvocation?.visite) {
            await tx.visite.update({
              where: { id: existingConvocation.visite.id },
              data: {
                type: visiteType,
                statut: "CLOTUREE",
                dateDebut: dateHeure,
                dateFin: dateHeure,
                updatedById: userId,
              },
            });
          } else {
            await tx.visite.create({
              data: {
                type: visiteType,
                statut: "CLOTUREE",
                dateDebut: dateHeure,
                dateFin: dateHeure,
                personnelId: personnel.id,
                convocationId: convocation.id,
                createdById: userId,
                updatedById: userId,
              },
            });
          }
        }

        if (dateProchainVisite !== undefined) {
          await tx.personnel.update({
            where: { id: personnel.id },
            data: { dateProchainVisite },
          });
        }
      });

      ok.push({
        ligne,
        matricule,
        nom: `${personnel.lastName} ${personnel.firstName}`,
        action: isUpdate ? "Mise à jour" : "Créée",
        statut: "ENVOYEE",
        visiteCreee: present,
      });
    } catch {
      errors.push({ ligne, matricule, raison: "Erreur lors de l'insertion" });
    }
  }

  return NextResponse.json({ ok, errors, totalImported: ok.length });
}
