import { useState } from 'react';
import { DREAM } from '@mt/shared';
import { GiftIcon, HeadphonesIcon, XIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { useTeen } from '../roles';

type CatKey = (typeof DREAM.categories)[number]['key'];
type Picks = Record<CatKey, number | null>;

interface Run {
    month: number;
    saved: number;
    picks: Picks;
    spent: Record<CatKey, number>;
    phase: 'play' | 'win' | 'lose';
    used: number;
    history: MonthLog[];
}

/** Итог одного месяца для кольца трат */
type MonthLog = Record<CatKey | 'gift' | 'left', number>;

const fresh = (): Run => ({
    month: 1,
    saved: 0,
    picks: { food: null, clothes: 0, fun: 0 },
    spent: { food: 0, clothes: 0, fun: 0 },
    phase: 'play',
    used: 0,
    history: [],
});

const NAMES: Record<CatKey, string> = { food: 'Еда', clothes: 'Одежда', fun: 'Развлечения' };

interface Slice {
    name: string;
    value: number;
    color: string;
}

const R = 46;
const C = 2 * Math.PI * R;
const GAP = 3;

/** Кольцо трат за месяц, как в аналитике банка: сегмент на каждую категорию + остаток «отложу» */
function SpendRing({ slices, spend, label }: { slices: Slice[]; spend: number; label: string }) {
    const total = slices.reduce((s, x) => s + x.value, 0) || 1;
    const shown = slices.filter((s) => s.value > 0);
    let offset = 0;
    return (
        <div className="spend-ring">
            <div className="spend-ring-chart">
                <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={R} className="spend-ring-track" />
                    {shown.map((s) => {
                        const len = (s.value / total) * C;
                        const dash = Math.max(len - (shown.length > 1 ? GAP : 0), 0.5);
                        const el = (
                            <circle
                                key={s.name}
                                cx="60"
                                cy="60"
                                r={R}
                                stroke={s.color}
                                strokeDasharray={`${dash} ${C - dash}`}
                                strokeDashoffset={-offset}
                            />
                        );
                        offset += len;
                        return el;
                    })}
                </svg>
                <div className="spend-ring-center">
                    <b>{spend}</b>
                    <span>{label}</span>
                </div>
            </div>
            <div className="spend-ring-legend">
                {slices.map((s) => (
                    <div key={s.name} className={s.value ? '' : 'off'}>
                        <i style={{ background: s.color }} />
                        <span>{s.name}</span>
                        <b>{s.value}</b>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Квест «Накопи на мечту»: 5 месяцев, 200 руб. в месяц, нужно отложить 500 на наушники */
export function Dream() {
    const teen = useTeen();
    const closeOverlay = useUi((s) => s.closeOverlay);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const [d, setD] = useState<Run>(fresh);
    const [range, setRange] = useState<'month' | 'quarter'>('month');

    const gift = d.month === DREAM.giftMonth ? DREAM.gift : 0;
    const spend = (d.picks.food ?? 0) + (d.picks.clothes ?? 0) + (d.picks.fun ?? 0) + gift;
    const left = DREAM.allowance - spend;
    const can = d.picks.food != null && spend <= d.saved + DREAM.allowance;
    const playing = d.phase === 'play';

    const current: MonthLog = {
        food: d.picks.food ?? 0,
        clothes: d.picks.clothes ?? 0,
        fun: d.picks.fun ?? 0,
        gift,
        left: Math.max(left, 0),
    };
    // «3 месяца» — два прошлых месяца из истории плюс текущий выбор
    const logs = range === 'month' ? [current] : [...d.history.slice(-2), current];
    const sum = (k: keyof MonthLog) => logs.reduce((s, m) => s + m[k], 0);
    const slices: Slice[] = [
        { name: NAMES.food, value: sum('food'), color: 'var(--yellow)' },
        { name: NAMES.clothes, value: sum('clothes'), color: 'var(--accent-600)' },
        { name: NAMES.fun, value: sum('fun'), color: 'var(--accent-2-700)' },
        ...(sum('gift') ? [{ name: 'Подарок', value: sum('gift'), color: '#a47bff' }] : []),
        { name: range === 'month' ? 'Отложу' : 'Отложено', value: sum('left'), color: 'var(--green)' },
    ];
    const ringSpend = slices.slice(0, -1).reduce((s, x) => s + x.value, 0);
    const ringLabel =
        range === 'month' ? 'руб. траты' : logs.length === 1 ? 'руб. за 1 мес.' : `руб. за ${logs.length} мес.`;

    const next = () => {
        if (d.phase === 'win') {
            action.mutate({ type: 'dream/complete', teen });
            closeOverlay();
            return flash('Квест недели выполнен: «Накопи на мечту»');
        }
        if (d.phase === 'lose') return setD(fresh());
        if (!can) return;
        const saved = d.saved + DREAM.allowance - spend;
        const spent = {
            food: d.spent.food + (d.picks.food ?? 0),
            clothes: d.spent.clothes + (d.picks.clothes ?? 0),
            fun: d.spent.fun + (d.picks.fun ?? 0),
        };
        const history = [...d.history, current];
        if (saved >= DREAM.goal) return setD({ ...d, saved, spent, history, phase: 'win', used: d.month });
        if (d.month === DREAM.months) return setD({ ...d, saved, spent, history, phase: 'lose' });
        setD({ ...d, saved, spent, history, month: d.month + 1, picks: { food: null, clothes: 0, fun: 0 } });
    };

    const top = (Object.keys(d.spent) as CatKey[]).sort((a, b) => d.spent[b] - d.spent[a])[0];
    const months = d.used === 1 ? '1 месяц' : d.used < 5 ? `${d.used} месяца` : `${d.used} месяцев`;
    const btn =
        d.phase === 'win'
            ? 'Забрать награду'
            : d.phase === 'lose'
              ? 'Начать заново'
              : d.picks.food == null
                ? 'Выбери, что будешь есть'
                : !can
                  ? 'Не хватает денег'
                  : 'Отложить и дальше';

    return (
        <div className="overlay">
            <div className="overlay-top">
                <button className="icon-btn plain" onClick={closeOverlay} aria-label="Выйти">
                    <XIcon size={24} />
                </button>
                <div className="segments wide">
                    {[1, 2, 3, 4, 5].map((m) => (
                        <div
                            key={m}
                            className={
                                m < d.month || (!playing && m <= d.month) ? 'on pink' : m === d.month ? 'now' : ''
                            }
                        />
                    ))}
                </div>
                <b style={{ fontSize: 14 }}>Месяц {d.month}/5</b>
            </div>
            <div className="overlay-body scroll">
                <div className="dream-card">
                    <div className="dream-icon">
                        <HeadphonesIcon size={38} weight="duotone" />
                    </div>
                    <div className="stack grow" style={{ gap: 6 }}>
                        <span className="small light">Мечта: наушники за {DREAM.goal} руб.</span>
                        <span className="display" style={{ fontSize: 26 }}>
                            {d.saved} <span className="unit">руб. отложено</span>
                        </span>
                        <div className="progress pink">
                            <div style={{ width: `${Math.min(100, (d.saved / DREAM.goal) * 100)}%` }} />
                        </div>
                    </div>
                </div>
                {playing && (
                    <>
                        <div className="row" style={{ justifyContent: 'space-between', fontSize: 15 }}>
                            <span>Родители дали на месяц</span>
                            <b className="pos">+{DREAM.allowance} руб.</b>
                        </div>
                        <div className="stack" style={{ gap: 8 }}>
                            <div className="spend-tabs">
                                <button className={range === 'month' ? 'on' : ''} onClick={() => setRange('month')}>
                                    Месяц
                                </button>
                                <button
                                    className={range === 'quarter' ? 'on' : ''}
                                    onClick={() => setRange('quarter')}
                                >
                                    3 месяца
                                </button>
                            </div>
                            <SpendRing slices={slices} spend={ringSpend} label={ringLabel} />
                        </div>
                        {d.month === DREAM.giftMonth && (
                            <div className="event">
                                <GiftIcon size={26} weight="duotone" />
                                <div className="stack" style={{ gap: 2 }}>
                                    <b>У друга день рождения</b>
                                    <span>Подарок обязателен: −{DREAM.gift} руб.</span>
                                </div>
                            </div>
                        )}
                        {DREAM.categories.map((c) => (
                            <div key={c.key} className="stack" style={{ gap: 8 }}>
                                <div
                                    className="row"
                                    style={{ justifyContent: 'space-between', alignItems: 'baseline' }}
                                >
                                    <b style={{ fontSize: 16 }}>{c.name}</b>
                                    <span className="small" style={{ fontSize: 12 }}>
                                        {c.hint}
                                    </span>
                                </div>
                                <div className="pick-grid">
                                    {c.opts.map(([label, price]) => (
                                        <button
                                            key={label}
                                            className={`pick ${d.picks[c.key] === price ? 'on' : ''}`}
                                            onClick={() => setD({ ...d, picks: { ...d.picks, [c.key]: price } })}
                                        >
                                            <span>{label}</span>
                                            <b>{price ? `${price} руб.` : '0'}</b>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}
                {!playing && (
                    <div className="stack" style={{ gap: 10, paddingTop: 10 }}>
                        <span className={`kicker ${d.phase === 'win' ? 'ok' : 'accent-2'}`}>
                            {d.phase === 'win' ? 'КВЕСТ ПРОЙДЕН' : 'НЕ ПОЛУЧИЛОСЬ'}
                        </span>
                        <span className="display" style={{ fontSize: 28, lineHeight: 1.1 }}>
                            {d.phase === 'win' ? 'Наушники твои' : `Не хватило ${DREAM.goal - d.saved} руб.`}
                        </span>
                        <span className="body">
                            {d.phase === 'win'
                                ? `Ты накопил за ${months}. Осталось ${d.saved - DREAM.goal} руб. +60 знаний${teen ? '.' : ' и +50 MTcoin.'}`
                                : `Больше всего ушло на «${NAMES[top]}». Чтобы успеть, тратить можно около 100 руб. в месяц.`}
                        </span>
                    </div>
                )}
            </div>
            <div className="overlay-foot">
                {playing && (
                    <div className="row" style={{ justifyContent: 'space-between', fontSize: 15 }}>
                        <span>
                            Траты: <b>{spend} руб.</b>
                        </span>
                        <span>
                            Отложу: <b className={left < 0 ? 'neg' : 'pos'}>{left} руб.</b>
                        </span>
                    </div>
                )}
                <button
                    className={`btn block tall ${d.phase === 'win' ? 'ok' : ''}`}
                    disabled={playing && !can}
                    onClick={next}
                >
                    {btn}
                </button>
            </div>
        </div>
    );
}
