import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client.js';
import { env } from './env.js';

// Для пилота на PostgreSQL: provider = "postgresql" в schema.prisma и адаптер @prisma/adapter-pg
export const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: env.DATABASE_URL }),
});

/** Клиент внутри prisma.$transaction */
export type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
