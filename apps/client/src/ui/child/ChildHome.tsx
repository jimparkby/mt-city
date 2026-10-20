import { useEffect } from 'react';
import { BUILDINGS, weekQuests, type GameState, type PlayerDto } from '@mt/shared';
import { CheckSquareIcon, PathIcon } from '@phosphor-icons/react';
import { emit, on } from '../../game/EventBus';
import { PhaserGame } from '../../PhaserGame';
import { useUi } from '../../store/ui';
import { Riso } from '../components/Riso';
import { byn, coins } from '../format';
import { KICKERS, currentNode } from './Parts';

/** Экран ребёнка — город на весь экран, всё остальное поверх карты */
export function ChildHome({ me, game }: { me: PlayerDto; game: GameState }) {
    const openSheet = useUi((s) => s.openSheet);
    const flash = useUi((s) => s.flash);

    // Уровень → какие здания на карте открыты
    useEffect(() => {
        const send = () => emit('city:state', { level: game.level });
        send();
        return on('city:ready', send);
    }, [game.level]);

    // Тап по зданию на карте
    useEffect(
        () =>
            on('building:open', ({ id }) => {
                const b = BUILDINGS.find((x) => x.id === id)!;
                if (game.level < b.minBankLevel) flash(`${b.name} откроется на уровне ${b.minBankLevel}`);
                else openSheet({ type: 'building', id });
            }),
        [game.level, flash, openSheet],
    );

    return (
        <>
            <div className="map-layer">
                <PhaserGame />
            </div>
            <div className="map-ui">
                <div className="map-top">
                    <Header me={me} game={game} />
                    <WeekCard game={game} />
                </div>
                <StepDock game={game} />
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

/** Нижняя панель: текущий шаг пути + входы в «Путь» и «Задания» */
function StepDock({ game }: { game: GameState }) {
    const openSheet = useUi((s) => s.openSheet);
    const cur = currentNode(game);
    const openTasks = game.tasks.filter((t) => t.status === 'open').length;

    return (
        <div className="map-bottom">
            <div className="dock">
                <span className="kicker accent-2">
                    Шаг {cur.id} · {KICKERS[cur.kind]}
                </span>
                <span className="dock-title">{cur.title}</span>
                <div className="row" style={{ gap: 8 }}>
                    <button
                        className="btn small"
                        style={{ flex: 1 }}
                        onClick={() => openSheet({ type: 'node', id: cur.id })}
                    >
                        {cur.kind === 'chest' ? 'Открыть сундук' : cur.kind === 'next' ? 'Подробнее' : 'Начать'}
                    </button>
                    <button className="dock-btn" onClick={() => openSheet({ type: 'path' })}>
                        <PathIcon size={22} weight="duotone" />
                        Путь
                    </button>
                    <button className="dock-btn" onClick={() => openSheet({ type: 'tasks' })}>
                        <CheckSquareIcon size={22} weight="duotone" />
                        Задания
                        {openTasks > 0 && <span className="count">{openTasks}</span>}
                    </button>
                </div>
            </div>
        </div>
    );
}
