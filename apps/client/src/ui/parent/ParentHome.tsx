import { useState } from 'react';
import { GRADES, GRADE_STEP, TASK_PRESETS, type GameState, type PlayerDto, type TaskIcon } from '@mt/shared';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn } from '../format';

/** Кабинет родителя (в жизни — в Moby у родителя): проверка заданий, новые задания, награды за оценки */
export function ParentHome({ me, game }: { me: PlayerDto; game: GameState }) {
    const action = useGameAction();
    const flash = useUi((s) => s.flash);
    const [preset, setPreset] = useState(0);
    const [custom, setCustom] = useState('');
    const [reward, setReward] = useState(200);

    const review = game.tasks.filter((t) => t.status === 'review');
    const isCustom = preset === TASK_PRESETS.length;
    const canSend = !isCustom || custom.trim().length > 1;
    const done = game.tasks.filter((t) => t.status === 'paid').length;

    const send = () => {
        if (!canSend) return;
        const p = TASK_PRESETS[preset];
        const title = isCustom ? custom.trim() : p.title;
        const icon: TaskIcon = isCustom ? 'star' : p.icon;
        action.mutate({ type: 'task/create', title, byn: reward, icon });
        setCustom('');
        flash(`Задание «${title}» отправлено ${me.name}`);
    };

    return (
        <div className="scroll">
            <div className="parent">
                <div className="masthead">
                    <div className="rule-thick" />
                    <div className="rule-thin" />
                    <div className="row kicker" style={{ color: 'var(--text)' }}>
                        <span>Кабинет родителя</span>
                        <span>
                            {me.name} · ур. {game.level}
                        </span>
                    </div>
                    <div style={{ height: 1, background: 'var(--text)' }} />
                    <div className="row num" style={{ justifyContent: 'flex-start', gap: 18, paddingTop: 14 }}>
                        <Stat value={byn(game.parentCard)} label="BYN, ваша карта •• 4821" />
                        <Stat value={byn(game.byn)} label={`BYN у ${me.name}`} accent />
                        <Stat value={`${done}`} label="заданий выполнено" />
                    </div>
                </div>

                <section className="stack" style={{ gap: 10 }}>
                    <h2 className="h2" style={{ fontSize: 22 }}>
                        На проверке
                    </h2>
                    {review.length === 0 && (
                        <p className="small" style={{ margin: 0 }}>
                            Пока нечего проверять. Когда {me.name} нажмёт «Готово», задание появится здесь.
                        </p>
                    )}
                    {review.map((t) => (
                        <div key={t.id} className="review-card">
                            <div className="row" style={{ alignItems: 'flex-start' }}>
                                <div className="stack" style={{ gap: 2 }}>
                                    <b style={{ fontSize: 17 }}>{t.title}</b>
                                    <span style={{ fontSize: 13, color: 'var(--accent-800)' }}>
                                        {me.name} отметила «Готово». Проверьте сами.
                                    </span>
                                </div>
                                <b className="num" style={{ whiteSpace: 'nowrap' }}>
                                    {byn(t.byn)} BYN
                                </b>
                            </div>
                            <div className="row">
                                <button
                                    className="btn ghost small"
                                    style={{ flex: 1, borderColor: 'var(--accent-300)' }}
                                    onClick={() => {
                                        action.mutate({ type: 'task/return', id: t.id });
                                        flash(`Задание вернулось ${me.name}`);
                                    }}
                                >
                                    Вернуть
                                </button>
                                <button
                                    className="btn small"
                                    style={{ flex: 2 }}
                                    onClick={() => {
                                        action.mutate({ type: 'task/approve', id: t.id });
                                        flash(`Переведено ${byn(t.byn)} BYN на карту ${me.name}`);
                                    }}
                                >
                                    Принять и перевести
                                </button>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="stack">
                    <h2 className="h2" style={{ fontSize: 22 }}>
                        Новое задание
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {[...TASK_PRESETS.map((p) => p.label), 'Своё…'].map((label, i) => (
                            <button
                                key={label}
                                className="chip"
                                aria-pressed={preset === i}
                                onClick={() => setPreset(i)}
                            >
                                {label}
                            </button>
                        ))}
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
                    <div className="row">
                        <div className="stack" style={{ gap: 0 }}>
                            <span style={{ fontSize: 15 }}>Награда</span>
                            <span className="small" style={{ fontSize: 12 }}>
                                + {reward / 10} MTcoin в игре
                            </span>
                        </div>
                        <div className="row" style={{ gap: 8 }}>
                            <button className="stepper" onClick={() => setReward((r) => Math.max(50, r - 50))}>
                                −
                            </button>
                            <b className="num" style={{ minWidth: 92, textAlign: 'center', fontSize: 20 }}>
                                {byn(reward)} BYN
                            </b>
                            <button className="stepper" onClick={() => setReward((r) => Math.min(2000, r + 50))}>
                                +
                            </button>
                        </div>
                    </div>
                    <button className="btn" disabled={!canSend} onClick={send}>
                        Отправить {me.name}
                    </button>
                    <span className="small">
                        Деньги спишутся с вашей карты только после того, как вы примете задание.
                    </span>
                </section>

                <section className="stack">
                    <div className="row" style={{ alignItems: 'center' }}>
                        <div className="stack" style={{ gap: 0 }}>
                            <h2 className="h2" style={{ fontSize: 22 }}>
                                Награды за оценки
                            </h2>
                            <span className="small">Отметки приходят из электронного дневника</span>
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
                            {GRADES.map((g) => (
                                <div key={g} className="row" style={{ gap: 10 }}>
                                    <span style={{ flex: 1, fontSize: 15 }}>
                                        Отметка <b className="num">{g}</b>
                                    </span>
                                    <button
                                        className="stepper"
                                        onClick={() =>
                                            action.mutate({ type: 'grades/rule', grade: g, delta: -GRADE_STEP })
                                        }
                                    >
                                        −
                                    </button>
                                    <b className="num" style={{ minWidth: 84, textAlign: 'center' }}>
                                        {game.rules[g] ? `${byn(game.rules[g])} BYN` : 'нет'}
                                    </b>
                                    <button
                                        className="stepper"
                                        onClick={() =>
                                            action.mutate({ type: 'grades/rule', grade: g, delta: GRADE_STEP })
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            ))}
                            <button
                                className="btn ghost small"
                                style={{
                                    alignSelf: 'flex-start',
                                    borderColor: 'var(--accent)',
                                    color: 'var(--accent-700)',
                                }}
                                onClick={() => {
                                    action.mutate({ type: 'grades/pull' });
                                    flash('Дневник обновлён');
                                }}
                            >
                                Обновить дневник
                            </button>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
    return (
        <div className="stack" style={{ gap: 0 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: accent ? 'var(--accent-700)' : undefined }}>
                {value}
            </span>
            <span className="small" style={{ fontSize: 12 }}>
                {label}
            </span>
        </div>
    );
}
