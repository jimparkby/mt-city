import { describe, expect, it } from 'vitest';
import { PATH, applyGameAction, initialGame, nodeStatus, weekQuests, type GameState } from './game.js';

const run = (s: GameState, ...actions: Parameters<typeof applyGameAction>[1][]) => actions.reduce(applyGameAction, s);

describe('задания от родителей', () => {
    it('ребёнок сдаёт, родитель принимает — деньги переходят', () => {
        const s0 = initialGame();
        const s = run(s0, { type: 'task/submit', id: 't2' }, { type: 'task/approve', id: 't2' });
        expect(s.tasks.find((t) => t.id === 't2')!.status).toBe('paid');
        expect(s.byn).toBe(s0.byn + 300);
        expect(s.parentCard).toBe(s0.parentCard - 300);
        expect(s.coins).toBe(s0.coins + 3_000);
    });

    it('нельзя принять задание, которое не сдано', () => {
        const s0 = initialGame();
        expect(applyGameAction(s0, { type: 'task/approve', id: 't2' })).toBe(s0);
    });

    it('возврат на доработку', () => {
        const s = run(initialGame(), { type: 'task/submit', id: 't3' }, { type: 'task/return', id: 't3' });
        expect(s.tasks.find((t) => t.id === 't3')).toMatchObject({ status: 'open', returned: true });
    });

    it('новое задание', () => {
        const s = applyGameAction(initialGame(), {
            type: 'task/create',
            title: ' Погулять с собакой ',
            byn: 150,
            icon: 'star',
        });
        expect(s.tasks.at(-1)).toMatchObject({ title: 'Погулять с собакой', byn: 150, status: 'open' });
    });
});

describe('путь и квесты недели', () => {
    it('сундук открывается только после всех пяти квестов', () => {
        const chest = PATH.find((n) => n.kind === 'chest')!;
        let s = initialGame();
        expect(nodeStatus(s, chest)).toBe('locked');
        expect(applyGameAction(s, { type: 'chest/open' })).toBe(s);

        s = run(
            s,
            { type: 'dream/complete' },
            { type: 'quiz/complete' },
            { type: 'task/submit', id: 't2' },
            { type: 'task/approve', id: 't2' },
        );
        expect(weekQuests(s).every((q) => q.done)).toBe(true);
        expect(nodeStatus(s, chest)).toBe('current');

        const opened = applyGameAction(s, { type: 'chest/open' });
        expect(opened.level).toBe(s.level + 1);
        expect(opened.coins).toBe(s.coins + 10_000);
    });

    it('награды за квест и урок начисляются один раз', () => {
        const s0 = initialGame();
        const s = run(s0, { type: 'dream/complete' }, { type: 'dream/complete' });
        expect(s.knowledge).toBe(s0.knowledge + 60);
    });
});

describe('оценки', () => {
    it('дневник платит по правилам родителя', () => {
        const s0 = initialGame();
        const s = applyGameAction(s0, { type: 'grades/pull' }); // Русский язык: 10
        expect(s.byn).toBe(s0.byn + 200);
        expect(s.gradeFeed.at(-1)).toEqual({ subj: 'Русский язык', g: 10, amt: 200 });
    });

    it('правило в пределах 0…10 BYN', () => {
        const s = run(initialGame(), { type: 'grades/rule', grade: 8, delta: -100 });
        expect(s.rules[8]).toBe(0);
    });
});

describe('бонусы в городе', () => {
    it('собираются один раз', () => {
        const s0 = initialGame();
        const s = run(s0, { type: 'city/collect', id: 'cofix' }, { type: 'city/collect', id: 'cofix' });
        expect(s.coins).toBe(s0.coins + 1_200);
        expect(applyGameAction(s0, { type: 'city/collect', id: 'legal' })).toBe(s0);
    });
});

describe('пути в зданиях, магазин и вклады (v7)', () => {
    it('шаг пути: ребёнку MTcoin, подростку знания, второй раз не платится', () => {
        const s0 = initialGame();
        const kid = applyGameAction(s0, { type: 'step/complete', loc: 'bank', k: 1 });
        expect(kid.coins).toBe(s0.coins + 1_500);
        expect(kid.quizDone).toBe(true);
        expect(applyGameAction(kid, { type: 'step/complete', loc: 'bank', k: 1 })).toBe(kid);
        const teen = applyGameAction(s0, { type: 'step/complete', loc: 'sosedi', k: 0, teen: true });
        expect(teen.coins).toBe(s0.coins);
        expect(teen.knowledge).toBe(s0.knowledge + 20);
    });

    it('покупка в магазине списывает MTcoin и надевает вещь', () => {
        const s0 = initialGame();
        const s = applyGameAction(s0, { type: 'shop/buy', cat: 'top', id: 'tee' });
        expect(s.coins).toBe(s0.coins - 8_000);
        expect(s.outfit.top).toBe('tee');
        expect(applyGameAction(s, { type: 'shop/buy', cat: 'hat', id: 'crown' })).toBe(s); // 400 > 160
    });

    it('вклад открывается с детской карты и не больше остатка', () => {
        const s0 = initialGame();
        const s = applyGameAction(s0, { type: 'deposit/open', id: 'b6', amt: 1_000 });
        expect(s.byn).toBe(s0.byn - 1_000);
        expect(s.deposits[0]).toMatchObject({ amt: 1_000, inc: 20 });
        expect(applyGameAction(s, { type: 'deposit/open', id: 'b6', amt: 2_000 })).toBe(s);
    });
});
