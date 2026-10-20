import { PATH, PATH_SECTION, nodeStatus, type GameState } from '@mt/shared';
import { CheckIcon, HeadphonesIcon, LockSimpleIcon, TreasureChestIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn } from '../format';
import { TASK_ICONS } from '../icons';

export const KICKERS = {
    lesson: 'Урок',
    dream: 'Квест · симуляция',
    quiz: 'Урок · квиз',
    chest: 'Награда недели',
    next: 'Следующий уровень',
} as const;

export function currentNode(game: GameState) {
    return PATH.find((n) => nodeStatus(game, n) === 'current') ?? PATH[PATH.length - 1];
}

/** Путь раздела: шаги кружками, текущий пульсирует */
export function PathStrip({ game }: { game: GameState }) {
    const openSheet = useUi((s) => s.openSheet);
    return (
        <>
            <span className="kicker">{PATH_SECTION}</span>
            <div className="path-strip">
                {PATH.map((n) => {
                    const st = nodeStatus(game, n);
                    const icon =
                        n.kind === 'chest' ? (
                            <TreasureChestIcon weight="duotone" />
                        ) : st === 'done' ? (
                            <CheckIcon weight="bold" />
                        ) : n.kind === 'dream' ? (
                            <HeadphonesIcon weight="duotone" />
                        ) : st === 'locked' ? (
                            <LockSimpleIcon />
                        ) : (
                            n.id
                        );
                    return (
                        <div key={n.id} className={`path-step ${st}`}>
                            <button
                                className="node"
                                onClick={() => openSheet({ type: 'node', id: n.id })}
                                aria-label={n.title}
                            >
                                {icon}
                            </button>
                            <span>{n.title}</span>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

export function FamilyTasks({ game }: { game: GameState }) {
    const action = useGameAction();
    const flash = useUi((s) => s.flash);
    const tasks = [...game.tasks].reverse();

    return (
        <>
            <div className="stack" style={{ gap: 6 }}>
                <span className="h1">Задания от мамы</span>
                <p className="body" style={{ fontSize: 14 }}>
                    Сделай и нажми «Готово». Мама проверит и переведёт деньги на твою карту, а в игру придут MTcoin.
                </p>
            </div>
            <div>
                {tasks.map((task) => {
                    const Icon = TASK_ICONS[task.icon];
                    return (
                        <div key={task.id} className="task-row">
                            <Icon
                                size={26}
                                weight="duotone"
                                color={task.status === 'paid' ? 'var(--faint)' : 'var(--accent-700)'}
                            />
                            <div className="grow">
                                <span className="title">{task.title}</span>
                                <span className="small num">
                                    {byn(task.byn)} BYN + {task.byn / 10} MTcoin
                                </span>
                                {task.status === 'open' && task.returned && (
                                    <span className="returned">Мама вернула: доделай, пожалуйста</span>
                                )}
                            </div>
                            {task.status === 'open' && (
                                <button
                                    className="btn small"
                                    onClick={() => {
                                        action.mutate({ type: 'task/submit', id: task.id });
                                        flash('Отправлено маме на проверку');
                                    }}
                                >
                                    Готово
                                </button>
                            )}
                            {task.status === 'review' && <span className="badge">На проверке</span>}
                            {task.status === 'paid' && <span className="badge ok">Оплачено</span>}
                        </div>
                    );
                })}
            </div>
            {game.gradesOn && game.gradeFeed.length > 0 && (
                <div className="stack" style={{ gap: 4 }}>
                    <span className="h2">За оценки</span>
                    {[...game.gradeFeed].reverse().map((g, i) => (
                        <div key={i} className="row" style={{ padding: '6px 0' }}>
                            <span
                                className="num"
                                style={{ width: 36, fontSize: 24, fontWeight: 700, color: 'var(--accent-700)' }}
                            >
                                {g.g}
                            </span>
                            <span style={{ flex: 1, fontSize: 15 }}>{g.subj}</span>
                            <b className="num" style={{ fontSize: 14 }}>
                                {g.amt ? `+${byn(g.amt)} BYN` : '—'}
                            </b>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
