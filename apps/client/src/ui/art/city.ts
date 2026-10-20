// План города: здания, дома, деревья, дороги и река. Каждый объект — отдельная картинка с z-index по глубине,
// чтобы персонаж и машины проходили за зданиями. Плюс транспорт, пешеходы и маршруты персонажа по тротуарам.

import {
    bridge,
    bush,
    construction,
    drawBuilding,
    fountain,
    house,
    lamp,
    lighthouse,
    tlight,
    treePine,
    treeRound,
    type CityBuilding,
    type House,
} from './buildings';
import { MAP_H, MAP_W, N, OL, P, TH, TW, circ, ell, lerp, ln, poly, r1, shade, up, uri, type Pt } from './svg';

export const BLD: CityBuilding[] = [
    {
        id: 'jobs',
        name: 'Биржа труда',
        i: 4.3,
        j: 0.8,
        w: 2,
        d: 2.2,
        h: 124,
        kind: 'tower',
        minL: 1,
        lab: 146,
        act: '1',
        actIcon: 'briefcase',
        alert: true,
        desc: 'Новая вакансия: бариста в Cofix. Смена −20 энергии, зарплата минус 13% налога.',
        btn: 'Смотреть вакансии',
    },
    {
        id: 'sosedi',
        name: 'Соседи',
        i: 3.6,
        j: 4.3,
        w: 2.6,
        d: 1.9,
        h: 38,
        kind: 'shop',
        theme: 'sosedi',
        minL: 1,
        lab: 72,
        desc: 'Продуктовый у дома. Оптом от 10 штук дешевле.',
        btn: 'В магазин',
    },
    {
        id: 'cofix',
        name: 'Cofix',
        i: 0.8,
        j: 4.5,
        w: 2.2,
        d: 1.6,
        h: 30,
        kind: 'cafe',
        minL: 1,
        lab: 74,
        act: '+12',
        actIcon: 'coins',
        coin: 12,
        actLeft: true,
        desc: 'Кофейня. Здесь проходит мини-игра «Бариста».',
        btn: 'Начать смену',
    },
    {
        id: 'bank',
        name: 'Офис МТБанка',
        i: 9,
        j: 1.4,
        w: 3,
        d: 3,
        h: 104,
        kind: 'bank',
        minL: 1,
        lab: 150,
        act: 'Копилка +3',
        actIcon: 'piggy',
        coin: 3,
        desc: 'Счёт, Копилка и кредиты. Деньги в Копилке растут каждый игровой день.',
        btn: 'Войти в банк',
    },
    {
        id: 'legal',
        name: 'Юрцентр',
        i: 15,
        j: 1.8,
        w: 1.8,
        d: 2.2,
        h: 62,
        kind: 'legal',
        minL: 5,
        lab: 100,
        desc: 'Регистрация бизнеса: самозанятый или ИП.',
        btn: 'Войти',
    },
    {
        id: 'plot',
        name: 'Мой участок',
        i: 1.8,
        j: 9.2,
        w: 3,
        d: 3,
        h: 0,
        kind: 'plot',
        minL: 1,
        lab: 56,
        desc: 'Здесь будет твой бизнес. Придумай идею, посчитай расходы и зарегистрируйся в Юрцентре.',
        btn: 'Придумать бизнес',
    },
    {
        id: 'med',
        name: 'Медцентр',
        i: 0.9,
        j: 13.4,
        w: 3,
        d: 2.2,
        h: 58,
        kind: 'med',
        minL: 1,
        lab: 92,
        desc: 'Лечение и страховка. Со страховкой лечение дешевле на 80%.',
        btn: 'Войти',
    },
    {
        id: 'market',
        name: 'Рынок',
        i: 9.4,
        j: 9.2,
        w: 3,
        d: 3,
        h: 0,
        kind: 'market',
        minL: 4,
        lab: 66,
        desc: 'Продавай товары по своей цене. Чем дороже — тем меньше купят.',
        btn: 'На рынок',
    },
    {
        id: 'school',
        name: 'Школа',
        i: 9,
        j: 17.4,
        w: 3,
        d: 2.6,
        h: 56,
        kind: 'school',
        minL: 1,
        lab: 112,
        desc: 'Уроки финансовой грамотности. За хорошие оценки родители платят на карту.',
        btn: 'На урок',
    },
    {
        id: 'stadium',
        name: 'Стадион',
        i: 1.2,
        j: 17.8,
        w: 4.6,
        d: 3.2,
        h: 0,
        kind: 'stadium',
        minL: 1,
        lab: 78,
        desc: 'Турнир недели: выполняй квесты и поднимайся в таблице лидеров города.',
        btn: 'Смотреть турнир',
    },
    {
        id: 'park',
        name: 'Парк',
        i: 17.5,
        j: 1.4,
        w: 3,
        d: 3,
        h: 100,
        kind: 'park',
        minL: 1,
        lab: 150,
        desc: 'Колесо обозрения и аттракционы. Отдых восстанавливает энергию.',
        btn: 'Покататься',
    },
    {
        id: 'green',
        name: 'Грин',
        i: 9,
        j: 13.6,
        w: 2.8,
        d: 2.2,
        h: 46,
        kind: 'shop',
        theme: 'green',
        minL: 1,
        lab: 80,
        desc: 'Гипермаркет. Большой выбор, но следи за сроком годности.',
        btn: 'В магазин',
    },
];

export const buildingById = (id: string) => BLD.find((b) => b.id === id)!;

const HOUSES: House[] = [
    { i: 0.8, j: 0.8, w: 1.4, d: 1.2, h: 22, wall: '#ffe3ec', roof: '#e0218a' },
    { i: 2.5, j: 1.7, w: 1.3, d: 1.2, h: 20, wall: '#e3efff', roof: '#2f6bf0' },
    { i: 5.1, j: 9.3, w: 1.3, d: 1.2, h: 22, wall: '#fff3c4', roof: '#e8673a' },
    { i: 5.1, j: 13.7, w: 1.3, d: 1.3, h: 22, wall: '#e5f6e0', roof: '#2f8a56' },
    { i: 15.2, j: 9.4, w: 1.3, d: 1.2, h: 20, wall: '#ffe3ec', roof: '#2f6bf0' },
    { i: 15.2, j: 11.8, w: 1.3, d: 1.2, h: 22, wall: '#e3efff', roof: '#e8673a' },
    { i: 18, j: 10.2, w: 1.4, d: 1.2, h: 22, wall: '#fff3c4', roof: '#2f6bf0' },
    { i: 18.2, j: 12.8, w: 1.3, d: 1.2, h: 20, wall: '#e5f6e0', roof: '#e0218a' },
    { i: 20.2, j: 11.4, w: 1.3, d: 1.3, h: 24, wall: '#e3efff', roof: '#e8673a' },
    { i: 16.4, j: 17.4, w: 1.4, d: 1.2, h: 22, wall: '#ffe3ec', roof: '#2f8a56' },
    { i: 18.8, j: 18.4, w: 1.3, d: 1.2, h: 20, wall: '#fff3c4', roof: '#e0218a' },
    { i: 20.2, j: 15.6, w: 1.3, d: 1.2, h: 22, wall: '#e5f6e0', roof: '#2f6bf0' },
    { i: 10, j: 20.7, w: 1.3, d: 1.1, h: 20, wall: '#e3efff', roof: '#e0218a' },
];

const OCC: { i: number; j: number; w: number; d: number; kind?: string }[] = [
    ...BLD,
    ...HOUSES,
    { i: 9.6, j: 5, w: 1.8, d: 1.5 },
    { i: 15.3, j: 14.9, w: 1.4, d: 1.4 },
];

/** Клетка свободна от дорог, реки и построек (с отступом m) — туда можно сажать траву и деревья */
function isFree(i: number, j: number, m: number) {
    if (i < 0.4 || j < 0.4 || i > N - 0.5 || j > N - 0.5) return false;
    if ((i > 6.2 && i < 8.8) || (j > 6.2 && j < 8.8)) return false;
    if (i > 12.3 && i < 15.1) return false;
    for (const o of OCC)
        if (i > o.i - m && i < o.i + o.w + m && j > o.j - m && j < o.j + (o.d + (o.kind === 'cafe' ? 0.7 : 0)) + m)
            return false;
    return true;
}

const rng = (seed: number) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
};

function groundSVG() {
    const T = P(0, 0),
        Rr = P(N, 0),
        B = P(N, N),
        L = P(0, N),
        dep = 46;
    let s = '';
    s += poly([P(-0.7, -0.7), P(N + 0.7, -0.7), P(N + 0.7, N + 0.7), P(-0.7, N + 0.7)], 'rgba(130,200,255,.22)', {
        s: 0,
    });
    [1.4, 2.3].forEach((o) => {
        s += poly([P(-o, -o), P(N + o, -o), P(N + o, N + o), P(-o, N + o)], 'none', {
            s: 'rgba(255,255,255,.16)',
            w: 1.5,
            dash: '10 16',
        });
    });
    s += poly([L, B, up(B, -dep), up(L, -dep)], 'url(#cL)') + poly([B, Rr, up(Rr, -dep), up(B, -dep)], 'url(#cR)');
    s +=
        poly([L, B, up(B, -9), up(L, -9)], '#6b4a2b', { s: 0 }) +
        poly([B, Rr, up(Rr, -9), up(B, -9)], '#55391f', { s: 0 });
    [20, 32].forEach((k) => {
        s += ln(up(L, -k), up(B, -k), 'rgba(0,0,0,.18)', 1.2) + ln(up(B, -k), up(Rr, -k), 'rgba(0,0,0,.18)', 1.2);
    });
    s +=
        ln(up(L, -dep), up(B, -dep), 'rgba(255,255,255,.55)', 3) +
        ln(up(B, -dep), up(Rr, -dep), 'rgba(255,255,255,.55)', 3);
    s += poly([T, Rr, B, L], '#86c95f', { w: 1.5 });
    for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++)
            if ((i + j) % 2) s += poly([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], '#8ed067', { s: 0 });
    s += ln(T, Rr, '#b4e68f', 2.4) + ln(T, L, '#b4e68f', 2.4);
    const rnd = rng(7);
    for (let k = 0; k < 480; k++) {
        const i = rnd() * N,
            j = rnd() * N;
        if (!isFree(i, j, 0.15)) continue;
        const c = P(i, j);
        if (k % 5 === 0) s += circ(c, 1.6, ['#ff6fb5', '#ffd23f', '#ffffff'][k % 3]);
        else
            s += `<path d="M${r1(c[0] - 3)} ${r1(c[1])} l1.5 -4 l1.5 4 l1.5 -4 l1.5 4" fill="none" stroke="#5fae45" stroke-width="1.1" stroke-linecap="round"/>`;
    }
    s +=
        poly([P(6.55, 0), P(8.45, 0), P(8.45, N), P(6.55, N)], '#d6d9e3', { s: 0 }) +
        poly([P(0, 6.55), P(N, 6.55), P(N, 8.45), P(0, 8.45)], '#d6d9e3', { s: 0 });
    s +=
        poly([P(7, 0), P(8, 0), P(8, N), P(7, N)], '#4a4f62', { s: 0 }) +
        poly([P(0, 7), P(N, 7), P(N, 8), P(0, 8)], '#4a4f62', { s: 0 });
    (
        [
            [P(7.5, 0), P(7.5, 6.5)],
            [P(7.5, 8.5), P(7.5, N)],
            [P(0, 7.5), P(6.5, 7.5)],
            [P(8.5, 7.5), P(N, 7.5)],
        ] as const
    ).forEach(([a, b]) => {
        s += ln(a, b, '#ffd23f', 1.8, 'stroke-dasharray="9 9"');
    });
    for (let k = 0; k < 6; k++) {
        const a = 7.08 + k * 0.16;
        s +=
            poly([P(a, 6.6), P(a + 0.09, 6.6), P(a + 0.09, 6.95), P(a, 6.95)], '#ffffff', { s: 0 }) +
            poly([P(a, 8.05), P(a + 0.09, 8.05), P(a + 0.09, 8.4), P(a, 8.4)], '#ffffff', { s: 0 }) +
            poly([P(6.6, a), P(6.95, a), P(6.95, a + 0.09), P(6.6, a + 0.09)], '#ffffff', { s: 0 }) +
            poly([P(8.05, a), P(8.4, a), P(8.4, a + 0.09), P(8.05, a + 0.09)], '#ffffff', { s: 0 });
    }
    s += ell(P(10.5, 5.75), 50, 25, '#e2d6bf');
    s +=
        poly([P(12.7, 0), P(14.8, 0), P(14.8, N), P(12.7, N)], '#e8d49c', { s: 0 }) +
        poly([P(12.95, 0), P(14.55, 0), P(14.55, N), P(12.95, N)], 'url(#water)', { s: '#2a6fd0', w: 1 });
    for (let k = 0; k < 16; k++) {
        const c = P(13.2 + (((k * 7) % 10) / 10) * 1.1, 0.5 + k * 1.05);
        s += `<path d="M${r1(c[0] - 8)} ${r1(c[1])} q4 -3 8 0 t8 0" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2" stroke-linecap="round"/>`;
    }
    for (let k = 0; k < 10; k++) {
        const c = P(k % 2 ? 12.78 : 14.72, 1 + k * 1.6);
        s += ell(c, 3.5, 2, '#a3a8bb', `stroke="${OL}" stroke-width=".6"`);
    }
    s +=
        poly([P(12.95, N), P(14.55, N), up(P(14.55, N), -dep), up(P(12.95, N), -dep)], 'url(#fall)', { s: 0 }) +
        ell(up(P(13.75, N), -dep), 32, 9, 'rgba(255,255,255,.75)');
    return s;
}

export interface Sprite {
    src: string;
    x: number;
    y: number;
    w: number;
    h: number;
    z: number;
}

let groundCache: string | null = null;
export const groundUri = () => (groundCache ??= uri(groundSVG(), 0, 0, MAP_W, MAP_H));

/** Рамка картинки здания */
function buildingFrame(b: CityBuilding) {
    const x0 = P(b.i, b.j + b.d)[0] - 50,
        x1 = P(b.i + b.w, b.j)[0] + 90,
        y0 = P(b.i, b.j)[1] - (b.h || 0) - 120,
        y1 = P(b.i + b.w, b.j + b.d)[1] + 40;
    return { x0, y0, w: x1 - x0, h: y1 - y0 };
}

const artCache: Record<string, { src: string; w: number; h: number }> = {};
/** Картинка здания для шапки экрана локации */
export function locationArt(b: CityBuilding) {
    if (!artCache[b.id]) {
        const f = buildingFrame(b);
        artCache[b.id] = { src: uri(drawBuilding(b), f.x0, f.y0, f.w, f.h), w: f.w, h: f.h };
    }
    return artCache[b.id];
}

/** Все неподвижные объекты карты; закрытые на этом уровне здания — стройки */
export function spritesFor(level: number): Sprite[] {
    const out: Sprite[] = [];
    const add = (inner: string, x: number, y: number, w: number, h: number, depth: number) =>
        out.push({ src: uri(inner, x, y, w, h), x, y, w, h, z: Math.round(depth * 10) + 10 });
    BLD.forEach((b) => {
        const locked = level < b.minL,
            f = buildingFrame(b);
        add(
            locked ? construction(b) : drawBuilding(b),
            f.x0,
            f.y0,
            f.w,
            f.h,
            b.kind === 'plot' ? 0 : b.i + b.w / 2 + b.j + b.d / 2,
        );
    });
    HOUSES.forEach((hh) => {
        const x0 = P(hh.i, hh.j + hh.d + 0.4)[0] - 20,
            x1 = P(hh.i + hh.w, hh.j)[0] + 40,
            y0 = P(hh.i, hh.j)[1] - hh.h - 40,
            y1 = P(hh.i + hh.w, hh.j + hh.d + 0.4)[1] + 16;
        add(house(hh), x0, y0, x1 - x0, y1 - y0, hh.i + hh.w / 2 + hh.j + hh.d / 2);
    });
    const lc = P(16.2, N - 1.2);
    add(lighthouse(lc), lc[0] - 40, lc[1] - 110, 80, 130, 31.6);
    const fc = P(10.5, 5.75);
    add(fountain(fc), fc[0] - 42, fc[1] - 50, 84, 72, 16.25);
    add(
        bridge(),
        P(12.5, 8.45)[0] - 10,
        P(12.5, 6.55)[1] - 30,
        P(15, 6.55)[0] - P(12.5, 8.45)[0] + 20,
        P(15, 8.45)[1] - P(12.5, 6.55)[1] + 60,
        13.75 + 6.55,
    );
    (
        [
            [6.4, 2.5],
            [6.4, 11],
            [8.6, 5],
            [8.6, 12],
            [3, 6.4],
            [11, 8.6],
            [5, 8.6],
            [10, 6.4],
            [6.4, 16],
            [8.6, 18.5],
            [6.4, 20.5],
            [17, 6.4],
            [20, 8.6],
            [17, 8.6],
            [3, 8.6],
        ] as const
    ).forEach(([i, j]) => {
        const c = P(i, j);
        add(lamp(c), c[0] - 12, c[1] - 40, 30, 46, i + j);
    });
    (
        [
            [6.42, 6.42],
            [8.58, 8.58],
        ] as const
    ).forEach(([i, j]) => {
        const c = P(i, j);
        add(tlight(c), c[0] - 10, c[1] - 44, 20, 50, i + j);
    });
    const rnd = rng(11),
        trees: [number, number, number][] = [];
    for (let k = 0; k < 1400 && trees.length < 90; k++) {
        const i = rnd() * N,
            j = rnd() * N;
        if (!isFree(i, j, 0.35) || trees.some((t) => Math.hypot(t[0] - i, t[1] - j) < 0.95)) continue;
        trees.push([i, j, k]);
    }
    trees.forEach(([i, j, k]) => {
        const c = P(i, j),
            t = k % 7;
        const inner = t < 3 ? treeRound(c, 9 + (k % 4)) : t < 5 ? treePine(c, 10 + (k % 3)) : bush(c, 6);
        add(inner, c[0] - 26, c[1] - 62, 56, 72, i + j);
    });
    return out;
}

// ---------- Транспорт и люди ----------

const Q = (u: number, v: number, z: number): Pt => [(u - v) * TW, (u + v) * TH - z];

function boxQ(
    u0: number,
    u1: number,
    v0: number,
    v1: number,
    z0: number,
    z1: number,
    cl: string,
    cr: string,
    ct: string,
) {
    return (
        poly([Q(u0, v1, z0), Q(u1, v1, z0), Q(u1, v1, z1), Q(u0, v1, z1)], cl, { w: 0.8 }) +
        poly([Q(u1, v1, z0), Q(u1, v0, z0), Q(u1, v0, z1), Q(u1, v1, z1)], cr, { w: 0.8 }) +
        poly([Q(u0, v0, z1), Q(u1, v0, z1), Q(u1, v1, z1), Q(u0, v1, z1)], ct, { w: 0.8 })
    );
}

export function carSVG(col: string, len: number, bus?: boolean) {
    const hl = len / 2,
        hw = bus ? 0.2 : 0.17;
    let s = ell(Q(0, 0, 0), hl * TW * 1.2 + 6, hl * TH * 1.1 + 4, 'rgba(0,0,0,.28)');
    s += ell(Q(-hl * 0.62, hw, 2), 2.8, 2.3, '#15161c') + ell(Q(hl * 0.62, hw, 2), 2.8, 2.3, '#15161c');
    if (bus) {
        s += boxQ(-hl, hl, -hw, hw, 2.5, 19, col, shade(col, -0.25), shade(col, 0.25));
        for (let k = 0; k < 5; k++) {
            const u0 = -hl + 0.08 + (k * (len - 0.16)) / 5,
                u1 = u0 + (len - 0.16) / 5 - 0.04;
            s += poly([Q(u0, hw, 10), Q(u1, hw, 10), Q(u1, hw, 16), Q(u0, hw, 16)], '#cfe6ff', { w: 0.6 });
        }
        s +=
            poly([Q(hl, hw * 0.85, 9), Q(hl, -hw * 0.85, 9), Q(hl, -hw * 0.85, 16), Q(hl, hw * 0.85, 16)], '#cfe6ff', {
                w: 0.6,
            }) + poly([Q(-hl, hw, 6), Q(hl, hw, 6), Q(hl, hw, 7.6), Q(-hl, hw, 7.6)], '#ffffff', { s: 0 });
    } else {
        s +=
            boxQ(-hl, hl, -hw, hw, 2.5, 8.5, col, shade(col, -0.25), shade(col, 0.2)) +
            boxQ(-hl * 0.55, hl * 0.3, -hw * 0.85, hw * 0.85, 8.5, 14, '#bfe0ff', '#8fb8f0', shade(col, 0.3));
        s +=
            ln(Q(-hl * 0.12, hw * 0.85, 8.5), Q(-hl * 0.12, hw * 0.85, 14), shade(col, -0.1), 1.4) +
            circ(Q(hl, hw * 0.6, 5.5), 1.3, '#fff6c2') +
            circ(Q(hl, -hw * 0.6, 5.5), 1.3, '#fff6c2');
    }
    return uri(s, -28, -36, 56, 54);
}

export function boatSVG() {
    let s =
        ln(Q(-0.32, -0.06, 0), Q(-0.8, -0.22, 0), 'rgba(255,255,255,.75)', 1.4) +
        ln(Q(-0.32, 0.06, 0), Q(-0.8, 0.22, 0), 'rgba(255,255,255,.75)', 1.4);
    s +=
        boxQ(-0.28, 0.22, -0.12, 0.12, -1, 4, '#ffffff', '#d9dde8', '#c98b4e') +
        poly([Q(0.22, 0.12, -1), Q(0.42, 0, -1), Q(0.42, 0, 4), Q(0.22, 0.12, 4)], '#ffffff', { w: 0.8 }) +
        poly([Q(0.22, -0.12, 4), Q(0.42, 0, 4), Q(0.22, 0.12, 4)], '#c98b4e', { w: 0.8 }) +
        poly([Q(-0.28, 0.12, 0), Q(0.22, 0.12, 0), Q(0.22, 0.12, 1.4), Q(-0.28, 0.12, 1.4)], '#e0218a', { s: 0 });
    s +=
        ln(Q(0, 0, 4), Q(0, 0, 32), '#3a2a20', 1.4) +
        poly([Q(0, 0, 31), Q(0, 0, 6), Q(-0.28, 0, 6)], '#ffffff', { w: 0.8 }) +
        poly([Q(0.02, 0, 28), Q(0.02, 0, 8), Q(0.22, 0, 8)], '#e0218a', { w: 0.8 });
    return uri(s, -28, -36, 56, 54);
}

export function personSVG(shirt: string, hair: string, k: number) {
    const skin = '#f2c7a5',
        pants = '#2f3a66';
    const s =
        ell([0, 0], 5 * k, 2 * k, 'rgba(0,0,0,.28)') +
        `<rect x="${-2.8 * k}" y="${-8 * k}" width="${2.3 * k}" height="${8 * k}" rx="${k}" fill="${pants}"/>` +
        `<rect x="${0.5 * k}" y="${-8 * k}" width="${2.3 * k}" height="${8 * k}" rx="${k}" fill="${pants}"/>` +
        `<rect x="${-4 * k}" y="${-17 * k}" width="${8 * k}" height="${10.5 * k}" rx="${3 * k}" fill="${shirt}" stroke="${OL}" stroke-width=".8"/>` +
        circ([0, -21 * k], 4.3 * k, skin, `stroke="${OL}" stroke-width=".8"`) +
        `<path d="M${-4.3 * k} ${-21.5 * k} a${4.3 * k} ${4.3 * k} 0 0 1 ${8.6 * k} 0 z" fill="${hair}"/>`;
    return uri(s, -10 * k, -29 * k, 20 * k, 32 * k);
}

export interface Lane {
    axis: 'i' | 'j';
    at: number;
    dir: 1 | -1;
}

export const LANES: Lane[] = [
    { axis: 'j', at: 7.28, dir: 1 },
    { axis: 'j', at: 7.72, dir: -1 },
    { axis: 'i', at: 7.72, dir: 1 },
    { axis: 'i', at: 7.28, dir: -1 },
];

export interface Car {
    lane: number;
    s: number;
    len: number;
    col: string;
    max: number;
    bus?: boolean;
    v: number;
}

export const initialCars = (): Car[] =>
    [
        { lane: 0, s: 1, len: 0.62, col: '#e0218a', max: 1.9 },
        { lane: 0, s: 9, len: 0.62, col: '#ffd23f', max: 1.7 },
        { lane: 1, s: 4, len: 0.62, col: '#f4f6fb', max: 2 },
        { lane: 1, s: 12, len: 0.62, col: '#2fa84f', max: 1.6 },
        { lane: 2, s: 2, len: 1.1, col: '#2f6bf0', max: 1.4, bus: true },
        { lane: 2, s: 11, len: 0.62, col: '#ff7a3d', max: 1.9 },
        { lane: 3, s: 6, len: 0.62, col: '#7a5cff', max: 1.8 },
        { lane: 3, s: 14, len: 0.62, col: '#e0218a', max: 1.7 },
        { lane: 0, s: 18, len: 0.62, col: '#3ecf6e', max: 1.8 },
        { lane: 2, s: 19, len: 0.62, col: '#ffd23f', max: 1.7 },
        { lane: 1, s: 20, len: 1.1, col: '#e0218a', max: 1.3, bus: true },
    ].map((c) => ({ ...c, v: c.max }));

export interface Ped {
    line: 'i' | 'j';
    at: number;
    a: number;
    b: number;
    sp: number;
    shirt: string;
    hair: string;
    t: number;
}

export const initialPeds = (): Ped[] =>
    [
        { line: 'i' as const, at: 6.75, a: 1, b: 6.2, sp: 0.45, shirt: '#2f6bf0', hair: '#3a2418' },
        { line: 'i' as const, at: 8.25, a: 9, b: 21, sp: 0.4, shirt: '#ffd23f', hair: '#1a1b22' },
        { line: 'j' as const, at: 8.25, a: 1, b: 6.2, sp: 0.5, shirt: '#2fa84f', hair: '#8a5a2b' },
        { line: 'j' as const, at: 6.75, a: 8.8, b: 21, sp: 0.42, shirt: '#ff7a3d', hair: '#3a2418' },
    ].map((p, k) => ({ ...p, t: k * 3 }));

// ---------- Маршрут персонажа по тротуарам ----------

export interface Cell {
    i: number;
    j: number;
}

const CORNER = (qi: number, qj: number): Cell => ({ i: qi ? 8.25 : 6.75, j: qj ? 8.25 : 6.75 });

interface Door extends Cell {
    line: 'i' | 'j';
    q: [number, number];
}

/** Точка на тротуаре у входа в здание */
function doorOf(b: CityBuilding): Door {
    const qi = b.i + b.w / 2 < 7.5 ? 1 : 0,
        qj = b.j + b.d / 2 < 7.5 ? 1 : 0,
        Qi = 1 - qi,
        Qj = 1 - qj,
        c = CORNER(Qi, Qj);
    const dA = Qi ? b.i - 8.25 : 6.75 - (b.i + b.w),
        dS = Qj ? b.j - 8.25 : 6.75 - (b.j + b.d);
    return dA <= dS
        ? { i: c.i, j: b.j + b.d / 2, line: 'i', q: [Qi, Qj] }
        : { i: b.i + b.w / 2, j: c.j, line: 'j', q: [Qi, Qj] };
}

/** Путь от текущей точки до входа: через углы перекрёстка */
export function routeTo(from: Cell, b: CityBuilding): Cell[] {
    const door = doorOf(b);
    const fq = [from.i < 7.5 ? 0 : 1, from.j < 7.5 ? 0 : 1],
        tq = door.q,
        same = fq[0] === tq[0] && fq[1] === tq[1];
    const onLine = door.line === 'i' ? Math.abs(from.i - door.i) < 0.05 : Math.abs(from.j - door.j) < 0.05;
    if (same && onLine) return [{ i: door.i, j: door.j }];
    const path = [CORNER(fq[0], fq[1])];
    if (fq[0] !== tq[0] && fq[1] !== tq[1]) path.push(CORNER(tq[0], fq[1]));
    if (!same) path.push(CORNER(tq[0], tq[1]));
    path.push({ i: door.i, j: door.j });
    return path;
}

export { MAP_H, MAP_W, N, P, lerp, r1 };
