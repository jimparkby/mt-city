// Персонаж ребёнка (одежда и шапки из магазина) и оформление карт Moby Kids / Moby Teen.

import type { HatId, SkinId, TopId } from '@mt/shared';
import { OL, ell, ln, r1, shade, uri } from './svg';

export interface Look {
    top: TopId;
    hat: HatId;
    /** Короткая стрижка — у подростка Марка */
    hair?: 'short';
}

export const KID_DEFAULT: Look = { top: 'hoodie', hat: 'none' };
export const TEEN_LOOK: Look = { top: 'jacket', hat: 'cap', hair: 'short' };

export const TOP_COLORS: Record<TopId, string> = {
    hoodie: '#e0218a',
    tee: '#ffd23f',
    jacket: '#2f6bf0',
    space: '#e8ecf5',
};

/** Персонаж в масштабе k: ширина 20k, высота 37k */
export function avatarSVG(o: Look, k: number) {
    const f = (n: number) => r1(n * k),
        st = `stroke="${OL}" stroke-width="${r1(0.3 * k)}" stroke-linejoin="round"`;
    const c = TOP_COLORS[o.top] ?? TOP_COLORS.hoodie,
        dk = shade(c, -0.22),
        skin = '#f2c7a5',
        skinD = '#e0a986',
        hair = o.hair === 'short' ? '#2a1a12' : '#6a3a22';
    const pants = o.top === 'space' ? '#dfe4ee' : '#34407a';
    const R = (x: number, y: number, w: number, hh: number, rx: number, fill: string, ex = '') =>
        `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(hh)}" rx="${f(rx)}" fill="${fill}" ${ex}/>`;
    const C = (x: number, y: number, r: number, fill: string, ex = '') =>
        `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${ex}/>`;
    const Pth = (d: string, fill: string, ex = '') =>
        `<path d="${d.replace(/-?(?:\d+(?:\.\d+)?|\.\d+)/g, (m) => String(f(+m)))}" fill="${fill}" ${ex}/>`;
    const mir = (d: string) =>
        d.replace(
            /([ML]|Q)?\s*(-?(?:\d+(?:\.\d+)?|\.\d+))\s+(-?(?:\d+(?:\.\d+)?|\.\d+))/g,
            (_m, cmd: string | undefined, x: string, y: string) => ' ' + (cmd || '') + -x + ' ' + y,
        );
    let s = ell([0, 0], 6 * k, 2.2 * k, 'rgba(0,0,0,.28)');
    if (o.hair !== 'short') s += C(3.4, -23.8, 2.3, hair, st) + C(4.4, -20.8, 1.7, hair, st);
    s += R(-2.9, -8.6, 2.5, 7.8, 1, pants, st) + R(0.4, -8.6, 2.5, 7.8, 1, pants, st);
    s +=
        R(-3.5, -2, 3.3, 2, 0.9, '#ffffff', st) +
        R(-3.5, -0.7, 3.3, 0.7, 0.3, '#e0218a') +
        R(0.2, -2, 3.3, 2, 0.9, '#ffffff', st) +
        R(0.2, -0.7, 3.3, 0.7, 0.3, '#e0218a');
    s += Pth(
        'M-4.2 -16.2 Q-4.4 -17.6 -3 -17.6 L3 -17.6 Q4.4 -17.6 4.2 -16.2 L4.4 -8 Q4.4 -6.6 3 -6.6 L-3 -6.6 Q-4.4 -6.6 -4.4 -8 Z',
        c,
        st,
    );
    if (o.top === 'hoodie')
        s +=
            Pth('M-2.6 -10.8 L2.6 -10.8 L3.2 -7.6 L-3.2 -7.6 Z', dk) +
            ln([f(-0.9), f(-16.4)], [f(-1.1), f(-13.2)], '#ffffff', r1(0.3 * k)) +
            ln([f(0.9), f(-16.4)], [f(1.1), f(-13.2)], '#ffffff', r1(0.3 * k));
    if (o.top === 'tee')
        s +=
            R(-4.4, -7.8, 8.8, 1, 0.4, dk) +
            C(0, -12.6, 1.9, '#e0218a') +
            Pth(
                'M-1 -11.7 L-1 -13.5 L0 -12.4 L1 -13.5 L1 -11.7',
                'none',
                `stroke="#ffffff" stroke-width="${r1(0.35 * k)}" stroke-linecap="round" stroke-linejoin="round"`,
            );
    if (o.top === 'jacket')
        s +=
            Pth('M-1.2 -17.6 L0 -15.8 L1.2 -17.6 Z', '#ffd23f') +
            ln([0, f(-15.8)], [0, f(-6.8)], '#ffffff', r1(0.3 * k)) +
            Pth('M-2.9 -17.6 L0 -15 L2.9 -17.6 L2.1 -18.5 L0 -16.4 L-2.1 -18.5 Z', dk, st) +
            R(-3.6, -10.4, 2.2, 0.5, 0.2, dk) +
            R(1.4, -10.4, 2.2, 0.5, 0.2, dk);
    if (o.top === 'space')
        s +=
            R(-2.4, -15.2, 4.8, 3.4, 0.8, '#2a2f45') +
            C(-1.3, -13.5, 0.5, '#3ecf6e') +
            C(0, -13.5, 0.5, '#ffd23f') +
            C(1.3, -13.5, 0.5, '#e0218a') +
            R(-4.4, -10.2, 8.8, 1.3, 0.3, '#2f6bf0') +
            R(-2.7, -18.3, 5.4, 1.2, 0.6, '#9aa3b8', st);
    const armC = o.top === 'tee' ? skin : c,
        handC = o.top === 'space' ? '#2f6bf0' : skin;
    const arm = 'M-4.2 -16.6 Q-6 -16 -6.2 -12.8 L-6.4 -9.6 L-4.7 -9.4 L-4.5 -12.4 Q-4.4 -13.6 -4 -14 Z',
        cap = 'M-4.2 -16.6 Q-6 -16 -6.1 -13.8 L-4.5 -13.6 Q-4.4 -14.2 -4 -14.6 Z';
    [arm, mir(arm)].forEach((d, n) => {
        s += Pth(d, armC, st);
        if (o.top === 'tee') s += Pth(n ? mir(cap) : cap, c, st);
    });
    s += C(-5.55, -8.9, 1.25, handC, st) + C(5.55, -8.9, 1.25, handC, st);
    s += R(-1, -18.6, 2, 1.8, 0.5, skinD);
    if (o.top === 'hoodie') s += Pth('M-3.4 -17.6 Q0 -14.6 3.4 -17.6 Q2.6 -19 0 -18.6 Q-2.6 -19 -3.4 -17.6 Z', dk, st);
    s += C(-4.3, -21.2, 0.9, skin, st) + C(4.3, -21.2, 0.9, skin, st) + C(0, -21.6, 4.4, skin, st);
    s += Pth(
        'M-4.5 -21.8 Q-4.8 -26.8 0 -26.4 Q4.8 -26.8 4.5 -21.8 Q3.6 -24 1.6 -23.8 Q-.6 -25 -2.4 -23.4 Q-3.8 -23.6 -4.5 -21.8 Z',
        hair,
        st,
    );
    if (o.hair !== 'short')
        s +=
            Pth('M-4.5 -22 Q-5.5 -18 -4 -16.6 L-3.4 -20.6 Z', hair) +
            Pth('M4.5 -22 Q5.5 -18 4 -16.6 L3.4 -20.6 Z', hair);
    s +=
        C(-1.5, -21.2, 0.58, '#1a1b22') +
        C(1.5, -21.2, 0.58, '#1a1b22') +
        C(-1.3, -21.45, 0.2, '#ffffff') +
        C(1.7, -21.45, 0.2, '#ffffff');
    s +=
        C(-2.7, -19.8, 0.75, 'rgba(255,111,181,.4)') +
        C(2.7, -19.8, 0.75, 'rgba(255,111,181,.4)') +
        Pth(
            'M-1.1 -19.4 Q0 -18.4 1.1 -19.4',
            'none',
            `stroke="#7a3a2a" stroke-width="${r1(0.3 * k)}" stroke-linecap="round"`,
        );
    if (o.hat === 'cap')
        s +=
            Pth('M-4.7 -22.6 Q-4.6 -27.6 0 -27.6 Q4.6 -27.6 4.7 -22.6 Z', '#2f6bf0', st) +
            Pth('M0 -23.2 L7.2 -23 Q7.7 -22.4 7 -22 L0 -22.2 Z', '#1d3f99', st) +
            C(0, -27.5, 0.5, '#ffd23f') +
            C(-1.9, -24.8, 0.9, '#ffffff');
    if (o.hat === 'phones')
        s +=
            Pth(
                'M-4.9 -21.4 Q-5.4 -28.6 0 -28.6 Q5.4 -28.6 4.9 -21.4',
                'none',
                `stroke="#15161c" stroke-width="${r1(1 * k)}" stroke-linecap="round"`,
            ) +
            R(-6.5, -23.6, 2.4, 4.6, 1, '#e0218a', st) +
            R(4.1, -23.6, 2.4, 4.6, 1, '#e0218a', st) +
            R(-6.1, -22.8, 0.9, 3, 0.4, '#ff8fc6') +
            R(5.2, -22.8, 0.9, 3, 0.4, '#ff8fc6');
    if (o.hat === 'crown')
        s +=
            Pth('M-3.8 -24.8 L3.8 -24.8 L4.4 -29.8 L2 -27.2 L0 -31 L-2 -27.2 L-4.4 -29.8 Z', '#ffd23f', st) +
            R(-3.8, -25.6, 7.6, 0.8, 0.2, '#e0b421') +
            C(0, -26.6, 0.7, '#e0218a') +
            C(-2.4, -26.2, 0.5, '#2f6bf0') +
            C(2.4, -26.2, 0.5, '#3ecf6e');
    return uri(s, -10 * k, -34 * k, 20 * k, 37 * k);
}

// ---------- Карты ----------

export interface CardLook {
    bg: string;
    pat: string;
}

export const SKIN_LOOKS: Record<SkinId, CardLook> = {
    classic: {
        bg: 'linear-gradient(135deg,#ff4fa8 0%,#b0127a 45%,#2f6bf0 100%)',
        pat: 'radial-gradient(circle at 105% -15%,rgba(255,255,255,.22) 0 80px,transparent 81px),radial-gradient(circle at 105% -15%,rgba(255,255,255,.1) 0 135px,transparent 136px),radial-gradient(circle at -15% 125%,rgba(255,255,255,.14) 0 105px,transparent 106px)',
    },
    neon: {
        bg: 'linear-gradient(135deg,#00c6ff 0%,#5a3cff 50%,#ff2fd0 100%)',
        pat: 'linear-gradient(rgba(255,255,255,.14) 1px,transparent 1px) 0 0/20px 20px,linear-gradient(90deg,rgba(255,255,255,.14) 1px,transparent 1px) 0 0/20px 20px,radial-gradient(120% 60% at 50% 120%,rgba(0,255,240,.45),transparent 60%)',
    },
    pixel: {
        bg: 'linear-gradient(160deg,#3ecf6e 0%,#1f8a45 100%)',
        pat: 'repeating-conic-gradient(rgba(255,255,255,.14) 0 25%,transparent 0 50%) 0 0/22px 22px,linear-gradient(0deg,rgba(255,210,63,.55) 0 18%,transparent 18%)',
    },
    space: {
        bg: 'linear-gradient(160deg,#0f1426 0%,#2a1640 55%,#1d3f99 100%)',
        pat: 'radial-gradient(circle at 80% 30%,#ffd23f 0 16px,#e0a300 17px,transparent 18px),radial-gradient(circle at 76% 26%,rgba(255,255,255,.5) 0 4px,transparent 5px),radial-gradient(circle at 14% 22%,#fff 0 1.5px,transparent 2.5px),radial-gradient(circle at 34% 68%,#fff 0 1px,transparent 2px),radial-gradient(circle at 58% 14%,#fff 0 1px,transparent 2px),radial-gradient(circle at 48% 86%,#fff 0 1.5px,transparent 2.5px),radial-gradient(circle at 92% 78%,#fff 0 1px,transparent 2px),radial-gradient(circle at 24% 46%,#fff 0 1px,transparent 2px),radial-gradient(60% 80% at 0% 100%,rgba(224,33,138,.45),transparent 70%)',
    },
};

const BRUSH =
    'repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 1px,transparent 1px 3px),linear-gradient(115deg,transparent 30%,rgba(255,255,255,.25) 46%,transparent 62%)';

/** Оформление уровней карты Moby Teen по индексу CARD_TIERS */
export const TIER_LOOKS: CardLook[] = [
    {
        bg: 'linear-gradient(135deg,#4d5368 0%,#15161c 100%)',
        pat: 'repeating-linear-gradient(135deg,rgba(255,255,255,.05) 0 2px,transparent 2px 10px)',
    },
    { bg: 'linear-gradient(135deg,#f0b07a 0%,#b0652e 45%,#6b3412 100%)', pat: BRUSH },
    { bg: 'linear-gradient(135deg,#d7dde9 0%,#8a93a8 45%,#4a5166 100%)', pat: BRUSH },
    { bg: 'linear-gradient(135deg,#ffe58a 0%,#d9a21c 45%,#7a4d00 100%)', pat: BRUSH },
];

/** Узор поверх фона одной строкой — для маленьких превью */
export const fullBg = (c: CardLook) => c.pat + ',' + c.bg;
