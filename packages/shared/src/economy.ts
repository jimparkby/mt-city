// Формулы экономики (ТЗ, раздел 8). Чистые функции без побочных эффектов — используются
// сервером для расчётов и клиентом только для превью.
// Округление «в пользу банка»: то, что получает игрок, — Math.floor; то, что платит, — Math.ceil.

import { BP, INFLATION, LOAN, MARKET, TAX } from './config.js';

const rate = (bp: number) => bp / BP;

/** Число полных игровых дней между start и now */
export function daysElapsed(now: number, start: number, dayMs: number): number {
    if (now <= start) return 0;
    return Math.floor((now - start) / dayMs);
}

// ---------- Вклады ----------

/** Сумма вклада со сложным процентом: A = P · (1 + r)^n */
export function depositAmount(principal: number, rateBp: number, days: number): number {
    return Math.floor(principal * Math.pow(1 + rate(rateBp), days));
}

export function depositInterest(principal: number, rateBp: number, days: number): number {
    return depositAmount(principal, rateBp, days) - principal;
}

/** Сколько вернётся при закрытии срочного вклада: досрочно — только P */
export function termDepositPayout(principal: number, rateBp: number, days: number, matured: boolean): number {
    return matured ? depositAmount(principal, rateBp, days) : principal;
}

// ---------- Кредиты ----------

/** Аннуитетный платёж: PMT = P · r / (1 − (1 + r)^−N) */
export function annuityPayment(principal: number, rateBp: number, periods: number): number {
    if (periods <= 0) throw new Error('periods must be > 0');
    const r = rate(rateBp);
    if (r === 0) return Math.ceil(principal / periods);
    return Math.ceil((principal * r) / (1 - Math.pow(1 + r, -periods)));
}

export function loanOverpayment(principal: number, payment: number, periods: number): number {
    return payment * periods - principal;
}

/** Ставка по рейтингу или null — отказ */
export function loanRateBp(creditScore: number): number | null {
    for (const tier of LOAN.rateByScore) {
        if (creditScore >= tier.minScore) return tier.rateBp;
    }
    return null;
}

/** Лимит кредита: 3 × выручка за 7 дней, без бизнеса — фиксированный */
export function loanLimit(revenueLast7Days: number | null): number {
    if (revenueLast7Days === null) return LOAN.limitWithoutBusiness;
    return revenueLast7Days * LOAN.limitRevenueMultiplier;
}

export interface LoanQuote {
    rateBp: number;
    payment: number;
    total: number;
    overpayment: number;
    schedule: { period: number; payment: number; interest: number; principal: number; remaining: number }[];
}

export function loanQuote(principal: number, periods: number, creditScore: number): LoanQuote | null {
    const rateBp = loanRateBp(creditScore);
    if (rateBp === null) return null;
    const payment = annuityPayment(principal, rateBp, periods);
    const schedule: LoanQuote['schedule'] = [];
    let remaining = principal;
    for (let period = 1; period <= periods; period++) {
        const interest = Math.ceil(remaining * rate(rateBp));
        const isLast = period === periods;
        const pay = isLast ? remaining + interest : payment;
        const body = pay - interest;
        remaining = Math.max(0, remaining - body);
        schedule.push({ period, payment: pay, interest, principal: body, remaining });
    }
    const total = schedule.reduce((s, row) => s + row.payment, 0);
    return { rateBp, payment, total, overpayment: total - principal, schedule };
}

export function overduePenalty(payment: number): number {
    return Math.ceil(payment * rate(LOAN.overduePenaltyBp));
}

export function adjustCreditScore(score: number, onTime: boolean): number {
    const delta = onTime ? LOAN.onTimeScoreDelta : LOAN.overdueScoreDelta;
    return Math.min(LOAN.scoreMax, Math.max(LOAN.scoreMin, score + delta));
}

// ---------- Торговля ----------

/** Цена за единицу с учётом опта */
export function unitPrice(
    product: { price: number; bulkMinQty?: number | null; bulkPrice?: number | null },
    qty: number,
): number {
    if (product.bulkMinQty != null && product.bulkPrice != null && qty >= product.bulkMinQty) {
        return product.bulkPrice;
    }
    return product.price;
}

/** Средневзвешенная себестоимость при докупке */
export function weightedUnitCost(oldQty: number, oldCost: number, addQty: number, addCost: number): number {
    const qty = oldQty + addQty;
    if (qty === 0) return 0;
    return Math.ceil((oldQty * oldCost + addQty * addCost) / qty);
}

/** Profit = Revenue − COGS − Losses */
export function dealProfit(revenue: number, cogs: number, losses = 0): number {
    return revenue - cogs - losses;
}

/** Наценка (Price − UnitCost) / UnitCost, в bp */
export function markupBp(price: number, unitCost: number): number {
    if (unitCost <= 0) return 0;
    return Math.floor(((price - unitCost) / unitCost) * BP);
}

/** Спрос за день: Q = ⌊Q_base · (P_ref / P)^e · k_district⌋ */
export function marketDemand(
    qBase: number,
    refPrice: number,
    price: number,
    kDistrict = 1,
    elasticity: number = MARKET.elasticity,
): number {
    if (price <= 0) return 0;
    return Math.floor(qBase * Math.pow(refPrice / price, elasticity) * kDistrict);
}

export function marketSale(qty: number, price: number, demand: number): { sold: number; revenue: number } {
    const sold = Math.max(0, Math.min(qty, demand));
    return { sold, revenue: sold * price };
}

// ---------- Налоги ----------

export function salaryAfterTax(gross: number): { gross: number; tax: number; net: number } {
    const tax = Math.ceil(gross * rate(TAX.salaryBp));
    return { gross, tax, net: gross - tax };
}

export function profitTax(profit: number): number {
    if (profit <= 0) return 0;
    return Math.ceil(profit * rate(TAX.profitBp));
}

/** Пени за неуплату: 1% в день после льготных 2 дней */
export function taxPenalty(taxDue: number, daysLate: number): number {
    const days = daysLate - TAX.graceDays;
    if (days <= 0) return 0;
    return Math.ceil(taxDue * rate(TAX.penaltyPerDayBp) * days);
}

// ---------- Инфляция ----------

export function inflate(price: number, inflationBp: number): number {
    return Math.ceil(price * (1 + rate(inflationBp)));
}

/** Глобальная ставка инфляции на период, детерминированная по seed */
export function inflationBpFor(seed: string): number {
    const rnd = seededRandom(seed)();
    return Math.round(INFLATION.minBp + rnd * (INFLATION.maxBp - INFLATION.minBp));
}

// ---------- Детерминированный рандом ----------

function hashString(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** mulberry32: одинаковый seed (playerId + день) → одинаковая последовательность */
export function seededRandom(seed: string): () => number {
    let a = hashString(seed);
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function chance(seed: string, bp: number): boolean {
    return seededRandom(seed)() < rate(bp);
}

// ---------- Форматирование ----------

/** 12345 → "123,45" */
export function formatCoins(kopecks: number): string {
    const sign = kopecks < 0 ? '−' : '';
    const abs = Math.abs(kopecks);
    const whole = Math.floor(abs / 100).toLocaleString('ru-RU');
    const frac = String(abs % 100).padStart(2, '0');
    return `${sign}${whole},${frac}`;
}
