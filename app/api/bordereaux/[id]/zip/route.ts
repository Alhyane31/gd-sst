import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { buildConvocationsBatchHtml, ConvocationData } from "@/app/pdf/convocationHtml";
import { renderHtmlToPdf } from "@/app/pdf/docxToPdf";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await Promise.resolve(ctx.params);

  const b = await prisma.bordereau.findUnique({
    where: { id },
    include: {
      convocations: {
        orderBy: [{ datePrevue: "asc" }, { createdAt: "asc" }],
        include: {
          personnel: {
            include: { poste: true, posteDetail: true, service: true, formation: true },
          },
        },
      },
    },
  });

  if (!b) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (b.convocations.length === 0)
    return NextResponse.json({ error: "Aucune convocation dans ce bordereau" }, { status: 400 });

  const items: ConvocationData[] = b.convocations.map((conv) => {
    const p    = conv.personnel;
    const date = conv.datePrevue.toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    const heure = conv.datePrevue.toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit",
    }).replace(":", "h");

    return {
      categorie: p.categorie as "SMR" | "VP",
      formation: p.formation.libelle,
      service:   p.service.libelle,
      numero:    conv.id.slice(-6).toUpperCase(),
      nomPrenom: `${p.firstName} ${p.lastName.toUpperCase()}`,
      fc:        p.poste?.libelle ?? "",
      poste:     p.posteDetail?.libelle ?? "",
      date,
      heure,
    };
  });

  const html      = buildConvocationsBatchHtml(items);
  const pdfBuffer = await renderHtmlToPdf(html, { format: "A5", landscape: true });

  if (!pdfBuffer)
    return NextResponse.json({ error: "Erreur génération PDF" }, { status: 500 });

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="convocations_${b.serialNumber}.pdf"`,
    },
  });
}
