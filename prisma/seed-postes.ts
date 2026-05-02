import { PrismaClient, CategorieForm } from "@prisma/client";

const prisma = new PrismaClient();

const postes = [
  { libelle: "Assistant social", categorieForm: "B" },
  { libelle: "Enseignant", categorieForm: "A" },
  { libelle: "Médecin Interne", categorieForm: "A" },
  { libelle: "Médecin Résident", categorieForm: "A" },
  { libelle: "Médecin Spécialiste", categorieForm: "A" },
  { libelle: "Médecin Généraliste", categorieForm: "A" },
  { libelle: "Pharmacien", categorieForm: "A" },
  { libelle: "Personnel Technique", categorieForm: "B" },
  { libelle: "Personnel Administratif", categorieForm: "B" },
  { libelle: "Personnel de Soutien", categorieForm: "B" },
  { libelle: "Infirmier", categorieForm: "B" },
] as const;

const details = [
  ["Enseignant", "Maître de Conférence"],
  ["Enseignant", "Professeur Agrégé"],
  ["Enseignant", "Professeur de l'Enseignement Supérieur"],

  ["Médecin Interne", "Première Année"],
  ["Médecin Interne", "Deuxième Année"],

  ["Médecin Résident", "Première Année"],
  ["Médecin Résident", "Deuxième Année"],
  ["Médecin Résident", "Troisième Année"],
  ["Médecin Résident", "Quatrième Année"],
  ["Médecin Résident", "Cinquième Année"],

  ["Infirmier", "Infirmier Polyvalent"],
  ["Infirmier", "Infirmier Anésthésiste"],
  ["Infirmier", "Infirmier Urgentiste"],
  ["Infirmier", "Infirmier en Santé Mentale"],

  ["Personnel Technique", "Technicien"],
  ["Personnel Technique", "Ingénieur"],
  ["Personnel Technique", "Physicien"],

  ["Personnel de Soutien", "Kinésithérapeute"],
  ["Personnel de Soutien", "Orthophoniste"],
  ["Personnel de Soutien", "Agent de service"],
] as const;

function makeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function main() {
  // 1) Désactiver les anciens postes
  await prisma.poste.updateMany({
    data: {
      isActive: false,
    },
  });

  // 2) Créer ou réactiver les nouveaux postes
  for (const p of postes) {
    await prisma.poste.upsert({
      where: {
        code: makeCode(p.libelle),
      },
      update: {
        libelle: p.libelle,
        categorieForm: p.categorieForm as CategorieForm,
        isActive: true,
      },
      create: {
        code: makeCode(p.libelle),
        libelle: p.libelle,
        categorieForm: p.categorieForm as CategorieForm,
        isActive: true,
      },
    });
  }

  // 3) Désactiver tous les anciens détails
  await prisma.posteDetail.updateMany({
    data: {
      isActive: false,
    },
  });

  // 4) Créer ou réactiver les détails
  for (const [posteLibelle, detailLibelle] of details) {
    const poste = await prisma.poste.findUnique({
      where: {
        code: makeCode(posteLibelle),
      },
    });

    if (!poste) {
      throw new Error(`Poste introuvable: ${posteLibelle}`);
    }

    const detailCode = `${makeCode(posteLibelle)}_${makeCode(detailLibelle)}`;

    await prisma.posteDetail.upsert({
      where: {
        code: detailCode,
      },
      update: {
        libelle: detailLibelle.trim(),
        posteId: poste.id,
        isActive: true,
      },
      create: {
        code: detailCode,
        libelle: detailLibelle.trim(),
        posteId: poste.id,
        isActive: true,
      },
    });
  }

  console.log("✅ Postes et détails de poste importés avec succès.");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed postes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });