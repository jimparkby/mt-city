import type { FastifyPluginAsync } from 'fastify';
import { AuthSessionBody, START, type SessionDto } from '@mt/shared';
import { prisma } from '../db.js';
import { AppError } from '../lib/errors.js';
import { parse } from '../lib/validate.js';
import { createSessionToken } from '../services/session.js';
import { getPlayerDto } from '../services/player.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
    // В mock — вход по имени и возрасту. В пилоте — обмен mobyToken на профиль у банка.
    app.post('/auth/session', async (req): Promise<SessionDto> => {
        const body = parse(AuthSessionBody, req.body);
        if (body.mobyToken) {
            // TODO(pilot): обменять mobyToken на { mobyUserId, age, parentId } через API банка
            throw new AppError('UNAUTHORIZED', 'Вход через Moby пока не поддерживается');
        }
        if (!body.name || !body.age) throw new AppError('VALIDATION', 'Нужны имя и возраст');

        const player = await prisma.player.create({
            data: {
                name: body.name,
                age: body.age,
                mode: body.age < 12 ? 'junior' : 'teen',
                account: { create: { balance: START.balance, walletCap: START.walletCap } },
            },
        });
        return { sessionToken: createSessionToken(player.id), player: await getPlayerDto(player.id) };
    });
};
