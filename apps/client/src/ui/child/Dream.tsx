import { useState, type ReactNode } from 'react';
import { DREAM } from '@mt/shared';
import {
    CaretRightIcon,
    CheckCircleIcon,
    ForkKnifeIcon,
    GameControllerIcon,
    GiftIcon,
    HeadphonesIcon,
    PiggyBankIcon,
    TShirtIcon,
    XIcon,
    type Icon,
} from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { Sheet } from '../components/Sheet';
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
    key: keyof MonthLog;
    name: string;
    value: number;
    color: string;
    icon: Icon;
}

const STYLE: Record<keyof MonthLog, { color: string; icon: Icon }> = {
    food: { color: '#ffb23f', icon: ForkKnifeIcon },
    clothes: { color: '#4a80ff', icon: TShirtIcon },
    fun: { color: '#ff6fb5', icon: GameControllerIcon },
    gift: { color: '#a47bff', icon: GiftIcon },
    left: { color: '#3ecf6e', icon: PiggyBankIcon },
};

const R = 80;
const C = 2 * Math.PI * R;
const GAP = 4;

/** Кольцо как в «Анализе расходов» банка: сегмент на каждую часть, подпись в центре.
 *  Если total больше суммы сегментов, остаток кольца остаётся пустой дорожкой */
function Ring({
    slices,
    total,
    className = '',
    children,
}: {
    slices: { key: string; value: number; color: string }[];
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

/** Оттенки сегментов накоплений по месяцам */
const SAVE_COLORS = ['#3ecf6e', '#7be39b', '#2fa84f', '#a8f0bf', '#1f8a40'];

/** Квест «Накопи на мечту»: 5 месяцев, 200 руб. в месяц, нужно отложить 500 на наушники */
export function Dream() {
    const teen = useTeen();
    const closeOverlay = useUi((s) => s.closeOverlay);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const [d, setD] = useState<Run>(fresh);
    const [range, setRange] = useState<'month' | 'quarter'>('month');
    const [open, setOpen] = useState<CatKey | null>(null);

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
    const slice = (key: keyof MonthLog, name: string): Slice => ({ key, name, value: sum(key), ...STYLE[key] });
    const slices: Slice[] = [
        slice('food', NAMES.food),
        slice('clothes', NAMES.clothes),
        slice('fun', NAMES.fun),
        ...(sum('gift') ? [slice('gift', 'Подарок другу')] : []),
        slice('left', range === 'month' ? 'Отложу' : 'Отложено'),
    ];
    const ringTotal = slices.reduce((s, x) => s + x.value, 0);
    // Накопления по месяцам; если брал из копилки, сегменты ужимаются до реального остатка
    const put = d.history.map((m) => m.left);
    const putSum = put.reduce((s, x) => s + x, 0);
    const savedSlices = put
        .map((v, i) => ({
            key: `m${i}`,
            month: i + 1,
            value: putSum > d.saved ? Math.round((v * d.saved) / putSum) : v,
            color: SAVE_COLORS[i % SAVE_COLORS.length],
        }))
        .filter((s) => s.value > 0);
    const ringSpend = ringTotal - sum('left');
    const ringLabel = range === 'month' ? `траты за месяц ${d.month}` : `траты за ${logs.length} мес.`;

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

    const sub = (s: Slice) => {
        const cat = DREAM.categories.find((c) => c.key === s.key);
        if (range === 'quarter' || !cat) return s.key === 'gift' ? 'обязательная трата' : null;
        const pick = d.picks[cat.key];
        if (pick == null) return <span className="neg">{cat.hint}</span>;
        return cat.opts.find(([, price]) => price === pick)?.[0];
    };
    const sheetCat = DREAM.categories.find((c) => c.key === open);

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
                    <Ring slices={savedSlices} total={DREAM.goal} className="mini">
                        <HeadphonesIcon size={26} weight="duotone" color="#ff6fb5" />
                        <b>{Math.min(100, Math.round((d.saved / DREAM.goal) * 100))}%</b>
                    </Ring>
                    <div className="stack grow" style={{ gap: 6, minWidth: 0 }}>
                        <span className="small light">Мечта: наушники за {DREAM.goal} руб.</span>
                        <span className="display" style={{ fontSize: 26 }}>
                            {d.saved} <span className="unit">руб. отложено</span>
                        </span>
                        <div className="save-chips">
                            {savedSlices.length ? (
                                savedSlices.map((s) => (
                                    <span key={s.key}>
                                        <i style={{ background: s.color }} />
                                        {s.month} мес. +{s.value}
                                    </span>
                                ))
                            ) : (
                                <span>осталось {DREAM.goal} руб.</span>
                            )}
                        </div>
                    </div>
                </div>
                {playing && (
                    <>
                        <div className="spend-tabs">
                            <button className={range === 'month' ? 'on' : ''} onClick={() => setRange('month')}>
                                Месяц
                            </button>
                            <button className={range === 'quarter' ? 'on' : ''} onClick={() => setRange('quarter')}>
                                3 месяца
                            </button>
                        </div>
                        <Ring slices={slices}>
                            <b>{ringSpend} руб.</b>
                            <span>{ringLabel}</span>
                        </Ring>
                        <div className="row" style={{ justifyContent: 'space-between', fontSize: 15 }}>
                            <span>Родители дали на месяц</span>
                            <b className="pos">+{DREAM.allowance} руб.</b>
                        </div>
                        <div className="spend-list">
                            {slices.map((s) => {
                                const Ico = s.icon;
                                const pickable = range === 'month' && s.key in NAMES;
                                return (
                                    <button
                                        key={s.key}
                                        className="spend-row"
                                        disabled={!pickable}
                                        onClick={() => setOpen(s.key as CatKey)}
                                    >
                                        <span className="spend-ico" style={{ color: s.color }}>
                                            <Ico size={22} weight="fill" />
                                        </span>
                                        <span className="spend-name">
                                            <b>{s.name}</b>
                                            {sub(s) && <span>{sub(s)}</span>}
                                        </span>
                                        <span className="spend-sum">
                                            <b>{s.value} руб.</b>
                                            <span>{ringTotal ? Math.round((s.value / ringTotal) * 100) : 0}%</span>
                                        </span>
                                        {pickable && <CaretRightIcon size={16} className="spend-caret" />}
                                    </button>
                                );
                            })}
                        </div>
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
            {sheetCat && (
                <Sheet onClose={() => setOpen(null)}>
                    <b className="sheet-title">{sheetCat.name}</b>
                    <span className="small">{sheetCat.hint}</span>
                    <div className="spend-list">
                        {sheetCat.opts.map(([label, price]) => (
                            <button
                                key={label}
                                className="spend-row"
                                onClick={() => {
                                    setD({ ...d, picks: { ...d.picks, [sheetCat.key]: price } });
                                    setOpen(null);
                                }}
                            >
                                <span className="spend-name">
                                    <b>{label}</b>
                                </span>
                                <span className="spend-sum">
                                    <b>{price} руб.</b>
                                </span>
                                {d.picks[sheetCat.key] === price && (
                                    <CheckCircleIcon size={22} weight="fill" color="var(--accent-600)" />
                                )}
                            </button>
                        ))}
                    </div>
                </Sheet>
            )}
        </div>
    );
}
