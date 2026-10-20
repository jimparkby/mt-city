import type { Tx } from '../db.js';
import { AppError } from './errors.js';

/**
 * Единственный способ менять баланс: проверка средств/лимита + запись в журнал Transaction.
 * Вызывать только внутри prisma.$transaction.
 */
export async function moveMoney(
    tx: Tx,
    playerId: string,
    amount: number,
    kind: string,
    meta?: Record<string, unknown>,
) {
    const account = await tx.account.findUniqueOrThrow({ where: { playerId } });
    const balance = account.balance + amount;
    if (balance < 0) throw new AppError('INSUFFICIENT_FUNDS', 'Недостаточно средств');
    if (amount > 0 && balance > account.walletCap) {
        throw new AppError('WALLET_CAP', 'Кошелёк переполнен — положи деньги в Копилку');
    }
    await tx.transaction.create({
        data: { playerId, amount, kind, meta: meta ? JSON.stringify(meta) : null },
    });
    return tx.account.update({ where: { playerId }, data: { balance } });
}
