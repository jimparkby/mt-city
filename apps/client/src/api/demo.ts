// Демо-режим без сервера и БД: те же эндпоинты, что у apps/server, но считаются в браузере
// по формулам @mt/shared, а состояние живёт в localStorage. Включается, когда VITE_API_URL не задан
// (так работает деплой на Vercel). В пилоте деньги считает только сервер.

import {
    BUILDINGS,
    DAY_MS_DEFAULT,
    ENERGY,
    HOUR_MS_FACTOR,
    JOBS,
    LESSONS,
    LoanQuoteBody,
    MOCK_MOBY_PROFILE,
    OnboardingCompleteBody,
    SHOP_CATALOG,
    START,
    DevTimeSkipBody,
    daysElapsed,
    depositAmount,
    loanLimit,
    loanQuote,
    salaryAfterTax,
    type BankOverviewDto,
    type DepositDto,
    type LoanDto,
    type PlayerDto,
    type ProductDto,
    type SessionDto,
    type TransactionDto,
} from '@mt/shared';
import type { z } from 'zod';
import { ApiRequestError } from './client';

const KEY = 'mt-city:demo-state';
const DAY_MS = DAY_MS_DEFAULT;

interface DemoState {
    player: PlayerDto;
    deposits: Omit<DepositDto, 'current'>[];
    loans: LoanDto[];
    transactions: TransactionDto[];
    /** Промотка времени для показа процентов: «сейчас» = Date.now() + timeOffset */
    timeOffset: number;
    lastTickAt: number;
}

let memory: DemoState | null = null;

function now(s: DemoState) {
    return Date.now() + s.timeOffset;
}

function freshState(): DemoState {
    return {
        player: {
            id: 'demo-player',
            name: MOCK_MOBY_PROFILE.name,
            age: MOCK_MOBY_PROFILE.age,
            mode: MOCK_MOBY_PROFILE.age < 12 ? 'junior' : 'teen',
            bankLevel: 1,
            knowledge: 0,
            energy: START.energy,
            health: START.health,
            creditScore: START.creditScore,
            onboarded: false,
            account: { balance: START.balance, walletCap: START.walletCap },
            buildings: BUILDINGS.map((b) => ({ buildingId: b.id, level: 1, upgradeEndsAt: null })),
        },
        deposits: [],
        loans: [],
        transactions: [],
        timeOffset: 0,
        lastTickAt: Date.now(),
    };
}

function load(): DemoState {
    if (memory) return memory;
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) memory = JSON.parse(raw) as DemoState;
    } catch {
        // localStorage недоступен — живём в памяти
    }
    return (memory ??= freshState());
}

function save(s: DemoState) {
    memory = s;
    try {
        localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
        // ignore
    }
}

/** Аналог services/tick.ts: догоняем таймеры */
function tick(s: DemoState) {
    const hourMs = DAY_MS / HOUR_MS_FACTOR;
    const hours = Math.floor((now(s) - s.lastTickAt) / hourMs);
    if (hours <= 0) return;
    s.player.energy = Math.min(ENERGY.max, s.player.energy + hours * ENERGY.regenPerHour);
    s.lastTickAt += hours * hourMs;
}

function addMoney(s: DemoState, amount: number, kind: string, meta?: Record<string, unknown>) {
    const balance = s.player.account.balance + amount;
    if (balance < 0) throw new ApiRequestError(409, 'INSUFFICIENT_FUNDS', 'Недостаточно средств');
    s.player.account.balance = balance;
    s.transactions.unshift({
        id: crypto.randomUUID(),
        amount,
        kind,
        meta: meta ?? null,
        createdAt: new Date(now(s)).toISOString(),
    });
}

function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
    const r = schema.safeParse(data ?? {});
    if (!r.success) throw new ApiRequestError(400, 'VALIDATION', 'Некорректные данные запроса');
    return r.data;
}

type Handler = (s: DemoState, body: unknown, params: string[]) => unknown;

const routes: [method: string, pattern: RegExp, handler: Handler][] = [
    ['POST', /^\/auth\/session$/, (s): SessionDto => ({ sessionToken: 'demo', player: s.player })],
    ['GET', /^\/player\/me$/, (s) => s.player],
    [
        'POST',
        /^\/onboarding\/complete$/,
        (s, body) => {
            const { path } = parse(OnboardingCompleteBody, body);
            if (!s.player.onboarded) {
                s.player.onboarded = true;
                addMoney(s, START.onboardingBonus, 'bonus', { reason: 'onboarding', path });
            }
            return s.player;
        },
    ],
    ['GET', /^\/transactions/, (s) => s.transactions.slice(0, 50)],
    [
        'GET',
        /^\/bank\/overview$/,
        (s): BankOverviewDto => ({
            account: s.player.account,
            creditScore: s.player.creditScore,
            deposits: s.deposits
                .filter((d) => !d.closedAt)
                .map((d) => ({
                    ...d,
                    current: depositAmount(d.principal, d.rateBp, daysElapsed(now(s), Date.parse(d.startedAt), DAY_MS)),
                })),
            loans: s.loans.filter((l) => l.paidPeriods < l.periods),
        }),
    ],
    [
        'POST',
        /^\/bank\/loans\/quote$/,
        (s, body) => {
            const { amount, periods } = parse(LoanQuoteBody, body);
            const limit = loanLimit(null);
            if (amount > limit) throw new ApiRequestError(400, 'VALIDATION', 'Сумма больше лимита');
            const quote = loanQuote(amount, periods, s.player.creditScore);
            if (!quote) throw new ApiRequestError(403, 'LEVEL_LOCKED', 'Банк отказал: низкий кредитный рейтинг');
            return { ...quote, limit };
        },
    ],
    ['GET', /^\/shops$/, () => SHOP_CATALOG.map(({ products: _p, ...shop }) => shop)],
    [
        'GET',
        /^\/shops\/([^/]+)\/products$/,
        (_s, _b, [shopId]): ProductDto[] =>
            (SHOP_CATALOG.find((sh) => sh.id === shopId)?.products ?? []).map((p) => ({
                id: `${shopId}:${p.sku}`,
                shopId,
                sku: p.sku,
                name: p.name,
                price: p.price,
                bulkMinQty: p.bulkMinQty ?? null,
                bulkPrice: p.bulkPrice ?? null,
                shelfLife: p.shelfLife ?? null,
            })),
    ],
    ['GET', /^\/jobs$/, () => JOBS.map((j) => ({ ...j, wage: salaryAfterTax(j.baseWage) }))],
    [
        'GET',
        /^\/lessons$/,
        () =>
            LESSONS.map((l) => ({
                id: l.id,
                title: l.title,
                knowledgeReward: l.knowledgeReward,
                questions: l.questions.map(({ text, options }) => ({ text, options })),
                progress: null,
            })),
    ],
    [
        'POST',
        /^\/dev\/time-skip$/,
        (s, body) => {
            const { days } = parse(DevTimeSkipBody, body);
            s.timeOffset += days * DAY_MS;
            tick(s);
            return s.player;
        },
    ],
    [
        'POST',
        /^\/dev\/reset$/,
        (s) => {
            Object.assign(s, freshState());
            return s.player;
        },
    ],
];

export async function demoApi<T>(method: string, path: string, body?: unknown): Promise<T> {
    const s = load();
    tick(s);
    for (const [m, pattern, handler] of routes) {
        const match = m === method && path.match(pattern);
        if (match) {
            const result = handler(s, body, match.slice(1));
            save(s);
            // Копия, чтобы React Query видел новый объект
            return structuredClone(result) as T;
        }
    }
    throw new ApiRequestError(501, 'NOT_IMPLEMENTED', `${method} ${path} — в демо-режиме пока не реализовано`);
}
