import { defineConfig, env } from 'prisma/config';

try {
    process.loadEnvFile('.env');
} catch {
    // .env нет — переменные приходят из окружения (Render/Railway)
}

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        seed: 'tsx prisma/seed.ts',
    },
    datasource: {
        url: env('DATABASE_URL'),
    },
});
