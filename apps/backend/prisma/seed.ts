import { PrismaClient } from "@prisma/client";
import { WELLBEING_PROMPTS } from "@journal-iq/shared";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.prompt.count();
  if (count > 0) {
    console.log(`Prompts already seeded (${count}). Skipping.`);
    return;
  }

  await prisma.prompt.createMany({
    data: WELLBEING_PROMPTS.map((p, index) => ({
      text: p.text,
      category: p.category,
      sortOrder: index,
    })),
  });

  console.log(`Seeded ${WELLBEING_PROMPTS.length} prompts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
