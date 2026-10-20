// Изометрия и примитивы SVG для карты города (макет «MT City v7 Roles»).
// Клетка карты (i, j) → точка на картинке; всё рисуется строками SVG и отдаётся как data: URI.

export type Pt = [number, number];

export const N = 22;
export const TW = 34;
export const TH = 17;
const PAD = 70;
const OX = N * TW + PAD;
const OY = 140;
export const MAP_W = 2 * N * TW + 2 * PAD;
export const MAP_H = 2 * N * TH + OY + 150;

export const P = (i: number, j: number): Pt => [(i - j) * TW + OX, (i + j) * TH + OY];
export const up = (p: Pt, h: number): Pt => [p[0], p[1] - h];
export const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const r1 = (n: number) => Math.round(n * 10) / 10;
const pts = (a: Pt[]) => a.map((p) => r1(p[0]) + ',' + r1(p[1])).join(' ');

/** Цвет обводки */
export const OL = 'rgba(24,26,48,.55)';

export interface PolyOpts {
    /** Цвет обводки; 0 — без обводки */
    s?: string | 0;
    w?: number;
    dash?: string;
}

export const poly = (a: Pt[], fill: string, o: PolyOpts = {}) =>
    `<polygon points="${pts(a)}" fill="${fill}"${o.s === 0 ? '' : ` stroke="${o.s || OL}" stroke-width="${o.w || 1}" stroke-linejoin="round"`}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
export const ln = (a: Pt, b: Pt, c?: string, w?: number, x?: string) =>
    `<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}" stroke="${c || OL}" stroke-width="${w || 1}" stroke-linecap="round" ${x || ''}/>`;
export const circ = (c: Pt, r: number, fill: string, x?: string) =>
    `<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r1(r)}" fill="${fill}" ${x || ''}/>`;
export const ell = (c: Pt, rx: number, ry: number, fill: string, x?: string) =>
    `<ellipse cx="${r1(c[0])}" cy="${r1(c[1])}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}" ${x || ''}/>`;

/** Осветлить (a > 0) или затемнить (a < 0) цвет #rrggbb */
export function shade(hex: string, a: number) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16,
        g = (n >> 8) & 255,
        b = n & 255;
    const t = a < 0 ? 0 : 255,
        p = Math.abs(a);
    r = Math.round(r + (t - r) * p);
    g = Math.round(g + (t - g) * p);
    b = Math.round(b + (t - b) * p);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const DEFS =
    '<defs><linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4e9ff"/><stop offset="1" stop-color="#6c9cf7"/></linearGradient>' +
    '<linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fc2f5"/><stop offset="1" stop-color="#3f6fd6"/></linearGradient>' +
    '<linearGradient id="gW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d6"/><stop offset="1" stop-color="#ffc861"/></linearGradient>' +
    '<linearGradient id="water" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7cc8ff"/><stop offset="1" stop-color="#2f7be0"/></linearGradient>' +
    '<linearGradient id="cL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a47a52"/><stop offset="1" stop-color="#5a3f2b"/></linearGradient>' +
    '<linearGradient id="cR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86623f"/><stop offset="1" stop-color="#46301f"/></linearGradient>' +
    '<linearGradient id="fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdeeff"/><stop offset="1" stop-color="#5fb0ff"/></linearGradient>' +
    '<radialGradient id="glow"><stop offset="0" stop-color="#fff3b0" stop-opacity=".95"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="glowR"><stop offset="0" stop-color="#ff5a6a" stop-opacity=".9"/><stop offset="1" stop-color="#ff3b4a" stop-opacity="0"/></radialGradient></defs>';

/** Фрагмент SVG → data: URI картинки с вырезанной областью (x, y, w, h) */
export const uri = (inner: string, x: number, y: number, w: number, h: number) =>
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${r1(w)}" height="${r1(h)}" viewBox="${r1(x)} ${r1(y)} ${r1(w)} ${r1(h)}">${DEFS}${inner}</svg>`,
    );
