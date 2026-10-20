import { useState } from 'react';
import { GRADES, TASK_PRESETS, weekQuests, type GameState, type PlayerDto, type TaskIcon } from '@mt/shared';
import { PencilSimpleLineIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn, nameCases } from '../format';
import { TASK_ICONS } from '../icons';

const QUICK = [100, 200, 500, 1_000];
const CUSTOM = { label: 'Своё задание', hint: 'напишите сами', byn: 200 };
const STATUS = {
    open: { text: 'Ждём', color: 'var(--n-700)' },
    review: { text: 'На проверке', color: 'var(--accent-700)' },
    paid: { text: 'Оплачено', color: 'var(--n-600)' },
};

function ago(ms?: number) {
    if (!ms) return '';
    const min = Math.round((Date.now() - ms) / 60_000);
    if (min < 1) return 'только что';
    if (min < 60) return `${min} мин назад`;
    return `${Math.round(min / 60)} ч назад`;
}

/** Кабинет родителя (в пилоте — экран внутри Moby): проверка, задания, награды за оценки */
export function ParentHome({ me, game }: { me: PlayerDto; game: GameState }) {
    const action = useGameAction();
    const flash = useUi((s) => s.flashParent);
    const [preset, setPreset] = useState(0);
    const [custom, setCustom] = useState('');
    const [amount, setAmount] = useState(TASK_PRESETS[0].byn);

    const review = game.tasks.filter((t) => t.status === 'review');
    const others = game.tasks.filter((t) => t.status !== 'review');
    const isCustom = preset === TASK_PRESETS.length;
    const canSend = !isCustom || custom.trim().length > 1;
    const questsDone = weekQuests(game).filter((q) => q.done).length;
    const { gen, dat } = nameCases(me.name);

    const send = () => {
        if (!canSend) return;
        const p = TASK_PRESETS[preset];
        const title = isCustom ? custom.trim() : p.title;
        const icon: TaskIcon = isCustom ? 'star' : p.icon;
        action.mutate({ type: 'task/create', title, byn: amount, icon });
        setCustom('');
        flash(`«${title}» отправлено ${dat}`);
    };

    return (
        <>
            <div className="parent-top" />
            <div className="scroll">
                <div className="parent">
                    <div className="parent-hero">
                        <div className="row" style={{ justifyContent: 'flex-start', gap: 12 }}>
                            <div className="hero-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>
                                {me.name[0]}
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                                <span style={{ fontSize: 22, fontWeight: 800 }}>
                                    {me.name}, {me.age} лет
                                </span>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>
                                    МТ Сити · уровень {game.level} · квесты {questsDone} из 5
                                </span>
                            </div>
                        </div>
                        <div className="row num" style={{ gap: 8 }}>
                            <div className="money-tile">
                                <span>Ваша карта •• 4821</span>
                                <b>{byn(game.parentCard)} BYN</b>
                            </div>
                            <div className="money-tile">
                                <span>Детская карта {gen}</span>
                                <b>{byn(game.byn)} BYN</b>
                            </div>
                        </div>
                    </div>

                    <section className="stack" style={{ gap: 10 }}>
                        <h2 className="h2">Ждёт проверки</h2>
                        {review.length === 0 && <span className="small">Нечего проверять.</span>}
                        {review.map((t) => {
                            const Icon = TASK_ICONS[t.icon];
                            return (
                                <div key={t.id} className="review-card">
                                    <div className="row" style={{ gap: 12 }}>
                                        <Icon size={28} weight="duotone" color="var(--accent-700)" />
                                        <div
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                lineHeight: 1.25,
                                            }}
                                        >
                                            <b style={{ fontSize: 17, fontWeight: 600 }}>{t.title}</b>
                                            <span style={{ fontSize: 13, color: 'var(--accent-800)' }}>
                                                {me.name} нажала «Готово» {ago(t.submittedAt)}
                                            </span>
                                        </div>
                                        <b className="num" style={{ fontSize: 17 }}>
                                            {byn(t.byn)}
                                        </b>
                                    </div>
                                    <div className="row">
                                        <button
                                            className="btn ghost small"
                                            style={{ flex: 1, borderColor: 'var(--accent-300)' }}
                                            onClick={() => {
                                                action.mutate({ type: 'task/return', id: t.id });
                                                flash(`Задание вернулось ${dat}`);
                                            }}
                                        >
                                            Вернуть
                                        </button>
                                        <button
                                            className="btn small"
                                            style={{ flex: 2 }}
                                            onClick={() => {
                                                action.mutate({ type: 'task/approve', id: t.id });
                                                flash(`Переведено ${byn(t.byn)} BYN ${dat}`);
                                            }}
                                        >
                                            Принять · {byn(t.byn)} BYN
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    <section className="stack" style={{ gap: 2 }}>
                        <h2 className="h2" style={{ marginBottom: 6 }}>
                            Задания {gen}
                        </h2>
                        {[...others].reverse().map((t) => {
                            const Icon = TASK_ICONS[t.icon];
                            const st = STATUS[t.status];
                            return (
                                <div key={t.id} className="row" style={{ gap: 12, padding: '9px 0' }}>
                                    <Icon size={22} weight="duotone" color="var(--n-700)" />
                                    <span style={{ flex: 1, fontSize: 15 }}>{t.title}</span>
                                    <span className="num small" style={{ fontSize: 14 }}>
                                        {byn(t.byn)}
                                    </span>
                                    <span style={{ minWidth: 78, textAlign: 'right', fontSize: 13, color: st.color }}>
                                        {t.returned && t.status === 'open' ? 'Доделывает' : st.text}
                                    </span>
                                </div>
                            );
                        })}
                    </section>

                    <section className="stack">
                        <h2 className="h2">Новое задание</h2>
                        <div className="preset-grid">
                            {[...TASK_PRESETS, CUSTOM].map((p, i) => {
                                const Icon =
                                    i < TASK_PRESETS.length ? TASK_ICONS[TASK_PRESETS[i].icon] : PencilSimpleLineIcon;
                                return (
                                    <button
                                        key={p.label}
                                        className="preset"
                                        aria-pressed={preset === i}
                                        onClick={() => {
                                            setPreset(i);
                                            setAmount(p.byn);
                                        }}
                                    >
                                        <Icon size={26} weight="duotone" />
                                        <b>{p.label}</b>
                                        <small>{p.hint}</small>
                                    </button>
                                );
                            })}
                        </div>
                        {isCustom && (
                            <input
                                className="text-input"
                                value={custom}
                                onChange={(e) => setCustom(e.target.value)}
                                placeholder="Например: погулять с собакой"
                                maxLength={80}
                            />
                        )}
                        <div className="stack" style={{ gap: 8 }}>
                            <span style={{ fontSize: 15 }}>Награда</span>
                            <div className="row" style={{ gap: 6 }}>
                                {QUICK.map((v) => (
                                    <button
                                        key={v}
                                        className="chip num"
                                        style={{ flex: 1 }}
                                        aria-pressed={amount === v}
                                        onClick={() => setAmount(v)}
                                    >
                                        {v / 100}
                                    </button>
                                ))}
                            </div>
                            <div className="row">
                                <span className="small">
                                    В игре {me.name} получит ещё {amount / 10} MTcoin
                                </span>
                                <div className="row" style={{ gap: 6 }}>
                                    <button className="stepper" onClick={() => setAmount((a) => Math.max(50, a - 50))}>
                                        −
                                    </button>
                                    <b className="num" style={{ minWidth: 48, textAlign: 'center' }}>
                                        {byn(amount)}
                                    </b>
                                    <button
                                        className="stepper"
                                        onClick={() => setAmount((a) => Math.min(5_000, a + 50))}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button className="btn" disabled={!canSend} onClick={send}>
                            Отправить {dat} · {byn(amount)} BYN
                        </button>
                        <span className="small">Деньги спишутся, только когда вы примете задание.</span>
                    </section>

                    <section className="stack" style={{ gap: 10 }}>
                        <div className="row">
                            <div className="stack" style={{ gap: 0 }}>
                                <h2 className="h2">За оценки</h2>
                                <span className="small">Из электронного дневника</span>
                            </div>
                            <button
                                className="toggle"
                                role="switch"
                                aria-checked={game.gradesOn}
                                aria-label="Награды за оценки"
                                onClick={() => action.mutate({ type: 'grades/toggle' })}
                            />
                        </div>
                        {game.gradesOn && (
                            <>
                                <div className="row" style={{ gap: 8 }}>
                                    {GRADES.map((g) => (
                                        <div key={g} className="grade-tile">
                                            <span style={{ fontSize: 22, fontWeight: 700 }}>{g}</span>
                                            <span className="small num">
                                                {game.rules[g] ? `${byn(game.rules[g])} BYN` : 'нет'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className="link-button"
                                    style={{ alignSelf: 'flex-start' }}
                                    onClick={() => {
                                        action.mutate({ type: 'grades/pull' });
                                        flash('Дневник обновлён');
                                    }}
                                >
                                    Обновить дневник (демо)
                                </button>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
