import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../env.js';

// sessionToken = <playerId>.<hmac>. Без хранения в БД; для пилота — заменить на обмен токена Moby + срок жизни.

const sign = (playerId: string) => createHmac('sha256', env.SESSION_SECRET).update(playerId).digest('base64url');

export function createSessionToken(playerId: string): string {
    return `${playerId}.${sign(playerId)}`;
}

export function verifySessionToken(token: string): string | null {
    const [playerId, sig] = token.split('.');
    if (!playerId || !sig) return null;
    const expected = Buffer.from(sign(playerId));
    const actual = Buffer.from(sig);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    return playerId;
}
