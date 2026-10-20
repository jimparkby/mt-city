import { BUILDINGS, PATH, PATH_SECTION, nodeStatus, weekQuests, type GameState, type PlayerDto } from '@mt/shared';
import { CheckIcon, HeadphonesIcon, LockSimpleIcon, TreasureChestIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { Riso } from '../components/Riso';
import { byn, coins } from '../format';
import { BUILDING_ICONS, TASK_ICONS } from '../icons';

const GUIDE: Record<number, string> = {
    4: 'Наушники стоят 500 руб. Успеешь накопить за 5 месяцев?',
    5: 'Узнаем, как деньги в Копилке растут сами.',
    6: 'Все пять квестов готовы. Открывай сундук!',
    7: 'Новый раздел откроется на следующей неделе.',
};

const KICKERS = {
    lesson: 'Урок',
    dream: 'Квест · симуляция',
    quiz: 'Урок · квиз',
    chest: 'Награда недели',
    next: 'Следующий уровень',
} as const;

/** Всё для ребёнка на одном экране: шапка → квесты недели → путь → задания от мамы → город */
export function ChildHome({ me, game }: { me: PlayerDto; game: GameState }) {
    return (
        <>
            <Header me={me} game={game} />
            <div className="scroll">
                <WeekCard game={game} />
                <CurrentStep game={game} />
                <FamilyTasks game={game} />
                <City level={game.level} />
            </div>
        </>
    );
}

function Header({ me, game }: { me: PlayerDto; game: GameState }) {
    const openSheet = useUi((s) => s.openSheet);
    return (
        <header className="child-header">
            <button className="avatar" onClick={() => openSheet({ type: 'profile' })} aria-label="Профиль">
                {me.name[0]}
            </button>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span className="kicker">
                    {me.name} · уровень {game.level}
                </span>
                <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em' }}>МТ Сити</span>
            </div>
            <div className="stats">
                <div className="stat">
                    <b>{coins(game.coins)}</b>
                    <span>MTcoin</span>
                </div>
                <div className="stat">
                    <b style={{ color: 'var(--accent-700)' }}>{byn(game.byn)}</b>
                    <span>BYN</span>
                </div>
                <div className="stat">
                    <b>{game.knowledge}</b>
                    <span>знаний</span>
                </div>
            </div>
        </header>
    );
}

function WeekCard({ game }: { game: GameState }) {
    const openSheet = useUi((s) => s.openSheet);
    const quests = weekQuests(game);
    const done = quests.filter((q) => q.done).length;
    const hint =
        done === 5
            ? game.chestOpened
                ? 'Неделя закрыта. Новые квесты в понедельник'
                : 'Все квесты готовы. Открой сундук'
            : `Ещё ${5 - done} — и уровень ${game.level + 1}`;

    return (
        <button className="week-card" onClick={() => openSheet({ type: 'week' })}>
            <Riso>{`${done}/5`}</Riso>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div className="row" style={{ fontSize: 14 }}>
                    <b>Квесты недели</b>
                    <span className="muted">ещё 4 дня</span>
                </div>
                <div className="segments">
                    {quests.map((q) => (
                        <div key={q.title} className={q.done ? 'on' : ''} />
                    ))}
                </div>
                <span className="small" style={{ color: '#4a4540' }}>
                    {hint}
                </span>
            </div>
        </button>
    );
}

function CurrentStep({ game }: { game: GameState }) {
    const openSheet = useUi((s) => s.openSheet);
    const statuses = PATH.map((n) => nodeStatus(game, n));
    const cur = PATH[statuses.indexOf('current')] ?? PATH[PATH.length - 1];

    return (
        <section className="section current-step">
            <span className="kicker accent-2">
                Шаг {cur.id} · {KICKERS[cur.kind]}
            </span>
            <Riso>{cur.title}</Riso>
            <p className="body">{cur.desc || GUIDE[cur.id]}</p>
            <button className="btn" onClick={() => openSheet({ type: 'node', id: cur.id })}>
                {cur.kind === 'chest' ? 'Открыть сундук' : cur.kind === 'next' ? 'Подробнее' : 'Начать'}
            </button>

            <span className="kicker" style={{ marginTop: 10 }}>
                {PATH_SECTION}
            </span>
            <div className="path-strip">
                {PATH.map((n, i) => {
                    const st = statuses[i];
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
        </section>
    );
}

function FamilyTasks({ game }: { game: GameState }) {
    const action = useGameAction();
    const flash = useUi((s) => s.flash);
    const tasks = [...game.tasks].reverse();

    return (
        <section className="section">
            <h2 className="h2">Задания от мамы</h2>
            <p className="small">Сделай и нажми «Готово». Мама проверит и переведёт деньги на твою карту.</p>
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
                    <span className="kicker" style={{ marginTop: 6 }}>
                        За оценки
                    </span>
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
        </section>
    );
}

function City({ level }: { level: number }) {
    const openSheet = useUi((s) => s.openSheet);
    const flash = useUi((s) => s.flash);

    return (
        <section className="section">
            <h2 className="h2">Город</h2>
            <p className="small">
                Здесь тратишь и зарабатываешь то, что выучил на пути. Новые здания открываются с уровнем.
            </p>
            <div className="city-grid">
                {BUILDINGS.map((b) => {
                    const Icon = BUILDING_ICONS[b.id];
                    const locked = level < b.minBankLevel;
                    return (
                        <button
                            key={b.id}
                            className={`building ${locked ? 'locked' : ''}`}
                            onClick={() =>
                                locked
                                    ? flash(`${b.name} откроется на уровне ${b.minBankLevel}`)
                                    : openSheet({ type: 'building', id: b.id })
                            }
                        >
                            <div className="tile">
                                <Icon size={34} weight="duotone" />
                                {locked && <span className="lvl">ур. {b.minBankLevel}</span>}
                            </div>
                            <span className="name">{b.name}</span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
