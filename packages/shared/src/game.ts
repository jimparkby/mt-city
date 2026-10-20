// Игровой прогресс ребёнка и связь с родителем: путь, квесты недели, задания, награды за оценки.
// Чистый редьюсер: демо-режим клиента применяет его в браузере, сервер — в БД (TODO(feat/parent)).
// MTcoin и BYN — в копейках.

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
}

export type GameAction =
    | { type: 'task/submit'; id: string }
    | { type: 'task/approve'; id: string }
    | { type: 'task/return'; id: string }
    | { type: 'task/create'; title: string; byn: number; icon: TaskIcon }
    | { type: 'grades/toggle' }
    | { type: 'grades/rule'; grade: number; delta: number }
    | { type: 'grades/pull' }
    | { type: 'dream/complete' }
    | { type: 'quiz/complete' }
    | { type: 'chest/open' };

/** 1 BYN награды = 10 MTcoin в игре */
export const COINS_PER_BYN = 10;
export const REWARDS = {
    dream: { knowledge: 60, coins: 5_000 },
    quiz: { knowledge: 40 },
    chest: { coins: 10_000 },
    lesson: { knowledge: 20 },
} as const;
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
        { id: 't3', title: 'Помыть пол', byn: 400, status: 'open', returned: false, icon: 'drop' },
    ],
    gradesOn: true,
    rules: { 10: 200, 9: 100, 8: 50 },
    gradeFeed: [{ subj: 'Математика', g: 9, amt: 100 }],
    diaryIdx: 0,
    dreamDone: false,
    quizDone: false,
    chestOpened: false,
});

/** Отметки, которые «приходят из электронного дневника» в демо */
export const DIARY = [
    { subj: 'Русский язык', g: 10 },
    { subj: 'Окружающий мир', g: 8 },
    { subj: 'Английский', g: 6 },
    { subj: 'Чтение', g: 9 },
];

export const TASK_PRESETS: { label: string; title: string; icon: TaskIcon }[] = [
    { label: 'Вынести мусор', title: 'Вынести мусор', icon: 'trash' },
    { label: 'Помыть пол', title: 'Помыть пол', icon: 'drop' },
    { label: 'Пропылесосить', title: 'Пропылесосить в квартире', icon: 'broom' },
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

export const QUIZ = [
    {
        text: 'Ты положил 100 руб. в Копилку под 10% в день. Сколько будет через 1 день?',
        opts: ['101 руб.', '110 руб.', '200 руб.'],
        ok: 1,
        hint: '10% от 100 — это 10. 100 + 10 = 110.',
    },
    {
        text: 'А через 2 дня, если не снимать?',
        opts: ['120 руб.', '121 руб.', '112 руб.'],
        ok: 1,
        hint: 'Второй день считаем от 110: 10% от 110 — это 11. 110 + 11 = 121.',
    },
];

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
            return { ...s, tasks: updateTask(s, a.id, { status: 'review', returned: false }) };
        }
        case 'task/approve': {
            const t = s.tasks.find((x) => x.id === a.id);
            if (t?.status !== 'review') return s;
            return {
                ...s,
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
                coins: s.coins + REWARDS.dream.coins,
            };
        case 'quiz/complete':
            if (s.quizDone) return s;
            return { ...s, quizDone: true, knowledge: s.knowledge + REWARDS.quiz.knowledge };
        case 'chest/open': {
            const chest = PATH.find((n) => n.kind === 'chest')!;
            if (nodeStatus(s, chest) !== 'current') return s;
            return { ...s, chestOpened: true, level: s.level + 1, coins: s.coins + REWARDS.chest.coins };
        }
    }
}
