import fp from 'fastify-plugin';
import type { FastifyRequest } from 'fastify';
import { AppError } from '../lib/errors.js';
import { verifySessionToken } from '../services/session.js';

declare module 'fastify' {
    interface FastifyRequest {
        playerId: string;
    }
    interface FastifyInstance {
        authenticate: (req: FastifyRequest) => Promise<void>;
    }
}

/** Проверка Authorization: Bearer <sessionToken>. Подключение в роуте: { onRequest: app.authenticate } */
export const authPlugin = fp(async (app) => {
    app.decorateRequest('playerId', '');
    app.decorate('authenticate', async (req: FastifyRequest) => {
        const header = req.headers.authorization ?? '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : '';
        const playerId = token ? verifySessionToken(token) : null;
        if (!playerId) throw new AppError('UNAUTHORIZED', 'Нужна авторизация');
        req.playerId = playerId;
    });
});
