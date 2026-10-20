import type { ErrorCode } from '@mt/shared';

const STATUS: Record<ErrorCode, number> = {
    INSUFFICIENT_FUNDS: 409,
    WALLET_CAP: 409,
    LOW_ENERGY: 409,
    LEVEL_LOCKED: 403,
    AGE_LOCKED: 403,
    VALIDATION: 400,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
};

/** Бросайте из сервисов — обработчик в app.ts превратит в { error: { code, message } } */
export class AppError extends Error {
    readonly status: number;

    constructor(
        readonly code: ErrorCode,
        message: string,
        readonly details?: unknown,
    ) {
        super(message);
        this.status = STATUS[code];
    }
}
