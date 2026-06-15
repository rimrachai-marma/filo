import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { FileType, PrismaClient } from "@/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Default admin
  const hashed = await bcrypt.hash("admin#123", 10);
  await prisma.admin.upsert({
    where: { email: "admin@filo.com" },
    update: {},
    create: { email: "admin@filo.com", password: hashed },
  });

  // Default packages
  const packages = [
    {
      name: "FREE",
      displayName: "Free",
      maxFolders: 5,
      maxNestingLevel: 2,
      allowedFileTypes: [FileType.IMAGE, FileType.PDF],
      maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB
      totalFileLimit: 20,
      filesPerFolder: 5,
      storageLimitBytes: 500 * 1024 * 1024, // 500 MB
      tierColor: "#64748b",
    },
    {
      name: "SILVER",
      displayName: "Silver",
      maxFolders: 20,
      maxNestingLevel: 3,
      allowedFileTypes: [FileType.IMAGE, FileType.VIDEO, FileType.PDF, FileType.AUDIO],
      maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB
      totalFileLimit: 100,
      filesPerFolder: 20,
      storageLimitBytes: 2 * 1024 * 1024 * 1024, // 2 GB
      tierColor: "#94a3b8",
    },
    {
      name: "GOLD",
      displayName: "Gold",
      maxFolders: 50,
      maxNestingLevel: 5,
      allowedFileTypes: [FileType.IMAGE, FileType.VIDEO, FileType.PDF, FileType.AUDIO],
      maxFileSizeBytes: 100 * 1024 * 1024, // 100 MB
      totalFileLimit: 500,
      filesPerFolder: 50,
      storageLimitBytes: 5 * 1024 * 1024 * 1024, // 5 GB
      tierColor: "#fbbf24",
    },
    {
      name: "DIAMOND",
      displayName: "Diamond",
      maxFolders: 200,
      maxNestingLevel: 10,
      allowedFileTypes: [FileType.IMAGE, FileType.VIDEO, FileType.PDF, FileType.AUDIO],
      maxFileSizeBytes: 500 * 1024 * 1024, // 500 MB
      totalFileLimit: 5000,
      filesPerFolder: 200,
      storageLimitBytes: 10 * 1024 * 1024 * 1024, // 10 GB
      tierColor: "#818cf8",
    },
  ];

  for (const pkg of packages) {
    await prisma.subscriptionPackage.upsert({ where: { name: pkg.name }, update: pkg, create: pkg });
  }

  console.log("✅ Seeded successfully!");
  console.log("📧 Admin: admin@filo.com");
  console.log("🔑 Password: admin#123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
