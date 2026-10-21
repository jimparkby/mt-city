import { useState } from 'react';
import { MINI_GAMES, PANEL, isStepDone, panelVerdict, pathSteps, type GameState, type MiniStage } from '@mt/shared';
import { CheckCircleIcon, CircleIcon, TrophyIcon, XCircleIcon, XIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { useTeen } from '../roles';

const rub = (v: number) => v.toLocaleString('ru-RU');

/** Мини-игра шага пути: сценарий из этапов (выбор и расчёт) или пульт стадиона */
export function MiniGame({ game }: { game: GameState }) {
    const teen = useTeen();
    const mini = useUi((s) => s.mini)!;
    const set = useUi((s) => s.set);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const p = pathSteps(mini.loc, teen)[mini.k];
    if (!p?.game) return null;

    const done = isStepDone(game, mini.loc, mini.k);
    const close = () => set({ overlay: null, mini: null });
    const finish = () => {
        if (!done) {
            action.mutate({ type: 'step/complete', loc: mini.loc, k: mini.k, teen });
            flash(`+${p.r} знаний · ${p.t}`);
        }
        close();
    };
    const reward = done ? 'Награда уже получена' : `+${p.r} знаний`;
    const claim = done ? 'Готово' : 'Забрать награду';

    return p.game === 'panel' ? (
        <Panel close={close} finish={finish} reward={reward} claim={claim} />
    ) : (
        <Scenario id={p.game} close={close} finish={finish} reward={reward} claim={claim} />
    );
}

interface Props {
    close: () => void;
    finish: () => void;
    reward: string;
    /** Подпись финальной кнопки: забрать награду или просто выйти при повторе */
    claim: string;
}

function Shell({
    title,
    close,
    progress,
    children,
    foot,
}: {
    title: string;
    close: () => void;
    progress?: [number, number];
    children: React.ReactNode;
    foot: React.ReactNode;
}) {
    return (
        <div className="overlay">
            <div className="overlay-top">
                <button className="icon-btn plain" onClick={close} aria-label="Выйти">
                    <XIcon size={24} />
                </button>
                {progress ? (
                    <div className="segments wide">
                        {Array.from({ length: progress[1] }, (_, i) => (
                            <div key={i} className={i < progress[0] ? 'on pink' : i === progress[0] ? 'now' : ''} />
                        ))}
                    </div>
                ) : (
                    <div className="grow" />
                )}
                <b style={{ fontSize: 14 }} className="nowrap">
                    {title}
                </b>
            </div>
            <div className="overlay-body scroll">{children}</div>
            <div className="overlay-foot">{foot}</div>
        </div>
    );
}

function Finale({ rank, text, reward }: { rank: string; text: string; reward: string }) {
    return (
        <div className="stack mini-finale">
            <TrophyIcon size={56} weight="duotone" />
            <span className="kicker ok">ТВОЙ СТАТУС</span>
            <span className="display" style={{ fontSize: 26, lineHeight: 1.15 }}>
                {rank}
            </span>
            <span className="body">{text}</span>
            <span className="reward-chip">{reward}</span>
        </div>
    );
}

/** Сценарий: этапы по очереди, на ошибке — разбор и повтор этапа */
function Scenario({ id, close, finish, reward, claim }: Props & { id: keyof typeof MINI_GAMES }) {
    const sc = MINI_GAMES[id];
    const [i, setI] = useState(0);
    const [picked, setPicked] = useState<number | null>(null);
    const [typed, setTyped] = useState('');
    const [result, setResult] = useState<boolean | null>(null);
    const over = i >= sc.stages.length;
    const st: MiniStage | undefined = sc.stages[i];

    const next = () => {
        setI(i + 1);
        setPicked(null);
        setTyped('');
        setResult(null);
    };
    const retry = () => {
        setPicked(null);
        setResult(null);
    };
    const check = () => {
        if (st?.kind === 'number') setResult(Number(typed.replace(/\D/g, '')) === st.answer);
    };

    let btn: string,
        act: () => void,
        tone = '',
        disabled = false;
    if (over) [btn, act, tone] = [claim, finish, 'ok'];
    else if (result === true) [btn, act, tone] = [i === sc.stages.length - 1 ? 'К итогам' : 'Дальше', next, 'ok'];
    else if (result === false) [btn, act] = ['Попробовать ещё', retry];
    else if (st.kind === 'choice') [btn, act, disabled] = ['Выбери решение', () => {}, true];
    else [btn, act, disabled] = ['Проверить', check, !typed.trim()];

    return (
        <Shell
            title={sc.title}
            close={close}
            progress={[i, sc.stages.length]}
            foot={
                <button className={`btn block tall ${tone}`} disabled={disabled} onClick={act}>
                    {btn}
                </button>
            }
        >
            {over ? (
                <Finale rank={sc.rank} text={sc.finale} reward={reward} />
            ) : (
                <>
                    {i === 0 && <div className="mini-legend">{sc.legend}</div>}
                    <span className="kicker accent-2">{st.title}</span>
                    <div className="mini-case">{st.text}</div>
                    <span className="question">{st.q}</span>
                    {st.kind === 'choice' ? (
                        <div className="stack" style={{ gap: 8 }}>
                            {st.opts.map((label, k) => {
                                const sel = picked === k,
                                    right = result === true && k === st.a;
                                const Ico = right ? CheckCircleIcon : sel ? XCircleIcon : CircleIcon;
                                return (
                                    <button
                                        key={k}
                                        className={`option ${right ? 'ok' : sel && result === false ? 'bad' : ''}`}
                                        onClick={() => {
                                            if (result != null) return;
                                            setPicked(k);
                                            setResult(k === st.a);
                                        }}
                                    >
                                        <span className="grow">{label}</span>
                                        <Ico size={22} weight={right || sel ? 'fill' : 'regular'} />
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <input
                            className={`answer-input ${result === false ? 'bad' : result ? 'ok' : ''}`}
                            value={typed}
                            inputMode="numeric"
                            placeholder="Сумма в рублях"
                            readOnly={result === true}
                            onChange={(e) => {
                                setTyped(e.target.value);
                                setResult(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && !disabled && act()}
                        />
                    )}
                    {result != null && (
                        <div className={`why ${result ? 'ok' : 'bad'}`}>
                            {result
                                ? st.ok
                                : st.kind === 'choice'
                                  ? (st.bad[picked ?? -1] ?? 'Не лучшее решение.')
                                  : `Пока не так. Подсказка: ${st.hint}`}
                        </div>
                    )}
                </>
            )}
        </Shell>
    );
}

/** Пульт стадиона: по одной кнопке в каждой системе, итог против бюджета */
function Panel({ close, finish, reward, claim }: Props) {
    const [picks, setPicks] = useState<(number | null)[]>(PANEL.systems.map(() => null));
    const [verdict, setVerdict] = useState<ReturnType<typeof panelVerdict> | null>(null);
    const sum = picks.reduce<number>((s, lv, i) => s + (lv == null ? 0 : PANEL.systems[i].levels[lv].cost), 0);
    const ready = picks.every((x) => x != null);
    const win = verdict?.ok === true;

    return (
        <Shell
            title="Пульт стадиона"
            close={close}
            foot={
                <>
                    {!win && (
                        <div className="row" style={{ justifyContent: 'space-between', fontSize: 15 }}>
                            <span>Бюджет месяца: {rub(PANEL.budget)} руб.</span>
                            <b className={sum > PANEL.budget ? 'neg' : 'pos'}>{rub(sum)}</b>
                        </div>
                    )}
                    <button
                        className={`btn block tall ${win ? 'ok' : ''}`}
                        disabled={!win && !ready}
                        onClick={() => (win ? finish() : setVerdict(panelVerdict(picks.map((x) => x ?? 0))))}
                    >
                        {win ? claim : ready ? 'Запустить месяц' : 'Выбери режим в каждой системе'}
                    </button>
                </>
            }
        >
            {win ? (
                <Finale rank={PANEL.rank} text={PANEL.finale} reward={reward} />
            ) : (
                <>
                    <div className="mini-legend">
                        Ноябрь: заморозки, частые дожди и 2 домашних матча. Выбери по одному режиму в каждой системе и
                        уложись в {rub(PANEL.budget)} руб. — ни рублём больше.
                    </div>
                    {PANEL.systems.map((sys, i) => {
                        const lvPick = picks[i];
                        return (
                            <div key={sys.name} className="stack" style={{ gap: 8 }}>
                                <div
                                    className="row"
                                    style={{ justifyContent: 'space-between', alignItems: 'baseline' }}
                                >
                                    <b style={{ fontSize: 16 }}>{sys.name}</b>
                                    <span className="small" style={{ fontSize: 12 }}>
                                        {sys.cond}
                                    </span>
                                </div>
                                <div className="pick-grid">
                                    {sys.levels.map((lv, k) => (
                                        <button
                                            key={lv.name}
                                            className={`pick panel-pick ${lv.tone} ${picks[i] === k ? 'on' : ''}`}
                                            onClick={() => {
                                                setPicks((cur) => cur.map((x, j) => (j === i ? k : x)));
                                                setVerdict(null);
                                            }}
                                        >
                                            <span>{lv.name}</span>
                                            <b>{lv.cost ? `${rub(lv.cost / 1_000_000)} млн` : '0'}</b>
                                        </button>
                                    ))}
                                </div>
                                {lvPick != null && <span className="tiny muted">{sys.levels[lvPick].note}</span>}
                            </div>
                        );
                    })}
                    {verdict && !verdict.ok && (
                        <div className="why bad">
                            <b>{verdict.title}</b> {verdict.text}
                        </div>
                    )}
                </>
            )}
        </Shell>
    );
}
