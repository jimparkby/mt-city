import type { FastifyPluginAsync } from 'fastify';
import { AuthSessionBody, MOCK_MOBY_PROFILE, MOCK_MOBY_TOKEN, START, type SessionDto } from '@mt/shared';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { AppError } from '../lib/errors.js';
import { parse } from '../lib/validate.js';
import { createSessionToken } from '../services/session.js';
import { getPlayerDto } from '../services/player.js';

/** Обмен токена Moby на профиль ребёнка. TODO(pilot): запрос к SSO-эндпоинту банка. */
async function resolveMobyProfile(mobyToken: string) {
    if (mobyToken === MOCK_MOBY_TOKEN && env.DEV_ENDPOINTS) return MOCK_MOBY_PROFILE;
    throw new AppError('UNAUTHORIZED', 'Не удалось войти через Moby');
}

export const authRoutes: FastifyPluginAsync = async (app) => {
    // Регистрации нет: банк уже знает пользователя. Первый вход создаёт игрока, следующие — находят его.
    app.post('/auth/session', async (req): Promise<SessionDto> => {
        const { mobyToken } = parse(AuthSessionBody, req.body);
        const profile = await resolveMobyProfile(mobyToken);

        const player = await prisma.player.upsert({
            where: { mobyUserId: profile.mobyUserId },
            update: {},
            create: {
                mobyUserId: profile.mobyUserId,
                name: profile.name,
                age: profile.age,
                mode: profile.age < 12 ? 'junior' : 'teen',
                account: { create: { balance: START.balance, walletCap: START.walletCap } },
            },
        });
        return { sessionToken: createSessionToken(player.id), player: await getPlayerDto(player.id) };
    });
};
