import type { ReactNode } from 'react';

export interface RingSlice {
    key: string;
    value: number;
    color: string;
}

const R = 80;
const C = 2 * Math.PI * R;
const GAP = 4;

/** Кольцо как в «Анализе расходов» банка: сегмент на каждую часть, подпись в центре.
 *  Если total больше суммы сегментов, остаток кольца остаётся пустой дорожкой */
export function Ring({
    slices,
    total,
    className = '',
    children,
}: {
    slices: RingSlice[];
    total?: number;
    className?: string;
    children: ReactNode;
}) {
    const sum = slices.reduce((s, x) => s + x.value, 0);
    const full = Math.max(total ?? 0, sum) || 1;
    const shown = slices.filter((s) => s.value > 0);
    const gap = shown.length > 1 || sum < full ? GAP : 0;
    const lens = shown.map((s) => (s.value / full) * C);
    // Каждый сегмент начинается там, где закончились предыдущие
    const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0));
    return (
        <div className={`spend-ring ${className}`}>
            <svg viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={R} className="spend-ring-track" />
                {shown.map((s, i) => {
                    const dash = Math.max(lens[i] - gap, 1);
                    return (
                        <circle
                            key={s.key}
                            cx="100"
                            cy="100"
                            r={R}
                            stroke={s.color}
                            strokeDasharray={`${dash} ${C - dash}`}
                            strokeDashoffset={-starts[i]}
                        />
                    );
                })}
            </svg>
            <div className="spend-ring-center">{children}</div>
        </div>
    );
}
