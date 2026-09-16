require("dotenv").config();
const { sequelize, PlaqueTier } = require("../models");

const TIERS = [
  {
    slug: "WOOD",
    displayName: "Wood",
    minAmount: 51,
    order: 1,
    imageUrl: "plaques/wood.png",
    freeShowDays: 7,
    benefits: [
      "Personalised Wood plaque shipped to you",
      "Your name engraved on the plaque",
      "Unique serial number for verification",
      "7 days free access to the artist's shows",
    ],
  },
  {
    slug: "CRIMSON",
    displayName: "Crimson",
    minAmount: 101,
    order: 2,
    imageUrl: "plaques/crimson.png",
    freeShowDays: 14,
    benefits: [
      "Personalised Crimson plaque shipped to you",
      "Your name engraved on the plaque",
      "Unique serial number for verification",
      "14 days free access to the artist's shows",
    ],
  },
  {
    slug: "SAPPHIRE",
    displayName: "Sapphire",
    minAmount: 301,
    order: 3,
    imageUrl: "plaques/sapphire.png",
    freeShowDays: 30,
    benefits: [
      "Personalised Sapphire plaque shipped to you",
      "Your name engraved on the plaque",
      "Unique serial number for verification",
      "30 days free access to the artist's shows",
      "Priority manufacturing",
    ],
  },
  {
    slug: "EMERALD",
    displayName: "Emerald",
    minAmount: 501,
    order: 4,
    imageUrl: "plaques/emerald.png",
    freeShowDays: 60,
    benefits: [
      "Personalised Emerald plaque shipped to you",
      "Your name engraved on the plaque",
      "Unique serial number for verification",
      "60 days free access to the artist's shows",
      "Priority manufacturing",
      "Signed album art print",
    ],
  },
  {
    slug: "SILVER",
    displayName: "Silver",
    minAmount: 701,
    order: 5,
    imageUrl: "plaques/silver.png",
    freeShowDays: 120,
    benefits: [
      "Personalised Silver plaque shipped to you",
      "Your name engraved on the plaque",
      "Unique serial number for verification",
      "120 days free access to the artist's shows",
      "Priority manufacturing",
      "Signed album art print",
      "Behind-the-scenes content access",
    ],
  },
  {
    slug: "GOLD",
    displayName: "Gold",
    minAmount: 901,
    order: 6,
    imageUrl: "plaques/gold.png",
    freeShowDays: null,
    benefits: [
      "Personalised Gold plaque shipped to you",
      "Your name engraved on the plaque",
      "Unique serial number for verification",
      "Lifetime free access to the artist's shows",
      "Priority manufacturing",
      "Signed album art print",
      "Featured in album credits",
      "Direct line to the artist's management",
    ],
  },
];

async function seed() {
  await sequelize.sync();
  console.log("🌱 Seeding plaque tiers...\n");

  for (const t of TIERS) {
    const [row, created] = await PlaqueTier.findOrCreate({
      where: { slug: t.slug },
      defaults: t,
    });

    if (!created) {
      await row.update(t);
    }

    console.log(
      `✅ ${t.slug.padEnd(9)} min $${String(t.minAmount).padEnd(5)} (${t.benefits.length} benefits)`
    );
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`✅ ${TIERS.length} plaque tiers seeded`);
  console.log("─────────────────────────────────────────");
}

seed()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n❌ Seed failed:", err);
    await sequelize.close();
    process.exit(1);
  });