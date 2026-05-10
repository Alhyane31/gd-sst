import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

type RadRow = { matricule: string; dateSortie: string };

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00.000Z`);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows }: { rows: RadRow[] } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Aucune ligne à traiter" }, { status: 400 });
  }

  type OkItem  = { ligne: number; matricule: string; nom: string; dateSortie: string };
  type ErrItem = { ligne: number; matricule: string; raison: string };

  const ok: OkItem[] = [];
  const errors: ErrItem[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const ligne = i + 2;
    const matricule = (r.matricule ?? "").trim();

    if (!matricule) { errors.push({ ligne, matricule: "", raison: "Matricule manquant" }); continue; }

    const dateSortie = parseDate((r.dateSortie ?? "").trim());
    if (!dateSortie) {
      errors.push({ ligne, matricule, raison: `Date de sortie invalide "${r.dateSortie}" (format attendu: DD/MM/YYYY)` }); continue;
    }

    const personnel = await prisma.personnel.findFirst({
      where: { matricule, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!personnel) {
      errors.push({ ligne, matricule, raison: `Matricule "${matricule}" introuvable ou déjà radié` }); continue;
    }

    await prisma.personnel.update({
      where: { id: personnel.id },
      data: { isActive: false, dateSortie },
    });
    ok.push({ ligne, matricule, nom: `${personnel.lastName} ${personnel.firstName}`, dateSortie: r.dateSortie });
  }

  return NextResponse.json({ ok, errors, totalImported: ok.length });
}
