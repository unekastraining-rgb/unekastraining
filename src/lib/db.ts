import path from "path";

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma";

function resolveSqliteUrl(): string {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

  if (!databaseUrl.startsWith("file:")) {
    return databaseUrl;
  }

  const filePath = databaseUrl.replace(/^file:/, "");

  if (path.isAbsolute(filePath)) {
    return `file:${filePath}`;
  }

  return `file:${path.join(/* turbopackIgnore: true */ process.cwd(), filePath.replace(/^\.\//, ""))}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion?: number;
};

// Bump when Prisma schema adds models so dev hot-reload picks up a fresh client.
const PRISMA_CLIENT_VERSION = 8;

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: resolveSqliteUrl(),
  });

  return new PrismaClient({ adapter });
}

function isPrismaClientCurrent(client: PrismaClient | undefined): client is PrismaClient {
  return Boolean(
    client &&
      globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION &&
      typeof client.resource?.findMany === "function",
  );
}

function getPrismaClient(): PrismaClient {
  if (isPrismaClientCurrent(globalForPrisma.prisma)) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  }

  return client;
}

export const db = getPrismaClient();
