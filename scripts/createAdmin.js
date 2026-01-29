// scripts/createAdmin.js
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("123456", 10);
await prisma.user.deleteMany({
  where: { email: "admin@test.com" },
});
  const user = await prisma.user.create({
    data: {
      email: "admin@test.com",
      password,
      firstName: "admin",
      lastName: "admin",
      role: "ADMIN",
    },
  });

  console.log("Utilisateur créé :", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
