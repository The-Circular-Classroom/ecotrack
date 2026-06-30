import { PrismaClient } from "./generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Remove sslmode from connection string to prevent it from overriding our explicit ssl config
  const connectionString = process.env.POSTGRES_PRISMA_URL!;
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');

  const pool = new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
