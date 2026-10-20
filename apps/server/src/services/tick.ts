// «Догоняет» таймеры игрока при каждом запросе (ТЗ, раздел 8, Tick).
// Фоновых задач нет: всё считается от lastTickAt / startedAt / endsAt.

import { ENERGY, HOUR_MS_FACTOR, daysElapsed } from '@mt/shared';
import { prisma } from '../db.js';
import { env } from '../env.js';

export async function tick(playerId: string, now = new Date()) {
    await prisma.$transaction(async (tx) => {
        const player = await tx.player.findUnique({ where: { id: playerId } });
        if (!player) return;

        // 1. Прошедшие дни/часы с lastTickAt
        const since = player.lastTickAt.getTime();
        const days = daysElapsed(now.getTime(), since, env.DAY_MS);
        const hours = Math.floor((now.getTime() - since) / (env.DAY_MS / HOUR_MS_FACTOR));
        if (hours <= 0) return;

        // 2. Проценты по вкладам считаются «на лету» (depositAmount от startedAt), здесь — выплата созревших срочных
        // TODO(feat/bank): срочные вклады с endsAt ≤ now → закрыть, начислить A на счёт, Transaction "interest"

        // 3. TODO(feat/business): производство с prodEndsAt ≤ now → в инвентарь; улучшения зданий upgradeEndsAt ≤ now

        // 4. Просроченный товар → убыток
        await tx.inventoryItem.deleteMany({ where: { playerId, expiresAt: { lte: now } } });
        // TODO(feat/shop): записать списание в Transaction kind "loss" с суммой qty × unitCost

        // 5. TODO(feat/bank): платежи по кредитам с nextDueAt ≤ now → автосписание или штраф + adjustCreditScore

        // 6. TODO: налоговый период, инфляция, случайные события; seed = `${playerId}:${dayIndex}`
        void days;

        // 7. Энергия восстанавливается +10 в игровой час
        const energy = Math.min(ENERGY.max, player.energy + hours * ENERGY.regenPerHour);
        const consumed = hours * (env.DAY_MS / HOUR_MS_FACTOR);
        await tx.player.update({
            where: { id: playerId },
            data: { energy, lastTickAt: new Date(since + consumed) },
        });
    });
}
