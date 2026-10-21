import { useState } from 'react';
import { TASK_PRESETS, weekQuests, type GameState, type TaskIcon } from '@mt/shared';
import { PencilSimpleLineIcon, type Icon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn } from '../format';
import { TASK_ICONS } from '../icons';
import { familyChild } from '../roles';
import { ControlTab } from './Control';
import { Decisions, OpsTab } from './Ops';
import { PackageWizard } from './Package';

/** Кабинет родителя в Moby: оформление пакета, затем задания, родительский контроль и операции ребёнка */
export function ParentHome({ game }: { game: GameState }) {
    const toast = useUi((s) => s.parentToast);
    return (
        <div className="parent">
            <div className="parent-top">
                <span className="display">Moby Семья</span>
                <span>Кабинет родителя</span>
            </div>
            {game.pkg ? <FamilyCabinet game={game} /> : <PackageWizard />}
            {toast && <div className="toast top">{toast}</div>}
        </div>
    );
}

const AMOUNTS = [100, 200, 500, 1_000];

function FamilyCabinet({ game }: { game: GameState }) {
    const action = useGameAction();
    const flash = useUi((s) => s.flash);
    const child = familyChild(game);
    const teen = game.pkg?.age === 'teen';
    const tab = useUi((s) => s.parentTab);
    const setUi = useUi((s) => s.set);
    const [preset, setPreset] = useState(0);
    const [custom, setCustom] = useState('');
    const [amount, setAmount] = useState(TASK_PRESETS[0].byn);

    const review = game.tasks.filter((t) => t.status === 'review');
    const active = game.tasks.filter((t) => t.status !== 'review');
    const weekDone = weekQuests(game).filter((q) => q.done).length;
    const isCustom = preset === TASK_PRESETS.length;
    const canSend = !isCustom || custom.trim().length > 1;

    const presets: { label: string; hint: string; Icon: Icon; icon: TaskIcon }[] = [
        ...TASK_PRESETS.map((p) => ({ label: p.label, hint: p.hint, Icon: TASK_ICONS[p.icon], icon: p.icon })),
        { label: 'Своё задание', hint: 'напишите сами', Icon: PencilSimpleLineIcon, icon: 'star' },
    ];

    const send = () => {
        if (!canSend) return;
        const title = isCustom ? custom.trim() : TASK_PRESETS[preset].title;
        action.mutate({ type: 'task/create', title, byn: amount, icon: presets[preset].icon });
        setCustom('');
        flash(`«${title}» отправлено ${child.dat}`, 'parentToast');
    };

    return (
        <div className="parent-scroll scroll" style={{ gap: 26 }}>
            <div className="parent-hero">
                <div className="row" style={{ gap: 12 }}>
                    <div className="hero-avatar">{child.name[0]}</div>
                    <div className="stack grow" style={{ lineHeight: 1.2 }}>
                        <b style={{ fontSize: 20 }}>
                            {child.name}, {child.age} лет
                        </b>
                        <span className="hero-text" style={{ fontSize: 13 }}>
                            Moby · уровень {game.level} · квесты {weekDone} из 5
                        </span>
                    </div>
                </div>
                <div className="row num" style={{ gap: 8 }}>
                    <div className="money-tile">
                        <span>Ваша карта •• 4821</span>
                        <b>{byn(game.parentCard)} BYN</b>
                    </div>
                    <div className="money-tile">
                        <span>Детская карта</span>
                        <b>{byn(game.byn)} BYN</b>
                    </div>
                </div>
            </div>

            <Decisions game={game} />
            <div className="segmented wide">
                {(
                    [
                        ['tasks', 'Задания'],
                        ['control', 'Контроль'],
                        ['ops', 'Операции'],
                    ] as const
                ).map(([id, label]) => (
                    <button key={id} aria-pressed={tab === id} onClick={() => setUi({ parentTab: id })}>
                        <b>{label}</b>
                    </button>
                ))}
            </div>
            {tab === 'control' && <ControlTab game={game} />}
            {tab === 'ops' && <OpsTab game={game} />}
            {tab === 'tasks' && (
                <>
                    <div className="stack" style={{ gap: 10 }}>
                        <span className="h2">Ждёт проверки</span>
                        {review.length === 0 && (
                            <span className="small">
                                Нечего проверять. Когда {child.name} {child.pressed} «Готово», задание появится здесь.
                            </span>
                        )}
                        {review.map((t) => {
                            const Ico = TASK_ICONS[t.icon];
                            return (
                                <div key={t.id} className="review-card">
                                    <div className="row" style={{ gap: 12 }}>
                                        <Ico size={28} weight="duotone" color="var(--accent-700)" />
                                        <div className="stack grow" style={{ lineHeight: 1.25 }}>
                                            <b style={{ fontSize: 16 }}>{t.title}</b>
                                            <span className="small">
                                                {child.name} {child.pressed} «Готово»
                                            </span>
                                        </div>
                                        <b className="num">{byn(t.byn)}</b>
                                    </div>
                                    <div className="row" style={{ gap: 8 }}>
                                        <button
                                            className="btn ghost"
                                            style={{ flex: 1 }}
                                            onClick={() => {
                                                action.mutate({ type: 'task/return', id: t.id });
                                                flash(`Задание вернулось ${child.dat}`, 'parentToast');
                                            }}
                                        >
                                            Вернуть
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ flex: 2 }}
                                            onClick={() => {
                                                action.mutate({ type: 'task/approve', id: t.id });
                                                flash(`Переведено ${byn(t.byn)} BYN ${child.dat}`, 'parentToast');
                                            }}
                                        >
                                            Принять · {byn(t.byn)} BYN
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="stack" style={{ gap: 2 }}>
                        <span className="h2" style={{ marginBottom: 8 }}>
                            Задания: {child.name}
                        </span>
                        {active.map((t) => {
                            const Ico = TASK_ICONS[t.icon];
                            return (
                                <div key={t.id} className="active-row">
                                    <Ico size={22} color="var(--n-700)" />
                                    <span className="grow">{t.title}</span>
                                    <span className="num muted-2">{byn(t.byn)}</span>
                                    <span className={`status ${t.status}`}>
                                        {t.status === 'paid' ? 'Оплачено' : 'Ждём'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="stack" style={{ gap: 12 }}>
                        <span className="h2">Новое задание</span>
                        <div className="grid-2">
                            {presets.map((p, k) => (
                                <button
                                    key={p.label}
                                    className={`choice preset ${preset === k ? 'on' : ''}`}
                                    onClick={() => {
                                        setPreset(k);
                                        setAmount(k < TASK_PRESETS.length ? TASK_PRESETS[k].byn : 100);
                                    }}
                                >
                                    <p.Icon size={26} weight="duotone" />
                                    <b>{p.label}</b>
                                    <span>{p.hint}</span>
                                </button>
                            ))}
                        </div>
                        {isCustom && (
                            <input
                                className="text-input"
                                value={custom}
                                onChange={(e) => setCustom(e.target.value)}
                                placeholder="Например: погулять с собакой"
                                maxLength={60}
                            />
                        )}
                        <div className="row" style={{ gap: 6 }}>
                            {AMOUNTS.map((v) => (
                                <button
                                    key={v}
                                    className={`seg-btn tall ${amount === v ? 'on' : ''}`}
                                    onClick={() => setAmount(v)}
                                >
                                    {v / 100} BYN
                                </button>
                            ))}
                        </div>
                        <span className="small">
                            {teen
                                ? `${child.name} получит деньги на карту Moby Teen`
                                : `В игре ${child.name} получит ещё ${amount / 10} MTcoin`}
                        </span>
                        <button className="btn block tall" disabled={!canSend} onClick={send}>
                            Отправить {child.dat} · {byn(amount)} BYN
                        </button>
                        <span className="small">Деньги спишутся, только когда вы примете задание.</span>
                    </div>
                </>
            )}
        </div>
    );
}
