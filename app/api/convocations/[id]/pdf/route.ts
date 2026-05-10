import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { buildConvocationHtml } from "@/app/pdf/convocationHtml";
import { renderHtmlToPdf } from "@/app/pdf/docxToPdf";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const TEMPLATES = {
  SMR: path.join(process.cwd(), "app", "DocModeles", "Convovation SMR.docx"),
  VP:  path.join(process.cwd(), "app", "DocModeles", "Convovation  Périodique.docx"),
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await Promise.resolve(ctx.params);

  const conv = await prisma.convocation.findUnique({
    where: { id },
    include: {
      personnel: {
        include: {
          poste:       true,
          posteDetail: true,
          service:     true,
          formation:   true,
        },
      },
    },
  });

  if (!conv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const p        = conv.personnel;
  const categorie = p.categorie as "SMR" | "VP";

  const date  = conv.datePrevue.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const heure = conv.datePrevue.toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit",
  }).replace(":", "h");

  const baseName = `convocation_${p.lastName}_${p.firstName}_${date.replace(/\//g, "-")}`;

  // Génération PDF via HTML
  const html = buildConvocationHtml({
    categorie,
    formation: p.formation.libelle,
    service:   p.service.libelle,
    numero:    id.slice(-6).toUpperCase(),
    nomPrenom: `${p.firstName} ${p.lastName.toUpperCase()}`,
    fc:        p.poste?.libelle ?? "",
    poste:     p.posteDetail?.libelle ?? "",
    date,
    heure,
  });

  const pdfBuffer = await renderHtmlToPdf(html, { format: "A5", landscape: true });

  if (pdfBuffer) {
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `inline; filename="${baseName}.pdf"`,
      },
    });
  }

  // Fallback : retourner le .docx rempli
  const templatePath = TEMPLATES[categorie];
  if (!fs.existsSync(templatePath))
    return NextResponse.json({ error: "Modèle introuvable" }, { status: 500 });

  const zip = new PizZip(fs.readFileSync(templatePath));
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{{", end: "}}" },
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render({
    Formation1: p.formation.libelle,
    Service1:   p.service.libelle,
    Num1:       id.slice(-6).toUpperCase(),
    Nom1:       `${p.firstName} ${p.lastName.toUpperCase()}`,
    FC1:        p.poste?.libelle ?? "",
    Poste1:     p.posteDetail?.libelle ? `Poste : ${p.posteDetail.libelle}` : "",
    Date1:      date,
    Heure1:     heure,
  });

  const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });
  return new NextResponse(docxBuffer, {
    status: 200,
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${baseName}.docx"`,
    },
  });
}
