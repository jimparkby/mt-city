// Изометрическая карта города (макет «MT City v3 Moby»): рисуется в SVG по описанию зданий.
// Каждый тип здания — свой силуэт; закрытые по уровню — стройка с краном и забором.

import { BUILDINGS, type BuildingId } from '@mt/shared';

type Pt = [number, number];

const N = 14;
const TW = 34;
const TH = 17;
const OX = N * TW + 20;
const OY = 190;
export const MAP_W = N * TW * 2 + 40;
export const MAP_H = N * TH * 2 + OY + 70;

export const P = (i: number, j: number): Pt => [(i - j) * TW + OX, (i + j) * TH + OY];
const up = (p: Pt, h: number): Pt => [p[0], p[1] - h];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

const INK = '#201e1d';
const pts = (a: Pt[]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

interface PolyOpts {
    s?: string;
    w?: number;
    dash?: string;
    op?: number;
}

const poly = (a: Pt[], fill: string, o: PolyOpts = {}) =>
    `<polygon points="${pts(a)}" fill="${fill}" stroke="${o.s ?? INK}" stroke-width="${o.w ?? 1.3}" stroke-linejoin="round"` +
    `${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op ? ` fill-opacity="${o.op}"` : ''}/>`;

const line = (a: Pt, b: Pt, c = INK, w = 1.3, extra = '') =>
    `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${c}" stroke-width="${w}" ${extra}/>`;

interface Palette {
    roof: string;
    l: string;
    r: string;
    win: string;
    aw?: string;
}

const PAL: Record<string, Palette> = {
    bank: { roof: '#2f6bf0', l: '#f4f1ea', r: '#e2ddd2', win: '#99e0ff' },
    jobs: { roof: '#7d7979', l: '#d7e6ee', r: '#bccfd9', win: '#5f8ea3' },
    shopA: { roof: '#e0218a', l: '#f6eef3', r: '#e3d6de', win: '#cfe0ff', aw: '#e0218a' },
    shopB: { roof: '#6fa65a', l: '#eef0e2', r: '#d9dcc8', win: '#cbeeff', aw: '#6fa65a' },
    cafe: { roof: '#5b4a3c', l: '#f3d866', r: '#e0c24a', win: '#fff6d6', aw: '#5b4a3c' },
    med: { roof: '#f8f4f4', l: '#ffffff', r: '#ecebeb', win: '#cbeeff' },
    legal: { roof: '#7d7979', l: '#efe9df', r: '#ddd5c7', win: '#bccfd9' },
    market: { roof: '#edbb00', l: '#f3d866', r: '#e0c24a', win: '#fff', aw: '#edbb00' },
};

type Kind = 'bank' | 'tower' | 'shop' | 'cafe' | 'plot' | 'med' | 'market' | 'legal';

export interface MapBuilding {
    id: BuildingId;
    i: number;
    j: number;
    w: number;
    d: number;
    h: number;
    pal: keyof typeof PAL;
    kind: Kind;
    /** Текст в шторке здания */
    desc: string;
    btn: string;
    /** Кнопка-пузырь над зданием: бонус MTcoin или уведомление */
    act?: { label: string; icon: 'piggy' | 'briefcase' | 'coins'; alert?: boolean };
}

export const MAP_BUILDINGS: MapBuilding[] = [
    {
        id: 'bank',
        i: 7.5,
        j: 1,
        w: 3,
        d: 3,
        h: 92,
        pal: 'bank',
        kind: 'bank',
        act: { label: 'Копилка +3', icon: 'piggy' },
        desc: 'Счёт, Копилка и кредиты. Деньги в Копилке растут каждый игровой день.',
        btn: 'Войти в банк',
    },
    {
        id: 'jobs',
        i: 3.5,
        j: 1,
        w: 2,
        d: 2,
        h: 112,
        pal: 'jobs',
        kind: 'tower',
        act: { label: '1', icon: 'briefcase', alert: true },
        desc: 'Новая вакансия: бариста в Cofix. Смена −20 энергии, зарплата минус 13% налога.',
        btn: 'Смотреть вакансии',
    },
    {
        id: 'sosedi',
        i: 0.5,
        j: 1,
        w: 2.5,
        d: 2,
        h: 34,
        pal: 'shopA',
        kind: 'shop',
        desc: 'Продуктовый магазин у дома. Оптом от 10 штук дешевле.',
        btn: 'В магазин',
    },
    {
        id: 'green',
        i: 11,
        j: 1,
        w: 2.5,
        d: 2.5,
        h: 42,
        pal: 'shopB',
        kind: 'shop',
        desc: 'Гипермаркет. Большой выбор, но следи за сроком годности.',
        btn: 'В магазин',
    },
    {
        id: 'cofix',
        i: 1,
        j: 4,
        w: 2,
        d: 1.6,
        h: 26,
        pal: 'cafe',
        kind: 'cafe',
        act: { label: '+12', icon: 'coins' },
        desc: 'Кофейня. Здесь проходит мини-игра «Бариста».',
        btn: 'В кофейню',
    },
    {
        id: 'plot',
        i: 2,
        j: 7.5,
        w: 3,
        d: 3,
        h: 0,
        pal: 'bank',
        kind: 'plot',
        desc: 'Здесь будет твой бизнес. Придумай идею, посчитай расходы и зарегистрируйся в Юрцентре.',
        btn: 'Придумать бизнес',
    },
    {
        id: 'medical',
        i: 1,
        j: 11,
        w: 3,
        d: 2,
        h: 52,
        pal: 'med',
        kind: 'med',
        desc: 'Лечение и страховка. Со страховкой лечение дешевле на 80%.',
        btn: 'Войти',
    },
    {
        id: 'market',
        i: 8,
        j: 8,
        w: 3,
        d: 3,
        h: 52,
        pal: 'market',
        kind: 'market',
        desc: 'Продавай товары по своей цене. Чем дороже — тем меньше купят.',
        btn: 'На рынок',
    },
    {
        id: 'legal',
        i: 11.2,
        j: 11.2,
        w: 2,
        d: 2,
        h: 70,
        pal: 'legal',
        kind: 'legal',
        desc: 'Регистрация бизнеса: самозанятый или ИП.',
        btn: 'Войти',
    },
];

export const minLevel = (id: BuildingId) => BUILDINGS.find((b) => b.id === id)!.minBankLevel;
export const buildingName = (id: BuildingId) => BUILDINGS.find((b) => b.id === id)!.name;

/** Высота таблички с названием над зданием */
export function pinTop(b: MapBuilding, locked: boolean): number {
    if (b.kind === 'plot') return 62;
    if (locked) return b.h + 8;
    const extra: Partial<Record<Kind, number>> = { bank: 54, tower: 40, cafe: 50, med: 44, shop: 22 };
    return b.h + (extra[b.kind] ?? 10);
}

const TREES: Pt[] = [
    [0.3, 0.2],
    [6.2, 0.2],
    [13.3, 0.3],
    [5.2, 4.6],
    [4.4, 3.8],
    [10.6, 4.8],
    [12.8, 4.5],
    [0.3, 6.6],
    [0.2, 10.2],
    [5.4, 9.4],
    [5.6, 12.6],
    [7.4, 12.9],
    [10, 13.3],
    [13.4, 9.6],
    [7.4, 4.7],
    [3.6, 13.3],
];
const POND: Pt[] = [
    [10.6, 4.6],
    [13.6, 4.6],
    [13.6, 6.2],
    [10.6, 6.2],
];

type Face = (u: number, v: number) => Pt;

interface Faces {
    A: Pt;
    B: Pt;
    C: Pt;
    D: Pt;
    h: number;
    lf: Face;
    rf: Face;
}

function faces(b: MapBuilding): Faces {
    const { i, j, w, d, h } = b;
    const A = P(i, j);
    const B = P(i + w, j);
    const C = P(i + w, j + d);
    const D = P(i, j + d);
    return { A, B, C, D, h, lf: (u, v) => up(lerp(D, C, u), v * h), rf: (u, v) => up(lerp(C, B, u), v * h) };
}

const quad = (f: Face, u0: number, u1: number, v0: number, v1: number, fill: string, o?: PolyOpts) =>
    poly([f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)], fill, o);

function walls(F: Faces, pal: { l: string; r: string }, o?: PolyOpts) {
    const { A, B, C, D, h } = F;
    const sh = (p: Pt): Pt => [p[0] - 16, p[1] + 6];
    return (
        poly([sh(A), sh(B), sh(C), sh(D)], 'rgba(32,30,29,.16)', { s: 'none' }) +
        poly([D, C, up(C, h), up(D, h)], pal.l, o) +
        poly([C, B, up(B, h), up(C, h)], pal.r, o)
    );
}

function flatRoof(F: Faces, pal: Palette, lip = 4) {
    const t = [F.A, F.B, F.C, F.D].map((p) => up(p, F.h));
    return (
        poly(
            t.map((p) => up(p, lip)),
            pal.roof,
        ) +
        poly([t[3], t[2], up(t[2], lip), up(t[3], lip)], pal.roof) +
        poly([t[2], t[1], up(t[1], lip), up(t[2], lip)], pal.roof, { op: 0.8 })
    );
}

function windows(f: Face, cols: number, rows: number, v0: number, v1: number, fill: string, skipDoor = false) {
    let s = '';
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            if (skipDoor && r === 0 && c === Math.floor(cols / 2)) continue;
            const a = (c + 0.22) / cols;
            const b = (c + 0.78) / cols;
            const rv = (v1 - v0) / rows;
            s += quad(f, a, b, v0 + rv * (r + 0.25), v0 + rv * (r + 0.8), fill, { w: 1 });
        }
    return s;
}

function awning(f: Face, v: number, col: string, n: number) {
    let s = '';
    const a0 = f(0, v);
    const a1 = f(1, v);
    const b1: Pt = [a1[0] - 7, a1[1] + 11];
    const b0: Pt = [a0[0] - 7, a0[1] + 11];
    for (let k = 0; k < n; k++)
        s += poly(
            [lerp(a0, a1, k / n), lerp(a0, a1, (k + 1) / n), lerp(b0, b1, (k + 1) / n), lerp(b0, b1, k / n)],
            k % 2 ? '#fbf8f2' : col,
            { w: 1 },
        );
    return s;
}

const door = (f: Face, u: number, wv: number, hv: number, fill = INK) =>
    quad(f, u - wv / 2, u + wv / 2, 0, hv, fill, { w: 1 });

function drawBuilding(b: MapBuilding, locked: boolean) {
    if (b.kind === 'plot') return plot(b);
    const F = faces(b);
    const pal = PAL[b.pal];
    if (locked) return construction(F);
    let s = walls(F, pal);
    const { lf, rf, h } = F;
    if (b.kind === 'bank') {
        s += quad(lf, 0, 1, 0, 0.1, '#e2ddd2', { w: 1 });
        for (let k = 0; k < 5; k++) {
            const u = 0.12 + k * 0.19;
            s += quad(lf, u, u + 0.06, 0.1, 0.5, '#fbf8f2', { w: 1 });
        }
        s += poly([lf(0.04, 0.5), lf(0.96, 0.5), lf(0.5, 0.64)], '#fbf8f2');
        s += door(lf, 0.5, 0.1, 0.32, '#2b5f73');
        s += windows(lf, 6, 2, 0.66, 0.98, pal.win) + windows(rf, 5, 3, 0.1, 0.98, pal.win);
        s += flatRoof(F, pal);
        const base = lerp(up(F.A, h + 4), up(F.C, h + 4), 0.5);
        s +=
            line(base, up(base, 46), INK, 2) +
            poly([up(base, 46), [base[0] + 24, base[1] - 39], up(base, 32)], '#e0218a');
    } else if (b.kind === 'tower') {
        s += windows(lf, 4, 6, 0.08, 0.97, pal.win, true) + windows(rf, 4, 6, 0.08, 0.97, pal.win);
        s += door(lf, 0.5, 0.2, 0.1, '#2b5f73') + flatRoof(F, pal, 5);
        const c = lerp(up(F.A, h + 5), up(F.C, h + 5), 0.5);
        s +=
            line(c, up(c, 30), INK, 2) +
            `<circle cx="${c[0]}" cy="${c[1] - 32}" r="3" fill="#d6006c" stroke="${INK}"/>`;
    } else if (b.kind === 'shop' || b.kind === 'market' || b.kind === 'legal') {
        if (b.kind === 'legal') {
            s += windows(lf, 3, 3, 0.1, 0.95, pal.win, true) + windows(rf, 3, 3, 0.1, 0.95, pal.win);
            s += door(lf, 0.5, 0.18, 0.22, '#5b4a3c') + flatRoof(F, pal);
            return s;
        }
        const aw = pal.aw ?? pal.roof;
        s += quad(lf, 0.06, 0.94, 0.06, 0.58, pal.win, { w: 1.2 });
        for (let k = 1; k < 4; k++) s += line(lf((k / 4) * 0.88 + 0.06, 0.06), lf((k / 4) * 0.88 + 0.06, 0.58), INK, 1);
        s += door(lf, 0.5, 0.16, 0.5, '#fbf8f2') + windows(rf, 3, 1, 0.2, 0.6, pal.win);
        s += awning(lf, 0.72, aw, 10) + flatRoof(F, pal);
        const sl = up(lerp(F.D, F.C, 0.2), h + 4);
        const sr = up(lerp(F.D, F.C, 0.8), h + 4);
        s += poly([sl, sr, up(sr, 14), up(sl, 14)], '#fbf8f2', { w: 1.2 });
        s += line(lerp(up(sl, 7), up(sr, 7), 0.15), lerp(up(sl, 7), up(sr, 7), 0.85), aw, 3);
    } else if (b.kind === 'cafe') {
        s +=
            quad(lf, 0.1, 0.62, 0.08, 0.6, pal.win) +
            door(lf, 0.8, 0.16, 0.62, '#5b4a3c') +
            windows(rf, 2, 1, 0.2, 0.6, pal.win);
        s += awning(lf, 0.72, pal.aw!, 8);
        const t = [F.A, F.B, F.C, F.D].map((p) => up(p, h));
        const R1 = up(lerp(t[0], t[3], 0.5), 20);
        const R2 = up(lerp(t[1], t[2], 0.5), 20);
        s +=
            poly([t[0], t[1], R2, R1], pal.roof) +
            poly([t[3], t[2], R2, R1], pal.roof, { op: 0.9 }) +
            poly([t[2], t[1], R2], pal.r);
        const sc = up(lerp(F.D, F.C, 0.35), h + 26);
        s +=
            line(up(sc, -10), sc, INK, 1.5) +
            `<circle cx="${sc[0]}" cy="${sc[1] - 9}" r="11" fill="#fbf8f2" stroke="${INK}" stroke-width="1.3"/>` +
            `<path d="M${sc[0] - 5} ${sc[1] - 13} h9 v6 a4 4 0 0 1 -9 0 z M${sc[0] + 4} ${sc[1] - 11} a2.5 2.5 0 0 1 0 5" fill="#5b4a3c" stroke="${INK}" stroke-width="1"/>`;
    } else if (b.kind === 'med') {
        s += windows(lf, 6, 2, 0.1, 0.9, pal.win, true) + windows(rf, 4, 2, 0.1, 0.9, pal.win);
        s += door(lf, 0.5, 0.14, 0.34, '#cbeeff') + flatRoof(F, pal);
        const c = up(lerp(F.D, F.C, 0.5), h + 22);
        s += line(up(c, -18), up(c, -4), INK, 1.5);
        s +=
            `<rect x="${c[0] - 14}" y="${c[1] - 14}" width="28" height="28" rx="3" fill="#fff" stroke="${INK}" stroke-width="1.3"/>` +
            `<path d="M${c[0] - 3} ${c[1] - 9} h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 v-6 h6 z" fill="#d6006c"/>`;
    }
    return s;
}

/** Закрытое здание: стройка с лесами, краном и забором */
function construction(F: Faces) {
    const { A, B, C, D, lf, rf } = F;
    const wood = '#a07a00';
    let s = poly(
        [A, B, C, D].map((p): Pt => [p[0] - 16, p[1] + 6]),
        'rgba(32,30,29,.1)',
        { s: 'none' },
    );
    s += poly([A, B, C, D], '#d8c9a8', { w: 1 });
    s += walls({ ...F, h: F.h * 0.45 }, { l: '#e8e3d8', r: '#d9d3c6' }, { dash: '4 3' });
    for (const f of [lf, rf]) {
        for (let k = 0; k <= 3; k++) s += line(f(k / 3, 0), f(k / 3, 1), wood, 1.6);
        for (let k = 1; k <= 3; k++) s += line(f(0, k / 3), f(1, k / 3), wood, 1.6);
        s += line(f(0, 0), f(1 / 3, 1 / 3), wood, 1) + line(f(1 / 3, 1 / 3), f(2 / 3, 2 / 3), wood, 1);
    }
    const top = up(lerp(B, A, 0.2), F.h);
    const arm: Pt = [top[0] + 50, top[1] - 6];
    s +=
        line(up(lerp(B, A, 0.2), 0), up(top, 30), '#edbb00', 3) +
        line(up(top, 28), up(arm, 28), '#edbb00', 3) +
        line(up(arm, 28), up(arm, 6), INK, 1);
    const f0: Pt = [D[0] - 6, D[1] + 6];
    const f1: Pt = [C[0] + 2, C[1] + 8];
    const f2: Pt = [B[0] + 8, B[1] + 6];
    for (let k = 0; k <= 8; k++) {
        const p = lerp(f0, f1, k / 8);
        s += line(p, up(p, 13), INK, 1.4);
    }
    for (let k = 1; k <= 8; k++) {
        const p = lerp(f1, f2, k / 8);
        s += line(p, up(p, 13), INK, 1.4);
    }
    s += line(up(f0, 9), up(f1, 9), '#edbb00', 3.5) + line(up(f1, 9), up(f2, 9), '#edbb00', 3.5);
    s +=
        line(up(f0, 9), up(f1, 9), INK, 3.5, 'stroke-dasharray="5 6"') +
        line(up(f1, 9), up(f2, 9), INK, 3.5, 'stroke-dasharray="5 6"');
    return s;
}

function plot(b: MapBuilding) {
    const { i, j, w, d } = b;
    let s = poly([P(i, j), P(i + w, j), P(i + w, j + d), P(i, j + d)], '#e6dcc2', { s: '#0088b0', w: 2, dash: '7 5' });
    for (let k = 1; k < 3; k++) s += line(P(i + 0.3, j + k), P(i + w - 0.3, j + k), '#d3c5a5', 1.2);
    const c = P(i + w / 2, j + d / 2);
    s +=
        line(c, up(c, 30), INK, 2) +
        poly([up(c, 52), [c[0] + 30, c[1] - 52], [c[0] + 30, c[1] - 30], up(c, 30)], '#fbf8f2');
    s += `<path d="M${c[0] + 9} ${c[1] - 41} h12 M${c[0] + 15} ${c[1] - 47} v12" stroke="#0088b0" stroke-width="2.4" stroke-linecap="round"/>`;
    return s;
}

function tree(i: number, j: number, big: boolean) {
    const c = P(i + 0.5, j + 0.5);
    const r = big ? 14 : 11;
    return (
        `<ellipse cx="${c[0] - 6}" cy="${c[1] + 3}" rx="${r + 2}" ry="${r / 2}" fill="rgba(32,30,29,.15)"/>` +
        line(c, up(c, 12), '#5b4a3c', 3) +
        `<circle cx="${c[0]}" cy="${c[1] - 12 - r}" r="${r}" fill="#5fb05a" stroke="${INK}" stroke-width="1.3"/>` +
        `<circle cx="${c[0] + r * 0.35}" cy="${c[1] - 12 - r * 1.35}" r="${r * 0.35}" fill="#a9cf86"/>`
    );
}

function lamp(i: number, j: number) {
    const c = P(i, j);
    return (
        line(c, up(c, 22), INK, 1.6) + `<circle cx="${c[0]}" cy="${c[1] - 24}" r="3.5" fill="#f3d866" stroke="${INK}"/>`
    );
}

function car(i: number, j: number, col: string, alongI: boolean) {
    const a = P(i, j);
    const b = alongI ? P(i + 0.9, j) : P(i, j + 0.9);
    const h = 10;
    return (
        poly([[a[0] - 6, a[1] + 3], [b[0] - 6, b[1] + 3], b, a], 'rgba(32,30,29,.15)', { s: 'none' }) +
        poly([a, b, up(b, h), up(a, h)], col) +
        poly(
            [up(lerp(a, b, 0.2), h), up(lerp(a, b, 0.8), h), up(lerp(a, b, 0.7), h + 7), up(lerp(a, b, 0.3), h + 7)],
            '#cbeeff',
            {
                w: 1,
            },
        )
    );
}

/** SVG всей карты для уровня игрока (закрытые здания — стройки) */
export function buildMapSvg(level: number): string {
    let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${MAP_W}" height="${MAP_H}" viewBox="0 0 ${MAP_W} ${MAP_H}">`;
    const T = P(0, 0);
    const R = P(N, 0);
    const Bt = P(N, N);
    const L = P(0, N);
    const dep = 34;
    s += `<ellipse cx="${Bt[0]}" cy="${(T[1] + Bt[1]) / 2 + 30}" rx="${N * TW + 40}" ry="${N * TH + 40}" fill="#2a56c9" fill-opacity=".55"/>`;
    s += poly([L, Bt, up(Bt, -dep), up(L, -dep)], '#b79a6c') + poly([Bt, R, up(R, -dep), up(Bt, -dep)], '#cdb488');
    s +=
        line(up(lerp(L, Bt, 0.02), -dep * 0.5), up(lerp(L, Bt, 0.98), -dep * 0.5), '#a0845a', 1) +
        line(up(lerp(Bt, R, 0.02), -dep * 0.5), up(lerp(Bt, R, 0.98), -dep * 0.5), '#b39c72', 1);
    s += poly([T, R, Bt, L], '#9fd17a', { w: 1.6 });
    for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++)
            if ((i + j) % 2)
                s += `<polygon points="${pts([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)])}" fill="#a9d884"/>`;
    const road = (a: Pt, b: Pt, c: Pt, d: Pt) => poly([a, b, c, d], '#5a5e6e', { w: 1 });
    s += road(P(6, 0), P(7, 0), P(7, N), P(6, N)) + road(P(0, 6), P(N, 6), P(N, 7), P(0, 7));
    s += poly([P(6, 6), P(7, 6), P(7, 7), P(6, 7)], '#5a5e6e', { s: 'none' });
    const dash = 'stroke-dasharray="9 9"';
    s += line(P(6.5, 0), P(6.5, 6), '#ffd23f', 2, dash) + line(P(6.5, 7), P(6.5, N), '#ffd23f', 2, dash);
    s += line(P(0, 6.5), P(6, 6.5), '#ffd23f', 2, dash) + line(P(7, 6.5), P(N, 6.5), '#ffd23f', 2, dash);
    for (let k = 0; k < 5; k++)
        s += poly(
            [P(7.15, 5.15 + k * 0.17), P(7.85, 5.15 + k * 0.17), P(7.85, 5.25 + k * 0.17), P(7.15, 5.25 + k * 0.17)],
            '#fbf8f2',
            { s: 'none' },
        );
    s += poly(
        POND.map(([i, j]) => P(i, j)),
        '#99e0ff',
        { s: '#38a6cf', w: 1.5 },
    );
    const w0 = P(11.6, 5.3);
    s += `<path d="M${w0[0]} ${w0[1]} q6 -4 12 0 t12 0" fill="none" stroke="#fbf8f2" stroke-width="1.5"/>`;

    // Рисуем от дальних объектов к ближним
    const items: { z: number; draw: () => string }[] = [];
    MAP_BUILDINGS.forEach((b) =>
        items.push({ z: b.i + b.w + b.j + b.d, draw: () => drawBuilding(b, level < minLevel(b.id)) }),
    );
    TREES.forEach(([i, j], k) => items.push({ z: i + j + 1.5, draw: () => tree(i, j, k % 3 === 0) }));
    (
        [
            [5.9, 2],
            [5.9, 9],
            [7.1, 11],
            [9, 5.9],
            [3, 7.1],
        ] as Pt[]
    ).forEach(([i, j]) => items.push({ z: i + j, draw: () => lamp(i, j) }));
    items.push({ z: 6.3 + 3, draw: () => car(6.15, 3, '#d6006c', false) });
    items.push({ z: 10 + 6.6, draw: () => car(10, 6.15, '#38a6cf', true) });
    items.sort((a, b) => a.z - b.z).forEach((it) => (s += it.draw()));
    return s + '</svg>';
}
