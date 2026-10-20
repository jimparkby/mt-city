// Zod-схемы тел запросов (ТЗ, раздел 7). Общие для сервера (валидация) и клиента (формы).

import { z } from 'zod';

const coins = z.number().int().positive();

export const AuthSessionBody = z.object({
    mobyToken: z.string().min(1).optional(),
    name: z.string().trim().min(1).max(32).optional(),
    age: z.number().int().min(6).max(17).optional(),
});

export const OnboardingCompleteBody = z.object({
    path: z.enum(['business', 'job']),
});

export const DepositOpenBody = z.object({
    type: z.enum(['demand', 'term']),
    amount: coins,
});

export const LoanQuoteBody = z.object({
    amount: coins,
    periods: z.number().int().min(1).max(12),
});

export const LoanTakeBody = LoanQuoteBody.extend({
    purpose: z.enum(['equipment', 'stock', 'upgrade', 'other']),
});

export const LoanPayBody = z.object({
    amount: coins.optional(),
});

export const ShopBuyBody = z.object({
    items: z.array(z.object({ productId: z.string(), qty: z.number().int().positive() })).min(1),
});

export const MarketSellBody = z.object({
    sku: z.string(),
    qty: z.number().int().positive(),
    price: coins,
});

export const BusinessCreateBody = z.object({
    type: z.string(),
    name: z.string().trim().min(1).max(32),
    price: coins,
});

export const BusinessRegisterBody = z.object({
    legalForm: z.enum(['self', 'ip']),
});

export const BusinessProduceBody = z.object({
    qty: z.number().int().positive(),
});

export const JobShiftBody = z.object({
    score: z.number().int().min(0).max(100),
});

export const MedicalTreatBody = z.object({
    service: z.enum(['checkup', 'treatment']),
});

export const MedicalInsuranceBody = z.object({
    active: z.boolean(),
});

export const LessonAnswerBody = z.object({
    answers: z.array(z.number().int().min(0)),
});

export const TransactionsQuery = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const ParentTaskBody = z.object({
    playerId: z.string(),
    title: z.string().trim().min(1).max(80),
    rewardByn: z.number().int().min(0),
    rewardCoin: z.number().int().min(0),
});

export const PocketMoneyBody = z.object({
    playerId: z.string(),
    amountByn: z.number().int().positive(),
});

export const DevTimeSkipBody = z.object({
    days: z.number().int().min(1).max(365),
});

export type AuthSessionBody = z.infer<typeof AuthSessionBody>;
export type OnboardingCompleteBody = z.infer<typeof OnboardingCompleteBody>;
export type DepositOpenBody = z.infer<typeof DepositOpenBody>;
export type LoanQuoteBody = z.infer<typeof LoanQuoteBody>;
export type LoanTakeBody = z.infer<typeof LoanTakeBody>;
export type LoanPayBody = z.infer<typeof LoanPayBody>;
export type ShopBuyBody = z.infer<typeof ShopBuyBody>;
export type MarketSellBody = z.infer<typeof MarketSellBody>;
export type BusinessCreateBody = z.infer<typeof BusinessCreateBody>;
export type BusinessRegisterBody = z.infer<typeof BusinessRegisterBody>;
export type BusinessProduceBody = z.infer<typeof BusinessProduceBody>;
export type JobShiftBody = z.infer<typeof JobShiftBody>;
export type MedicalTreatBody = z.infer<typeof MedicalTreatBody>;
export type MedicalInsuranceBody = z.infer<typeof MedicalInsuranceBody>;
export type LessonAnswerBody = z.infer<typeof LessonAnswerBody>;
export type ParentTaskBody = z.infer<typeof ParentTaskBody>;
export type PocketMoneyBody = z.infer<typeof PocketMoneyBody>;
export type DevTimeSkipBody = z.infer<typeof DevTimeSkipBody>;
