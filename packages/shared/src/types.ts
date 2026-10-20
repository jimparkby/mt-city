// Общие типы сущностей в формате ответов API (даты — ISO-строки, суммы — копейки).

export type PlayerMode = 'junior' | 'teen';

export const ERROR_CODES = [
    'INSUFFICIENT_FUNDS',
    'WALLET_CAP',
    'LOW_ENERGY',
    'LEVEL_LOCKED',
    'AGE_LOCKED',
    'VALIDATION',
    'NOT_FOUND',
    'UNAUTHORIZED',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiError {
    error: { code: ErrorCode; message: string; details?: unknown };
}

export interface AccountDto {
    balance: number;
    walletCap: number;
}

export interface PlayerDto {
    id: string;
    name: string;
    age: number;
    mode: PlayerMode;
    bankLevel: number;
    knowledge: number;
    energy: number;
    health: number;
    creditScore: number;
    onboarded: boolean;
    account: AccountDto;
    buildings: { buildingId: string; level: number; upgradeEndsAt: string | null }[];
}

export interface DepositDto {
    id: string;
    type: 'demand' | 'term';
    principal: number;
    rateBp: number;
    startedAt: string;
    endsAt: string | null;
    closedAt: string | null;
    /** Текущая сумма с процентами */
    current: number;
}

export interface LoanDto {
    id: string;
    principal: number;
    rateBp: number;
    periods: number;
    payment: number;
    paidPeriods: number;
    nextDueAt: string;
    overdue: number;
    purpose: string;
}

export interface BankOverviewDto {
    account: AccountDto;
    deposits: DepositDto[];
    loans: LoanDto[];
    creditScore: number;
}

export interface ShopDto {
    id: string;
    name: string;
    category: string;
    district: string;
}

export interface ProductDto {
    id: string;
    shopId: string;
    sku: string;
    name: string;
    price: number;
    bulkMinQty: number | null;
    bulkPrice: number | null;
    shelfLife: number | null;
}

export interface ReceiptDto {
    lines: { productId: string; name: string; qty: number; unitPrice: number; total: number }[];
    total: number;
    account: AccountDto;
}

export interface TransactionDto {
    id: string;
    amount: number;
    kind: string;
    meta: Record<string, unknown> | null;
    createdAt: string;
}

export interface SessionDto {
    sessionToken: string;
    player: PlayerDto;
}
