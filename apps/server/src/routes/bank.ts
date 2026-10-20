import type { FastifyPluginAsync } from 'fastify';
import { LoanQuoteBody, daysElapsed, depositAmount, loanLimit, loanQuote, type BankOverviewDto } from '@mt/shared';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { AppError } from '../lib/errors.js';
import { parse } from '../lib/validate.js';
import { notImplemented } from './todo.js';

export const bankRoutes: FastifyPluginAsync = async (app) => {
    app.get('/bank/overview', async (req): Promise<BankOverviewDto> => {
        const p = await prisma.player.findUniqueOrThrow({
            where: { id: req.playerId },
            include: { account: true, deposits: { where: { closedAt: null } }, loans: true },
        });
        const now = Date.now();
        return {
            account: { balance: p.account!.balance, walletCap: p.account!.walletCap },
            creditScore: p.creditScore,
            deposits: p.deposits.map((d) => ({
                id: d.id,
                type: d.type as 'demand' | 'term',
                principal: d.principal,
                rateBp: d.rateBp,
                startedAt: d.startedAt.toISOString(),
                endsAt: d.endsAt?.toISOString() ?? null,
                closedAt: null,
                current: depositAmount(d.principal, d.rateBp, daysElapsed(now, d.startedAt.getTime(), env.DAY_MS)),
            })),
            loans: p.loans
                .filter((l) => l.paidPeriods < l.periods)
                .map((l) => ({
                    id: l.id,
                    principal: l.principal,
                    rateBp: l.rateBp,
                    periods: l.periods,
                    payment: l.payment,
                    paidPeriods: l.paidPeriods,
                    nextDueAt: l.nextDueAt.toISOString(),
                    overdue: l.overdue,
                    purpose: l.purpose,
                })),
        };
    });

    app.post('/bank/loans/quote', async (req) => {
        const { amount, periods } = parse(LoanQuoteBody, req.body);
        const p = await prisma.player.findUniqueOrThrow({ where: { id: req.playerId }, include: { business: true } });
        // TODO(feat/bank): выручка бизнеса за 7 дней из Transaction kind "sale"
        const limit = loanLimit(p.business ? 0 : null);
        if (amount > limit) throw new AppError('VALIDATION', 'Сумма больше лимита', { limit });
        const quote = loanQuote(amount, periods, p.creditScore);
        if (!quote) throw new AppError('LEVEL_LOCKED', 'Банк отказал: низкий кредитный рейтинг');
        return { ...quote, limit };
    });

    app.post('/bank/deposits', notImplemented('feat/bank'));
    app.post('/bank/deposits/:id/close', notImplemented('feat/bank'));
    app.post('/bank/loans', notImplemented('feat/bank'));
    app.post('/bank/loans/:id/pay', notImplemented('feat/bank'));
};
