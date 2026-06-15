import app from "@/app";
import { prisma } from "@/lib/prisma";

const PORT = parseInt(process.env.PORT || "8080", 10);

async function main() {
  // Verify DB connection
  try {
    await prisma.$connect();
    console.log("✅ Database connected.");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Filo API running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down...`);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main();
