import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const TEMPLATE_PATH = path.join(
  process.cwd(), "app", "DocModeles", "Bordereau SST 2025.docx"
);

function fmtDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildNomsXml(convocations: Array<{ nom: string; prenom: string; datePrevue: Date; categorie: string }>): string {
  const smr = convocations.filter((c) => c.categorie === "SMR");
  const vp  = convocations.filter((c) => c.categorie === "VP");

  const paras: string[] = [];

  const addGroup = (items: typeof convocations) => {
    const map = new Map<string, typeof convocations>();
    for (const c of items) {
      const key = fmtDate(c.datePrevue);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    for (const [date, persons] of map.entries()) {
      paras.push(
        `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Le ${escapeXml(date)} :</w:t></w:r></w:p>`
      );
      for (const p of persons) {
        paras.push(
          `<w:p><w:r><w:t xml:space="preserve">   ${escapeXml(p.prenom)} ${escapeXml(p.nom.toUpperCase())}</w:t></w:r></w:p>`
        );
      }
    }
  };

  if (smr.length) addGroup(smr);
  if (vp.length) {
    if (smr.length) paras.push(`<w:p><w:r><w:t> </w:t></w:r></w:p>`);
    addGroup(vp);
  }

  return paras.join("");
}

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
      service: true,
      convocations: {
        orderBy: [{ datePrevue: "asc" }, { createdAt: "asc" }],
        include: { personnel: { include: { poste: true } } },
      },
    },
  });

  if (!b) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (!fs.existsSync(TEMPLATE_PATH)) {
    return NextResponse.json({ error: `Modèle introuvable : ${TEMPLATE_PATH}` }, { status: 500 });
  }

  const convocs = b.convocations.map((c) => ({
    nom:        c.personnel.lastName,
    prenom:     c.personnel.firstName,
    datePrevue: c.datePrevue,
    categorie:  c.personnel.categorie,
  }));

  // Remplissage du modèle Word (délimiteurs {...})
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(templateBuffer);

  // Patch {Noms} → {@Noms} pour activer l'injection XML brut (dates en gras)
  const docXmlKey = "word/document.xml";
  zip.file(docXmlKey, zip.files[docXmlKey].asText().replace("{Noms}", "{@Noms}"));

  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{", end: "}" },
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render({
    Date:    fmtDate(b.dateEdition),
    Service: b.service.libelle,
    Noms:    buildNomsXml(convocs),
    Total:   String(convocs.length),
  });

  const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });
  const baseName   = `bordereau_${b.serialNumber}`;

  return new NextResponse(docxBuffer, {
    status: 200,
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${baseName}.docx"`,
    },
  });
}
