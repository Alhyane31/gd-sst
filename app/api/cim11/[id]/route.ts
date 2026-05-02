import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const item = await prisma.cim11Node.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, code: true, libelle: true },
        },
        children: {
          select: { id: true, code: true, libelle: true, level: true, isLeaf: true },
          orderBy: { code: "asc" },
        },
        _count: {
          select: { pathologies: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ message: "Élément introuvable" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.cim11Node.update({
      where: { id },
      data: {
        code: body.code?.trim(),
        libelle: body.libelle?.trim(),
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

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.cim11Node.findUnique({
      where: { id },
      include: {
        _count: {
          select: { children: true, pathologies: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Élément introuvable" }, { status: 404 });
    }

    if (existing._count.children > 0) {
      return NextResponse.json(
        { message: "Suppression impossible : ce nœud a des enfants." },
        { status: 400 }
      );
    }

    if (existing._count.pathologies > 0) {
      return NextResponse.json(
        { message: "Suppression impossible : ce nœud est utilisé par des pathologies." },
        { status: 400 }
      );
    }

    await prisma.cim11Node.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}