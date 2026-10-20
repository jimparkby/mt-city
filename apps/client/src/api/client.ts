import type { ApiError } from '@mt/shared';
import { useSession } from '../store/session';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiRequestError extends Error {
    constructor(
        readonly status: number,
        readonly code: string,
        message: string,
    ) {
        super(message);
    }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
    const token = useSession.getState().token;
    const res = await fetch(`${BASE}${path}`, {
        method: init.method ?? (init.body ? 'POST' : 'GET'),
        headers: {
            ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        if (res.status === 401) useSession.getState().setToken(null);
        throw new ApiRequestError(res.status, err?.error.code ?? 'INTERNAL', err?.error.message ?? res.statusText);
    }
    return res.json() as Promise<T>;
}
