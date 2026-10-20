import { FEATURES, CHILD_PRODUCTS, type ChildRequest, type GameState } from '@mt/shared';
import { BellRingingIcon, HandCoinsIcon, KeyIcon, ShieldWarningIcon, StarIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn } from '../format';
import { familyChild } from '../roles';
import { OpRow } from '../components/OpRow';

const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

function requestTitle(r: ChildRequest) {
    if (r.kind === 'money') return `Просит ${byn(r.amt ?? 0)} BYN`;
    const name = [...FEATURES, ...CHILD_PRODUCTS].find((x) => x.id === r.key)?.name ?? '';
    return r.kind === 'feature' ? `Просит включить: ${name}` : `Просит открыть: ${name}`;
}

/** Решения родителя: покупки на подтверждение и просьбы ребёнка. Показываются над вкладками кабинета. */
export function Decisions({ game }: { game: GameState }) {
    const action = useGameAction();
    const flash = useUi((s) => s.flash);
    const child = familyChild(game);
    const teen = game.pkg?.age === 'teen';
    const pending = game.ops.filter((o) => o.status === 'pending');
    const reqs = game.requests.filter((r) => r.status === 'open');
    if (!pending.length && !reqs.length) return null;
    const toast = (m: string) => flash(m, 'parentToast');

    return (
        <div className="stack" style={{ gap: 10 }}>
            <span className="h2">Ждёт вашего решения</span>
            {pending.map((o) => (
                <div key={o.id} className="decision">
                    <div className="row" style={{ gap: 12 }}>
                        <ShieldWarningIcon size={28} weight="duotone" color="var(--yellow)" />
                        <div className="stack grow" style={{ lineHeight: 1.25 }}>
                            <b>{o.title}</b>
                            <span className="small" style={{ fontSize: 13 }}>
                                {child.name} хочет оплатить картой
                            </span>
                        </div>
                        <b className="num">{byn(o.amt)}</b>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                        <button
                            className="btn ghost"
                            style={{ flex: 1 }}
                            onClick={() => {
                                action.mutate({ type: 'op/decline', id: o.id });
                                toast('Покупка отклонена');
                            }}
                        >
                            Отклонить
                        </button>
                        <button
                            className="btn"
                            style={{ flex: 2 }}
                            onClick={() => {
                                action.mutate({ type: 'op/approve', id: o.id, teen });
                                toast('Покупка подтверждена');
                            }}
                        >
                            Разрешить · {byn(o.amt)} BYN
                        </button>
                    </div>
                </div>
            ))}
            {reqs.map((r) => {
                const Ico = r.kind === 'money' ? HandCoinsIcon : KeyIcon;
                return (
                    <div key={r.id} className="decision">
                        <div className="row" style={{ gap: 12 }}>
                            <Ico size={28} weight="duotone" color="var(--accent-700)" />
                            <div className="stack grow" style={{ lineHeight: 1.25 }}>
                                <b>
                                    {child.name}: {lowerFirst(requestTitle(r))}
                                </b>
                                {r.note && (
                                    <span className="small" style={{ fontSize: 13 }}>
                                        «{r.note}»
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="row" style={{ gap: 8 }}>
                            <button
                                className="btn ghost"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    action.mutate({ type: 'req/resolve', id: r.id, ok: false });
                                    toast('Просьба отклонена');
                                }}
                            >
                                Нет
                            </button>
                            <button
                                className="btn"
                                style={{ flex: 2 }}
                                onClick={() => {
                                    action.mutate({ type: 'req/resolve', id: r.id, ok: true });
                                    toast(
                                        r.kind === 'money'
                                            ? `Переведено ${byn(r.amt ?? 0)} BYN ${child.dat}`
                                            : 'Разрешено',
                                    );
                                }}
                            >
                                {r.kind === 'money' ? `Перевести ${byn(r.amt ?? 0)} BYN` : 'Разрешить'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/** Уведомления и операции по карте ребёнка */
export function OpsTab({ game }: { game: GameState }) {
    const set = useUi((s) => s.set);
    const child = familyChild(game);
    const declined = game.ops.filter((o) => o.status === 'declined').length;
    const done = game.ops.filter((o) => o.status === 'done' && !o.income);
    const total = done.reduce((a, o) => a + o.amt, 0);

    return (
        <div className="stack" style={{ gap: 18 }}>
            <div className="grid-2">
                <div className="stat-tile">
                    <span>Потрачено за месяц</span>
                    <b>{byn(game.spent.month)}</b>
                </div>
                <div className="stat-tile">
                    <span>Отклонено банком</span>
                    <b className={declined ? 'neg' : ''}>{declined}</b>
                </div>
            </div>
            <button className="points-card" onClick={() => set({ page: 'partners' })}>
                <StarIcon size={26} weight="fill" color="var(--yellow)" />
                <div className="stack grow" style={{ gap: 2 }}>
                    <b>Ваши баллы: {game.points.parent}</b>
                    <span className="tiny muted">
                        у {child.gen} {game.points.child} · копятся отдельно, 100 баллов = 1 BYN
                    </span>
                </div>
            </button>
            <div className="stack" style={{ gap: 4 }}>
                <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                    <BellRingingIcon size={20} weight="duotone" color="var(--accent-700)" />
                    <span className="h2">Уведомления об операциях</span>
                </div>
                {game.ops.map((o) => (
                    <OpRow key={o.id} op={o} />
                ))}
                <span className="tiny muted" style={{ marginTop: 8 }}>
                    Всего покупок на {byn(total)} BYN. О каждой операции приходит пуш в Moby.
                </span>
            </div>
        </div>
    );
}
