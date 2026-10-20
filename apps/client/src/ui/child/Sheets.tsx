import { BUILDINGS, PATH, nodeStatus, weekQuests, type GameState, type PlayerDto } from '@mt/shared';
import { CheckIcon, HandHeartIcon, HeadphonesIcon, PercentIcon, PiggyBankIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { Sheet } from '../components/Sheet';
import { byn, coins } from '../format';
import { Bank } from '../screens/Bank';
import { Shop } from '../screens/Shop';
import { BusinessBuilder, Jobs, LegalCenter, Market, Medical } from '../screens/placeholders';

const KICKERS = {
    lesson: 'Урок',
    dream: 'Квест · симуляция',
    quiz: 'Урок · квиз',
    chest: 'Награда недели',
    next: 'Следующий уровень',
} as const;

export function ChildSheets({ me, game }: { me: PlayerDto; game: GameState }) {
    const sheet = useUi((s) => s.sheet);
    const close = useUi((s) => s.closeSheet);
    if (!sheet) return null;

    switch (sheet.type) {
        case 'node':
            return <NodeSheet id={sheet.id} game={game} />;
        case 'week':
            return <WeekSheet game={game} />;
        case 'profile':
            return <ProfileSheet me={me} game={game} />;
        case 'building':
            switch (sheet.id) {
                case 'bank':
                    return <Bank onClose={close} />;
                case 'sosedi':
                case 'green':
                case 'cofix':
                    return (
                        <Shop
                            shopId={sheet.id}
                            title={BUILDINGS.find((b) => b.id === sheet.id)!.name}
                            onClose={close}
                        />
                    );
                case 'jobs':
                    return <Jobs onClose={close} />;
                case 'medical':
                    return <Medical onClose={close} />;
                case 'plot':
                    return <BusinessBuilder onClose={close} />;
                case 'market':
                    return <Market onClose={close} />;
                case 'legal':
                    return <LegalCenter onClose={close} />;
            }
    }
}

function NodeSheet({ id, game }: { id: number; game: GameState }) {
    const close = useUi((s) => s.closeSheet);
    const openOverlay = useUi((s) => s.openOverlay);
    const action = useGameAction();
    const node = PATH.find((n) => n.id === id)!;
    const st = nodeStatus(game, node);
    const prev = PATH[id - 2];
    const weekDone = weekQuests(game).filter((q) => q.done).length;

    const desc =
        st === 'done'
            ? node.kind === 'dream'
                ? 'Пройдено. Можно сыграть ещё раз и попробовать уложиться быстрее.'
                : 'Пройдено. Ты получил за этот урок 20 знаний.'
            : st === 'locked'
              ? node.kind === 'chest'
                  ? `Откроется, когда выполнишь все пять квестов недели. Сейчас ${weekDone} из 5.`
                  : node.kind === 'next'
                    ? node.desc
                    : `Сначала пройди «${prev.title}».`
              : node.desc;

    const primary = st === 'current' && node.kind !== 'next';
    const label =
        st === 'locked'
            ? 'Понятно'
            : st === 'done'
              ? node.kind === 'dream'
                  ? 'Сыграть ещё раз'
                  : 'Закрыть'
              : node.kind === 'chest'
                ? 'Открыть сундук'
                : node.kind === 'next'
                  ? 'Понятно'
                  : node.kind === 'dream'
                    ? 'Начать квест'
                    : 'Начать урок';

    const onAction = () => {
        if (st === 'locked') return close();
        if (node.kind === 'dream') return openOverlay('dream');
        if (node.kind === 'quiz' && st === 'current') return openOverlay('quiz');
        if (node.kind === 'chest' && st === 'current') {
            action.mutate({ type: 'chest/open' });
            return openOverlay('levelup');
        }
        close();
    };

    return (
        <Sheet>
            <div className="stack" style={{ gap: 6 }}>
                <span className={`kicker ${st === 'current' ? 'accent-2' : ''}`}>
                    {KICKERS[node.kind]}
                    {st === 'done' ? ' · пройдено' : st === 'locked' ? ' · закрыто' : ''}
                </span>
                <span className="h1" style={{ fontSize: 26 }}>
                    {node.title}
                </span>
                <p className="body">{desc}</p>
            </div>
            <button className={`btn ${primary ? '' : 'ghost'}`} onClick={onAction}>
                {label}
            </button>
        </Sheet>
    );
}

function WeekSheet({ game }: { game: GameState }) {
    return (
        <Sheet>
            <div className="stack" style={{ gap: 6 }}>
                <span className="h1" style={{ fontSize: 26 }}>
                    Квесты недели
                </span>
                <p className="body">
                    Выполни все пять до воскресенья и открой сундук: там уровень {game.level + 1} и 100 MTcoin. Что не
                    успеешь — перейдёт на следующую неделю.
                </p>
            </div>
            <div>
                {weekQuests(game).map((q) => (
                    <div key={q.title} className="row" style={{ padding: '10px 0', justifyContent: 'flex-start' }}>
                        <span
                            style={{
                                width: 24,
                                height: 24,
                                flex: 'none',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: q.done ? 'var(--accent)' : 'transparent',
                                border: q.done ? 0 : '1.5px solid var(--line)',
                                color: '#fff',
                                fontSize: 13,
                            }}
                        >
                            {q.done && <CheckIcon weight="bold" />}
                        </span>
                        <span
                            style={{
                                flex: 1,
                                fontSize: 15,
                                color: q.done ? 'var(--faint)' : 'var(--text)',
                                textDecoration: q.done ? 'line-through' : 'none',
                            }}
                        >
                            {q.title}
                        </span>
                        <span className="small num">{q.meta}</span>
                    </div>
                ))}
            </div>
        </Sheet>
    );
}

function ProfileSheet({ me, game }: { me: PlayerDto; game: GameState }) {
    const paid = game.tasks.filter((t) => t.status === 'paid').length;
    const awards = [
        { t: 'Первый вклад', on: true, Icon: PiggyBankIcon },
        { t: 'Мечтатель', on: game.dreamDone, Icon: HeadphonesIcon },
        { t: 'Помощник', on: paid >= 2, Icon: HandHeartIcon },
        { t: 'Знаток процентов', on: game.quizDone, Icon: PercentIcon },
    ];
    const done = [
        { t: 'Откуда берутся деньги', pts: '+20' },
        { t: 'Нужды и хотелки', pts: '+20' },
        { t: 'Бюджет на неделю', pts: '+20' },
        ...(game.dreamDone ? [{ t: 'Накопи на мечту', pts: '+60' }] : []),
        ...(game.quizDone ? [{ t: 'Копилка и проценты', pts: '+40' }] : []),
    ];

    return (
        <Sheet>
            <div className="row" style={{ justifyContent: 'flex-start', gap: 16 }}>
                <div
                    className="avatar"
                    style={{ width: 64, height: 64, fontSize: 28, display: 'grid', placeItems: 'center' }}
                >
                    {me.name[0]}
                </div>
                <div className="stack" style={{ gap: 0 }}>
                    <span className="h1" style={{ fontSize: 26 }}>
                        {me.name}, {me.age} лет
                    </span>
                    <span className="small">Уровень {game.level} · неделя 12</span>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                <Big value={game.knowledge} label="очков знаний" />
                <Big value={coins(game.coins)} label="MTcoin" />
                <Big value={byn(game.byn)} label="BYN на карте" accent />
            </div>
            <div className="stack">
                <h3 className="h2">Награды</h3>
                <div className="badges">
                    {awards.map(({ t, on, Icon }) => (
                        <div key={t} className={`award ${on ? 'on' : ''}`}>
                            <div className="disc">
                                <Icon size={28} weight="duotone" />
                            </div>
                            {t}
                        </div>
                    ))}
                </div>
            </div>
            <div className="stack" style={{ gap: 0 }}>
                <h3 className="h2">Пройдено</h3>
                {done.map((d) => (
                    <div key={d.t} className="row" style={{ fontSize: 15, padding: '6px 0' }}>
                        <span>{d.t}</span>
                        <span className="muted num">{d.pts}</span>
                    </div>
                ))}
            </div>
        </Sheet>
    );
}

function Big({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
    return (
        <div className="stack" style={{ gap: 0 }}>
            <span
                className="num"
                style={{ fontSize: 26, fontWeight: 700, color: accent ? 'var(--accent-700)' : undefined }}
            >
                {value}
            </span>
            <span className="small">{label}</span>
        </div>
    );
}
