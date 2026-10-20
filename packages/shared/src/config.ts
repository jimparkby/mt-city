// Константы баланса. Суммы — в копейках MTcoin, ставки — в базисных пунктах (1% = 100 bp).

export const BP = 10_000;

/** Длительность игрового дня по умолчанию (local/demo — 1 мин). Сервер берёт значение из env DAY_MS. */
export const DAY_MS_DEFAULT = 60_000;
export const HOUR_MS_FACTOR = 24; // игровой час = DAY_MS / 24

export const START = {
    balance: 10_000, // 100,00 MTcoin
    walletCap: 50_000,
    energy: 100,
    health: 100,
    creditScore: 600,
    onboardingBonus: 10_000,
} as const;

export const DEPOSIT = {
    demandRateBp: 50, // 0,5% в игровой день
    termRateBp: 100, // 1% в игровой день
    termDays: 7,
    minAmount: 1_000,
} as const;

export const LOAN = {
    /** Ставка за период по кредитному рейтингу; ниже minScore — отказ */
    rateByScore: [
        { minScore: 700, rateBp: 1_000 },
        { minScore: 600, rateBp: 1_500 },
        { minScore: 450, rateBp: 2_000 },
    ],
    minScore: 450,
    limitRevenueMultiplier: 3,
    limitRevenueDays: 7,
    limitWithoutBusiness: 20_000, // 200 MTcoin
    overduePenaltyBp: 500, // 5% платежа
    overdueScoreDelta: -20,
    onTimeScoreDelta: 5,
    scoreMin: 300,
    scoreMax: 850,
} as const;

export const MARKET = {
    elasticity: 1.5,
    districtK: { center: 1.2, residential: 1.0, outskirts: 0.8 } as Record<string, number>,
} as const;

export const TAX = {
    salaryBp: 1_300, // 13%
    profitBp: 1_000, // 10%
    profitPeriodDays: 7,
    graceDays: 2,
    penaltyPerDayBp: 100, // 1% в день
} as const;

export const INFLATION = {
    periodDays: 7,
    minBp: 100,
    maxBp: 200,
} as const;

export const ENERGY = {
    max: 100,
    shiftCost: 20,
    regenPerHour: 10,
} as const;

export const HEALTH = {
    sickChanceBp: 500, // 5% в день
    insuranceDiscountBp: 8_000, // −80% к стоимости лечения
} as const;

export type BuildingId = 'bank' | 'sosedi' | 'green' | 'cofix' | 'legal' | 'medical' | 'plot' | 'market' | 'jobs';

export interface BuildingDef {
    id: BuildingId;
    name: string;
    minBankLevel: number;
}

/** Здания города в порядке показа; minBankLevel — уровень игрока, с которого открывается */
export const BUILDINGS: BuildingDef[] = [
    { id: 'bank', name: 'Офис МТБанка', minBankLevel: 1 },
    { id: 'sosedi', name: 'Соседи', minBankLevel: 1 },
    { id: 'green', name: 'Грин', minBankLevel: 1 },
    { id: 'cofix', name: 'Cofix', minBankLevel: 1 },
    { id: 'jobs', name: 'Биржа труда', minBankLevel: 1 },
    { id: 'medical', name: 'Медцентр', minBankLevel: 2 },
    { id: 'plot', name: 'Мой участок', minBankLevel: 2 },
    { id: 'market', name: 'Рынок', minBankLevel: 4 },
    { id: 'legal', name: 'Юрцентр', minBankLevel: 5 },
];

export interface JobDef {
    id: string;
    title: string;
    /** Оплата за смену при score = 100, копейки */
    baseWage: number;
    minAge: number;
    minigame: string;
}

export const JOBS: JobDef[] = [
    { id: 'barista', title: 'Бариста в Cofix', baseWage: 3_000, minAge: 7, minigame: 'Barista' },
];

export interface BusinessTypeDef {
    type: string;
    name: string;
    /** sku сырья → количество на единицу продукции */
    recipe: Record<string, number>;
    productSku: string;
    /** Время производства одной партии, в игровых часах */
    produceHours: number;
}

export const BUSINESS_TYPES: BusinessTypeDef[] = [
    {
        type: 'coffee',
        name: 'Кофейня',
        recipe: { coffee_beans: 1, milk: 1, cup: 1 },
        productSku: 'coffee',
        produceHours: 2,
    },
    {
        type: 'lemonade',
        name: 'Лимонадная',
        recipe: { lemon: 1, sugar: 1, cup: 1 },
        productSku: 'lemonade',
        produceHours: 1,
    },
];

export const LEGAL_FORMS = {
    self: { name: 'Самозанятый', fee: 1_000 },
    ip: { name: 'ИП', fee: 3_000 },
} as const;

export interface LessonDef {
    id: string;
    title: string;
    questions: { text: string; options: string[]; correct: number }[];
    knowledgeReward: number;
}

export const LESSONS: LessonDef[] = [
    {
        id: 'buy_sell',
        title: 'Купля-продажа',
        knowledgeReward: 10,
        questions: [
            {
                text: 'Ты купил яблоко за 1 MTcoin и продал за 1,5. Какая прибыль?',
                options: ['0,5 MTcoin', '1,5 MTcoin', '2,5 MTcoin'],
                correct: 0,
            },
            {
                text: 'Что такое оптовая цена?',
                options: [
                    'Цена за один товар',
                    'Сниженная цена при покупке большого количества',
                    'Цена со скидкой по пятницам',
                ],
                correct: 1,
            },
            {
                text: 'Если поднять цену слишком высоко, что произойдёт со спросом?',
                options: ['Вырастет', 'Не изменится', 'Упадёт'],
                correct: 2,
            },
        ],
    },
];
