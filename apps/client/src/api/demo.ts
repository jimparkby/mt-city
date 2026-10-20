// Демо-режим без сервера и БД: те же эндпоинты, что у apps/server, но считаются в браузере
// по формулам и редьюсерам из @mt/shared, а состояние живёт в localStorage. Включается, когда VITE_API_URL
// не задан (так работает деплой на Vercel). В пилоте деньги считает только сервер.

import {
    BUILDINGS,
    DAY_MS_DEFAULT,
    DevTimeSkipBody,
    ENERGY,
    HOUR_MS_FACTOR,
    JOBS,
    LESSONS,
    LoanQuoteBody,
    MOCK_MOBY_PROFILE,
    OnboardingCompleteBody,
    SHOP_CATALOG,
    START,
    applyGameAction,
    daysElapsed,
    depositAmount,
    initialGame,
    loanLimit,
    loanQuote,
    salaryAfterTax,
    type BankOverviewDto,
    type DepositDto,
    type GameAction,
    type GameState,
    type LoanDto,
    type PlayerDto,
    type ProductDto,
    type SessionDto,
    type TransactionDto,
} from '@mt/shared';
import type { z } from 'zod';
import { ApiRequestError } from './client';

const KEY = 'mt-city:demo-state:v2';
const DAY_MS = DAY_MS_DEFAULT;

interface DemoState {
    game: GameState;
    energy: number;
    onboarded: boolean;
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
        game: initialGame(),
        energy: START.energy,
        onboarded: true,
        deposits: [],
        loans: [],
        transactions: [],
        timeOffset: 0,
        lastTickAt: Date.now(),
    };
}

function toPlayer(s: DemoState): PlayerDto {
    return {
        id: 'demo-player',
        name: MOCK_MOBY_PROFILE.name,
        age: MOCK_MOBY_PROFILE.age,
        mode: MOCK_MOBY_PROFILE.age < 12 ? 'junior' : 'teen',
        bankLevel: s.game.level,
        knowledge: s.game.knowledge,
        energy: s.energy,
        health: START.health,
        creditScore: START.creditScore,
        onboarded: s.onboarded,
        account: { balance: s.game.coins, walletCap: START.walletCap },
        buildings: BUILDINGS.map((b) => ({ buildingId: b.id, level: 1, upgradeEndsAt: null })),
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
    s.energy = Math.min(ENERGY.max, s.energy + hours * ENERGY.regenPerHour);
    s.lastTickAt += hours * hourMs;
}

function logTransaction(s: DemoState, amount: number, kind: string, meta?: Record<string, unknown>) {
    if (amount === 0) return;
    s.transactions.unshift({
        id: crypto.randomUUID(),
        amount,
        kind,
        meta: meta ?? null,
        createdAt: new Date(now(s)).toISOString(),
    });
}

function addCoins(s: DemoState, amount: number, kind: string, meta?: Record<string, unknown>) {
    if (s.game.coins + amount < 0) throw new ApiRequestError(409, 'INSUFFICIENT_FUNDS', 'Недостаточно средств');
    s.game = { ...s.game, coins: s.game.coins + amount };
    logTransaction(s, amount, kind, meta);
}

function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
    const r = schema.safeParse(data ?? {});
    if (!r.success) throw new ApiRequestError(400, 'VALIDATION', 'Некорректные данные запроса');
    return r.data;
}

type Handler = (s: DemoState, body: unknown, params: string[]) => unknown;

const routes: [method: string, pattern: RegExp, handler: Handler][] = [
    ['POST', /^\/auth\/session$/, (s): SessionDto => ({ sessionToken: 'demo', player: toPlayer(s) })],
    ['GET', /^\/player\/me$/, (s) => toPlayer(s)],
    [
        'POST',
        /^\/onboarding\/complete$/,
        (s, body) => {
            const { path } = parse(OnboardingCompleteBody, body);
            if (!s.onboarded) {
                s.onboarded = true;
                addCoins(s, START.onboardingBonus, 'bonus', { reason: 'onboarding', path });
            }
            return toPlayer(s);
        },
    ],
    ['GET', /^\/game$/, (s) => s.game],
    [
        'POST',
        /^\/game\/action$/,
        (s, body) => {
            const action = body as GameAction;
            const before = s.game.coins;
            s.game = applyGameAction(s.game, action);
            logTransaction(s, s.game.coins - before, 'reward', { action: action.type });
            return s.game;
        },
    ],
    ['GET', /^\/transactions/, (s) => s.transactions.slice(0, 50)],
    [
        'GET',
        /^\/bank\/overview$/,
        (s): BankOverviewDto => ({
            account: toPlayer(s).account,
            creditScore: START.creditScore,
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
        (_s, body) => {
            const { amount, periods } = parse(LoanQuoteBody, body);
            const limit = loanLimit(null);
            if (amount > limit) throw new ApiRequestError(400, 'VALIDATION', 'Сумма больше лимита');
            const quote = loanQuote(amount, periods, START.creditScore);
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
            return toPlayer(s);
        },
    ],
    [
        'POST',
        /^\/dev\/reset$/,
        (s) => {
            Object.assign(s, freshState());
            return toPlayer(s);
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
