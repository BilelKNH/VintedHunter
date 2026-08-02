import { Marketplace, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const listings = [
  {
    externalId: "seed-listing-1",
    source: Marketplace.VINTED,
    title: "Nike Tech Fleece Hoodie",
    description: "Excellent condition, worn twice.",
    brand: "Nike",
    category: "Hoodie",
    size: "L",
    condition: "Excellent",
    price: 35,
    currency: "EUR",
    url: "https://www.vinted.fr/items/seed-1",
    images: ["https://images.example/seed-1-a.jpg"],
  },
  {
    externalId: "seed-listing-2",
    source: Marketplace.VINTED,
    title: "Stone Island Shadow Project Sweatshirt",
    description: "Rare piece, minor pilling on sleeve.",
    brand: "Stone Island",
    category: "Sweatshirt",
    size: "M",
    condition: "Good",
    price: 80,
    currency: "EUR",
    url: "https://www.vinted.fr/items/seed-2",
    images: ["https://images.example/seed-2-a.jpg"],
  },
  {
    externalId: "seed-listing-3",
    source: Marketplace.VINTED,
    title: "Arc'Teryx Beta AR Jacket",
    description: "Great shell jacket, light use.",
    brand: "Arc'Teryx",
    category: "Jacket",
    size: "M",
    condition: "Excellent",
    price: 220,
    currency: "EUR",
    url: "https://www.vinted.fr/items/seed-3",
    images: ["https://images.example/seed-3-a.jpg"],
  },
];

async function main(): Promise<void> {
  const seller = await prisma.seller.upsert({
    where: { externalId: "seed-seller-1" },
    update: {},
    create: {
      externalId: "seed-seller-1",
      username: "vintage_reseller",
      rating: 4.9,
      reviews: 342,
      accountAge: 720,
      totalListings: 58,
      riskScore: 5,
    },
  });

  for (const listing of listings) {
    await prisma.listing.upsert({
      where: { externalId: listing.externalId },
      update: {},
      create: { ...listing, sellerId: seller.id },
    });
  }

  console.log(`Seeded 1 seller and ${listings.length} listings.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
