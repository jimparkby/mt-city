import { describe, expect, it } from 'vitest';
import { applyGameAction, initialGame, type GameAction, type GameState } from './game.js';

const run = (s: GameState, ...actions: GameAction[]) => actions.reduce(applyGameAction, s);

describe('Moby Семья: покупки по правилам родителя', () => {
    it('казино и 18+ отклоняются всегда, даже если родитель пытается включить', () => {
        const s0 = initialGame();
        const s = run(
            s0,
            { type: 'controls/set', patch: { cats: { ...s0.controls.cats, gambling: true } } },
            { type: 'op/pay', merchant: 'casino' },
        );
        expect(s.controls.cats.gambling).toBe(false);
        expect(s.ops[0]).toMatchObject({ status: 'declined', reason: 'Запрещено для детских карт' });
        expect(s.byn).toBe(s0.byn);
    });

    it('покупка у партнёра списывает деньги и даёт баллы ребёнку и родителю', () => {
        const s0 = initialGame();
        const s = applyGameAction(s0, { type: 'op/pay', merchant: 'cofix' });
        expect(s.byn).toBe(s0.byn - 450);
        expect(s.points.child).toBe(s0.points.child + 23);
        expect(s.points.parent).toBe(s0.points.parent + 5);
    });

    it('дорогая покупка ждёт подтверждения и списывается только после него', () => {
        const s0 = run(initialGame(), { type: 'controls/set', patch: { dayLimit: 10_000 } }, { type: 'pocket/pay' });
        const s1 = applyGameAction(s0, { type: 'op/pay', merchant: 'green' });
        expect(s1.ops[0].status).toBe('pending');
        expect(s1.byn).toBe(s0.byn);
        const s2 = applyGameAction(s1, { type: 'op/approve', id: s1.ops[0].id });
        expect(s2.ops[0].status).toBe('done');
        expect(s2.byn).toBe(s0.byn - 1_290);
    });

    it('интернет-покупки выключены у ребёнка 7–13 по умолчанию', () => {
        const s = applyGameAction(initialGame(), { type: 'op/pay', merchant: 'game' });
        expect(s.ops[0].status).toBe('declined');
    });

    it('потерянную карту нельзя просто разблокировать — только перевыпустить', () => {
        let s = applyGameAction(initialGame(), { type: 'card/block', lost: true });
        s = applyGameAction(s, { type: 'card/unblock' });
        expect(s.controls.blocked).toBe(true);
        s = applyGameAction(s, { type: 'card/reissue' });
        expect(s.controls).toMatchObject({ blocked: false, lost: false });
        expect(s.reissued).toBe(1);
    });
});

describe('Moby Семья: просьбы ребёнка и карманные деньги', () => {
    it('родитель разрешает функцию по просьбе', () => {
        const s1 = applyGameAction(initialGame(), { type: 'req/create', kind: 'feature', key: 'online', note: '' });
        const s2 = applyGameAction(s1, { type: 'req/resolve', id: s1.requests[0].id, ok: true });
        expect(s2.controls.features.online).toBe(true);
    });

    it('просьба о деньгах и карманные деньги переводят с карты родителя', () => {
        const s0 = initialGame();
        const s1 = applyGameAction(s0, { type: 'req/create', kind: 'money', amt: 500, note: 'на подарок' });
        const s2 = run(s1, { type: 'req/resolve', id: s1.requests[0].id, ok: true }, { type: 'pocket/pay' });
        expect(s2.byn).toBe(s0.byn + 500 + s0.pocket.amt);
        expect(s2.parentCard).toBe(s0.parentCard - 500 - s0.pocket.amt);
    });
});
