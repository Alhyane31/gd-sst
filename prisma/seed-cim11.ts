import "dotenv/config";
import { PrismaClient, Cim11Level } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type CsvRow = {
  code: string;
  libelle: string;
  level: Cim11Level;
  parentCode: string;
  isLeaf: boolean;
  pathCodes: string[];
};

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "true" || v === "vrai" || v === "1";
}

function parseLevel(value: string | undefined): Cim11Level {
  const v = (value ?? "").trim().toUpperCase();
  if (v === "L1" || v === "L2" || v === "L3" || v === "L4" || v === "L5") {
    return v as Cim11Level;
  }
  throw new Error(`Niveau invalide: ${value}`);
}

function parsePathCodes(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(">")
    .map((x) => x.trim())
    .filter(Boolean);
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((x) => x.trim());
}

function readCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);

  const getIndex = (name: string) => {
    const idx = headers.findIndex((h) => h.trim() === name);
    if (idx === -1) {
      throw new Error(`Colonne manquante dans le CSV: ${name}`);
    }
    return idx;
  };

  const idxCode = getIndex("code");
  const idxLibelle = getIndex("libelle");
  const idxLevel = getIndex("level");
  const idxParentCode = getIndex("parentCode");
  const idxIsLeaf = getIndex("isLeaf");
  const idxPathCodes = getIndex("pathCodes");

  return lines.slice(1).map((line, rowIndex) => {
    const cols = splitCsvLine(line);

    const code = cols[idxCode]?.trim();
    const libelle = cols[idxLibelle]?.trim();

    if (!code) {
      throw new Error(`Ligne ${rowIndex + 2}: code vide`);
    }
    if (!libelle) {
      throw new Error(`Ligne ${rowIndex + 2}: libellé vide`);
    }

    return {
      code,
      libelle,
      level: parseLevel(cols[idxLevel]),
      parentCode: cols[idxParentCode]?.trim() ?? "",
      isLeaf: parseBoolean(cols[idxIsLeaf]),
      pathCodes: parsePathCodes(cols[idxPathCodes]),
    };
  });
}

async function main() {
  const filePath = path.join(process.cwd(), "prisma", "data", "cim11.csv");
  const rows = readCsv(filePath);

  console.log(`📥 ${rows.length} lignes lues depuis ${filePath}`);

  // 1er passage : créer ou mettre à jour les nœuds sans parentId
  for (const row of rows) {
    await prisma.cim11Node.upsert({
      where: { code: row.code },
      update: {
        libelle: row.libelle,
        level: row.level,
        isLeaf: row.isLeaf,
        pathCodes: row.pathCodes,
      },
      create: {
        code: row.code,
        libelle: row.libelle,
        level: row.level,
        isLeaf: row.isLeaf,
        pathCodes: row.pathCodes,
      },
    });
  }

  console.log("✅ 1er passage terminé");

  // 2e passage : lier les parents
  for (const row of rows) {
    if (!row.parentCode) continue;

    const parent = await prisma.cim11Node.findUnique({
      where: { code: row.parentCode },
      select: { id: true, code: true },
    });

    if (!parent) {
      throw new Error(
        `Parent introuvable pour ${row.code}: parentCode=${row.parentCode}`
      );
    }

    await prisma.cim11Node.update({
      where: { code: row.code },
      data: {
        parentId: parent.id,
      },
    });
  }

  console.log("✅ 2e passage terminé");

  const count = await prisma.cim11Node.count();
  console.log(`🎉 Import terminé. Total en base: ${count}`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur import CIM11:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });