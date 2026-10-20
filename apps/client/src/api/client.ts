import type { ApiError } from '@mt/shared';
import { useSession } from '../store/session';

/** Адрес сервера. Не задан → демо-режим: всё считается в браузере (src/api/demo.ts), сервер и БД не нужны. */
const BASE = import.meta.env.VITE_API_URL;
export const isDemoMode = !BASE;

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
    const method = init.method ?? (init.body !== undefined ? 'POST' : 'GET');

    if (isDemoMode) {
        const { demoApi } = await import('./demo');
        return demoApi<T>(method, path, init.body);
    }

    const token = useSession.getState().token;
    const res = await fetch(`${BASE}${path}`, {
        method,
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
