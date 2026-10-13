// Initialise le référentiel AES (annexes de la spécification). Ne modifie pas un paramétrage existant.
//   npx tsx prisma/seed-referentiel-aes.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { initialiserReferentiel } from "../lib/aes/referentielDb";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

initialiserReferentiel(prisma)
  .then((creees) =>
    console.log(creees.length ? `✅ Référentiel AES initialisé : ${creees.join(", ")}` : "Référentiel AES déjà initialisé, rien à faire.")
  )
  .catch((e) => {
    console.error("❌ Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
