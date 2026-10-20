import { useState } from 'react';
import { DREAM, QUIZ, REWARDS, type GameState } from '@mt/shared';
import { GiftIcon, HeadphonesIcon, XIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { Riso } from '../components/Riso';

export function ChildOverlays({ game }: { game: GameState }) {
    const overlay = useUi((s) => s.overlay);
    if (overlay === 'dream') return <DreamQuest />;
    if (overlay === 'quiz') return <Quiz />;
    if (overlay === 'levelup') return <LevelUp level={game.level} />;
    return null;
}

// ---------- Накопи на мечту ----------

type CatKey = (typeof DREAM.categories)[number]['key'];
type Picks = { food: number | null; clothes: number; fun: number };
type Phase = 'play' | 'win' | 'lose';

const CAT_NAMES: Record<CatKey | 'gift', string> = {
    food: 'Еда',
    clothes: 'Одежда',
    fun: 'Развлечения',
    gift: 'Подарок',
};

const emptyPicks = (): Picks => ({ food: null, clothes: 0, fun: 0 });

function DreamQuest() {
    const close = useUi((s) => s.closeOverlay);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const [month, setMonth] = useState(1);
    const [saved, setSaved] = useState(0);
    const [picks, setPicks] = useState<Picks>(emptyPicks);
    const [spentBy, setSpentBy] = useState({ food: 0, clothes: 0, fun: 0, gift: 0 });
    const [phase, setPhase] = useState<Phase>('play');
    const [monthsUsed, setMonthsUsed] = useState(0);

    const gift = month === DREAM.giftMonth ? DREAM.gift : 0;
    const spend = (picks.food ?? 0) + picks.clothes + picks.fun + gift;
    const left = DREAM.allowance - spend;
    const can = picks.food !== null && spend <= saved + DREAM.allowance;
    const top = (Object.keys(spentBy) as (keyof typeof spentBy)[]).sort((a, b) => spentBy[b] - spentBy[a])[0];

    const restart = () => {
        setMonth(1);
        setSaved(0);
        setPicks(emptyPicks());
        setSpentBy({ food: 0, clothes: 0, fun: 0, gift: 0 });
        setPhase('play');
    };

    const next = () => {
        if (phase === 'win') {
            action.mutate({ type: 'dream/complete' });
            close();
            flash('Квест недели выполнен: «Накопи на мечту»');
            return;
        }
        if (phase === 'lose') return restart();
        if (!can) return;
        const total = saved + left;
        setSaved(total);
        setSpentBy((s) => ({
            food: s.food + (picks.food ?? 0),
            clothes: s.clothes + picks.clothes,
            fun: s.fun + picks.fun,
            gift: s.gift + gift,
        }));
        if (total >= DREAM.goal) {
            setMonthsUsed(month);
            return setPhase('win');
        }
        if (month === DREAM.months) return setPhase('lose');
        setMonth(month + 1);
        setPicks(emptyPicks());
    };

    const monthsWord = monthsUsed === 1 ? '1 месяц' : monthsUsed < 5 ? `${monthsUsed} месяца` : `${monthsUsed} месяцев`;
    const btn =
        phase === 'win'
            ? 'Забрать награду'
            : phase === 'lose'
              ? 'Начать заново'
              : picks.food === null
                ? 'Выбери, что будешь есть'
                : !can
                  ? 'Не хватает денег'
                  : month === DREAM.months || saved + left >= DREAM.goal
                    ? 'Закончить месяц'
                    : 'Отложить и дальше';

    return (
        <div className="overlay">
            <div className="overlay-top">
                <button className="icon-btn" onClick={close} aria-label="Выйти">
                    <XIcon />
                </button>
                <div className="segments" style={{ flex: 1 }}>
                    {Array.from({ length: DREAM.months }, (_, i) => i + 1).map((m) => (
                        <div
                            key={m}
                            style={{
                                height: 8,
                                background:
                                    m < month || (phase !== 'play' && m <= month)
                                        ? 'var(--accent-2)'
                                        : m === month
                                          ? 'rgba(224, 33, 138, 0.45)'
                                          : 'var(--surface)',
                            }}
                        />
                    ))}
                </div>
                <b className="num" style={{ fontSize: 14 }}>
                    Месяц {month}/{DREAM.months}
                </b>
            </div>

            <div className="overlay-body">
                <div className="row" style={{ justifyContent: 'flex-start', gap: 14 }}>
                    <div
                        className="tile"
                        style={{
                            width: 84,
                            height: 84,
                            flex: 'none',
                            borderRadius: 'var(--radius-lg)',
                            background:
                                'repeating-linear-gradient(135deg, var(--surface) 0 6px, var(--surface-2) 6px 12px)',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'var(--accent-2)',
                        }}
                    >
                        <HeadphonesIcon size={40} weight="duotone" />
                    </div>
                    <div className="stack" style={{ flex: 1, gap: 6 }}>
                        <span className="small">Мечта: наушники за {DREAM.goal} руб.</span>
                        <span
                            className="num"
                            style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}
                        >
                            {saved}{' '}
                            <span style={{ fontSize: 15, fontWeight: 400 }} className="muted">
                                руб. отложено
                            </span>
                        </span>
                        <div className="progress" style={{ flex: 'none' }}>
                            <div
                                style={{
                                    width: `${Math.min(100, (saved / DREAM.goal) * 100)}%`,
                                    background: 'var(--accent-2)',
                                }}
                            />
                        </div>
                    </div>
                </div>

                {phase === 'play' && (
                    <>
                        <div className="row" style={{ fontSize: 15 }}>
                            <span>Родители дали на месяц</span>
                            <b className="num" style={{ color: 'var(--accent-700)' }}>
                                +{DREAM.allowance} руб.
                            </b>
                        </div>
                        {gift > 0 && (
                            <div className="event">
                                <GiftIcon size={26} weight="duotone" />
                                <div className="stack" style={{ gap: 2, flex: 1 }}>
                                    <b style={{ fontSize: 15, color: 'var(--text)' }}>У друга день рождения</b>
                                    <span style={{ fontSize: 13 }}>
                                        Подарок обязателен: −{DREAM.gift} руб. Такое бывает, поэтому полезно иметь
                                        запас.
                                    </span>
                                </div>
                            </div>
                        )}
                        {DREAM.categories.map((c) => (
                            <div key={c.key} className="stack" style={{ gap: 8 }}>
                                <div className="row" style={{ alignItems: 'baseline' }}>
                                    <b style={{ fontSize: 17 }}>{c.name}</b>
                                    <span className="small" style={{ fontSize: 12 }}>
                                        {c.hint}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                        gap: 8,
                                    }}
                                >
                                    {c.opts.map(([label, price]) => (
                                        <button
                                            key={label}
                                            className="pick"
                                            aria-pressed={picks[c.key] === price}
                                            onClick={() => setPicks((p) => ({ ...p, [c.key]: price }))}
                                        >
                                            <span style={{ fontSize: 14, lineHeight: 1.2 }}>{label}</span>
                                            <b className="num" style={{ fontSize: 16 }}>
                                                {price ? `${price} руб.` : '0'}
                                            </b>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {phase === 'win' && (
                    <div className="stack" style={{ gap: 10, paddingTop: 12 }}>
                        <span className="kicker accent">Квест пройден</span>
                        <span className="h1" style={{ fontSize: 34 }}>
                            Наушники твои
                        </span>
                        <p className="body" style={{ fontSize: 16 }}>
                            Ты накопил за {monthsWord}. После покупки осталось {saved - DREAM.goal} руб. Больше всего
                            ушло на «{CAT_NAMES[top]}».
                        </p>
                        <b style={{ fontSize: 15 }}>
                            +{REWARDS.dream.knowledge} знаний · +{REWARDS.dream.coins / 100} MTcoin
                        </b>
                    </div>
                )}

                {phase === 'lose' && (
                    <div className="stack" style={{ gap: 10, paddingTop: 12 }}>
                        <span className="kicker accent-2">Не получилось</span>
                        <span className="h1" style={{ fontSize: 34 }}>
                            Не хватило {DREAM.goal - saved} руб.
                        </span>
                        <p className="body" style={{ fontSize: 16 }}>
                            Больше всего ушло на «{CAT_NAMES[top]}». Чтобы успеть за 5 месяцев, тратить можно примерно
                            100 руб. в месяц.
                        </p>
                    </div>
                )}
            </div>

            <div className="overlay-foot">
                {phase === 'play' && (
                    <div className="row num" style={{ fontSize: 15 }}>
                        <span>
                            Траты: <b>{spend} руб.</b>
                        </span>
                        <span>
                            Отложу:{' '}
                            <b style={{ color: left < 0 ? 'var(--accent-2-700)' : 'var(--accent-700)' }}>{left} руб.</b>
                        </span>
                    </div>
                )}
                <button className="btn" disabled={phase === 'play' && !can} onClick={next}>
                    {btn}
                </button>
            </div>
        </div>
    );
}

// ---------- Копилка и проценты ----------

function Quiz() {
    const close = useUi((s) => s.closeOverlay);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const [i, setI] = useState(0);
    const [pick, setPick] = useState<number | null>(null);
    const [done, setDone] = useState(false);

    const item = QUIZ[i];
    const answered = pick !== null;
    const ok = answered && pick === item.ok;
    const pct = done ? 100 : ((i + (ok ? 1 : 0)) / QUIZ.length) * 100;

    const next = () => {
        if (done) {
            action.mutate({ type: 'quiz/complete' });
            close();
            flash('Квест недели выполнен: урок «Копилка и проценты»');
            return;
        }
        if (!answered) return;
        if (!ok) return setPick(null);
        if (i === QUIZ.length - 1) return setDone(true);
        setI(i + 1);
        setPick(null);
    };

    return (
        <div className="overlay">
            <div className="overlay-top">
                <button className="icon-btn" onClick={close} aria-label="Выйти">
                    <XIcon />
                </button>
                <div className="progress">
                    <div style={{ width: `${pct}%` }} />
                </div>
            </div>
            <div className="overlay-body">
                {!done ? (
                    <>
                        <div className="stack" style={{ gap: 8 }}>
                            <span className="kicker accent">
                                Копилка и проценты · вопрос {i + 1} из {QUIZ.length}
                            </span>
                            <span className="h1" style={{ fontSize: 26, lineHeight: 1.15 }}>
                                {item.text}
                            </span>
                        </div>
                        <div className="stack" style={{ gap: 10 }}>
                            {item.opts.map((label, idx) => (
                                <button
                                    key={label}
                                    className={`option ${pick === idx ? (idx === item.ok ? 'ok' : 'bad') : ''}`}
                                    onClick={() => setPick(idx)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        {answered && (
                            <div className="guide">
                                <div className="guide-face">К</div>
                                <p className="body" style={{ color: ok ? 'var(--accent-800)' : 'var(--accent-2-700)' }}>
                                    {ok ? `Верно! ${item.hint}` : `Не совсем. ${item.hint} Попробуй ещё раз.`}
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="stack" style={{ gap: 10, paddingTop: 12 }}>
                        <span className="kicker accent">Урок пройден</span>
                        <span className="h1" style={{ fontSize: 34 }}>
                            Проценты растут на проценты
                        </span>
                        <p className="body" style={{ fontSize: 16 }}>
                            Это называется сложный процент. В банке Копилка работает так же, только медленнее.
                        </p>
                        <b style={{ fontSize: 15 }}>+{REWARDS.quiz.knowledge} знаний</b>
                    </div>
                )}
            </div>
            <div className="overlay-foot" style={{ borderTop: 0 }}>
                <button className="btn" disabled={!done && !answered} onClick={next}>
                    {done ? 'Готово' : !answered ? 'Выбери ответ' : ok ? 'Дальше' : 'Ещё раз'}
                </button>
            </div>
        </div>
    );
}

// ---------- Новый уровень ----------

function LevelUp({ level }: { level: number }) {
    const close = useUi((s) => s.closeOverlay);
    return (
        <div className="levelup">
            <span className="kicker">Неделя закрыта</span>
            <Riso>{level}</Riso>
            <span className="h1" style={{ fontSize: 36 }}>
                Новый уровень
            </span>
            <p className="body" style={{ fontSize: 16 }}>
                В сундуке было 100 MTcoin. Теперь в городе открыт Рынок, а на пути — раздел «Покупка с умом».
            </p>
            <button className="btn" style={{ marginTop: 10 }} onClick={close}>
                Дальше
            </button>
        </div>
    );
}
