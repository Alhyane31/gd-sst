import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

type Ctx = { params: Promise<{ id?: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params; // ✅ UNWRAP params

  if (!id || id === "undefined" || id === "null") {
    return NextResponse.json({ error: "Formation id manquant" }, { status: 400 });
  }

  // (debug)
  // console.log("formationId reçu:", id);

  const services = await prisma.service.findMany({
    where: { formationId: id },      // ✅ filtrage OK
    orderBy: { libelle: "asc" },
  });

  return NextResponse.json(services);
}
