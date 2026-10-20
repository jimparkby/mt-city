// Игровой прогресс ребёнка и связь с родителем: путь, квесты недели, задания, награды за оценки.
// Чистый редьюсер: демо-режим клиента применяет его в браузере, сервер — в БД (TODO(feat/parent)).
// MTcoin и BYN — в копейках.

import { pathSteps } from './paths.js';

export type TaskStatus = 'open' | 'review' | 'paid';
export type TaskIcon = 'trash' | 'drop' | 'broom' | 'star';

export interface FamilyTask {
    id: string;
    title: string;
    /** Награда на карту ребёнка, копейки BYN */
    byn: number;
    status: TaskStatus;
    /** Родитель вернул на доработку */
    returned: boolean;
    icon: TaskIcon;
    /** Когда ребёнок нажал «Готово», мс */
    submittedAt?: number;
}

export interface GradeEntry {
    subj: string;
    g: number;
    amt: number;
}

export interface GameState {
    level: number;
    knowledge: number;
    /** Баланс в игре, копейки MTcoin */
    coins: number;
    /** Детская карта в Moby, копейки BYN */
    byn: number;
    /** Карта родителя (mock Moby), копейки BYN */
    parentCard: number;
    tasks: FamilyTask[];
    gradesOn: boolean;
    /** Отметка → награда, копейки BYN */
    rules: Record<number, number>;
    gradeFeed: GradeEntry[];
    diaryIdx: number;
    dreamDone: boolean;
    quizDone: boolean;
    chestOpened: boolean;
    /** Собранные бонусы над зданиями города (id здания → собран) */
    collected: Record<string, boolean>;
    /** Пройденные шаги путей в зданиях: «bank:0» → true */
    done: Record<string, boolean>;
    /** Одежда персонажа (7–13) */
    outfit: Outfit;
    /** Купленные вещи и дизайны карты: «top:tee», «card:neon» */
    owned: string[];
    /** Дизайн детской карты Moby Kids */
    skin: SkinId;
    /** Вклады подростка в BYN (открываются с детской карты) */
    deposits: OpenDeposit[];
    /** План Копилки подростка */
    kop: KopPlan;
    /** Последний перевод за задание — для ленты операций в Moby */
    lastPaid: number;
    lastTitle: string;
}

export type ShopCategory = 'top' | 'hat' | 'card';
export type TopId = 'hoodie' | 'tee' | 'jacket' | 'space';
export type HatId = 'none' | 'cap' | 'phones' | 'crown';
export type SkinId = 'classic' | 'neon' | 'pixel' | 'space';

export interface Outfit {
    top: TopId;
    hat: HatId;
}

export interface OpenDeposit {
    name: string;
    /** Копейки BYN */
    amt: number;
    rateT: string;
    months: number;
    /** Доход за срок, копейки BYN */
    inc: number;
}

/** Суммы плана Копилки — в BYN (целые и дробные), это планировщик, а не счёт */
export interface KopPlan {
    name: string;
    target: number;
    saved: number;
    income: number;
    food: number;
    fun: number;
    other: number;
    /** Сколько процентов свободных денег вкладывать */
    share: number;
    planned: boolean;
}

export type GameAction =
    | { type: 'task/submit'; id: string }
    | { type: 'task/approve'; id: string }
    | { type: 'task/return'; id: string }
    | { type: 'task/create'; title: string; byn: number; icon: TaskIcon }
    | { type: 'grades/toggle' }
    | { type: 'grades/rule'; grade: number; delta: number }
    | { type: 'grades/pull' }
    /** teen: подросток 14–17 получает только знания, без MTcoin */
    | { type: 'dream/complete'; teen?: boolean }
    | { type: 'quiz/complete' }
    | { type: 'chest/open'; teen?: boolean }
    | { type: 'city/collect'; id: string }
    | { type: 'step/complete'; loc: string; k: number; teen?: boolean }
    | { type: 'shop/buy'; cat: ShopCategory; id: string }
    | { type: 'shop/equip'; cat: ShopCategory; id: string }
    | { type: 'deposit/open'; id: string; amt: number }
    | { type: 'kop/set'; patch: Partial<KopPlan> };

/** 1 BYN награды = 10 MTcoin в игре */
export const COINS_PER_BYN = 10;
export const REWARDS = {
    dream: { knowledge: 60, coins: 5_000 },
    quiz: { knowledge: 40 },
    chest: { coins: 10_000 },
    lesson: { knowledge: 20 },
} as const;
/** Бонусы над зданиями на карте, копейки MTcoin (Копилка +3, Cofix +12); jobs — уведомление без монет */
export const CITY_BONUSES: Record<string, number> = { bank: 300, cofix: 1_200, jobs: 0 };

/** Магазин персонажа и дизайнов карты: цены в целых MTcoin */
export const SHOP: Record<ShopCategory, Record<string, { name: string; price: number }>> = {
    top: {
        hoodie: { name: 'Розовое худи', price: 0 },
        tee: { name: 'Футболка МТ', price: 80 },
        jacket: { name: 'Синяя куртка', price: 120 },
        space: { name: 'Космокостюм', price: 300 },
    },
    hat: {
        none: { name: 'Без шапки', price: 0 },
        cap: { name: 'Кепка', price: 60 },
        phones: { name: 'Наушники', price: 150 },
        crown: { name: 'Корона', price: 400 },
    },
    card: {
        classic: { name: 'Классика', price: 0 },
        neon: { name: 'Неон', price: 200 },
        pixel: { name: 'Пиксели', price: 250 },
        space: { name: 'Космос', price: 350 },
    },
};

export const isOwned = (s: GameState, cat: ShopCategory, id: string) =>
    SHOP[cat][id]?.price === 0 || s.owned.includes(`${cat}:${id}`);

/** Уровни карты Moby Teen: кешбэк растёт с уровнем в МТ Сити */
export const CARD_TIERS = [
    { n: 'Старт', lvl: 1, cb: 0 },
    { n: 'Бронза', lvl: 4, cb: 1 },
    { n: 'Серебро', lvl: 6, cb: 2 },
    { n: 'Золото', lvl: 8, cb: 3 },
] as const;

export const tierIndex = (level: number) => CARD_TIERS.reduce((acc, t, k) => (level >= t.lvl ? k : acc), 0);

/** Вклады в BYN для подростка (условия в демо приблизительные) */
export const TEEN_DEPOSITS = [
    {
        id: 'mtb',
        star: true,
        name: 'МТБелки Online',
        rate: 13.2,
        months: 12,
        rateT: 'до 13,2%',
        term: 'до 37 мес.',
        type: 'безотзывный',
        sub: 'Флагманский вклад МТБанка: открывается онлайн в Moby, ставка фиксирована на весь срок.',
    },
    {
        id: 'b3',
        star: false,
        name: 'Базовый · 3 месяца',
        rate: 3,
        months: 3,
        rateT: '3%',
        term: '3 мес.',
        type: 'отзывный',
        sub: 'Можно забрать досрочно',
    },
    {
        id: 'b6',
        star: false,
        name: 'Базовый · 6 месяцев',
        rate: 4,
        months: 6,
        rateT: '4%',
        term: '6 мес.',
        type: 'отзывный',
        sub: 'Можно забрать досрочно',
    },
    {
        id: 'b12',
        star: false,
        name: 'Базовый · 12 месяцев',
        rate: 5,
        months: 12,
        rateT: '5%',
        term: '12 мес.',
        type: 'безотзывный',
        sub: 'Деньги лежат до конца срока',
    },
] as const;

/** Минимальная сумма вклада, копейки BYN */
export const DEPOSIT_MIN = 1_000;

/** Доход по вкладу за весь срок (простые проценты), копейки BYN */
export const depositIncome = (amt: number, rate: number, months: number) => Math.round((amt * rate * months) / 1_200);
export const GRADE_STEP = 50;
export const GRADE_MAX = 1_000;
export const GRADES = [10, 9, 8] as const;

export const initialGame = (): GameState => ({
    level: 3,
    knowledge: 180,
    coins: 24_000,
    byn: 1_250,
    parentCard: 14_620,
    tasks: [
        { id: 't1', title: 'Вынести мусор', byn: 200, status: 'paid', returned: false, icon: 'trash' },
        { id: 't2', title: 'Пропылесосить в квартире', byn: 300, status: 'open', returned: false, icon: 'broom' },
        {
            id: 't3',
            title: 'Помыть пол',
            byn: 400,
            status: 'review',
            returned: false,
            icon: 'drop',
            submittedAt: Date.now() - 10 * 60_000,
        },
    ],
    gradesOn: true,
    rules: { 10: 200, 9: 100, 8: 50 },
    gradeFeed: [{ subj: 'Математика', g: 9, amt: 100 }],
    diaryIdx: 0,
    dreamDone: false,
    quizDone: false,
    chestOpened: false,
    collected: {},
    done: { 'school:0': true, 'school:1': true, 'bank:0': true },
    outfit: { top: 'hoodie', hat: 'none' },
    owned: [],
    skin: 'classic',
    deposits: [],
    kop: {
        name: 'Велосипед',
        target: 150,
        saved: 20,
        income: 30,
        food: 8,
        fun: 6,
        other: 4,
        share: 70,
        planned: false,
    },
    lastPaid: 200,
    lastTitle: 'Вынести мусор',
});

/** Отметки, которые «приходят из электронного дневника» в демо */
export const DIARY = [
    { subj: 'Русский язык', g: 10 },
    { subj: 'Окружающий мир', g: 8 },
    { subj: 'Английский', g: 6 },
    { subj: 'Чтение', g: 9 },
];

/** Шаблоны заданий для родителя: подсказка «сколько обычно платят» и сумма по умолчанию, копейки BYN */
export const TASK_PRESETS: { label: string; title: string; icon: TaskIcon; hint: string; byn: number }[] = [
    { label: 'Вынести мусор', title: 'Вынести мусор', icon: 'trash', hint: 'обычно 1–2 BYN', byn: 200 },
    { label: 'Помыть пол', title: 'Помыть пол', icon: 'drop', hint: 'обычно 3–5 BYN', byn: 500 },
    { label: 'Пропылесосить', title: 'Пропылесосить в квартире', icon: 'broom', hint: 'обычно 2–4 BYN', byn: 200 },
];

// ---------- Путь ----------

export type NodeKind = 'lesson' | 'dream' | 'quiz' | 'chest' | 'next';
export type NodeStatus = 'done' | 'current' | 'locked';

export interface PathNode {
    id: number;
    title: string;
    kind: NodeKind;
    desc: string;
}

export const PATH_SECTION = 'Раздел 2 · Деньги и цели';
export const PATH: PathNode[] = [
    { id: 1, title: 'Откуда берутся деньги', kind: 'lesson', desc: '' },
    { id: 2, title: 'Нужды и хотелки', kind: 'lesson', desc: '' },
    { id: 3, title: 'Бюджет на неделю', kind: 'lesson', desc: '' },
    {
        id: 4,
        title: 'Накопи на мечту',
        kind: 'dream',
        desc: 'Наушники стоят 500 руб. Каждый месяц родители дают 200. Реши, сколько тратить на еду, одежду и развлечения, и успей за 5 месяцев.',
    },
    {
        id: 5,
        title: 'Копилка и проценты',
        kind: 'quiz',
        desc: 'Два вопроса про проценты. Ответишь — получишь 40 знаний.',
    },
    { id: 6, title: 'Сундук недели', kind: 'chest', desc: 'Внутри новый уровень и 100 MTcoin.' },
    {
        id: 7,
        title: 'Покупка с умом',
        kind: 'next',
        desc: 'Раздел откроется на следующей неделе вместе с новыми квестами.',
    },
];

export interface Quest {
    title: string;
    done: boolean;
    meta: string;
}

export function weekQuests(s: GameState): Quest[] {
    const approved = Math.min(2, s.tasks.filter((t) => t.status === 'paid').length);
    return [
        { title: 'Урок «Бюджет на неделю»', done: true, meta: '' },
        { title: 'Положить 20 MTcoin в Копилку', done: true, meta: '' },
        { title: 'Два задания от родителей', done: approved >= 2, meta: `${approved}/2` },
        { title: 'Квест «Накопи на мечту»', done: s.dreamDone, meta: '' },
        { title: 'Урок «Копилка и проценты»', done: s.quizDone, meta: '' },
    ];
}

export function nodeStatus(s: GameState, node: PathNode): NodeStatus {
    const weekDone = weekQuests(s).filter((q) => q.done).length;
    switch (node.kind) {
        case 'lesson':
            return 'done';
        case 'dream':
            return s.dreamDone ? 'done' : 'current';
        case 'quiz':
            return s.quizDone ? 'done' : s.dreamDone ? 'current' : 'locked';
        case 'chest':
            return s.chestOpened ? 'done' : weekDone === 5 ? 'current' : 'locked';
        case 'next':
            return s.chestOpened ? 'current' : 'locked';
    }
}

// ---------- Мини-игры пути ----------

export const DREAM = {
    goal: 500,
    allowance: 200,
    months: 5,
    giftMonth: 3,
    gift: 50,
    categories: [
        {
            key: 'food',
            name: 'Еда',
            hint: 'выбрать обязательно',
            opts: [
                ['Обед из дома', 40],
                ['Столовая', 70],
                ['Фастфуд', 120],
            ],
        },
        {
            key: 'clothes',
            name: 'Одежда',
            hint: 'можно пропустить',
            opts: [
                ['Ничего не нужно', 0],
                ['Носки', 20],
                ['Худи', 90],
            ],
        },
        {
            key: 'fun',
            name: 'Развлечения',
            hint: 'можно пропустить',
            opts: [
                ['Гулять в парке', 0],
                ['Кино', 30],
                ['Новая игра', 80],
            ],
        },
    ],
} as const;

// ---------- Редьюсер ----------

function updateTask(s: GameState, id: string, patch: Partial<FamilyTask>): FamilyTask[] {
    return s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
}

/** Применяет действие и возвращает новое состояние; некорректные действия игнорируются */
export function applyGameAction(s: GameState, a: GameAction): GameState {
    switch (a.type) {
        case 'task/submit': {
            const t = s.tasks.find((x) => x.id === a.id);
            if (t?.status !== 'open') return s;
            return { ...s, tasks: updateTask(s, a.id, { status: 'review', returned: false, submittedAt: Date.now() }) };
        }
        case 'task/approve': {
            const t = s.tasks.find((x) => x.id === a.id);
            if (t?.status !== 'review') return s;
            return {
                ...s,
                lastPaid: t.byn,
                lastTitle: t.title,
                tasks: updateTask(s, a.id, { status: 'paid' }),
                parentCard: s.parentCard - t.byn,
                byn: s.byn + t.byn,
                coins: s.coins + t.byn * COINS_PER_BYN,
            };
        }
        case 'task/return': {
            const t = s.tasks.find((x) => x.id === a.id);
            if (t?.status !== 'review') return s;
            return { ...s, tasks: updateTask(s, a.id, { status: 'open', returned: true }) };
        }
        case 'task/create': {
            const title = a.title.trim();
            if (title.length < 2 || a.byn <= 0) return s;
            const id = `t${Date.now().toString(36)}${s.tasks.length}`;
            return {
                ...s,
                tasks: [...s.tasks, { id, title, byn: a.byn, status: 'open', returned: false, icon: a.icon }],
            };
        }
        case 'grades/toggle':
            return { ...s, gradesOn: !s.gradesOn };
        case 'grades/rule': {
            const value = Math.min(GRADE_MAX, Math.max(0, (s.rules[a.grade] ?? 0) + a.delta));
            return { ...s, rules: { ...s.rules, [a.grade]: value } };
        }
        case 'grades/pull': {
            const g = DIARY[s.diaryIdx % DIARY.length];
            const amt = s.rules[g.g] ?? 0;
            return {
                ...s,
                diaryIdx: s.diaryIdx + 1,
                gradeFeed: [...s.gradeFeed, { ...g, amt }],
                byn: s.byn + amt,
                parentCard: s.parentCard - amt,
            };
        }
        case 'dream/complete':
            if (s.dreamDone) return s;
            return {
                ...s,
                dreamDone: true,
                knowledge: s.knowledge + REWARDS.dream.knowledge,
                coins: s.coins + (a.teen ? 0 : REWARDS.dream.coins),
            };
        case 'quiz/complete':
            if (s.quizDone) return s;
            return { ...s, quizDone: true, knowledge: s.knowledge + REWARDS.quiz.knowledge };
        case 'city/collect': {
            const bonus = CITY_BONUSES[a.id];
            if (bonus === undefined || s.collected?.[a.id]) return s;
            return { ...s, coins: s.coins + bonus, collected: { ...s.collected, [a.id]: true } };
        }
        case 'chest/open': {
            const chest = PATH.find((n) => n.kind === 'chest')!;
            if (nodeStatus(s, chest) !== 'current') return s;
            return {
                ...s,
                chestOpened: true,
                level: s.level + 1,
                coins: s.coins + (a.teen ? 0 : REWARDS.chest.coins),
            };
        }
        case 'step/complete': {
            const step = pathSteps(a.loc, !!a.teen)[a.k];
            const key = `${a.loc}:${a.k}`;
            if (!step || step.kind === 'sim' || isStepDone(s, a.loc, a.k)) return s;
            return {
                ...s,
                done: { ...s.done, [key]: true },
                quizDone: s.quizDone || key === 'bank:1',
                coins: s.coins + (a.teen ? 0 : step.r * 100),
                knowledge: s.knowledge + (a.teen ? step.r : 0),
            };
        }
        case 'shop/buy': {
            const item = SHOP[a.cat][a.id];
            if (!item || isOwned(s, a.cat, a.id) || s.coins < item.price * 100) return s;
            return equip(
                { ...s, coins: s.coins - item.price * 100, owned: [...s.owned, `${a.cat}:${a.id}`] },
                a.cat,
                a.id,
            );
        }
        case 'shop/equip':
            if (!SHOP[a.cat][a.id] || !isOwned(s, a.cat, a.id)) return s;
            return equip(s, a.cat, a.id);
        case 'deposit/open': {
            const d = TEEN_DEPOSITS.find((x) => x.id === a.id);
            if (!d || a.amt < DEPOSIT_MIN || a.amt > s.byn) return s;
            const inc = depositIncome(a.amt, d.rate, d.months);
            return {
                ...s,
                byn: s.byn - a.amt,
                deposits: [...s.deposits, { name: d.name, amt: a.amt, rateT: d.rateT, months: d.months, inc }],
            };
        }
        case 'kop/set':
            return { ...s, kop: { ...s.kop, ...a.patch } };
    }
}

function equip(s: GameState, cat: ShopCategory, id: string): GameState {
    if (cat === 'card') return { ...s, skin: id as SkinId };
    return { ...s, outfit: { ...s.outfit, [cat]: id } };
}

/** Шаг пути пройден; Копилка (bank:1) и «Накопи на мечту» (bank:2) засчитываются и через путь недели */
export function isStepDone(s: GameState, loc: string, k: number): boolean {
    const key = `${loc}:${k}`;
    return !!(s.done[key] || (key === 'bank:1' && s.quizDone) || (key === 'bank:2' && s.dreamDone));
}

/** Статусы шагов пути здания: пройденные, один текущий, остальные закрыты */
export function stepStatuses(s: GameState, loc: string, teen: boolean): NodeStatus[] {
    let cur = false;
    return pathSteps(loc, teen).map((_, k) => {
        if (isStepDone(s, loc, k)) return 'done';
        if (!cur) {
            cur = true;
            return 'current';
        }
        return 'locked';
    });
}
