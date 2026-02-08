import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const day = (searchParams.get("day") ?? "").trim(); // YYYY-MM-DD
  if (!day) return NextResponse.json({ error: "day obligatoire (YYYY-MM-DD)" }, { status: 400 });

  const start = new Date(`${day}T00:00:00.000Z`);
  const end = new Date(`${day}T23:59:59.999Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "day invalide" }, { status: 400 });
  }

  const totalNonAnnule = await prisma.convocation.count({
    where: {
      datePrevue: { gte: start, lte: end },
      NOT: { statut: "ANNULEE" },
    },
  });

  return NextResponse.json({ day, totalNonAnnule });
}
