import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function parseBool(value: string | null) {
  if (value == null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");
    const q = searchParams.get("q")?.trim() ?? "";
    const level = searchParams.get("level")?.trim() ?? "";
    const isLeaf = parseBool(searchParams.get("isLeaf"));
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");

    if (q) {
      // 1. Trouver les feuilles correspondant à la recherche
      const matchingLeaves = await prisma.cim11Node.findMany({
        where: {
          isLeaf: true,
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { libelle: { contains: q, mode: "insensitive" } },
          ],
        },
        include: {
          parent: { select: { id: true, code: true, libelle: true } },
          _count: { select: { children: true, pathologies: true } },
        },
        orderBy: [{ code: "asc" }],
        take: 20,
      });

      // 2. Collecter les IDs de parents uniques non déjà dans les résultats
      const leafIds = new Set(matchingLeaves.map((n) => n.id));
      const parentIds = [
        ...new Set(
          matchingLeaves
            .map((n) => n.parentId)
            .filter((id): id is string => !!id && !leafIds.has(id))
        ),
      ];

      // 3. Charger les parents
      const parents =
        parentIds.length > 0
          ? await prisma.cim11Node.findMany({
              where: { id: { in: parentIds } },
              include: {
                parent: { select: { id: true, code: true, libelle: true } },
                _count: { select: { children: true, pathologies: true } },
              },
            })
          : [];

    
// 4. Grouper les feuilles sous leur parent respectif, triés par code
const leavesByParent = matchingLeaves.reduce<Record<string, typeof matchingLeaves>>(
  (acc, leaf) => {
    const key = leaf.parentId ?? "__root__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(leaf);
    return acc;
  },
  {}
);

const itemsL = parents
  .sort((a, b) => a.code.localeCompare(b.code))
  .flatMap((parent) => [
    parent,
    ...(leavesByParent[parent.id] ?? []).sort((a, b) => a.code.localeCompare(b.code)),
  ]);

// Feuilles orphelines (parent non chargé) à la fin
const usedLeafIds = new Set(itemsL.map((n) => n.id));
const orphans = matchingLeaves
  .filter((l) => !usedLeafIds.has(l.id))
  .sort((a, b) => a.code.localeCompare(b.code));


 const items = [...itemsL, ...orphans];
      return NextResponse.json({
        items,
        total: items.length,
        page: 1,
        pageSize: items.length,
        totalPages: 1,
      });
    }

    // — Chemin normal sans recherche textuelle —
    const where: any = {};
    if (parentId) where.parentId = parentId;
    if (level) where.level = Number(level);
    if (typeof isLeaf === "boolean") where.isLeaf = isLeaf;

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.cim11Node.findMany({
        where,
        include: {
          parent: { select: { id: true, code: true, libelle: true } },
          _count: { select: { children: true, pathologies: true } },
        },
        orderBy: [{ pathCodes: "asc" }, { code: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.cim11Node.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.code?.trim()) {
      return NextResponse.json({ message: "Le code est obligatoire" }, { status: 400 });
    }

    if (!body.libelle?.trim()) {
      return NextResponse.json({ message: "Le libellé est obligatoire" }, { status: 400 });
    }

    if (!body.level) {
      return NextResponse.json({ message: "Le niveau est obligatoire" }, { status: 400 });
    }

    const created = await prisma.cim11Node.create({
      data: {
        code: body.code.trim(),
        libelle: body.libelle.trim(),
        level: body.level,
        parentId: body.parentId || null,
        isLeaf: Boolean(body.isLeaf),
        pathCodes: Array.isArray(body.pathCodes) ? body.pathCodes : [],
      },
      include: {
        parent: {
          select: { id: true, code: true, libelle: true },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}