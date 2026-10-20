import type { FastifyPluginAsync } from 'fastify';
import { OnboardingCompleteBody, START, TransactionsQuery, type TransactionDto } from '@mt/shared';
import { prisma } from '../db.js';
import { moveMoney } from '../lib/money.js';
import { parse } from '../lib/validate.js';
import { getPlayerDto } from '../services/player.js';

export const playerRoutes: FastifyPluginAsync = async (app) => {
    app.get('/player/me', async (req) => getPlayerDto(req.playerId));

    app.post('/onboarding/complete', async (req) => {
        const { path } = parse(OnboardingCompleteBody, req.body);
        await prisma.$transaction(async (tx) => {
            const p = await tx.player.findUniqueOrThrow({ where: { id: req.playerId } });
            if (p.onboardedAt) return;
            await tx.player.update({ where: { id: p.id }, data: { onboardedAt: new Date() } });
            await moveMoney(tx, p.id, START.onboardingBonus, 'bonus', { reason: 'onboarding', path });
        });
        return getPlayerDto(req.playerId);
    });

    app.get('/transactions', async (req): Promise<TransactionDto[]> => {
        const { limit } = parse(TransactionsQuery, req.query);
        const rows = await prisma.transaction.findMany({
            where: { playerId: req.playerId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return rows.map((t) => ({
            id: t.id,
            amount: t.amount,
            kind: t.kind,
            meta: t.meta ? JSON.parse(t.meta) : null,
            createdAt: t.createdAt.toISOString(),
        }));
    });
};
