import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { personnelIds, dateSortie } = await req.json();

  if (!Array.isArray(personnelIds) || personnelIds.length === 0) {
    return NextResponse.json({ error: "Aucun personnel sélectionné" }, { status: 400 });
  }
  if (!dateSortie) {
    return NextResponse.json({ error: "Date de sortie obligatoire" }, { status: 400 });
  }

  const date = new Date(dateSortie);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Date de sortie invalide" }, { status: 400 });
  }

  const result = await prisma.personnel.updateMany({
    where: { id: { in: personnelIds }, isActive: true },
    data: { isActive: false, dateSortie: date },
  });

  return NextResponse.json({ count: result.count });
}
