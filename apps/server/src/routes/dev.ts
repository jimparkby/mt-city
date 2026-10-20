import type { FastifyPluginAsync } from 'fastify';
import { DevTimeSkipBody, START } from '@mt/shared';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { parse } from '../lib/validate.js';
import { getPlayerDto } from '../services/player.js';
import { tick } from '../services/tick.js';

const back = (d: Date | null, ms: number) => (d ? new Date(d.getTime() - ms) : null);

// Только local/demo (DEV_ENDPOINTS=true). Нужны для показа процентов и кредита на защите.
export const devRoutes: FastifyPluginAsync = async (app) => {
    // «Промотать» время = сдвинуть все таймеры игрока в прошлое, затем tick догонит события
    app.post('/dev/time-skip', async (req) => {
        const { days } = parse(DevTimeSkipBody, req.body);
        const ms = days * env.DAY_MS;
        const playerId = req.playerId;
        await prisma.$transaction(async (tx) => {
            const p = await tx.player.findUniqueOrThrow({
                where: { id: playerId },
                include: { deposits: true, loans: true, business: true, buildings: true, inventory: true },
            });
            await tx.player.update({ where: { id: p.id }, data: { lastTickAt: back(p.lastTickAt, ms)! } });
            for (const d of p.deposits) {
                await tx.deposit.update({
                    where: { id: d.id },
                    data: { startedAt: back(d.startedAt, ms)!, endsAt: back(d.endsAt, ms) },
                });
            }
            for (const l of p.loans) {
                await tx.loan.update({ where: { id: l.id }, data: { nextDueAt: back(l.nextDueAt, ms)! } });
            }
            if (p.business) {
                await tx.business.update({
                    where: { id: p.business.id },
                    data: { prodEndsAt: back(p.business.prodEndsAt, ms) },
                });
            }
            for (const b of p.buildings) {
                await tx.playerBuilding.update({
                    where: { id: b.id },
                    data: { upgradeEndsAt: back(b.upgradeEndsAt, ms) },
                });
            }
            for (const i of p.inventory) {
                await tx.inventoryItem.update({ where: { id: i.id }, data: { expiresAt: back(i.expiresAt, ms) } });
            }
        });
        await tick(playerId);
        return getPlayerDto(playerId);
    });

    app.post('/dev/reset', async (req) => {
        const id = req.playerId;
        const byPlayer = { where: { playerId: id } };
        await prisma.$transaction([
            prisma.deposit.deleteMany(byPlayer),
            prisma.loan.deleteMany(byPlayer),
            prisma.business.deleteMany(byPlayer),
            prisma.inventoryItem.deleteMany(byPlayer),
            prisma.playerBuilding.deleteMany(byPlayer),
            prisma.lessonProgress.deleteMany(byPlayer),
            prisma.transaction.deleteMany(byPlayer),
            prisma.parentTask.deleteMany(byPlayer),
            prisma.account.update({ where: { playerId: id }, data: { balance: START.balance } }),
            prisma.player.update({
                where: { id },
                data: {
                    energy: START.energy,
                    health: START.health,
                    creditScore: START.creditScore,
                    knowledge: 0,
                    bankLevel: 1,
                    insured: false,
                    onboardedAt: null,
                    lastTickAt: new Date(),
                },
            }),
        ]);
        return getPlayerDto(id);
    });
};
