import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './env.js';
import { AppError } from './lib/errors.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { bankRoutes } from './routes/bank.js';
import { devRoutes } from './routes/dev.js';
import { playerRoutes } from './routes/player.js';
import { shopRoutes } from './routes/shop.js';
import { businessRoutes, jobsRoutes, lessonsRoutes, medicalRoutes, parentRoutes } from './routes/stubs.js';
import { tick } from './services/tick.js';

export async function buildApp() {
    const app = Fastify({ logger: { level: process.env.NODE_ENV === 'test' ? 'silent' : 'info' } });

    await app.register(cors, { origin: env.CLIENT_ORIGIN.split(',') });
    await app.register(rateLimit, {
        max: 60,
        timeWindow: '1 minute',
        keyGenerator: (req) => req.headers.authorization ?? req.ip,
    });
    await app.register(authPlugin);

    app.setErrorHandler((err, req, reply) => {
        if (err instanceof AppError) {
            return reply
                .code(err.status)
                .send({ error: { code: err.code, message: err.message, details: err.details } });
        }
        const status = (err as { statusCode?: number }).statusCode ?? 500;
        if (status >= 500) req.log.error(err);
        return reply
            .code(status)
            .send({ error: { code: status === 429 ? 'RATE_LIMIT' : 'INTERNAL', message: (err as Error).message } });
    });

    app.get('/health', async () => ({ ok: true }));

    await app.register(
        async (api) => {
            await api.register(authRoutes);

            // Всё ниже — только с токеном; перед каждым запросом сервер «догоняет» таймеры игрока
            await api.register(async (priv) => {
                priv.addHook('onRequest', priv.authenticate);
                priv.addHook('preHandler', async (req) => tick(req.playerId));

                await priv.register(playerRoutes);
                await priv.register(bankRoutes);
                await priv.register(shopRoutes);
                await priv.register(businessRoutes);
                await priv.register(jobsRoutes);
                await priv.register(medicalRoutes);
                await priv.register(lessonsRoutes);
                await priv.register(parentRoutes);
                if (env.DEV_ENDPOINTS) await priv.register(devRoutes);
            });
        },
        { prefix: '/api/v1' },
    );

    return app;
}
