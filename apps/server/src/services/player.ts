import type { PlayerDto } from '@mt/shared';
import { prisma } from '../db.js';
import { AppError } from '../lib/errors.js';

export async function getPlayerDto(playerId: string): Promise<PlayerDto> {
    const p = await prisma.player.findUnique({
        where: { id: playerId },
        include: { account: true, buildings: true },
    });
    if (!p || !p.account) throw new AppError('NOT_FOUND', 'Игрок не найден');
    return {
        id: p.id,
        name: p.name,
        age: p.age,
        mode: p.mode as PlayerDto['mode'],
        bankLevel: p.bankLevel,
        knowledge: p.knowledge,
        energy: p.energy,
        health: p.health,
        creditScore: p.creditScore,
        onboarded: p.onboardedAt !== null,
        account: { balance: p.account.balance, walletCap: p.account.walletCap },
        buildings: p.buildings.map((b) => ({
            buildingId: b.buildingId,
            level: b.level,
            upgradeEndsAt: b.upgradeEndsAt?.toISOString() ?? null,
        })),
    };
}
