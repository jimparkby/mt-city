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
    MapPinIcon,
    NumberOneIcon,
    NumberThreeIcon,
    NumberTwoIcon,
    type Icon,
} from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';

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
    const patch = (p: Partial<KopPlan>) => action.mutate({ type: 'kop/set', patch: { ...p, planned: false } });
    // Поля ввода держат своё значение: ответ демо-API приходит асинхронно, и иначе курсор прыгал бы
    const [name, setName] = useState(K.name);
    const [target, setTarget] = useState(String(K.target));
    const setGoal = (v: number) => {
        setTarget(String(v));
        patch({ target: v });
    };

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
              ? 'Так цель не достигается и за 10 лет. Подними долю вклада или выбери цель поменьше.'
              : m > 12
                ? 'Больше года — долго. Подними долю вклада или урежь одну статью трат, и срок заметно сократится.'
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
    const interest = Math.max(0, bal - K.saved - invest * m);

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

            <div className="road">
                <div className="road-finish">
                    <div className="flag" />
                    <span>ФИНИШ</span>
                </div>
                {miles.map(([p, kicker, Ico]) => {
                    const r = at(K.target * p);
                    const next = p === nextP;
                    const state = r.ok ? 'ok' : next ? 'next' : '';
                    return (
                        <div key={p} className={`mile ${state}`}>
                            <div className="lane">
                                <div className="lane-dash" />
                                <div className="mile-dot">
                                    {r.ok ? <CheckIcon weight="bold" /> : <Ico weight="bold" />}
                                </div>
                            </div>
                            <div className="mile-link" />
                            <div className="mile-card">
                                <span className="mile-kicker">{kicker}</span>
                                <b className="num">{money(K.target * p)} BYN</b>
                                <span className="mile-when">{r.when}</span>
                            </div>
                        </div>
                    );
                })}
                <div className="mile here">
                    <div className="lane start">
                        <div className="lane-dash" />
                        <div className="mile-dot">
                            <MapPinIcon weight="fill" />
                        </div>
                    </div>
                    <div className="mile-link" />
                    <div className="mile-card">
                        <span className="mile-kicker">ТЫ ЗДЕСЬ</span>
                        <b className="num">{money(K.saved)} BYN</b>
                        <span className="mile-when">+{money(invest)} BYN каждый месяц</span>
                    </div>
                </div>
            </div>

            <div className="stack" style={{ padding: '22px 16px 28px', gap: 22 }}>
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
                <div className="grid-2">
                    <div className="stat-tile">
                        <span>Трачу в месяц</span>
                        <b>{money(spend)}</b>
                    </div>
                    <div className="stat-tile">
                        <span>Остаётся</span>
                        <b className={free > 0 ? 'pos' : 'neg'}>{money(free)}</b>
                    </div>
                    <div className="stat-tile ring">
                        <span>Вкладываю</span>
                        <b style={{ color: 'var(--accent-700)' }}>{money(invest)}</b>
                    </div>
                    <div className="stat-tile">
                        <span>Свободно</span>
                        <b>{money(Math.max(0, free - invest))}</b>
                    </div>
                </div>
                <div className="tip">
                    <LightbulbIcon size={24} weight="duotone" />
                    <span>{tip}</span>
                </div>
                <div className="stack" style={{ gap: 10 }}>
                    <span className="h2">Настроить цель</span>
                    <input
                        className="text-input"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            patch({ name: e.target.value });
                        }}
                        placeholder="На что копишь?"
                        maxLength={40}
                    />
                    <label className="text-input row" style={{ gap: 8 }}>
                        <span className="small" style={{ fontSize: 14 }}>
                            Сумма
                        </span>
                        <input
                            type="number"
                            min={1}
                            value={target}
                            onChange={(e) => {
                                setTarget(e.target.value);
                                const v = parseFloat(e.target.value.replace(',', '.')) || 0;
                                patch({ target: Math.max(1, Math.min(100_000, v)) });
                            }}
                            className="bare-input num"
                        />
                        <b>BYN</b>
                    </label>
                    <div className="row" style={{ gap: 6 }}>
                        {[50, 150, 300, 500].map((v) => (
                            <button
                                key={v}
                                className={`seg-btn ${K.target === v ? 'on' : ''}`}
                                onClick={() => setGoal(v)}
                            >
                                {v} BYN
                            </button>
                        ))}
                    </div>
                </div>
                <div className="stack" style={{ gap: 8 }}>
                    <span className="h2">Деньги в месяц</span>
                    {rows.map(([k, label, sub, c, Ico]) => (
                        <div key={k} className="card row" style={{ gap: 12, padding: '10px 12px' }}>
                            <Ico size={26} weight="duotone" color={c} />
                            <div className="stack grow" style={{ minWidth: 0, lineHeight: 1.25 }}>
                                <b>{label}</b>
                                <span className="tiny muted">{sub}</span>
                            </div>
                            <button
                                className="step-btn small"
                                onClick={() => patch({ [k]: Math.max(0, (K[k] as number) - 1) })}
                            >
                                −
                            </button>
                            <b className="num" style={{ minWidth: 52, textAlign: 'center' }}>
                                {money(K[k] as number)}
                            </b>
                            <button className="step-btn small" onClick={() => patch({ [k]: (K[k] as number) + 1 })}>
                                +
                            </button>
                        </div>
                    ))}
                    <div className="row" style={{ gap: 10, paddingTop: 4 }}>
                        <span className="grow" style={{ fontSize: 14, color: 'var(--n-800)' }}>
                            Сколько от остатка вкладывать
                        </span>
                        <div className="row" style={{ gap: 4 }}>
                            {[50, 70, 100].map((v) => (
                                <button
                                    key={v}
                                    className={`seg-btn share ${K.share === v ? 'on' : ''}`}
                                    onClick={() => patch({ share: v })}
                                >
                                    {v}%
                                </button>
                            ))}
                        </div>
                    </div>
                    <span className="tiny muted">
                        Проценты Копилки добавят {money(interest)} BYN · ставка 8% годовых (демо)
                    </span>
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
