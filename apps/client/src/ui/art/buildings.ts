// Здания города: у каждого типа свой силуэт. Закрытые по уровню рисуются стройкой с краном.

import { OL, P, circ, ell, lerp, ln, poly, r1, shade, up, type PolyOpts, type Pt } from './svg';

type Face = (u: number, v: number) => Pt;

export type Kind =
    'bank' | 'tower' | 'shop' | 'cafe' | 'med' | 'market' | 'legal' | 'plot' | 'school' | 'stadium' | 'park';

export interface Box {
    i: number;
    j: number;
    w: number;
    d: number;
    h: number;
}

export interface CityBuilding extends Box {
    id: string;
    name: string;
    kind: Kind;
    theme?: 'sosedi' | 'green';
    minL: number;
    /** Высота таблички над центром здания */
    lab: number;
    /** Пузырь над зданием: бонус MTcoin или уведомление */
    act?: string;
    actIcon?: 'briefcase' | 'coins' | 'piggy';
    alert?: boolean;
    coin?: number;
    actLeft?: boolean;
    desc: string;
    btn: string;
}

/** Параллелепипед на клетках: L — левая стена, R — правая, T — крыша */
function F(i: number, j: number, w: number, d: number, h: number, z0 = 0) {
    const A = P(i, j),
        B = P(i + w, j),
        C = P(i + w, j + d),
        D = P(i, j + d);
    return {
        A,
        B,
        C,
        D,
        h,
        L: ((u, v) => up(lerp(D, C, u), z0 + v * h)) as Face,
        R: ((u, v) => up(lerp(C, B, u), z0 + v * h)) as Face,
        T: ((u, v) => up(P(i + u * w, j + v * d), z0 + h)) as Face,
    };
}
type Frame = ReturnType<typeof F>;

const fq = (f: Face, u0: number, u1: number, v0: number, v1: number, fill: string, o?: PolyOpts) =>
    poly([f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)], fill, o);
const top4 = (f: Frame, fill: string, o?: PolyOpts) => poly([f.T(0, 0), f.T(1, 0), f.T(1, 1), f.T(0, 1)], fill, o);
const block = (f: Frame, cl: string, cr: string, ct: string, o?: PolyOpts) =>
    fq(f.L, 0, 1, 0, 1, cl, o) + fq(f.R, 0, 1, 0, 1, cr, o) + top4(f, ct, o);
const shadowFp = (i: number, j: number, w: number, d: number, h: number) => {
    const s = Math.min(1.5, h / 60 + 0.2);
    return poly(
        [
            P(i + w, j),
            P(i + w + s, j + s * 0.2),
            P(i + w + s, j + d + s * 0.2),
            P(i + s * 0.4, j + d + s * 0.2),
            P(i, j + d),
        ],
        'rgba(14,52,14,.24)',
        { s: 0 },
    );
};
const planeI =
    (i0: number, i1: number, j: number, z0: number, hh: number): Face =>
    (u, v) =>
        up(lerp(P(i0, j), P(i1, j), u), z0 + v * hh);
const txtL = (c: Pt, str: string, size: number, color: string) =>
    `<text x="0" y="0" transform="matrix(1,0.5,0,1,${r1(c[0])},${r1(c[1])})" text-anchor="middle" dominant-baseline="central" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${size}" fill="${color}">${str}</text>`;

function wins(
    f: Face,
    cols: number,
    rows: number,
    v0: number,
    v1: number,
    fill: string,
    skip?: (r: number, c: number) => boolean,
) {
    let s = '';
    const rv = (v1 - v0) / rows;
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            if (skip && skip(r, c)) continue;
            s += fq(f, (c + 0.2) / cols, (c + 0.8) / cols, v0 + rv * (r + 0.2), v0 + rv * (r + 0.8), fill, { w: 0.7 });
        }
    return s;
}

function awning(f: Face, v: number, col: string, n: number) {
    let s = '';
    const a0 = f(0, v),
        a1 = f(1, v),
        b0: Pt = [a0[0] - 8, a0[1] + 12],
        b1: Pt = [a1[0] - 8, a1[1] + 12];
    for (let k = 0; k < n; k++)
        s += poly(
            [lerp(a0, a1, k / n), lerp(a0, a1, (k + 1) / n), lerp(b0, b1, (k + 1) / n), lerp(b0, b1, k / n)],
            k % 2 ? '#fffaf2' : col,
            { w: 0.8 },
        );
    return s;
}

function roofSign(
    i0: number,
    i1: number,
    j: number,
    z: number,
    hh: number,
    bg: string,
    str: string,
    size: number,
    color: string,
) {
    const f = planeI(i0, i1, j, z + 4, hh);
    return (
        ln(up(P(i0 + (i1 - i0) * 0.2, j), z), f(0.2, 0), '#3a3f55', 1.4) +
        ln(up(P(i0 + (i1 - i0) * 0.8, j), z), f(0.8, 0), '#3a3f55', 1.4) +
        fq(f, 0, 1, 0, 1, bg, { w: 1.2 }) +
        txtL(f(0.5, 0.5), str, size, color)
    );
}

function bank(b: Box) {
    const { i, j, w, d, h } = b,
        f = F(i, j, w, d, h);
    let s = shadowFp(i, j, w, d, h);
    s += fq(f.L, 0, 1, 0, 1, 'url(#gL)') + fq(f.R, 0, 1, 0, 1, 'url(#gR)');
    s += fq(f.L, 0, 1, 0, 0.27, '#8d9ab6', { s: 0 }) + fq(f.R, 0, 1, 0, 0.27, '#7684a3', { s: 0 });
    for (let k = 0; k < 7; k++) {
        const u = 0.04 + k * 0.152;
        s += fq(f.L, u, u + 0.06, 0, 0.25, '#f7f8fc', { w: 0.7 });
    }
    for (let k = 0; k < 6; k++) {
        const u = 0.05 + k * 0.17;
        s += fq(f.R, u, u + 0.07, 0, 0.25, '#dfe3ee', { w: 0.7 });
    }
    s += fq(f.L, 0.4, 0.56, 0, 0.17, '#1d3f99', { w: 0.7 });
    s += fq(f.L, 0, 1, 0.25, 0.31, '#ffffff') + fq(f.R, 0, 1, 0.25, 0.31, '#d9dfeb');
    for (let k = 1; k < 9; k++)
        s +=
            ln(f.L(k / 9, 0.31), f.L(k / 9, 1), 'rgba(255,255,255,.5)', 0.8) +
            ln(f.R(k / 9, 0.31), f.R(k / 9, 1), 'rgba(255,255,255,.35)', 0.8);
    for (let k = 1; k < 6; k++) {
        const v = 0.31 + (k * 0.69) / 6;
        s +=
            ln(f.L(0, v), f.L(1, v), 'rgba(255,255,255,.5)', 0.8) +
            ln(f.R(0, v), f.R(1, v), 'rgba(255,255,255,.35)', 0.8);
    }
    s +=
        poly([f.L(0.12, 0.31), f.L(0.3, 0.31), f.L(0.62, 1), f.L(0.44, 1)], 'rgba(255,255,255,.25)', { s: 0 }) +
        poly([f.R(0.5, 0.31), f.R(0.6, 0.31), f.R(0.85, 1), f.R(0.75, 1)], 'rgba(255,255,255,.15)', { s: 0 });
    s += fq(f.L, 0, 1, 0, 1, 'none') + fq(f.R, 0, 1, 0, 1, 'none') + top4(f, '#e6ebf4');
    s += top4(F(i + 0.18, j + 0.18, w - 0.36, d - 0.36, 0, h), '#c9d1e2', { w: 0.8 });
    s += block(F(i + 0.5, j + 0.5, 0.9, 0.9, 14, h), '#eef1f7', '#cbd2e1', '#f5f7fb');
    s += roofSign(i + 0.9, i + w - 0.25, j + d - 0.25, h, 22, '#2f6bf0', 'МТБанк', 13, '#ffffff');
    const base = up(P(i + 0.95, j + 0.95), h + 14);
    s +=
        ln(base, up(base, 40), '#3a3f55', 1.6) +
        poly([up(base, 40), [base[0] + 22, base[1] - 35], up(base, 28)], '#e0218a', { w: 0.8 });
    return s;
}

function tower(b: Box) {
    const { i, j, w, d, h } = b,
        f = F(i, j, w, d, h);
    let s = shadowFp(i, j, w, d, h);
    s += block(f, '#4d5b7c', '#3a4562', '#5e6c8e');
    for (let k = 0; k < 7; k++) {
        const v0 = 0.13 + k * (0.85 / 7),
            v1 = v0 + (0.85 / 7) * 0.56;
        s += fq(f.L, 0.04, 0.96, v0, v1, 'url(#gL)', { w: 0.7 }) + fq(f.R, 0.04, 0.96, v0, v1, 'url(#gR)', { w: 0.7 });
        for (let c = 0; c < 6; c++)
            if ((k * 7 + c * 3) % 5 === 0)
                s += fq(f.L, 0.05 + c * 0.152, 0.05 + c * 0.152 + 0.12, v0 + 0.01, v1 - 0.01, '#ffe08a', { s: 0 });
        for (let c = 0; c < 5; c++)
            if ((k * 3 + c * 5) % 7 === 0)
                s += fq(f.R, 0.05 + c * 0.18, 0.05 + c * 0.18 + 0.14, v0 + 0.01, v1 - 0.01, '#f0c060', { s: 0 });
    }
    s += fq(f.L, 0.38, 0.62, 0, 0.09, '#15161c', { w: 0.7 });
    s += block(F(i + w * 0.3, j + d, w * 0.4, 0.3, 3, h * 0.1), '#ffd23f', '#e0b421', '#ffe57a');
    s +=
        block(F(i + 0.3, j + 0.3, 0.5, 0.5, 7, h), '#c9d1e2', '#a9b3c8', '#e1e6ef') +
        block(F(i + 1.1, j + 1.1, 0.5, 0.5, 7, h), '#c9d1e2', '#a9b3c8', '#e1e6ef');
    const ant = up(P(i + w * 0.75, j + d * 0.3), h);
    s += ln(ant, up(ant, 34), '#2a2f45', 1.6) + circ(up(ant, 36), 9, 'url(#glowR)') + circ(up(ant, 36), 2.6, '#ff3b4a');
    return s;
}

const SHOPS = {
    sosedi: { l: '#eef4ff', r: '#cfdcf3', t: '#f2f3f8', a: '#2f6bf0', name: 'СОСЕДИ' },
    green: { l: '#f1faea', r: '#d3e8c4', t: '#eef2ea', a: '#2fa84f', name: 'ГРИН' },
};

function shop(b: CityBuilding) {
    const t = SHOPS[b.theme ?? 'sosedi'],
        { i, j, w, d, h } = b,
        f = F(i, j, w, d, h);
    let s = shadowFp(i, j, w, d, h);
    s +=
        block(f, t.l, t.r, t.t) +
        fq(f.L, 0, 1, 0.86, 1, t.a, { s: 0 }) +
        fq(f.R, 0, 1, 0.86, 1, shade(t.a, -0.15), { s: 0 });
    s += fq(f.L, 0.05, 0.95, 0.06, 0.6, 'url(#gL)', { w: 1 });
    for (let k = 1; k < 6; k++)
        s += ln(f.L(0.05 + k * 0.15, 0.06), f.L(0.05 + k * 0.15, 0.6), 'rgba(255,255,255,.8)', 1);
    s += fq(f.L, 0.43, 0.57, 0, 0.54, '#e9f4ff', { w: 0.8 }) + ln(f.L(0.5, 0), f.L(0.5, 0.54), OL, 0.8);
    s += wins(f.R, 3, 1, 0.2, 0.62, 'url(#gR)') + awning(f.L, 0.7, t.a, 12);
    s += block(F(i + 0.3, j + 0.3, 0.6, 0.5, 6, h), '#d9dee8', '#b9c1d1', '#eef1f6');
    s += roofSign(i + 0.35, i + w - 0.35, j + d - 0.2, h, 18, t.a, t.name, 11, '#ffffff');
    for (let k = 0; k < 3; k++) {
        const c = P(i + w + 0.2, j + 0.3 + k * 0.3);
        s += poly(
            [up(c, 1), up(P(i + w + 0.45, j + 0.3 + k * 0.3), 1), up(P(i + w + 0.45, j + 0.3 + k * 0.3), 7), up(c, 7)],
            '#c9d1e2',
            { w: 0.7 },
        );
    }
    return s;
}

function cafe(b: Box) {
    const { i, j, w, d, h } = b,
        f = F(i, j, w, d, h);
    let s = shadowFp(i, j, w, d, h);
    s += fq(f.L, 0, 1, 0, 1, '#ffe39a') + fq(f.R, 0, 1, 0, 1, '#efc96a');
    s += fq(f.L, 0.07, 0.56, 0.08, 0.62, 'url(#gW)', { w: 1 }) + ln(f.L(0.31, 0.08), f.L(0.31, 0.62), '#5b3a26', 0.8);
    s += fq(f.L, 0.66, 0.88, 0, 0.66, '#5b3a26', { w: 0.8 }) + circ(f.L(0.84, 0.33), 1.2, '#ffd23f');
    s += fq(f.R, 0.2, 0.8, 0.15, 0.6, 'url(#gW)', { w: 0.8 }) + awning(f.L, 0.7, '#5b3a26', 10);
    s += fq(f.L, 0.08, 0.6, 0.76, 0.97, '#15161c', { w: 0.8 }) + txtL(f.L(0.34, 0.865), 'COFIX', 8, '#ffd23f');
    const r = 17,
        t00 = f.T(0, 0),
        t10 = f.T(1, 0),
        t11 = f.T(1, 1),
        t01 = f.T(0, 1),
        R1 = up(f.T(0, 0.5), r),
        R2 = up(f.T(1, 0.5), r);
    s += poly([t00, t10, R2, R1], '#7a4b2f') + poly([t01, t11, R2, R1], '#8f5a37') + poly([t11, t10, R2], '#efc96a');
    for (let k = 1; k < 6; k++) s += ln(lerp(t01, t11, k / 6), lerp(R1, R2, k / 6), 'rgba(0,0,0,.2)', 0.8);
    const cs = up(lerp(R1, R2, 0.5), 2);
    s +=
        ln(cs, up(cs, 6), '#3a2a20', 1.4) +
        circ(up(cs, 16), 10, '#fffaf2', `stroke="${OL}" stroke-width="1.2"`) +
        `<path d="M${r1(cs[0] - 5)} ${r1(cs[1] - 20)} h9 v6 a4.5 4.5 0 0 1 -9 0 z M${r1(cs[0] + 4)} ${r1(cs[1] - 18)} a2.5 2.5 0 0 1 0 5" fill="#5b3a26" stroke="#3a2a20" stroke-width=".8"/>`;
    (
        [
            [0.25, '#e0218a'],
            [0.72, '#2f6bf0'],
        ] as const
    ).forEach(([uu, col]) => {
        const c = P(i + w * uu, j + d + 0.45);
        s +=
            ell(c, 8, 3.5, 'rgba(0,0,0,.2)') +
            ln(c, up(c, 7), '#3a2a20', 1.2) +
            ell(up(c, 7), 5, 2.3, '#fffaf2') +
            ln(c, up(c, 20), '#3a2a20', 1) +
            poly(
                [
                    [c[0] - 13, c[1] - 17],
                    [c[0], c[1] - 26],
                    [c[0] + 13, c[1] - 17],
                ],
                col,
                { w: 0.8 },
            ) +
            ell([c[0], c[1] - 17], 13, 3, shade(col, -0.2));
    });
    return s;
}

function med(b: Box) {
    const { i, j, w, d, h } = b,
        f = F(i, j, w, d, h);
    let s = shadowFp(i, j, w, d, h);
    s +=
        block(f, '#ffffff', '#dde3ee', '#eef2f8') +
        fq(f.L, 0, 1, 0.92, 1, '#e0218a', { s: 0 }) +
        fq(f.R, 0, 1, 0.92, 1, '#b0127a', { s: 0 });
    s +=
        wins(f.L, 6, 3, 0.06, 0.9, 'url(#gL)', (r, c) => r === 0 && (c === 2 || c === 3)) +
        wins(f.R, 4, 3, 0.06, 0.9, 'url(#gR)');
    s +=
        fq(f.L, 0.36, 0.64, 0, 0.28, 'url(#gL)', { w: 0.8 }) +
        block(F(i + w * 0.3, j + d, w * 0.4, 0.34, 3, h * 0.3), '#2f6bf0', '#1d4fc4', '#5a8bff');
    const hc = f.T(0.55, 0.4);
    s +=
        ell(hc, 24, 12, '#4a4f62') +
        ell(hc, 19, 9.5, 'none', 'stroke="#ffffff" stroke-width="1.2"') +
        `<text x="0" y="0" transform="matrix(1,0.5,-1,0.5,${r1(hc[0])},${r1(hc[1])})" text-anchor="middle" dominant-baseline="central" font-family="Arial Black,Arial" font-weight="900" font-size="12" fill="#ffffff">H</text>`;
    const sf = planeI(i + 0.25, i + 1.05, j + d - 0.2, h + 4, 20);
    s +=
        ln(up(P(i + 0.65, j + d - 0.2), h), sf(0.5, 0), '#3a3f55', 1.4) +
        fq(sf, 0, 1, 0, 1, '#ffffff', { w: 1.2 }) +
        fq(sf, 0.4, 0.6, 0.15, 0.85, '#e0218a', { s: 0 }) +
        fq(sf, 0.2, 0.8, 0.38, 0.62, '#e0218a', { s: 0 });
    return s;
}

function market(b: Box) {
    const { i, j, w, d } = b;
    let s = poly([P(i, j), P(i + w, j), P(i + w, j + d), P(i, j + d)], '#e9dcc2', { w: 1 });
    for (let k = 1; k < 6; k++)
        s +=
            ln(P(i + (k * w) / 6, j), P(i + (k * w) / 6, j + d), 'rgba(0,0,0,.07)', 1) +
            ln(P(i, j + (k * d) / 6), P(i + w, j + (k * d) / 6), 'rgba(0,0,0,.07)', 1);
    const cols = ['#e0218a', '#2f6bf0', '#ffd23f', '#2fa84f'],
        fruit = [
            ['#ff5a3a', '#ffd23f'],
            ['#7fd06b', '#ff8a3a'],
            ['#c04aff', '#ff5a3a'],
            ['#ffd23f', '#7fd06b'],
        ];
    (
        [
            [0.12, 0.12],
            [0.58, 0.12],
            [0.12, 0.58],
            [0.58, 0.58],
        ] as const
    ).forEach(([u, v], k) => {
        const si = i + u * w,
            sj = j + v * d,
            sw = 0.95,
            sd = 0.8,
            c = cols[k];
        s += block(F(si, sj, sw, sd, 9), '#d39a5f', '#b07a45', '#e8b47a');
        for (let q = 0; q < 6; q++)
            s += circ(
                up(P(si + 0.15 + (q % 3) * 0.3, sj + 0.2 + Math.floor(q / 3) * 0.35), 11),
                2.6,
                fruit[k][q % 2],
                `stroke="${OL}" stroke-width=".6"`,
            );
        (
            [
                [0, 0],
                [sw, 0],
                [sw, sd],
                [0, sd],
            ] as const
        ).forEach(([a, e]) => {
            s += ln(P(si + a, sj + e), up(P(si + a, sj + e), 26), '#6b4a2b', 1.3);
        });
        const t00 = up(P(si, sj), 26),
            t10 = up(P(si + sw, sj), 26),
            t11 = up(P(si + sw, sj + sd), 26),
            t01 = up(P(si, sj + sd), 26),
            R1 = up(P(si, sj + sd / 2), 34),
            R2 = up(P(si + sw, sj + sd / 2), 34);
        s += poly([t00, t10, R2, R1], shade(c, -0.2)) + poly([t01, t11, R2, R1], c) + poly([t11, t10, R2], '#fffaf2');
        for (let q = 1; q < 4; q += 2)
            s += poly(
                [lerp(t01, t11, q / 4), lerp(t01, t11, (q + 1) / 4), lerp(R1, R2, (q + 1) / 4), lerp(R1, R2, q / 4)],
                '#fffaf2',
                { w: 0.6 },
            );
    });
    return s;
}

function legal(b: Box) {
    const { i, j, w, d, h } = b;
    let s = shadowFp(i, j, w, d, h);
    s += block(F(i - 0.12, j - 0.12, w + 0.24, d + 0.24, 5), '#e2dccd', '#c9c1af', '#efe9dc');
    const f = F(i, j, w, d, h, 5);
    s += block(f, '#f4efe4', '#d9d0bf', '#ece5d6');
    for (let k = 0; k < 5; k++) {
        const u = 0.08 + k * 0.2;
        s += fq(f.L, u, u + 0.07, 0, 0.78, '#ffffff', { w: 0.7 });
    }
    s += wins(f.R, 3, 2, 0.1, 0.78, 'url(#gR)') + poly([f.L(-0.02, 0.8), f.L(1.02, 0.8), f.L(0.5, 1.02)], '#ffffff');
    const c = f.T(0.5, 0.5);
    s +=
        ell(c, 20, 10, '#c9d1e2', `stroke="${OL}"`) +
        `<path d="M${r1(c[0] - 17)} ${r1(c[1])} A17 17 0 0 1 ${r1(c[0] + 17)} ${r1(c[1])} Z" fill="#7aa8ff" stroke="${OL}"/>` +
        ln(up(c, 17), up(c, 28), '#3a3f55', 1.4) +
        circ(up(c, 29), 2.4, '#ffd23f');
    return s;
}

export function construction(b: Box) {
    const { i, j, w, d } = b;
    let s =
        poly([P(i, j), P(i + w, j), P(i + w, j + d), P(i, j + d)], '#c8a578', { w: 1 }) +
        ell(P(i + w * 0.5, j + d * 0.5), 30, 13, '#b8925f');
    const H = 52;
    s += block(F(i + 0.3, j + 0.3, w - 0.6, d - 0.6, 6), '#b8bcc9', '#9ca1b1', '#d0d4de');
    s += block(F(i + 0.45, j + 0.45, w - 0.9, d - 0.9, H * 0.45, 6), '#eceff5', '#d2d7e2', '#f4f6fa', { dash: '3 2' });
    const sc = F(i + 0.3, j + 0.3, w - 0.6, d - 0.6, H, 6),
        wood = '#e0a33a';
    [sc.L, sc.R].forEach((fn) => {
        for (let k = 0; k <= 3; k++) s += ln(fn(k / 3, 0), fn(k / 3, 1), wood, 1.6);
        for (let k = 1; k <= 3; k++) s += ln(fn(0, k / 3), fn(1, k / 3), wood, 1.6);
        for (let k = 0; k < 3; k++) s += ln(fn(k / 3, k / 3), fn((k + 1) / 3, (k + 1) / 3), wood, 0.9);
    });
    const cb = P(i + 0.4, j + 0.4),
        ct = up(cb, H + 42);
    s +=
        ln(cb, ct, '#ffd23f', 3.2) +
        ln([ct[0] - 26, ct[1] - 2], [ct[0] + 72, ct[1] + 8], '#ffd23f', 2.6) +
        poly(
            [
                [ct[0] - 30, ct[1] - 6],
                [ct[0] - 20, ct[1] - 6],
                [ct[0] - 20, ct[1] + 4],
                [ct[0] - 30, ct[1] + 4],
            ],
            '#5e6c8e',
        ) +
        ln([ct[0] + 56, ct[1] + 6], [ct[0] + 56, ct[1] + 40], '#2a2f45', 0.8) +
        poly(
            [
                [ct[0] + 50, ct[1] + 40],
                [ct[0] + 62, ct[1] + 40],
                [ct[0] + 62, ct[1] + 46],
                [ct[0] + 50, ct[1] + 46],
            ],
            '#e0a33a',
        );
    const f0 = P(i - 0.05, j + d + 0.1),
        f1 = P(i + w + 0.1, j + d + 0.1),
        f2 = P(i + w + 0.1, j - 0.05);
    for (let k = 0; k <= 8; k++) {
        const p = lerp(f0, f1, k / 8);
        s += ln(p, up(p, 13), '#3a3f55', 1.3);
    }
    for (let k = 1; k <= 8; k++) {
        const p = lerp(f1, f2, k / 8);
        s += ln(p, up(p, 13), '#3a3f55', 1.3);
    }
    s +=
        ln(up(f0, 9), up(f1, 9), '#ffd23f', 3.5) +
        ln(up(f1, 9), up(f2, 9), '#ffd23f', 3.5) +
        ln(up(f0, 9), up(f1, 9), '#15161c', 3.5, 'stroke-dasharray="5 6"') +
        ln(up(f1, 9), up(f2, 9), '#15161c', 3.5, 'stroke-dasharray="5 6"');
    (
        [
            [0.15, 1.25],
            [1.05, 0.3],
        ] as const
    ).forEach(([a, e]) => {
        const c = P(i + w * a, j + d * e - 0.1);
        s += poly(
            [
                [c[0] - 4, c[1]],
                [c[0] + 4, c[1]],
                [c[0], c[1] - 11],
            ],
            '#ff7a3d',
            { w: 0.7 },
        );
    });
    return s;
}

function plot(b: Box) {
    const { i, j, w, d } = b;
    let s = poly([P(i, j), P(i + w, j), P(i + w, j + d), P(i, j + d)], '#d9bb8a', { s: '#2f6bf0', w: 2, dash: '7 5' });
    for (let k = 1; k < 6; k++) s += ln(P(i + 0.2, j + (k * d) / 6), P(i + w - 0.2, j + (k * d) / 6), '#c39f6c', 1.8);
    for (let k = 0; k < 8; k++)
        s += circ(up(P(i + 0.5 + (k % 4) * 0.65, j + (d / 6) * (k < 4 ? 2 : 4)), 2), 2.2, '#5fb05a');
    const f = planeI(i + w * 0.3, i + w * 0.78, j + d - 0.1, 8, 18);
    s +=
        ln(up(P(i + w * 0.38, j + d - 0.1), 0), f(0.15, 0), '#3a3f55', 1.4) +
        ln(up(P(i + w * 0.7, j + d - 0.1), 0), f(0.85, 0), '#3a3f55', 1.4) +
        fq(f, 0, 1, 0, 1, '#2f6bf0', { w: 1.2 }) +
        txtL(f(0.5, 0.5), '+ БИЗНЕС', 8, '#ffffff');
    return s;
}

export interface House extends Box {
    wall: string;
    roof: string;
}

export function house(hh: House) {
    const { i, j, w, d, h, wall, roof } = hh,
        f = F(i, j, w, d, h);
    let s = shadowFp(i, j, w, d, h);
    s += fq(f.L, 0, 1, 0, 1, wall) + fq(f.R, 0, 1, 0, 1, shade(wall, -0.12));
    s +=
        fq(f.L, 0.1, 0.36, 0.32, 0.78, '#ffffff', { w: 0.7 }) +
        fq(f.L, 0.13, 0.33, 0.36, 0.74, 'url(#gW)', { w: 0.5 }) +
        fq(f.L, 0.64, 0.9, 0.32, 0.78, '#ffffff', { w: 0.7 }) +
        fq(f.L, 0.67, 0.87, 0.36, 0.74, 'url(#gL)', { w: 0.5 }) +
        fq(f.L, 0.42, 0.58, 0, 0.64, shade(roof, -0.25), { w: 0.7 }) +
        fq(f.R, 0.3, 0.7, 0.32, 0.74, 'url(#gR)', { w: 0.6 });
    const r = 15,
        t00 = f.T(0, 0),
        t10 = f.T(1, 0),
        t11 = f.T(1, 1),
        t01 = f.T(0, 1),
        R1 = up(f.T(0, 0.5), r),
        R2 = up(f.T(1, 0.5), r);
    s += block(F(i + w * 0.7, j + d * 0.15, 0.18, 0.18, 14, h + 4), '#b5543a', '#8f3f2b', '#c96a4f');
    s +=
        poly([t00, t10, R2, R1], shade(roof, -0.18)) +
        poly([t01, t11, R2, R1], roof) +
        poly([t11, t10, R2], shade(wall, -0.12)) +
        circ(lerp(lerp(t11, t10, 0.5), R2, 0.45), 2.2, '#fff6d6', `stroke="${OL}" stroke-width=".6"`);
    for (let k = 1; k < 5; k++) s += ln(lerp(t01, t11, k / 5), lerp(R1, R2, k / 5), 'rgba(0,0,0,.15)', 0.8);
    const a = P(i - 0.05, j + d + 0.3),
        b2 = P(i + w + 0.05, j + d + 0.3);
    for (let k = 0; k <= 7; k++) {
        const p = lerp(a, b2, k / 7);
        s += ln(p, up(p, 7), '#ffffff', 1.4);
    }
    s += ln(up(a, 5), up(b2, 5), '#ffffff', 1.2);
    ['#ff6fb5', '#ffd23f', '#ffffff', '#ff6fb5'].forEach((c, k) => {
        s += circ(lerp(P(i + 0.1, j + d + 0.15), P(i + w - 0.1, j + d + 0.15), k / 3), 1.8, c);
    });
    return s;
}

function school(b: Box) {
    const { i, j, w, d, h } = b,
        f = F(i, j, w, d, h);
    let s = shadowFp(i, j, w, d, h);
    s +=
        block(f, '#ffe9cf', '#efcfa8', '#f2e2cc') +
        fq(f.L, 0, 1, 0, 0.12, '#c85a32', { s: 0 }) +
        fq(f.R, 0, 1, 0, 0.12, '#a84a28', { s: 0 });
    s +=
        wins(f.L, 6, 2, 0.16, 0.92, 'url(#gL)', (r, c) => r === 0 && (c === 2 || c === 3)) +
        wins(f.R, 4, 2, 0.16, 0.92, 'url(#gR)');
    s += fq(f.L, 0.38, 0.62, 0, 0.42, '#7a3f17', { w: 0.8 }) + fq(f.L, 0.41, 0.59, 0, 0.38, 'url(#gW)', { w: 0.6 });
    s += top4(F(i + 0.15, j + 0.15, w - 0.3, d - 0.3, 0, h), '#e8673a', { w: 0.8 });
    s += block(F(i + w * 0.32, j + d, w * 0.36, 0.45, 4, h * 0.46), '#f4efe4', '#d9d0bf', '#e8673a');
    s += roofSign(i + 0.3, i + w - 0.3, j + d - 0.2, h, 18, '#2fa84f', 'ШКОЛА', 11, '#ffffff');
    const fp = up(P(i + w - 0.4, j + 0.4), h);
    s +=
        ln(fp, up(fp, 36), '#3a3f55', 1.4) +
        poly([up(fp, 36), [fp[0] + 18, fp[1] - 31], up(fp, 26)], '#2f6bf0', { w: 0.8 });
    return s;
}

function stadium(b: Box) {
    const { i, j, w, d } = b,
        W = '#ffffff';
    let s = poly([P(i, j), P(i + w, j), P(i + w, j + d), P(i, j + d)], '#e05a3a', { w: 1 });
    const fi = i + 0.45,
        fj = j + 0.45,
        fw = w - 0.9,
        fd = d - 0.9;
    for (let k = 0; k < 6; k++)
        s += poly(
            [
                P(fi + (k * fw) / 6, fj),
                P(fi + ((k + 1) * fw) / 6, fj),
                P(fi + ((k + 1) * fw) / 6, fj + fd),
                P(fi + (k * fw) / 6, fj + fd),
            ],
            k % 2 ? '#4fb35a' : '#5fc36a',
            { s: 0 },
        );
    s += poly(
        [
            P(fi + 0.1, fj + 0.1),
            P(fi + fw - 0.1, fj + 0.1),
            P(fi + fw - 0.1, fj + fd - 0.1),
            P(fi + 0.1, fj + fd - 0.1),
        ],
        'none',
        {
            s: W,
            w: 1.4,
        },
    );
    s +=
        ln(P(fi + fw / 2, fj + 0.1), P(fi + fw / 2, fj + fd - 0.1), W, 1.4) +
        ell(P(fi + fw / 2, fj + fd / 2), 22, 11, 'none', 'stroke="#ffffff" stroke-width="1.4"');
    [fi + 0.1, fi + fw - 0.1].forEach((gi) => {
        const a = P(gi, fj + fd / 2 - 0.35),
            c = P(gi, fj + fd / 2 + 0.35);
        s += ln(a, up(a, 9), W, 1.6) + ln(c, up(c, 9), W, 1.6) + ln(up(a, 9), up(c, 9), W, 1.6);
    });
    s +=
        block(F(i, j - 0.55, w, 0.5, 12), '#2f6bf0', '#1d4fc4', '#5a8bff') +
        block(F(i - 0.55, j, 0.5, d, 12), '#e0218a', '#b0127a', '#ff6fb5');
    for (let k = 0; k < 9; k++)
        s += circ(up(P(i + 0.3 + (k * (w - 0.6)) / 8, j - 0.3), 13), 1.8, ['#ffd23f', '#ffffff', '#ff6fb5'][k % 3]);
    (
        [
            [i - 0.3, j - 0.3],
            [i + w + 0.2, j - 0.3],
            [i - 0.3, j + d + 0.2],
            [i + w + 0.2, j + d + 0.2],
        ] as const
    ).forEach(([a, e]) => {
        const c = P(a, e);
        s +=
            ln(c, up(c, 60), '#3a3f55', 1.8) +
            circ(up(c, 62), 14, 'url(#glow)') +
            poly(
                [
                    [c[0] - 7, c[1] - 66],
                    [c[0] + 7, c[1] - 66],
                    [c[0] + 7, c[1] - 58],
                    [c[0] - 7, c[1] - 58],
                ],
                '#ffe08a',
                { w: 0.8 },
            );
    });
    return s;
}

function ferris(b: Box) {
    const { i, j, w, d } = b;
    let s = poly([P(i, j), P(i + w, j), P(i + w, j + d), P(i, j + d)], '#e2d6bf', { w: 1 });
    const c0 = P(i + w / 2, j + d / 2),
        R = 46,
        cx = c0[0],
        cy = c0[1] - 62;
    s +=
        ell(c0, 40, 14, 'rgba(14,52,14,.2)') +
        ln([cx - 26, c0[1]], [cx, cy], '#5e6c8e', 3) +
        ln([cx + 26, c0[1]], [cx, cy], '#5e6c8e', 3);
    s +=
        circ([cx, cy], R, 'none', 'stroke="#e0218a" stroke-width="3"') +
        circ([cx, cy], R - 7, 'none', 'stroke="#ff6fb5" stroke-width="1.2"');
    for (let k = 0; k < 12; k++) {
        const a = (k * Math.PI) / 6;
        s += ln([cx, cy], [cx + Math.cos(a) * R, cy + Math.sin(a) * R], 'rgba(255,255,255,.85)', 1);
    }
    const cols = ['#2f6bf0', '#ffd23f', '#3ecf6e', '#ff7a3d'];
    for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4 + 0.2,
            px = cx + Math.cos(a) * R,
            py = cy + Math.sin(a) * R;
        s +=
            ln([px, py], [px, py + 5], '#3a3f55', 1) +
            `<rect x="${r1(px - 6)}" y="${r1(py + 4)}" width="12" height="9" rx="3" fill="${cols[k % 4]}" stroke="${OL}" stroke-width=".8"/>`;
    }
    s += circ([cx, cy], 5, '#ffd23f', `stroke="${OL}"`);
    s += block(F(i + 0.2, j + d - 0.9, 0.7, 0.6, 14), '#ffffff', '#dde3ee', '#e0218a');
    return s;
}

export function lighthouse(c: Pt) {
    let s =
        ell([c[0], c[1] + 2], 26, 12, '#8a8fa3', `stroke="${OL}"`) +
        ell([c[0] - 6, c[1]], 14, 6, '#a3a8bb') +
        ell([c[0] + 6, c[1] + 4], 11, 5, '#9499ad');
    const H = 74,
        bw = 11,
        tw = 7;
    for (let k = 0; k < 4; k++) {
        const y0 = c[1] - (k * H) / 4,
            y1 = c[1] - ((k + 1) * H) / 4,
            w0 = bw - ((bw - tw) * k) / 4,
            w1 = bw - ((bw - tw) * (k + 1)) / 4;
        s += poly(
            [
                [c[0] - w0, y0],
                [c[0] + w0, y0],
                [c[0] + w1, y1],
                [c[0] - w1, y1],
            ],
            k % 2 ? '#ffffff' : '#e0213a',
            { w: 0.8 },
        );
    }
    s += poly(
        [
            [c[0], c[1]],
            [c[0] + bw, c[1]],
            [c[0] + tw, c[1] - H],
            [c[0], c[1] - H],
        ],
        'rgba(0,0,0,.14)',
        { s: 0 },
    );
    const t = c[1] - H;
    s +=
        ell([c[0], t], 11, 4, '#2a2f45') +
        circ([c[0], t - 8], 26, 'url(#glow)') +
        poly(
            [
                [c[0] - 6, t],
                [c[0] + 6, t],
                [c[0] + 6, t - 12],
                [c[0] - 6, t - 12],
            ],
            '#ffe08a',
            { w: 0.8 },
        ) +
        poly(
            [
                [c[0] - 8, t - 12],
                [c[0] + 8, t - 12],
                [c[0], t - 22],
            ],
            '#b0122a',
            { w: 0.8 },
        );
    return s;
}

export function fountain(c: Pt) {
    const rx = 30,
        ry = 15;
    let s =
        ell(c, rx + 8, ry + 4, '#d6d9e3') +
        ell(c, rx, ry, '#9aa1b6', `stroke="${OL}"`) +
        `<rect x="${r1(c[0] - rx)}" y="${r1(c[1] - 6)}" width="${rx * 2}" height="6" fill="#9aa1b6"/>` +
        ell(up(c, 6), rx, ry, '#cfd4e1', `stroke="${OL}"`) +
        ell(up(c, 6), rx - 5, ry - 3, 'url(#water)');
    s +=
        `<rect x="${r1(c[0] - 3)}" y="${r1(c[1] - 22)}" width="6" height="16" fill="#cfd4e1" stroke="${OL}" stroke-width=".8"/>` +
        ell(up(c, 22), 10, 4, '#cfd4e1', `stroke="${OL}" stroke-width=".8"`);
    s += `<path d="M${r1(c[0])} ${r1(c[1] - 24)} q-12 -14 -20 12 M${r1(c[0])} ${r1(c[1] - 24)} q12 -14 20 12 M${r1(c[0])} ${r1(c[1] - 24)} v-10" fill="none" stroke="#e8f6ff" stroke-width="1.8" stroke-linecap="round"/>`;
    return s;
}

export function bridge() {
    const i0 = 12.5,
        i1 = 15,
        j0 = 6.55,
        j1 = 8.45,
        f = F(i0, j0, i1 - i0, j1 - j0, 12, -12);
    let s = '';
    s += fq(f.L, 0, 1, 0, 1, '#b8a68c');
    const arch: Pt[] = [];
    for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        arch.push(f.L(0.16 + 0.68 * t, 0.78 * Math.sin(Math.PI * t)));
    }
    s += poly(arch, '#1d4fa8', { w: 0.8 });
    for (let k = 0; k < 6; k++) s += ln(f.L(k / 6, 0), f.L(k / 6, 1), 'rgba(0,0,0,.08)', 0.8);
    s +=
        poly([P(i0, j0), P(i1, j0), P(i1, j1), P(i0, j1)], '#cfc3ae', { w: 1 }) +
        poly([P(i0, 7), P(i1, 7), P(i1, 8), P(i0, 8)], '#4a4f62', { s: 0 }) +
        ln(P(i0, 7.5), P(i1, 7.5), '#ffd23f', 1.6, 'stroke-dasharray="8 8"');
    [j0 + 0.04, j1 - 0.04].forEach((jj) => {
        for (let k = 0; k <= 8; k++) {
            const p = P(i0 + (k * (i1 - i0)) / 8, jj);
            s += ln(p, up(p, 9), '#f0e6d6', 1.6);
        }
        s += ln(up(P(i0, jj), 9), up(P(i1, jj), 9), '#f0e6d6', 2);
    });
    return s;
}

export const lamp = (c: Pt) =>
    ell([c[0] + 3, c[1] + 1], 5, 2, 'rgba(0,0,0,.22)') +
    ln(c, up(c, 26), '#2e3346', 1.6) +
    ln(up(c, 26), [c[0] + 6, c[1] - 28], '#2e3346', 1.4) +
    circ([c[0] + 6, c[1] - 27], 9, 'url(#glow)') +
    circ([c[0] + 6, c[1] - 27], 2.6, '#ffe08a');

export const tlight = (c: Pt) =>
    ell([c[0] + 3, c[1] + 1], 5, 2, 'rgba(0,0,0,.22)') +
    ln(c, up(c, 30), '#2e3346', 2) +
    `<rect x="${r1(c[0] - 4)}" y="${r1(c[1] - 40)}" width="8" height="12" rx="2" fill="#15161c"/>`;

export const treeRound = (c: Pt, r: number) =>
    ell([c[0] + 7, c[1] + 2], r * 1.2, r * 0.5, 'rgba(14,52,14,.26)') +
    `<path d="M${r1(c[0] - 1.8)} ${r1(c[1])} L${r1(c[0] - 1.2)} ${r1(c[1] - r)} L${r1(c[0] + 1.2)} ${r1(c[1] - r)} L${r1(c[0] + 1.8)} ${r1(c[1])} Z" fill="#7a5233"/>` +
    circ([c[0], c[1] - r * 1.6], r, '#358a42', `stroke="${OL}" stroke-width=".9"`) +
    circ([c[0] - r * 0.45, c[1] - r * 1.35], r * 0.62, '#3f9a4a') +
    circ([c[0] + r * 0.35, c[1] - r * 1.95], r * 0.6, '#56b85a') +
    circ([c[0] - r * 0.25, c[1] - r * 2.05], r * 0.32, '#8edc7a');

export function treePine(c: Pt, r: number) {
    let s =
        ell([c[0] + 6, c[1] + 2], r, r * 0.45, 'rgba(14,52,14,.26)') +
        `<rect x="${r1(c[0] - 1.6)}" y="${r1(c[1] - 7)}" width="3.2" height="7" fill="#7a5233"/>`;
    for (let k = 0; k < 3; k++) {
        const w = r * (1.05 - k * 0.25),
            y0 = c[1] - 5 - k * r * 0.75;
        s +=
            poly(
                [
                    [c[0] - w, y0],
                    [c[0] + w, y0],
                    [c[0], y0 - r * 1.2],
                ],
                k % 2 ? '#2f8a56' : '#28794a',
                { w: 0.8 },
            ) +
            poly(
                [
                    [c[0] - w * 0.1, y0 - 1],
                    [c[0] + w * 0.85, y0 - 1],
                    [c[0], y0 - r * 1.15],
                ],
                'rgba(255,255,255,.12)',
                { s: 0 },
            );
    }
    return s;
}

export const bush = (c: Pt, r: number) =>
    ell([c[0] + 4, c[1] + 1], r * 1.3, r * 0.5, 'rgba(14,52,14,.22)') +
    circ([c[0] - r * 0.5, c[1] - r * 0.6], r * 0.7, '#3f9a4a', `stroke="${OL}" stroke-width=".7"`) +
    circ([c[0] + r * 0.5, c[1] - r * 0.6], r * 0.7, '#47a852', `stroke="${OL}" stroke-width=".7"`) +
    circ([c[0], c[1] - r], r * 0.75, '#56b85a', `stroke="${OL}" stroke-width=".7"`) +
    circ([c[0] - r * 0.3, c[1] - r * 1.2], 1.6, '#ff6fb5') +
    circ([c[0] + r * 0.4, c[1] - r * 0.9], 1.6, '#ffffff');

/** Рисунок здания по его типу */
export function drawBuilding(b: CityBuilding): string {
    switch (b.kind) {
        case 'bank':
            return bank(b);
        case 'tower':
            return tower(b);
        case 'shop':
            return shop(b);
        case 'cafe':
            return cafe(b);
        case 'med':
            return med(b);
        case 'market':
            return market(b);
        case 'legal':
            return legal(b);
        case 'plot':
            return plot(b);
        case 'school':
            return school(b);
        case 'stadium':
            return stadium(b);
        case 'park':
            return ferris(b);
    }
}
