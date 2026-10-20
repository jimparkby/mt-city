import { describe, expect, it } from 'vitest';
import {
    adjustCreditScore,
    annuityPayment,
    daysElapsed,
    depositAmount,
    formatCoins,
    loanLimit,
    loanQuote,
    loanRateBp,
    marketDemand,
    marketSale,
    markupBp,
    profitTax,
    salaryAfterTax,
    seededRandom,
    taxPenalty,
    termDepositPayout,
    unitPrice,
    weightedUnitCost,
} from './economy.js';

describe('время', () => {
    it('считает полные дни', () => {
        expect(daysElapsed(0, 0, 60_000)).toBe(0);
        expect(daysElapsed(59_999, 0, 60_000)).toBe(0);
        expect(daysElapsed(120_000, 0, 60_000)).toBe(2);
        expect(daysElapsed(0, 100, 60_000)).toBe(0);
    });
});

describe('вклады', () => {
    it('сложный процент', () => {
        expect(depositAmount(10_000, 100, 0)).toBe(10_000);
        expect(depositAmount(10_000, 100, 1)).toBe(10_100);
        expect(depositAmount(10_000, 100, 7)).toBe(10_721); // 10000 · 1.01^7 = 10721.35
    });
    it('срочный вклад досрочно возвращает только P', () => {
        expect(termDepositPayout(10_000, 100, 3, false)).toBe(10_000);
        expect(termDepositPayout(10_000, 100, 7, true)).toBe(10_721);
    });
});

describe('кредиты', () => {
    it('аннуитет', () => {
        // 1000 под 10% на 3 периода: 1000 · 0.1 / (1 − 1.1^−3) = 402.11
        expect(annuityPayment(1_000, 1_000, 3)).toBe(403);
        expect(annuityPayment(900, 0, 3)).toBe(300);
    });
    it('ставка по рейтингу', () => {
        expect(loanRateBp(850)).toBe(1_000);
        expect(loanRateBp(700)).toBe(1_000);
        expect(loanRateBp(699)).toBe(1_500);
        expect(loanRateBp(600)).toBe(1_500);
        expect(loanRateBp(599)).toBe(2_000);
        expect(loanRateBp(449)).toBeNull();
    });
    it('лимит', () => {
        expect(loanLimit(null)).toBe(20_000);
        expect(loanLimit(5_000)).toBe(15_000);
    });
    it('график гасит кредит полностью', () => {
        const q = loanQuote(10_000, 4, 650)!;
        expect(q.rateBp).toBe(1_500);
        expect(q.schedule.at(-1)!.remaining).toBe(0);
        expect(q.schedule.reduce((s, r) => s + r.principal, 0)).toBe(10_000);
        expect(q.overpayment).toBe(q.total - 10_000);
        expect(loanQuote(10_000, 4, 400)).toBeNull();
    });
    it('рейтинг в границах 300–850', () => {
        expect(adjustCreditScore(848, true)).toBe(850);
        expect(adjustCreditScore(310, false)).toBe(300);
        expect(adjustCreditScore(600, false)).toBe(580);
    });
});

describe('торговля', () => {
    it('оптовая цена', () => {
        const p = { price: 100, bulkMinQty: 10, bulkPrice: 80 };
        expect(unitPrice(p, 9)).toBe(100);
        expect(unitPrice(p, 10)).toBe(80);
        expect(unitPrice({ price: 100 }, 50)).toBe(100);
    });
    it('средневзвешенная себестоимость', () => {
        expect(weightedUnitCost(10, 100, 10, 80)).toBe(90);
        expect(weightedUnitCost(0, 0, 5, 70)).toBe(70);
    });
    it('наценка', () => {
        expect(markupBp(150, 100)).toBe(5_000);
    });
    it('спрос падает с ростом цены', () => {
        expect(marketDemand(20, 100, 100)).toBe(20);
        expect(marketDemand(20, 100, 200)).toBe(7); // 20 · 0.5^1.5 = 7.07
        expect(marketDemand(20, 100, 100, 1.2)).toBe(24);
        expect(marketSale(30, 100, 20)).toEqual({ sold: 20, revenue: 2_000 });
        expect(marketSale(5, 100, 20)).toEqual({ sold: 5, revenue: 500 });
    });
});

describe('налоги', () => {
    it('НДФЛ 13%', () => {
        expect(salaryAfterTax(3_000)).toEqual({ gross: 3_000, tax: 390, net: 2_610 });
    });
    it('налог на прибыль и пени', () => {
        expect(profitTax(10_000)).toBe(1_000);
        expect(profitTax(-500)).toBe(0);
        expect(taxPenalty(1_000, 2)).toBe(0);
        expect(taxPenalty(1_000, 4)).toBe(20);
    });
});

describe('утилиты', () => {
    it('детерминированный рандом', () => {
        expect(seededRandom('p1:5')()).toBe(seededRandom('p1:5')());
        expect(seededRandom('p1:5')()).not.toBe(seededRandom('p1:6')());
    });
    it('формат', () => {
        expect(formatCoins(10_000)).toBe('100,00');
        expect(formatCoins(-5)).toBe('−0,05');
    });
});
