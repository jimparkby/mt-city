import { weekQuests, type GameState } from '@mt/shared';
import { CheckIcon, TreasureChestIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { useTeen } from '../roles';
import { buildingById } from '../art/city';
import { Sheet } from '../components/Sheet';

/** Шторки игры: квесты недели и карточка здания без пути (закрытое или участок) */
export function ChildSheets({ game }: { game: GameState }) {
    const sheet = useUi((s) => s.sheet);
    if (!sheet) return null;
    if (sheet.type === 'week') return <WeekSheet game={game} />;
    return <BuildingSheet game={game} id={sheet.id} />;
}

function WeekSheet({ game }: { game: GameState }) {
    const teen = useTeen();
    const openOverlay = useUi((s) => s.openOverlay);
    const action = useGameAction();
    const quests = weekQuests(game);
    const done = quests.filter((q) => q.done).length;
    const prize = teen ? `уровень ${game.level + 1} и рост кешбэка по карте` : `уровень ${game.level + 1} и 100 MTcoin`;

    return (
        <Sheet>
            <span className="display" style={{ fontSize: 20 }}>
                Квесты недели
            </span>
            <span className="small">
                Выполни все пять до воскресенья: сундук: {prize}. Невыполненные перейдут на следующую неделю.
            </span>
            <div>
                {quests.map((q) => (
                    <div key={q.title} className={`quest-row ${q.done ? 'done' : ''}`}>
                        <span className="quest-check">{q.done && <CheckIcon weight="bold" />}</span>
                        <span className="grow">{q.title}</span>
                        <span className="small">{q.meta}</span>
                    </div>
                ))}
            </div>
            {done === 5 && !game.chestOpened && (
                <button
                    className="btn block tall pink"
                    onClick={() => {
                        action.mutate({ type: 'chest/open', teen });
                        openOverlay('levelup');
                    }}
                >
                    <TreasureChestIcon size={22} weight="duotone" />
                    Открыть сундук недели
                </button>
            )}
        </Sheet>
    );
}

function BuildingSheet({ game, id }: { game: GameState; id: string }) {
    const closeSheet = useUi((s) => s.closeSheet);
    const flash = useUi((s) => s.flash);
    const b = buildingById(id);
    const locked = game.level < b.minL;

    return (
        <Sheet>
            <span className={`kicker ${locked ? '' : 'accent'}`}>
                {locked ? `Строится · откроется на уровне ${b.minL}` : b.kind === 'plot' ? 'Твоя земля' : 'Открыто'}
            </span>
            <span className="display sheet-title">{b.name}</span>
            <span className="body">{b.desc}</span>
            <button
                className={`btn block tall ${locked ? 'ghost' : ''}`}
                onClick={() => {
                    closeSheet();
                    if (!locked) flash(`Здесь откроется экран «${b.name}»`);
                }}
            >
                {locked ? 'Понятно' : b.btn}
            </button>
        </Sheet>
    );
}
