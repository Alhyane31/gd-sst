import { NextRequest,NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 
  const { searchParams } = new URL(req.url);
  const isActive = searchParams.get("isActive");

  const postes = await prisma.poste.findMany({
    where: {
      ...(isActive === "true" ? { isActive: true } : {}),
    },
    include: {
      details: {
        where: { isActive: true },
        orderBy: { libelle: "asc" },
      },
    },
    orderBy: { libelle: "asc" },
  });

  return NextResponse.json(postes);
}
