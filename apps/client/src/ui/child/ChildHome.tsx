import { weekQuests, type GameState, type PlayerDto } from '@mt/shared';
import {
    BuildingsIcon,
    CheckSquareIcon,
    CoinsIcon,
    LightbulbIcon,
    PathIcon,
    UserCircleIcon,
    WalletIcon,
} from '@phosphor-icons/react';
import { useUi, type Sheet } from '../../store/ui';
import { byn, coins } from '../format';
import { CityMap } from './CityMap';
import { currentNode } from './Parts';

/** Экран ребёнка (макет v3): город на весь экран, сверху герой и квесты, снизу следующий шаг и меню */
export function ChildHome({ me, game }: { me: PlayerDto; game: GameState }) {
    return (
        <>
            <CityMap game={game} />
            <TopHud me={me} game={game} />
            <BottomHud game={game} />
        </>
    );
}

function TopHud({ me, game }: { me: PlayerDto; game: GameState }) {
    const openSheet = useUi((s) => s.openSheet);
    const quests = weekQuests(game);
    const done = quests.filter((q) => q.done).length;

    return (
        <div className="hud-top">
            <button className="hero" onClick={() => openSheet({ type: 'profile' })}>
                <div className="hero-avatar">{me.name[0]}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{me.name}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}>уровень {game.level}</span>
                </div>
                <div className="hero-stats">
                    <span title="MTcoin">
                        <CoinsIcon size={18} weight="duotone" color="#ffd23f" />
                        {coins(game.coins)}
                    </span>
                    <span title="BYN на детской карте">
                        <WalletIcon size={18} weight="duotone" color="#a9c6ff" />
                        {byn(game.byn)}
                    </span>
                    <span title="Очки знаний">
                        <LightbulbIcon size={18} weight="duotone" color="#ffb3dc" />
                        {game.knowledge}
                    </span>
                </div>
            </button>
            <button className="quest-pill" onClick={() => openSheet({ type: 'week' })}>
                <span>
                    <b>Квесты {done}/5</b> <span className="muted">· ещё 4 дня</span>
                </span>
                <div className="segments">
                    {quests.map((q) => (
                        <div key={q.title} className={q.done ? 'on' : ''} />
                    ))}
                </div>
            </button>
        </div>
    );
}

const NAV: { label: string; Icon: typeof BuildingsIcon; sheet: Sheet | null }[] = [
    { label: 'Город', Icon: BuildingsIcon, sheet: null },
    { label: 'Путь', Icon: PathIcon, sheet: { type: 'path' } },
    { label: 'Задания', Icon: CheckSquareIcon, sheet: { type: 'tasks' } },
    { label: 'Профиль', Icon: UserCircleIcon, sheet: { type: 'profile' } },
];

function BottomHud({ game }: { game: GameState }) {
    const sheet = useUi((s) => s.sheet);
    const openSheet = useUi((s) => s.openSheet);
    const closeSheet = useUi((s) => s.closeSheet);
    const cur = currentNode(game);
    const openTasks = game.tasks.filter((t) => t.status === 'open').length;
    const active = NAV.find((n) => n.sheet && n.sheet.type === sheet?.type) ?? NAV[0];

    return (
        <div className="hud-bottom">
            <div className="next-step">
                <div className="step-num">{cur.id}</div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                    <span className="small" style={{ fontSize: 12 }}>
                        Следующий шаг пути
                    </span>
                    <span className="display" style={{ fontSize: 16 }}>
                        {cur.title}
                    </span>
                </div>
                <button className="step-play" onClick={() => openSheet({ type: 'node', id: cur.id })}>
                    {cur.kind === 'chest' ? 'Открыть' : 'Играть'}
                </button>
            </div>
            <nav className="nav">
                {NAV.map(({ label, Icon, sheet: target }) => (
                    <button
                        key={label}
                        aria-current={active.label === label ? 'page' : undefined}
                        onClick={() => (target ? openSheet(target) : closeSheet())}
                    >
                        <Icon size={26} weight="duotone" />
                        {label}
                        {label === 'Задания' && openTasks > 0 && <span className="count">{openTasks}</span>}
                    </button>
                ))}
            </nav>
        </div>
    );
}
