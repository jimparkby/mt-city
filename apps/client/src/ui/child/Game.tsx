import { CARD_TIERS, tierIndex, weekQuests, type GameState } from '@mt/shared';
import {
    BuildingsIcon,
    CaretLeftIcon,
    CheckSquareIcon,
    CoinsIcon,
    LightbulbIcon,
    PercentIcon,
    TrophyIcon,
    UserCircleIcon,
    WalletIcon,
    type Icon,
} from '@phosphor-icons/react';
import { moby } from '../../moby';
import { isDemoMode, isStandalone } from '../../api/client';
import { useUi, type GameTab } from '../../store/ui';
import { byn, coins } from '../format';
import { KID, TEEN, useTeen } from '../roles';
import { buildingById } from '../art/city';
import { CityMap } from './CityMap';
import { STEP_ICONS, nextStep } from './steps';
import { Dream } from './Dream';
import { Location } from './Location';
import { Profile } from './Profile';
import { ChildSheets } from './Sheets';
import { Tasks } from './Tasks';

/** Игра ребёнка внутри Moby (макет v7): город, задания, профиль; поверх — локации, шторки и мини-игры */
export function Game({ game }: { game: GameState }) {
    const tab = useUi((s) => s.tab);
    const overlay = useUi((s) => s.overlay);
    const loc = useUi((s) => s.loc);
    const toast = useUi((s) => s.toast);

    return (
        <div className="game">
            {tab === 'city' ? (
                <CityMap game={game} />
            ) : (
                <div className="game-scroll scroll">
                    {tab === 'tasks' ? <Tasks game={game} /> : <Profile game={game} />}
                </div>
            )}
            <TopHud game={game} />
            {tab === 'city' && <NextStep game={game} />}
            {loc && <Location game={game} />}
            <ChildSheets game={game} />
            {overlay === 'dream' && <Dream />}
            {overlay === 'levelup' && <LevelUp game={game} />}
            {toast && <div className="toast game-toast">{toast}</div>}
        </div>
    );
}

function TopHud({ game }: { game: GameState }) {
    const teen = useTeen();
    const tab = useUi((s) => s.tab);
    const openSheet = useUi((s) => s.openSheet);
    const quests = weekQuests(game);
    const done = quests.filter((q) => q.done).length;
    const child = teen ? TEEN : KID;

    return (
        <div className="hud-top">
            <div className="hero" data-ob="wallet">
                <div className="hero-avatar">{child.name[0]}</div>
                <div className="hero-name">
                    <b>{child.name}</b>
                    <span>уровень {game.level}</span>
                </div>
                <div className="hero-stats">
                    {teen ? (
                        <span title="Кешбэк по карте">
                            <PercentIcon size={18} weight="duotone" color="#3ecf6e" />
                            {CARD_TIERS[tierIndex(game.spent.month)].cb}%
                        </span>
                    ) : (
                        <span title="MTcoin">
                            <CoinsIcon size={18} weight="duotone" color="#ffd23f" />
                            {coins(game.coins)}
                        </span>
                    )}
                    <span title="BYN на карте">
                        <WalletIcon size={18} weight="duotone" color="#a9c6ff" />
                        {byn(game.byn)}
                    </span>
                    <span title="Очки знаний">
                        <LightbulbIcon size={18} weight="duotone" color="#ffb3dc" />
                        {game.knowledge}
                    </span>
                </div>
            </div>
            {tab === 'city' && (
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
            )}
        </div>
    );
}

function NextStep({ game }: { game: GameState }) {
    const teen = useTeen();
    const walkTo = useUi((s) => s.walkTo);
    const nx = nextStep(game, teen);
    const Ico = nx ? STEP_ICONS[nx.step.kind] : TrophyIcon;

    return (
        <div className="next-step" data-ob="next">
            <div className="next-icon">
                <Ico size={24} weight="duotone" />
            </div>
            <div className="grow">
                <span className="next-kicker">
                    {nx ? `${buildingById(nx.id).name} · шаг ${nx.k + 1}` : isStandalone ? 'Город' : 'Moby'}
                </span>
                <span className="next-title">{nx ? nx.step.t : 'Все пути пройдены'}</span>
            </div>
            <button className="btn compact" onClick={() => nx && walkTo(nx.id)}>
                {nx ? 'Играть' : 'Ура!'}
            </button>
        </div>
    );
}

function LevelUp({ game }: { game: GameState }) {
    const teen = useTeen();
    const set = useUi((s) => s.set);
    const text = teen ? 'В городе открылся Рынок.' : 'В сундуке было 100 MTcoin. В городе открылся Рынок.';
    return (
        <div className="levelup">
            <span className="kicker light">НЕДЕЛЯ ЗАКРЫТА</span>
            <span className="levelup-num">{game.level}</span>
            <span className="display" style={{ fontSize: 28 }}>
                Новый уровень
            </span>
            <span className="body">{text}</span>
            <button className="btn block" onClick={() => set({ overlay: null, tab: 'city' })}>
                В город
            </button>
        </div>
    );
}

const NAV: [GameTab, string, Icon][] = [
    ['city', 'Город', BuildingsIcon],
    ['tasks', 'Задания', CheckSquareIcon],
    ['profile', 'Профиль', UserCircleIcon],
];

/** Нижнее меню игры: «Moby» — выход обратно в банк */
export function GameNav({ game }: { game: GameState }) {
    const tab = useUi((s) => s.tab);
    const setTab = useUi((s) => s.setTab);
    const goBank = useUi((s) => s.goBank);
    const openN = game.tasks.filter((t) => t.status === 'open').length;

    return (
        <nav className="nav">
            <button className="nav-back" data-ob="moby" onClick={() => (isDemoMode ? goBank('home') : moby.close())}>
                <CaretLeftIcon size={26} />
                Moby
            </button>
            <div className="nav-sep" />
            {NAV.map(([id, label, Ico]) => (
                <button
                    key={id}
                    data-ob={id === 'city' ? undefined : id}
                    aria-current={tab === id ? 'page' : undefined}
                    onClick={() => setTab(id)}
                >
                    <Ico size={26} weight="duotone" />
                    {label}
                    {id === 'tasks' && openN > 0 && <span className="count">{openN}</span>}
                </button>
            ))}
        </nav>
    );
}
