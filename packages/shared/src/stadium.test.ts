import { describe, expect, it } from 'vitest';
import { PANEL, STADIUM_TEEN, checkOpenAnswer, panelVerdict } from './stadium.js';
import { pathSteps } from './paths.js';

describe('стадион 14–17', () => {
    it('путь подростка собран из четырёх блоков методички', () => {
        expect(pathSteps('stadium', true)).toBe(STADIUM_TEEN);
        expect(new Set(STADIUM_TEEN.map((s) => s.block)).size).toBe(4);
        expect(STADIUM_TEEN.filter((s) => s.kind === 'game').map((s) => s.game)).toEqual([
            'director',
            'auditor',
            'talks',
            'panel',
        ]);
    });

    it('открытый ответ: число по цифрам, слово по корню', () => {
        expect(checkOpenAnswer(['1392000'], '1 392 000 руб.')).toBe(true);
        expect(checkOpenAnswer(['1392000'], '1600000')).toBe(false);
        expect(checkOpenAnswer(['премиальн'], 'Премиальный продукт')).toBe(true);
        expect(checkOpenAnswer(['выраст', 'повыш'], 'цена повышается')).toBe(true);
        expect(checkOpenAnswer(['монопол'], '')).toBe(false);
    });

    it('пульт: побеждает только «золотое сечение» на 10 млн', () => {
        expect(panelVerdict([2, 1, 1, 1])).toEqual({ ok: true });
        expect(panelVerdict([2, 1, 1, 1]).ok && PANEL.budget).toBe(10_000_000);
        expect(panelVerdict([0, 1, 1, 1]).ok).toBe(false);
        expect(panelVerdict([2, 2, 1, 1]).ok).toBe(false);
        expect(panelVerdict([1, 1, 1, 2]).ok).toBe(false);
    });
});
