// Пакет «Moby Семья»: оформление, родительский контроль, операции по детской карте, запросы ребёнка,
// карманные деньги, партнёры с семейным кешбэком и страховка. Все суммы — копейки BYN.
// Правила проверки покупки повторяют то, что в пилоте делает процессинг банка по настройкам родителя.

import type { GameState } from './game.js';

export type AgeGroup = 'kid' | 'teen';

/** Категории трат; gambling и adult запрещены для детских карт всегда */
export type SpendCat = 'food' | 'transport' | 'games' | 'fun' | 'shops' | 'gambling' | 'adult';
export type Feature = 'online' | 'cash' | 'transfers';
export type ChildProduct = 'kopilka' | 'deposits';

export const SPEND_CATS: { id: SpendCat; name: string; hint: string; forbidden?: boolean }[] = [
    { id: 'food', name: 'Еда и кафе', hint: 'столовая, кафе, продукты' },
    { id: 'transport', name: 'Транспорт', hint: 'проезд, такси' },
    { id: 'shops', name: 'Магазины', hint: 'одежда, канцтовары' },
    { id: 'fun', name: 'Развлечения', hint: 'кино, парки, кружки' },
    { id: 'games', name: 'Игры и приложения', hint: 'покупки в играх, подписки' },
    { id: 'gambling', name: 'Азартные игры и ставки', hint: 'запрещено законом', forbidden: true },
    { id: 'adult', name: 'Алкоголь, табак, 18+', hint: 'запрещено законом', forbidden: true },
];

export const FEATURES: { id: Feature; name: string; hint: string }[] = [
    { id: 'online', name: 'Покупки в интернете', hint: 'оплата картой на сайтах и в приложениях' },
    { id: 'cash', name: 'Снятие наличных', hint: 'в банкоматах МТБанка без комиссии' },
    { id: 'transfers', name: 'Переводы друзьям', hint: 'по номеру телефона внутри Moby' },
];

export const CHILD_PRODUCTS: { id: ChildProduct; name: string; hint: string; teenOnly?: boolean }[] = [
    { id: 'kopilka', name: 'Копилка', hint: 'накопление на цель с процентами' },
    { id: 'deposits', name: 'Вклады в BYN', hint: 'с 14 лет подросток открывает вклад сам', teenOnly: true },
];

export interface Controls {
    /** Ребёнок может входить в Moby на своём телефоне */
    childAccess: boolean;
    blocked: boolean;
    /** Заблокирована как потерянная — нужен перевыпуск */
    lost: boolean;
    dayLimit: number;
    monthLimit: number;
    /** Покупки дороже этой суммы ждут подтверждения родителя; 0 — без подтверждения */
    approveOver: number;
    /** Новые подписки ребёнка — только с согласия родителя */
    subsApproval: boolean;
    cats: Record<SpendCat, boolean>;
    features: Record<Feature, boolean>;
    products: Record<ChildProduct, boolean>;
}

export interface FamilyPackage {
    age: AgeGroup;
    card: 'physical' | 'digital';
    delivery: 'courier' | 'office';
    /** Код, по которому ребёнок входит в Moby */
    invite: string;
    marketing: boolean;
}

export type OpStatus = 'done' | 'declined' | 'pending' | 'disputed';

/** Кто в семье подключил подписку */
export type Member = 'parent' | 'kid' | 'teen';

export interface Subscription {
    id: string;
    name: string;
    /** Музыка, кино, игры, облако — для подсказок о дублях */
    kind: 'music' | 'video' | 'games' | 'cloud' | 'edu';
    who: Member;
    /** Платёж в месяц, копейки BYN */
    amt: number;
    /** День месяца списания */
    day: number;
    status: 'active' | 'paused';
    /** Подключена по семейному тарифу или бесплатно у партнёра */
    note?: string;
}

export const SUB_KINDS: Record<Subscription['kind'], string> = {
    music: 'Музыка',
    video: 'Кино и сериалы',
    games: 'Игры',
    cloud: 'Облако',
    edu: 'Обучение',
};

export interface CardOp {
    id: string;
    title: string;
    cat: SpendCat | 'income';
    /** Списание (> 0) или поступление (< 0 не используем: см. income) */
    amt: number;
    income?: boolean;
    status: OpStatus;
    reason?: string;
    partner?: string;
    at: number;
    /** Покупка оформляет подписку */
    sub?: Subscription['kind'];
    who?: Member;
}

export interface ChildRequest {
    id: string;
    kind: 'money' | 'feature' | 'product';
    key?: Feature | ChildProduct;
    amt?: number;
    note: string;
    status: 'open' | 'ok' | 'no';
    at: number;
}

export interface Pocket {
    on: boolean;
    amt: number;
    period: 'day' | 'week' | 'month';
}

export interface FamilyState {
    pkg: FamilyPackage | null;
    controls: Controls;
    ops: CardOp[];
    requests: ChildRequest[];
    pocket: Pocket;
    /** Баллы программы лояльности: копятся отдельно у ребёнка и у родителя (100 баллов = 1 BYN) */
    points: { parent: number; child: number };
    /** Потрачено за день и месяц — для лимитов */
    spent: { day: number; month: number };
    insurance: boolean;
    /** Сколько раз карту перевыпускали — меняет последние цифры номера */
    reissued: number;
    subs: Subscription[];
}

export type FamilyAction =
    | { type: 'pkg/issue'; pkg: Omit<FamilyPackage, 'invite'>; insurance: boolean }
    | { type: 'pkg/cancel' }
    | { type: 'controls/set'; patch: Partial<Controls> }
    | { type: 'op/pay'; merchant: string; teen?: boolean }
    | { type: 'op/approve'; id: string; teen?: boolean }
    | { type: 'op/decline'; id: string }
    | { type: 'op/dispute'; id: string }
    | { type: 'card/block'; lost?: boolean }
    | { type: 'card/unblock' }
    | { type: 'card/reissue' }
    | { type: 'req/create'; kind: ChildRequest['kind']; key?: Feature | ChildProduct; amt?: number; note: string }
    | { type: 'req/resolve'; id: string; ok: boolean }
    | { type: 'pocket/set'; patch: Partial<Pocket> }
    | { type: 'pocket/pay' }
    | { type: 'insurance/set'; on: boolean }
    | { type: 'sub/cancel'; id: string }
    | { type: 'sub/pause'; id: string };

/** Стоимость страховки ребёнка в месяц и покрытие (условия в демо приблизительные) */
export const INSURANCE = { monthly: 200, cover: 500_000 };

export const PERIOD_NAMES: Record<Pocket['period'], string> = {
    day: 'каждый день',
    week: 'каждую неделю',
    month: 'каждый месяц',
};

export interface Partner {
    id: string;
    name: string;
    kind: string;
    offer: string;
    /** Семейный кешбэк баллами, % */
    cb: number;
    /** Здание партнёра в МТ Сити */
    city?: string;
}

/** Партнёры программы (в демо — пример набора: кафе, продукты, развлечения, медицина, обучение) */
export const PARTNERS: Partner[] = [
    { id: 'cofix', name: 'Cofix', kind: 'Кафе', offer: 'Какао и выпечка −15% по детской карте', cb: 5, city: 'cofix' },
    {
        id: 'sosedi',
        name: 'Соседи',
        kind: 'Продукты',
        offer: 'Семейный кешбэк на продукты к ужину',
        cb: 3,
        city: 'sosedi',
    },
    {
        id: 'green',
        name: 'Грин',
        kind: 'Гипермаркет',
        offer: 'Кешбэк на канцтовары и форму к школе',
        cb: 3,
        city: 'green',
    },
    {
        id: 'jump',
        name: 'Батутный центр «Прыжок»',
        kind: 'Развлечения',
        offer: 'Второй час бесплатно в выходные',
        cb: 7,
    },
    {
        id: 'clinic',
        name: 'Детский медцентр «Здоровье»',
        kind: 'Медицина',
        offer: '−10% на приём педиатра для всей семьи',
        cb: 5,
        city: 'med',
    },
    { id: 'code', name: 'Школа программирования «Код»', kind: 'Обучение', offer: 'Первый месяц занятий −20%', cb: 4 },
    { id: 'kino', name: 'Онлайн-кинотеатр', kind: 'Подписка', offer: 'Детский профиль бесплатно 3 месяца', cb: 0 },
];

export interface Merchant {
    /** Покупка — это подписка с ежемесячным списанием */
    sub?: Subscription['kind'];
    id: string;
    title: string;
    cat: SpendCat;
    amt: number;
    online?: boolean;
    partner?: string;
}

/** Покупки, которые ребёнок может «совершить» в демо, чтобы увидеть работу ограничений */
export const MERCHANTS: Merchant[] = [
    { id: 'cofix', title: 'Cofix · какао', cat: 'food', amt: 450, partner: 'cofix' },
    { id: 'bus', title: 'Проезд в автобусе', cat: 'transport', amt: 90 },
    { id: 'sosedi', title: 'Соседи · перекус', cat: 'food', amt: 720, partner: 'sosedi' },
    { id: 'green', title: 'Грин · канцтовары', cat: 'shops', amt: 1_290, partner: 'green' },
    { id: 'jump', title: 'Батутный центр «Прыжок»', cat: 'fun', amt: 1_500, partner: 'jump' },
    { id: 'game', title: 'Скин в игре', cat: 'games', amt: 1_800, online: true },
    { id: 'sneakers', title: 'Кроссовки в интернет-магазине', cat: 'shops', amt: 9_500, online: true },
    { id: 'casino', title: 'Онлайн-казино', cat: 'gambling', amt: 2_000, online: true },
    { id: 'vape', title: 'Вейп-шоп', cat: 'adult', amt: 3_500 },
    { id: 'music', title: 'Подписка на музыку', cat: 'games', amt: 499, online: true, sub: 'music' },
];

export function defaultControls(age: AgeGroup): Controls {
    const teen = age === 'teen';
    return {
        childAccess: true,
        blocked: false,
        lost: false,
        dayLimit: teen ? 5_000 : 2_000,
        monthLimit: teen ? 40_000 : 15_000,
        approveOver: teen ? 3_000 : 1_000,
        cats: { food: true, transport: true, shops: true, fun: true, games: teen, gambling: false, adult: false },
        features: { online: teen, cash: teen, transfers: teen },
        products: { kopilka: true, deposits: true },
        subsApproval: true,
    };
}

const DAY = 86_400_000;

export const initialFamily = (): FamilyState => {
    const now = Date.now();
    return {
        pkg: { age: 'kid', card: 'physical', delivery: 'courier', invite: 'MOBY-4821', marketing: true },
        controls: defaultControls('kid'),
        ops: [
            {
                id: 'o3',
                title: 'Онлайн-казино',
                cat: 'gambling',
                amt: 2_000,
                status: 'declined',
                reason: 'Запрещено для детских карт',
                at: now - 0.2 * DAY,
            },
            {
                id: 'o2',
                title: 'Cofix · какао',
                cat: 'food',
                amt: 450,
                status: 'done',
                partner: 'cofix',
                at: now - 0.4 * DAY,
            },
            {
                id: 'o1',
                title: 'Карманные деньги',
                cat: 'income',
                amt: 1_000,
                income: true,
                status: 'done',
                at: now - 2 * DAY,
            },
        ],
        requests: [],
        pocket: { on: true, amt: 1_000, period: 'week' },
        points: { parent: 1_240, child: 23 },
        spent: { day: 450, month: 3_120 },
        insurance: false,
        reissued: 0,
        subs: [
            {
                id: 's1',
                name: 'Онлайн-кинотеатр · семейный',
                kind: 'video',
                who: 'parent',
                amt: 1_990,
                day: 5,
                status: 'active',
            },
            { id: 's2', name: 'Музыка', kind: 'music', who: 'parent', amt: 799, day: 12, status: 'active' },
            { id: 's3', name: 'Облако для фото', kind: 'cloud', who: 'parent', amt: 499, day: 20, status: 'active' },
            {
                id: 's4',
                name: 'Детский онлайн-кинотеатр',
                kind: 'video',
                who: 'kid',
                amt: 0,
                day: 3,
                status: 'active',
                note: 'бесплатно 3 месяца у партнёра',
            },
            { id: 's5', name: 'Боевой пропуск в игре', kind: 'games', who: 'kid', amt: 990, day: 15, status: 'active' },
            { id: 's6', name: 'Музыка', kind: 'music', who: 'teen', amt: 499, day: 9, status: 'active' },
            { id: 's7', name: 'Игровая подписка', kind: 'games', who: 'teen', amt: 1_490, day: 25, status: 'active' },
            {
                id: 's8',
                name: 'Английский с репетитором онлайн',
                kind: 'edu',
                who: 'teen',
                amt: 2_500,
                day: 1,
                status: 'paused',
            },
        ],
    };
};

let seq = 0;
const nid = (p: string) => `${p}${Date.now().toString(36)}${++seq}`;

/** Номер детской карты меняется при перевыпуске */
export const childCardTail = (s: FamilyState) => String(7310 + s.reissued * 137).slice(-4);

/** Решение по покупке: проходит, отклоняется (с причиной) или ждёт подтверждения родителя */
export function checkPurchase(s: GameState, m: Merchant, teen = false): { status: OpStatus; reason?: string } {
    const c = s.controls;
    const cat = SPEND_CATS.find((x) => x.id === m.cat)!;
    if (c.blocked)
        return {
            status: 'declined',
            reason: c.lost ? 'Карта заблокирована: потеряна' : 'Карта заблокирована родителем',
        };
    if (cat.forbidden) return { status: 'declined', reason: 'Запрещено для детских карт' };
    if (!c.cats[m.cat]) return { status: 'declined', reason: `Категория «${cat.name}» выключена родителем` };
    if (m.online && !c.features.online) return { status: 'declined', reason: 'Покупки в интернете выключены' };
    if (m.amt > s.byn) return { status: 'declined', reason: 'Недостаточно денег на карте' };
    if (s.spent.day + m.amt > c.dayLimit) return { status: 'declined', reason: 'Превышен дневной лимит' };
    if (s.spent.month + m.amt > c.monthLimit) return { status: 'declined', reason: 'Превышен месячный лимит' };
    // Подписки 7–13 лет — только с согласия родителя; подросток 14+ подключает сам, родитель видит их в «Подписках семьи»
    if (m.sub && c.subsApproval && !teen)
        return { status: 'pending', reason: 'Новая подписка — нужно согласие родителя' };
    if (c.approveOver > 0 && m.amt > c.approveOver) return { status: 'pending', reason: 'Ждёт подтверждения родителя' };
    return { status: 'done' };
}

/** Списание и начисления по проведённой покупке: семейные баллы у партнёров, кешбэк подростка по тратам */
function settle(s: GameState, m: Merchant, teenCb: number, who: Member): GameState {
    const partner = PARTNERS.find((p) => p.id === m.partner);
    const childPts = partner ? Math.round((m.amt * partner.cb) / 100) : 0;
    // Семейный бонус: родителю 1% от покупок ребёнка у партнёров
    const parentPts = partner ? Math.round(m.amt / 100) : 0;
    const cashback = Math.round((m.amt * teenCb) / 100);
    const subs: Subscription[] = m.sub
        ? [
              ...s.subs,
              {
                  id: nid('s'),
                  name: m.title.replace(/^Подписка на /, '').replace(/^./, (c) => c.toUpperCase()),
                  kind: m.sub,
                  who,
                  amt: m.amt,
                  day: new Date().getDate(),
                  status: 'active',
              },
          ]
        : s.subs;
    return {
        ...s,
        subs,
        byn: s.byn - m.amt + cashback,
        spent: { day: s.spent.day + m.amt, month: s.spent.month + m.amt },
        points: { parent: s.points.parent + parentPts, child: s.points.child + childPts },
    };
}

/** Кешбэк карты Moby Teen передаёт вызывающий: он зависит от трат за месяц (см. CARD_TIERS) */
export function applyFamily(s: GameState, a: FamilyAction, teenCb: number): GameState {
    switch (a.type) {
        case 'pkg/issue': {
            const invite = `MOBY-${1000 + (Math.floor(Date.now() / 1000) % 9000)}`;
            return {
                ...s,
                pkg: { ...a.pkg, invite },
                controls: defaultControls(a.pkg.age),
                insurance: a.insurance,
            };
        }
        case 'pkg/cancel':
            return { ...s, pkg: null };
        case 'controls/set': {
            const p = a.patch;
            // Запреты по закону родитель включить не может
            const cats = p.cats ? { ...p.cats, gambling: false, adult: false } : s.controls.cats;
            return { ...s, controls: { ...s.controls, ...p, cats } };
        }
        case 'op/pay': {
            const m = MERCHANTS.find((x) => x.id === a.merchant);
            if (!m || !s.pkg) return s;
            const r = checkPurchase(s, m, !!a.teen);
            const who: Member = a.teen ? 'teen' : 'kid';
            const op: CardOp = {
                id: nid('o'),
                title: m.title,
                cat: m.cat,
                amt: m.amt,
                status: r.status,
                reason: r.reason,
                partner: m.partner,
                at: Date.now(),
                sub: m.sub,
                who,
            };
            const next = r.status === 'done' ? settle(s, m, a.teen ? teenCb : 0, who) : s;
            return { ...next, ops: [op, ...s.ops] };
        }
        case 'op/approve': {
            const op = s.ops.find((o) => o.id === a.id);
            if (op?.status !== 'pending') return s;
            const m: Merchant = {
                id: op.id,
                title: op.title,
                cat: op.cat as SpendCat,
                amt: op.amt,
                partner: op.partner,
                sub: op.sub,
            };
            if (m.amt > s.byn)
                return {
                    ...s,
                    ops: s.ops.map((o) =>
                        o.id === a.id ? { ...o, status: 'declined', reason: 'Недостаточно денег на карте' } : o,
                    ),
                };
            const next = settle(s, m, a.teen ? teenCb : 0, op.who ?? (a.teen ? 'teen' : 'kid'));
            return {
                ...next,
                ops: s.ops.map((o) => (o.id === a.id ? { ...o, status: 'done', reason: 'Подтверждено родителем' } : o)),
            };
        }
        case 'op/decline':
            return {
                ...s,
                ops: s.ops.map((o) =>
                    o.id === a.id && o.status === 'pending'
                        ? { ...o, status: 'declined', reason: 'Отклонено родителем' }
                        : o,
                ),
            };
        case 'op/dispute':
            return {
                ...s,
                ops: s.ops.map((o) =>
                    o.id === a.id && o.status === 'done' && !o.income
                        ? {
                              ...o,
                              status: 'disputed',
                              reason: 'Заявка на оспаривание: ответ банка в течение 10 рабочих дней',
                          }
                        : o,
                ),
            };
        case 'card/block':
            return { ...s, controls: { ...s.controls, blocked: true, lost: !!a.lost || s.controls.lost } };
        case 'card/unblock':
            if (s.controls.lost) return s;
            return { ...s, controls: { ...s.controls, blocked: false } };
        case 'card/reissue':
            return { ...s, reissued: s.reissued + 1, controls: { ...s.controls, blocked: false, lost: false } };
        case 'req/create': {
            if (
                s.requests.some(
                    (r) => r.status === 'open' && r.kind === a.kind && r.key === a.key && a.kind !== 'money',
                )
            )
                return s;
            const req: ChildRequest = {
                id: nid('r'),
                kind: a.kind,
                key: a.key,
                amt: a.amt,
                note: a.note,
                status: 'open',
                at: Date.now(),
            };
            return { ...s, requests: [req, ...s.requests] };
        }
        case 'req/resolve': {
            const r = s.requests.find((x) => x.id === a.id);
            if (r?.status !== 'open') return s;
            let next: GameState = {
                ...s,
                requests: s.requests.map((x) => (x.id === a.id ? { ...x, status: a.ok ? 'ok' : 'no' } : x)),
            };
            if (!a.ok) return next;
            if (r.kind === 'feature' && r.key)
                next = {
                    ...next,
                    controls: { ...next.controls, features: { ...next.controls.features, [r.key]: true } },
                };
            if (r.kind === 'product' && r.key)
                next = {
                    ...next,
                    controls: { ...next.controls, products: { ...next.controls.products, [r.key]: true } },
                };
            if (r.kind === 'money' && r.amt && r.amt <= next.parentCard)
                next = transfer(next, r.amt, 'Перевод от мамы');
            return next;
        }
        case 'pocket/set':
            return { ...s, pocket: { ...s.pocket, ...a.patch } };
        case 'pocket/pay':
            if (s.pocket.amt > s.parentCard || !s.pkg) return s;
            return transfer(s, s.pocket.amt, 'Карманные деньги');
        case 'sub/cancel':
            return { ...s, subs: s.subs.filter((x) => x.id !== a.id) };
        case 'sub/pause':
            return {
                ...s,
                subs: s.subs.map((x) =>
                    x.id === a.id ? { ...x, status: x.status === 'active' ? 'paused' : 'active' } : x,
                ),
            };
        case 'insurance/set':
            return { ...s, insurance: a.on };
    }
}

function transfer(s: GameState, amt: number, title: string): GameState {
    const op: CardOp = { id: nid('o'), title, cat: 'income', amt, income: true, status: 'done', at: Date.now() };
    return { ...s, parentCard: s.parentCard - amt, byn: s.byn + amt, ops: [op, ...s.ops] };
}

/** Сколько уходит на активные подписки в месяц: всего и по каждому члену семьи */
export function subsTotals(subs: Subscription[]) {
    const by: Record<Member, number> = { parent: 0, kid: 0, teen: 0 };
    for (const x of subs) if (x.status === 'active') by[x.who] += x.amt;
    return { total: by.parent + by.kid + by.teen, by };
}

/** Одинаковые подписки у нескольких членов семьи: подсказка перейти на семейный тариф */
export function subDuplicates(subs: Subscription[]) {
    const out: { kind: Subscription['kind']; who: Member[]; amt: number }[] = [];
    for (const kind of Object.keys(SUB_KINDS) as Subscription['kind'][]) {
        const same = subs.filter((x) => x.kind === kind && x.status === 'active' && x.amt > 0);
        const who = [...new Set(same.map((x) => x.who))];
        if (who.length > 1) out.push({ kind, who, amt: same.reduce((a, x) => a + x.amt, 0) });
    }
    return out;
}
