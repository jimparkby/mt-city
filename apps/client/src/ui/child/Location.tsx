import { Fragment, useState } from 'react';
import { PATHS, checkOpenAnswer, isStepDone, pathSteps, stepStatuses, type GameState } from '@mt/shared';
import {
    CaretLeftIcon,
    CheckCircleIcon,
    CheckIcon,
    CircleIcon,
    CoinsIcon,
    LightbulbIcon,
    LockSimpleIcon,
    TrophyIcon,
    XCircleIcon,
} from '@phosphor-icons/react';
import { isStandalone } from '../../api/client';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { useTeen } from '../roles';
import { shade } from '../art/svg';
import { buildingById, locationArt } from '../art/city';
import { LocationExtras } from './LocationExtras';
import { STEP_ICONS } from './steps';

const KIND_LABEL = {
    lesson: 'Урок',
    quiz: 'Квиз',
    sim: 'Симуляция',
    work: 'Работа',
    open: 'Вопрос',
    game: 'Мини-игра',
} as const;

/** Награда шага: ребёнку — MTcoin, подростку — знания */
function useReward() {
    const teen = useTeen();
    return {
        Icon: teen ? LightbulbIcon : CoinsIcon,
        color: teen ? '#ffb3dc' : '#ffd23f',
        unit: teen ? ' знаний' : ' MTcoin',
    };
}

/** Экран здания: подсказка, что тут происходит, и путь из коротких шагов */
export function Location({ game }: { game: GameState }) {
    const teen = useTeen();
    const loc = useUi((s) => s.loc)!;
    const step = useUi((s) => s.step);
    const closeLoc = useUi((s) => s.closeLoc);
    const openStep = useUi((s) => s.openStep);
    const flash = useUi((s) => s.flash);
    const reward = useReward();
    const path = PATHS[loc];
    if (!path) return null;

    const b = buildingById(loc);
    const steps = pathSteps(loc, teen);
    const stats = stepStatuses(game, loc, teen);
    const doneN = stats.filter((s) => s === 'done').length;
    const left = steps.reduce((a, p, k) => a + (stats[k] === 'done' ? 0 : p.r), 0);
    const cur = stats.indexOf('current');
    const art = locationArt(b);
    const sc = Math.min(320 / art.w, 176 / art.h, 1.5);

    return (
        <div className="location">
            <div
                className="location-head"
                style={{
                    background: `radial-gradient(100% 90% at 50% 100%,${shade(path.c, 0.35)} 0%,${path.c} 55%,#1a1b22 100%)`,
                }}
            >
                <div className="location-shadow" />
                <img
                    src={art.src}
                    alt={b.name}
                    draggable={false}
                    className="location-art"
                    style={{ width: art.w * sc, height: art.h * sc }}
                />
                <div className="location-bar">
                    <button className="icon-btn dark" onClick={closeLoc} aria-label="Назад">
                        <CaretLeftIcon size={22} />
                    </button>
                    <div className="grow location-title">
                        <span className="display">{b.name}</span>
                        <span>
                            Путь локации · {doneN} из {stats.length}
                        </span>
                    </div>
                    <span className="chip-dark">
                        <reward.Icon size={16} weight="duotone" color={reward.color} />
                        {left ? `+${left}` : 'собрано'}
                    </span>
                </div>
            </div>
            <div className="location-body scroll">
                <Bubble kicker="КАК ЗДЕСЬ ВСЁ УСТРОЕНО">{(teen && path.tipTeen) || path.tip}</Bubble>
                {!isStandalone && <LocationExtras game={game} loc={loc} />}
                <div className="timeline">
                    {steps.map((p, k) => {
                        const st = stats[k];
                        const Ico = st === 'done' ? CheckIcon : st === 'locked' ? LockSimpleIcon : STEP_ICONS[p.kind];
                        const head = p.block && p.block !== steps[k - 1]?.block;
                        return (
                            <Fragment key={k}>
                                {head && <span className="tl-block">{p.block}</span>}
                                <button
                                    className={`tl-step ${st} ${k === steps.length - 1 ? 'last' : ''}`}
                                    onClick={() =>
                                        st === 'locked'
                                            ? flash(`Сначала пройди «${steps[cur].t}»`)
                                            : openStep({ loc, k, picked: null })
                                    }
                                >
                                    <div className="tl-rail">
                                        <div className="tl-dot">
                                            <Ico weight={st === 'done' ? 'bold' : 'duotone'} />
                                        </div>
                                        <div className="tl-line" />
                                    </div>
                                    <div className="tl-text">
                                        <span className="tl-kicker">
                                            Шаг {k + 1} · {KIND_LABEL[p.kind]}
                                        </span>
                                        <span className="tl-title">{p.t}</span>
                                        <span
                                            className="tl-reward"
                                            style={{
                                                color:
                                                    st === 'locked'
                                                        ? undefined
                                                        : st === 'done'
                                                          ? '#3ecf6e'
                                                          : reward.color,
                                            }}
                                        >
                                            {st === 'done' ? (
                                                <CheckIcon size={15} weight="bold" />
                                            ) : (
                                                <reward.Icon size={15} weight="duotone" />
                                            )}
                                            {st === 'done' ? 'получено' : `+${p.r}${reward.unit}`}
                                        </span>
                                    </div>
                                </button>
                            </Fragment>
                        );
                    })}
                    {doneN === steps.length && (
                        <div className="all-done">
                            <TrophyIcon size={28} weight="duotone" />
                            <span>
                                Путь локации пройден. Загляни в другие места города — там тоже ждут шаги и награды.
                            </span>
                        </div>
                    )}
                </div>
                {cur >= 0 && (
                    <button
                        className="btn block tall location-cta"
                        onClick={() => openStep({ loc, k: cur, picked: null })}
                    >
                        Начать шаг {cur + 1} · {steps[cur].t}
                    </button>
                )}
            </div>
            {step && <StepSheet key={`${step.loc}:${step.k}`} game={game} />}
        </div>
    );
}

function Bubble({ kicker, children, small }: { kicker?: string; children: string; small?: boolean }) {
    return (
        <div className="bubble-row">
            <div className={`bubble-icon ${small ? 'small' : ''}`}>
                <LightbulbIcon size={small ? 22 : 26} weight="duotone" />
            </div>
            <div className="bubble">
                {kicker && <span className="bubble-kicker">{kicker}</span>}
                {children}
            </div>
        </div>
    );
}

/** Шаг пути: урок, квиз или запуск симуляции */
function StepSheet({ game }: { game: GameState }) {
    const teen = useTeen();
    const step = useUi((s) => s.step)!;
    const openStep = useUi((s) => s.openStep);
    const openOverlay = useUi((s) => s.openOverlay);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const reward = useReward();
    const set = useUi((s) => s.set);
    const [typed, setTyped] = useState('');
    const [checked, setChecked] = useState<boolean | null>(null);

    const p = pathSteps(step.loc, teen)[step.k];
    const numeric = !!p.answers?.every((a) => /^\d+$/.test(a));
    const done = isStepDone(game, step.loc, step.k);
    const pk = step.picked;
    const quiz = p.kind === 'quiz';
    const ok = quiz && pk === p.a;
    const close = () => openStep(null);
    const complete = () => {
        action.mutate({ type: 'step/complete', loc: step.loc, k: step.k, teen });
        close();
        flash(`+${p.r}${reward.unit} · ${p.t}`);
    };

    let btn: string,
        act: () => void,
        tone = '',
        disabled = false;
    if (done && p.kind !== 'sim' && p.kind !== 'game') [btn, act, tone] = ['Пройдено · закрыть', close, 'ghost'];
    else if (p.kind === 'game')
        [btn, act] = [
            done ? 'Сыграть ещё раз' : 'Начать игру',
            () => {
                close();
                set({ mini: { loc: step.loc, k: step.k }, overlay: 'mini' });
            },
        ];
    else if (p.kind === 'open') {
        if (checked) [btn, act, tone] = [`Забрать +${p.r}${reward.unit}`, complete, 'ok'];
        else
            [btn, act, disabled] = [
                'Проверить',
                () => setChecked(checkOpenAnswer(p.answers ?? [], typed)),
                !typed.trim(),
            ];
    } else if (p.kind === 'sim')
        [btn, act] = [
            done ? 'Сыграть ещё раз' : 'Начать квест',
            () => {
                close();
                openOverlay('dream');
            },
        ];
    else if (!quiz) [btn, act] = [`Понятно · +${p.r}${reward.unit}`, complete];
    else if (pk == null) [btn, act, disabled] = ['Выбери ответ', () => {}, true];
    else if (ok) [btn, act, tone] = [`Забрать +${p.r}${reward.unit}`, complete, 'ok'];
    else [btn, act] = ['Попробовать ещё', () => openStep({ ...step, picked: null })];

    return (
        <>
            <div className="backdrop" onClick={close} />
            <div className="sheet scroll" role="dialog" style={{ maxHeight: '90%' }}>
                <div className="grip" />
                <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
                    <span className="kicker accent-2">
                        {KIND_LABEL[p.kind]}
                        {done ? ' · пройдено' : ''}
                    </span>
                    <span className="reward-chip">
                        <reward.Icon size={15} weight="duotone" color={reward.color} />
                        {done ? 'получено' : `+${p.r}${reward.unit}`}
                    </span>
                </div>
                <span className="display sheet-title">{p.t}</span>
                <Bubble small>{p.say}</Bubble>
                {p.text && (
                    <div className="theory">
                        {p.text.map((x, i) => (
                            <p key={i}>
                                {x.h && <b>{x.h}. </b>}
                                {x.p}
                            </p>
                        ))}
                    </div>
                )}
                {p.kind === 'open' && !done && (
                    <>
                        <span className="question" style={{ whiteSpace: 'pre-line' }}>
                            {p.q}
                        </span>
                        <input
                            className={`answer-input ${checked === false ? 'bad' : checked ? 'ok' : ''}`}
                            value={typed}
                            placeholder={numeric ? 'Число, например 1 500 000' : 'Твой ответ'}
                            inputMode={numeric ? 'numeric' : 'text'}
                            readOnly={!!checked}
                            onChange={(e) => {
                                setTyped(e.target.value);
                                setChecked(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && !disabled && act()}
                        />
                        {checked != null && (
                            <div className={`why ${checked ? 'ok' : 'bad'}`}>
                                {checked ? `Верно! ${p.why}` : `Пока не так. Подсказка: ${p.hint}`}
                            </div>
                        )}
                    </>
                )}
                {quiz && !done && (
                    <>
                        <span className="question" style={{ whiteSpace: 'pre-line' }}>
                            {p.q}
                        </span>
                        <div className="stack" style={{ gap: 8 }}>
                            {p.opts!.map((label, i) => {
                                const sel = pk === i,
                                    right = pk != null && i === p.a;
                                const Ico = right ? CheckCircleIcon : sel ? XCircleIcon : CircleIcon;
                                return (
                                    <button
                                        key={i}
                                        className={`option ${right ? 'ok' : sel ? 'bad' : ''}`}
                                        onClick={() => pk == null && openStep({ ...step, picked: i })}
                                    >
                                        <span className="grow">{label}</span>
                                        <Ico size={22} weight={right || sel ? 'fill' : 'regular'} />
                                    </button>
                                );
                            })}
                        </div>
                        {pk != null && (
                            <div className={`why ${ok ? 'ok' : 'bad'}`}>
                                {ok ? 'Верно! ' : 'Не совсем. '}
                                {p.why}
                            </div>
                        )}
                    </>
                )}
                <button className={`btn block tall ${tone}`} disabled={disabled} onClick={act}>
                    {btn}
                </button>
            </div>
        </>
    );
}
