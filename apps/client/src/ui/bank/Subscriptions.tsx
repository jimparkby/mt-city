import { useState } from 'react';
import { SUB_KINDS, subDuplicates, subsTotals, type GameState, type Member, type Subscription } from '@mt/shared';
import {
    BookOpenIcon,
    CaretLeftIcon,
    CloudIcon,
    FilmSlateIcon,
    GameControllerIcon,
    LightbulbIcon,
    MusicNotesIcon,
    PauseIcon,
    PlayIcon,
    TrashIcon,
    type Icon,
} from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn } from '../format';
import { KID, PARENT_NAME, TEEN } from '../roles';
import { SwitchRow } from '../parent/Control';

const KIND_ICONS: Record<Subscription['kind'], Icon> = {
    music: MusicNotesIcon,
    video: FilmSlateIcon,
    games: GameControllerIcon,
    cloud: CloudIcon,
    edu: BookOpenIcon,
};

const MEMBERS: { id: Member; name: string; gen: string; sub: string; color: string }[] = [
    { id: 'parent', name: PARENT_NAME, gen: 'Ольги', sub: 'родитель', color: '#2f6bf0' },
    { id: 'kid', name: KID.name, gen: KID.gen, sub: '7–13 лет', color: '#e0218a' },
    { id: 'teen', name: TEEN.name, gen: TEEN.gen, sub: '14–17 лет', color: '#ffd23f' },
];

const memberName = (id: Member) => MEMBERS.find((m) => m.id === id)!.name;
const memberGen = (id: Member) => MEMBERS.find((m) => m.id === id)!.gen;

/** Подписки семьи: кто что подключил и сколько это стоит в месяц. Ребёнок видит только свои. */
export function Subscriptions({ game }: { game: GameState }) {
    const role = useUi((s) => s.role);
    const set = useUi((s) => s.set);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const isParent = role === 'parent';
    const [filter, setFilter] = useState<Member | 'all'>('all');
    // Ребёнок видит только свои подписки; родитель — всю семью
    const own: Member | null = isParent ? null : role === 'teen' ? 'teen' : 'kid';
    const subs = game.subs.filter((x) => (own ? x.who === own : filter === 'all' || x.who === filter));
    const totals = subsTotals(own ? game.subs.filter((x) => x.who === own) : game.subs);
    const shown = subsTotals(subs).total;
    const dups = isParent ? subDuplicates(game.subs) : [];
    const groups = MEMBERS.filter((m) => subs.some((x) => x.who === m.id));
    const toast = (m: string) => flash(m, isParent ? 'parentToast' : 'bankToast');

    return (
        <div className="bank-page plain scroll">
            <div className="page-bar">
                <div className="page-bar-inner">
                    <button className="icon-btn" onClick={() => set({ page: null })} aria-label="Назад">
                        <CaretLeftIcon size={22} />
                    </button>
                    <div className="stack grow" style={{ lineHeight: 1.15 }}>
                        <span className="page-kicker">ПОДПИСКИ</span>
                        <span className="display" style={{ fontSize: 18 }}>
                            {isParent ? 'Подписки семьи' : 'Мои подписки'}
                        </span>
                    </div>
                    <div className="stack right" style={{ lineHeight: 1.15 }}>
                        <b className="num">{byn(totals.total)}</b>
                        <span className="tiny muted">BYN в месяц</span>
                    </div>
                </div>
            </div>
            <div className="stack" style={{ padding: '6px 16px 28px', gap: 20 }}>
                <div className="subs-hero">
                    <span className="tiny">{isParent ? 'Вся семья тратит на подписки' : 'Ты тратишь на подписки'}</span>
                    <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
                        <span className="display num" style={{ fontSize: 30 }}>
                            {byn(totals.total)}
                        </span>
                        <span className="small" style={{ color: 'rgba(255,255,255,.8)' }}>
                            BYN в месяц · {byn(totals.total * 12)} в год
                        </span>
                    </div>
                    {isParent && totals.total > 0 && (
                        <>
                            <div className="subs-bar">
                                {MEMBERS.map((m) =>
                                    totals.by[m.id] ? (
                                        <div
                                            key={m.id}
                                            style={{ flex: totals.by[m.id], background: m.color }}
                                            title={m.name}
                                        />
                                    ) : null,
                                )}
                            </div>
                            <div className="subs-legend">
                                {MEMBERS.map((m) => (
                                    <span key={m.id}>
                                        <i style={{ background: m.color }} />
                                        {m.name} · <b className="num">{byn(totals.by[m.id])}</b>
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {isParent && (
                    <div className="row scroll" style={{ gap: 6, overflowX: 'auto' }}>
                        {(['all', ...MEMBERS.map((m) => m.id)] as const).map((id) => (
                            <button
                                key={id}
                                className={`seg-btn filter-chip ${filter === id ? 'on' : ''}`}
                                onClick={() => setFilter(id)}
                            >
                                {id === 'all' ? 'Все' : memberName(id)}
                            </button>
                        ))}
                    </div>
                )}

                {dups.map((d) => (
                    <div key={d.kind} className="tip">
                        <LightbulbIcon size={24} weight="duotone" />
                        <span>
                            «{SUB_KINDS[d.kind]}» подключена у {d.who.map(memberGen).join(' и ')} — {byn(d.amt)} BYN в
                            месяц. Семейный тариф обычно дешевле, чем несколько отдельных.
                        </span>
                    </div>
                ))}

                {groups.length === 0 && <span className="small">Подписок пока нет.</span>}
                {groups.map((m) => (
                    <div key={m.id} className="stack" style={{ gap: 8 }}>
                        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span className="h2">
                                {own ? 'Мои' : m.name}
                                {!own && <span className="small"> · {m.sub}</span>}
                            </span>
                            {!own && filter === 'all' && (
                                <span className="small num">{byn(totals.by[m.id])} BYN/мес.</span>
                            )}
                        </div>
                        {subs
                            .filter((x) => x.who === m.id)
                            .map((x) => {
                                const Ico = KIND_ICONS[x.kind];
                                const paused = x.status === 'paused';
                                return (
                                    <div key={x.id} className={`sub-row ${paused ? 'paused' : ''}`}>
                                        <span className="sub-icon" style={{ color: m.color }}>
                                            <Ico size={22} weight="duotone" />
                                        </span>
                                        <div className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                                            <b className="ellipsis">{x.name}</b>
                                            <span className="tiny muted">
                                                {SUB_KINDS[x.kind]} ·{' '}
                                                {paused ? 'на паузе' : x.amt ? `списание ${x.day} числа` : x.note}
                                            </span>
                                            <div className="row" style={{ gap: 14, marginTop: 4 }}>
                                                <button
                                                    className="link-button sub-act"
                                                    onClick={() => {
                                                        action.mutate({ type: 'sub/pause', id: x.id });
                                                        toast(
                                                            paused
                                                                ? `«${x.name}» снова работает`
                                                                : `«${x.name}» на паузе`,
                                                        );
                                                    }}
                                                >
                                                    {paused ? <PlayIcon size={14} /> : <PauseIcon size={14} />}
                                                    {paused ? 'Возобновить' : 'Пауза'}
                                                </button>
                                                <button
                                                    className="link-button sub-act danger"
                                                    onClick={() => {
                                                        action.mutate({ type: 'sub/cancel', id: x.id });
                                                        toast(`Подписка «${x.name}» отменена`);
                                                    }}
                                                >
                                                    <TrashIcon size={14} />
                                                    Отменить
                                                </button>
                                            </div>
                                        </div>
                                        <div className="stack right">
                                            <b className="num">{x.amt ? byn(x.amt) : '0,00'}</b>
                                            <span className="tiny muted">в месяц</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                ))}

                {isParent ? (
                    <div className="list-card">
                        <SwitchRow
                            title="Подписки 7–13 лет — с моего согласия"
                            hint={`Списание начнётся, только когда вы разрешите. ${TEEN.name} (14–17) подключает подписки сам — они всё равно видны здесь`}
                            on={game.controls.subsApproval}
                            onToggle={() =>
                                action.mutate({
                                    type: 'controls/set',
                                    patch: { subsApproval: !game.controls.subsApproval },
                                })
                            }
                        />
                    </div>
                ) : (
                    <span className="tiny muted">
                        {game.controls.subsApproval && own === 'kid'
                            ? 'Новую подписку мама подтверждает в своём Moby — без её согласия деньги не спишутся.'
                            : 'Ты подключаешь подписки сам, а мама видит их в Moby Семье. Каждая списывает деньги каждый месяц — следи за итогом.'}
                    </span>
                )}
                {shown !== totals.total && filter !== 'all' && (
                    <span className="tiny muted">
                        Показано на {byn(shown)} BYN из {byn(totals.total)} BYN.
                    </span>
                )}
            </div>
        </div>
    );
}
