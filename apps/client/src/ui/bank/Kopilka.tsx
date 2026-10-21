import { useState } from 'react';
import type { GameState, KopPlan } from '@mt/shared';
import {
    ArrowDownLeftIcon,
    CalendarCheckIcon,
    CaretLeftIcon,
    CheckIcon,
    DotsThreeCircleIcon,
    FlagCheckeredIcon,
    GameControllerIcon,
    HamburgerIcon,
    LightbulbIcon,
    NumberOneIcon,
    NumberThreeIcon,
    NumberTwoIcon,
    PiggyBankIcon,
    WalletIcon,
    CalendarPlusIcon,
    type Icon,
} from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { Ring, type RingSlice } from '../components/Ring';

/** Ставка Копилки в демо: 8% годовых, проценты капитализируются раз в месяц */
const RATE = 0.08 / 12;
const MONTHS_TO = [
    'январю',
    'февралю',
    'марту',
    'апрелю',
    'маю',
    'июню',
    'июлю',
    'августу',
    'сентябрю',
    'октябрю',
    'ноябрю',
    'декабрю',
];

const money = (v: number) => (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
const pctOf = (v: number, total: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

/** Строка под кольцом: сегмент кольца + подпись в списке */
interface Part extends RingSlice {
    name: string;
    sub: string;
    icon: Icon;
}

function monthsWord(m: number) {
    if (m % 10 === 1 && m % 100 !== 11) return 'месяц';
    if (m % 10 >= 2 && m % 10 <= 4 && (m % 100 < 10 || m % 100 >= 20)) return 'месяца';
    return 'месяцев';
}

/** К какому месяцу будет собрана сумма, считая от следующего месяца */
const byMonth = (i: number) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1);
    return `к ${MONTHS_TO[d.getMonth()]} ${d.getFullYear()}`;
};

/** План цели подростка: доход и траты в месяц → сколько вкладывать и когда цель соберётся */
export function Kopilka({ game }: { game: GameState }) {
    const set = useUi((s) => s.set);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const K = game.kop;
    const [range, setRange] = useState<1 | 3>(1);

    const spend = K.food + K.fun + K.other;
    const free = K.income - spend;
    const invest = free > 0 ? Math.round(free * K.share) / 100 : 0;
    const series: number[] = [];
    let bal = K.saved,
        m = 0;
    while (bal < K.target && m < 120 && invest > 0) {
        bal = bal * (1 + RATE) + invest;
        m++;
        series.push(bal);
    }
    const reach = K.saved >= K.target || bal >= K.target;
    const when = K.saved >= K.target ? 'Цель уже собрана!' : reach ? `${m} ${monthsWord(m)}` : 'Не достигается';
    const tip =
        free <= 0
            ? 'Траты больше дохода — копить пока не из чего. Попробуй урезать развлечения или возьми ещё задание у мамы.'
            : !reach
              ? 'Так цель не достигается и за 10 лет. Попробуй тратить меньше или выбери цель поменьше.'
              : m > 12
                ? 'Больше года — долго. Урежь одну статью трат, и срок заметно сократится.'
                : `Хороший план! Переводи ${money(invest)} BYN в Копилку в первый день месяца — так деньги не потратятся случайно.`;

    const at = (amt: number) => {
        if (K.saved >= amt) return { ok: true, when: 'уже накоплено' };
        const i = series.findIndex((v) => v >= amt);
        if (i < 0) return { ok: false, when: 'пока не достигается' };
        return { ok: false, when: `${byMonth(i)} · ${i + 1} мес.` };
    };
    const nextP = [0.25, 0.5, 0.75, 1].find((p) => K.saved < K.target * p);
    const miles: [number, string, Icon][] = [
        [1, 'ЦЕЛЬ · 100%', FlagCheckeredIcon],
        [0.75, 'ЭТАП 3 · 75%', NumberThreeIcon],
        [0.5, 'ЭТАП 2 · 50%', NumberTwoIcon],
        [0.25, 'ЭТАП 1 · 25%', NumberOneIcon],
    ];
    const rows: [keyof KopPlan, string, string, string, Icon][] = [
        ['income', 'Доход', 'карманные и награды за задания', '#3ecf6e', ArrowDownLeftIcon],
        ['food', 'Еда и перекусы', 'столовая, снеки', '#ff6fb5', HamburgerIcon],
        ['fun', 'Развлечения', 'кино, игры, кафе', '#ffd23f', GameControllerIcon],
        ['other', 'Другое', 'проезд, подарки', '#7aa8ff', DotsThreeCircleIcon],
    ];

    // Кольцо накоплений: уже отложено + сколько добавится в следующем месяце, остаток до цели — пустая дорожка
    const soon = Math.min(Math.max(0, K.target - K.saved), invest);
    const saveSlices: Part[] = [
        {
            key: 'saved',
            name: 'Накоплено',
            sub: 'уже в Копилке',
            value: K.saved,
            color: '#3ecf6e',
            icon: PiggyBankIcon,
        },
        {
            key: 'soon',
            name: 'Через месяц',
            sub: 'по твоему плану',
            value: soon,
            color: '#a8f0bf',
            icon: CalendarPlusIcon,
        },
    ];
    const leftSlice: Part = {
        key: 'left',
        name: 'Осталось до цели',
        sub: K.name,
        value: Math.max(0, K.target - K.saved - soon),
        color: '#80859a',
        icon: FlagCheckeredIcon,
    };

    // Кольцо трат: доход делится на траты, вклад в Копилку и свободный остаток
    const spendSlices: Part[] = [
        ...rows
            .filter(([k]) => k !== 'income')
            .map(([k, name, sub, color, icon]) => ({
                key: k,
                name,
                sub,
                value: (K[k] as number) * range,
                color,
                icon,
            })),
        {
            key: 'invest',
            name: 'В Копилку',
            sub: `${K.share}% от остатка`,
            value: invest * range,
            color: '#3ecf6e',
            icon: PiggyBankIcon,
        },
        {
            key: 'free',
            name: 'Свободно',
            sub: 'остаётся на руках',
            value: Math.max(0, free - invest) * range,
            color: '#80859a',
            icon: WalletIcon,
        },
    ];
    const spendTotal = spendSlices.reduce((s, x) => s + x.value, 0);

    return (
        <div className="bank-page kopilka scroll">
            <div className="page-bar">
                <div className="page-bar-inner">
                    <button className="icon-btn" onClick={() => set({ page: null })} aria-label="Назад">
                        <CaretLeftIcon size={22} />
                    </button>
                    <div className="stack grow" style={{ minWidth: 0, lineHeight: 1.15 }}>
                        <span className="page-kicker">ЦЕЛЬ</span>
                        <span className="display ellipsis" style={{ fontSize: 18 }}>
                            {K.name}
                        </span>
                    </div>
                    <div className="stack right" style={{ lineHeight: 1.15 }}>
                        <b className="num" style={{ fontSize: 17 }}>
                            {money(K.target)}
                        </b>
                        <span className="tiny muted">
                            BYN · {Math.min(100, Math.round((K.saved / K.target) * 100))}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="stack" style={{ padding: '18px 16px 28px', gap: 22 }}>
                <div className="stack" style={{ gap: 12 }}>
                    <span className="h2">Накопления</span>
                    <Ring slices={saveSlices} total={K.target}>
                        <b>{money(K.saved)} BYN</b>
                        <span>из {money(K.target)} BYN</span>
                    </Ring>
                    <div className="spend-list">
                        {saveSlices.concat(leftSlice).map((s) => (
                            <div key={s.key} className="spend-row">
                                <span className="spend-ico" style={{ color: s.color }}>
                                    <s.icon size={22} weight="fill" />
                                </span>
                                <span className="spend-name">
                                    <b>{s.name}</b>
                                    <span>{s.sub}</span>
                                </span>
                                <span className="spend-sum">
                                    <b>{money(s.value)} BYN</b>
                                    <span>{pctOf(s.value, K.target)}%</span>
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="spend-list">
                        {[...miles].reverse().map(([p, kicker, Ico]) => {
                            const r = at(K.target * p);
                            const color = r.ok ? '#3ecf6e' : p === nextP ? '#7aa8ff' : '#80859a';
                            return (
                                <div key={p} className="spend-row">
                                    <span className="spend-ico" style={{ color }}>
                                        {r.ok ? <CheckIcon size={20} weight="bold" /> : <Ico size={20} weight="bold" />}
                                    </span>
                                    <span className="spend-name">
                                        <b>{kicker}</b>
                                        <span>{r.when}</span>
                                    </span>
                                    <span className="spend-sum">
                                        <b>{money(K.target * p)} BYN</b>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="goal-when">
                    <div className="goal-icon">
                        <CalendarCheckIcon size={28} weight="duotone" />
                    </div>
                    <div className="stack grow" style={{ gap: 2 }}>
                        <span className="tiny">Цель будет собрана через</span>
                        <span className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>
                            {when}
                        </span>
                        {reach && m > 0 && <span className="tiny">{byMonth(m - 1)} г.</span>}
                    </div>
                </div>
                <div className="stack" style={{ gap: 12 }}>
                    <span className="h2">Траты</span>
                    <div className="spend-tabs">
                        <button className={range === 1 ? 'on' : ''} onClick={() => setRange(1)}>
                            Месяц
                        </button>
                        <button className={range === 3 ? 'on' : ''} onClick={() => setRange(3)}>
                            3 месяца
                        </button>
                    </div>
                    <Ring slices={spendSlices}>
                        <b>{money(spend * range)} BYN</b>
                        <span>{range === 1 ? 'траты в месяц' : 'траты за 3 месяца'}</span>
                    </Ring>
                    <div className="row" style={{ justifyContent: 'space-between', fontSize: 15 }}>
                        <span>Доход {range === 1 ? 'в месяц' : 'за 3 месяца'}</span>
                        <b className="pos">+{money(K.income * range)} BYN</b>
                    </div>
                    <div className="spend-list">
                        {spendSlices.map((s) => (
                            <div key={s.key} className="spend-row">
                                <span className="spend-ico" style={{ color: s.color }}>
                                    <s.icon size={22} weight="fill" />
                                </span>
                                <span className="spend-name">
                                    <b>{s.name}</b>
                                    <span>{s.sub}</span>
                                </span>
                                <span className="spend-sum">
                                    <b>{money(s.value)} BYN</b>
                                    <span>{pctOf(s.value, spendTotal)}%</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="tip">
                    <LightbulbIcon size={24} weight="duotone" />
                    <span>{tip}</span>
                </div>
                <button
                    className={`btn block tall ${K.planned ? 'ok' : ''}`}
                    onClick={() => {
                        if (K.planned) return;
                        action.mutate({ type: 'kop/set', patch: { planned: true } });
                        flash(`План сохранён: ${money(invest)} BYN в Копилку каждый месяц`, 'bankToast');
                    }}
                >
                    {K.planned ? 'План сохранён' : 'Сохранить план'}
                </button>
            </div>
        </div>
    );
}
