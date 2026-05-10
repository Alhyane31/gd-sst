import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids obligatoire" }, { status: 400 });
    }

    const { count } = await prisma.convocation.updateMany({
      where: { id: { in: ids }, statut: { notIn: ["ANNULEE", "ENVOYEE"] } },
      data: { statut: "ANNULEE" },
    });

    return NextResponse.json({ ok: true, count });
  } catch (e) {
    console.error("bulk-cancel error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
