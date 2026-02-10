import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
    { emit: "event", level: "info" },
  ],
});

if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e: { query: string; params: string; duration: number }) => {
    logger.debug(`Prisma Query: ${e.query}`, {
      action: "prisma_query",
      meta: { params: e.params, duration: e.duration },
    });
  });
}

prisma.$on("error", (e: { message: string; target?: string }) => {
  logger.error(`Prisma Error: ${e.message}`, { action: "prisma_error", meta: { target: e.target } });
});

prisma.$on("warn", (e: { message: string }) => {
  logger.warn(`Prisma Warning: ${e.message}`, { action: "prisma_warn" });
});

prisma.$on("info", (e: { message: string }) => {
  logger.info(`Prisma Info: ${e.message}`, { action: "prisma_info" });
});

export { prisma };
