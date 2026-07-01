import { PrismaClient } from "./generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.POSTGRES_PRISMA_URL;

  // During build phase, POSTGRES_PRISMA_URL may not be available.
  // Return a proxy that throws on actual usage to allow the build to succeed.
  if (!connectionString) {
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === 'then' || prop === Symbol.toPrimitive || prop === Symbol.toStringTag) {
          return undefined;
        }
        throw new Error(
          `Prisma client is not available: POSTGRES_PRISMA_URL is not set. ` +
          `This typically occurs during the build phase.`
        );
      },
    });
  }

  // Remove sslmode from connection string to prevent it from overriding our explicit ssl config
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
