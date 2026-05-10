import fs from "fs";
import path from "path";

const LOGO_G = path.join(process.cwd(), "public", "images", "image2.jpg"); // Ministère
const LOGO_D = path.join(process.cwd(), "public", "images", "image1.jpg"); // CHU Ibn Rochd

function imgBase64(p: string): string {
  if (!fs.existsSync(p)) return "";
  return `data:image/jpeg;base64,${fs.readFileSync(p).toString("base64")}`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type ConvocationData = {
  categorie: "SMR" | "VP";
  formation: string;
  service:   string;
  numero:    string;
  nomPrenom: string;
  fc:        string;
  poste:     string;
  date:      string;
  heure:     string;
};

const CSS = `
  @page { size: A5 landscape; margin: 12mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Candara, Arial, sans-serif; font-size: 9.5pt; color: #000; }

  .page { page-break-after: always; }
  .page:last-child { page-break-after: avoid; }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 40pt;
  }
  .logo { height: 52px; width: auto; object-fit: contain; flex-shrink: 0; }
  .title-block { flex: 1; text-align: center; padding: 0 12px; }
  .title-main { font-weight: bold; font-size: 10.5pt; margin-bottom: 5pt; margin-top: 32pt; }
  .title-sub  { font-weight: bold; font-size: 9.5pt; margin-bottom: 8pt; }

  .field-row { display: flex; align-items: baseline; margin-bottom: 6pt; }
  .b   { font-weight: bold; white-space: nowrap; }
  .sep { margin-left: 14px; }

  .poste-row { margin-bottom: 14pt; margin-top: 4pt; }

  .para   { margin-bottom: 9pt; line-height: 1.6; text-align: justify; }
  .bullet { margin-left: 22px; margin-bottom: 4pt; }
  .closing{ margin-top: 14pt; line-height: 1.6; text-align: justify; }
`;

function buildBody(d: ConvocationData, logoG: string, logoD: string): string {
  const isSmr     = d.categorie === "SMR";
  const titleMain = isSmr ? "Surveillance Médicale Rapprochée (SMR)" : "Surveillance Médicale Périodique";
  const typeTexte = isSmr ? "rapprochée" : "périodique";
  const posteLabel = [d.fc, d.poste].filter(Boolean).join(" – ");

  return `
  <div class="header">
    ${logoG ? `<img class="logo" src="${logoG}" />` : `<div style="width:60px"></div>`}
    <div class="title-block">
      <div class="title-main">${esc(titleMain)}</div>
      <div class="title-sub">Convocation à la visite médicale</div>
    </div>
    ${logoD ? `<img class="logo" src="${logoD}" />` : `<div style="width:70px"></div>`}
  </div>

  <div class="field-row">
    <span class="b">Formation :&nbsp;</span><span>${esc(d.formation)}</span>
  </div>
  <div class="field-row">
    <span class="b">Service :&nbsp;</span><span>${esc(d.service)}</span>
    
  </div>
  <div class="field-row">
    <span class="b">Nom et prénom :&nbsp;</span><span>${esc(d.nomPrenom)}</span>
  </div>
  ${posteLabel ? `<div class="poste-row"><span class="b">Poste :&nbsp;</span>${esc(posteLabel)}</div>` : `<div style="margin-bottom:14pt;"></div>`}

  <p class="para">
    Dans le cadre de ses missions, le Service de Santé au Travail du Centre
    Hospitalier Universitaire Ibn Rochd, organise la surveillance médicale
    ${typeTexte} au profit du personnel hospitalier.
  </p>
  <p class="para">
    Aussi, vous êtes prié de vous présenter le :
    <strong>${esc(d.date)} à ${esc(d.heure)}</strong>, au Service de Santé au Travail
    muni des documents suivants :
  </p>
  <p class="bullet">-&nbsp;&nbsp; La présente convocation</p>
  <p class="bullet">-&nbsp;&nbsp; Votre pièce d'identité</p>
  <p class="closing">
    Veuillez agréer, Madame/Monsieur, l'expression de nos salutations distinguées.
  </p>`;
}

export function buildConvocationHtml(d: ConvocationData): string {
  const logoG = imgBase64(LOGO_G);
  const logoD = imgBase64(LOGO_D);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CSS}</style></head>
<body><div class="page">${buildBody(d, logoG, logoD)}</div></body></html>`;
}

// Toutes les convocations dans un seul HTML multi-pages
export function buildConvocationsBatchHtml(items: ConvocationData[]): string {
  const logoG = imgBase64(LOGO_G);
  const logoD = imgBase64(LOGO_D);
  const pages = items.map((d) => `<div class="page">${buildBody(d, logoG, logoD)}</div>`).join("\n");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CSS}</style></head>
<body>${pages}</body></html>`;
}
