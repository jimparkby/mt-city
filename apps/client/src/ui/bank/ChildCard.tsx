import { useState } from 'react';
import { CARD_TIERS, FEATURES, INSURANCE, childCardTail, subsTotals, tierIndex, type GameState } from '@mt/shared';
import {
    CaretLeftIcon,
    CheckCircleIcon,
    HeartbeatIcon,
    LockSimpleIcon,
    PhoneCallIcon,
    RepeatIcon,
    SnowflakeIcon,
    WarningIcon,
    XCircleIcon,
} from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn } from '../format';
import { KID, TEEN, useTeen } from '../roles';
import { SKIN_LOOKS, TIER_LOOKS } from '../art/avatar';
import { BankCard } from '../components/BankCard';
import { OpRow } from '../components/OpRow';

/** Экран детской карты: статус, остаток лимитов, что разрешено, операции, потеря карты и спорные операции */
export function ChildCard({ game }: { game: GameState }) {
    const teen = useTeen();
    const set = useUi((s) => s.set);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const [confirmLost, setConfirmLost] = useState(false);
    const c = game.controls;
    const child = teen ? TEEN : KID;
    const ti = tierIndex(game.level);
    const tail = childCardTail(game);
    const toast = (m: string) => flash(m, 'bankToast');
    const dayLeft = Math.max(0, c.dayLimit - game.spent.day);

    return (
        <div className="bank-page plain scroll">
            <div className="page-bar">
                <div className="page-bar-inner">
                    <button className="icon-btn" onClick={() => set({ page: null })} aria-label="Назад">
                        <CaretLeftIcon size={22} />
                    </button>
                    <div className="stack grow" style={{ lineHeight: 1.15 }}>
                        <span className="page-kicker">МОЯ КАРТА</span>
                        <span className="display" style={{ fontSize: 18 }}>
                            {child.card} •• {tail}
                        </span>
                    </div>
                    <div className="stack right" style={{ lineHeight: 1.15 }}>
                        <b className="num">{byn(game.byn)}</b>
                        <span className="tiny muted">BYN</span>
                    </div>
                </div>
            </div>
            <div className="stack" style={{ padding: '6px 16px 28px', gap: 20 }}>
                <div className={c.blocked ? 'card-frozen' : ''}>
                    <BankCard
                        look={teen ? TIER_LOOKS[ti] : SKIN_LOOKS[game.skin]}
                        title={child.card}
                        subtitle={
                            teen
                                ? `Кешбэк ${CARD_TIERS[ti].cb}%`
                                : game.pkg?.card === 'digital'
                                  ? 'Цифровая карта'
                                  : 'Физическая карта'
                        }
                        number={`${teen ? '4255' : '5310'} •••• •••• ${tail}`}
                        holder={child.name.toUpperCase()}
                        brand={teen ? 'visa' : 'mc'}
                    />
                    {c.blocked && (
                        <div className="frozen-badge">
                            <SnowflakeIcon size={18} weight="bold" />
                            {c.lost ? 'Заблокирована: потеряна' : 'Заблокирована'}
                        </div>
                    )}
                </div>

                <div className="card stack" style={{ gap: 10 }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                        <b>Можно потратить сегодня</b>
                        <b className="num">{byn(dayLeft)} BYN</b>
                    </div>
                    <div className="progress">
                        <div style={{ width: `${Math.min(100, (game.spent.day / c.dayLimit) * 100)}%` }} />
                    </div>
                    <span className="tiny muted">
                        Лимит {byn(c.dayLimit)} в день и {byn(c.monthLimit)} в месяц.
                        {c.approveOver ? ` Покупки дороже ${byn(c.approveOver)} BYN подтверждает мама.` : ''}
                    </span>
                </div>

                <div className="stack" style={{ gap: 8 }}>
                    <span className="h2">Что включено</span>
                    <div className="list-card">
                        {FEATURES.map((f) => (
                            <div key={f.id} className="feature-state">
                                {c.features[f.id] ? (
                                    <CheckCircleIcon size={22} weight="fill" color="var(--green)" />
                                ) : (
                                    <LockSimpleIcon size={22} color="var(--n-500)" />
                                )}
                                <span className="grow">{f.name}</span>
                                {!c.features[f.id] && (
                                    <button
                                        className="link-button"
                                        onClick={() => {
                                            action.mutate({ type: 'req/create', kind: 'feature', key: f.id, note: '' });
                                            toast('Просьба отправлена маме');
                                        }}
                                    >
                                        Попросить
                                    </button>
                                )}
                            </div>
                        ))}
                        <div className="feature-state">
                            <XCircleIcon size={22} weight="fill" color="var(--accent-2-700)" />
                            <span className="grow">Азартные игры и 18+ — запрещены для детских карт</span>
                        </div>
                    </div>
                </div>

                {game.insurance && (
                    <div className="tip">
                        <HeartbeatIcon size={24} weight="duotone" />
                        <span>
                            Ты застрахован: если что-то случится, страховка покроет до {byn(INSURANCE.cover)} BYN.
                            Покажи это сообщение маме или врачу.
                        </span>
                    </div>
                )}

                <button className="points-card subs" onClick={() => set({ page: 'subs' })}>
                    <RepeatIcon size={26} weight="duotone" color="var(--accent-700)" />
                    <div className="stack grow" style={{ gap: 2 }}>
                        <b>
                            Мои подписки:{' '}
                            {byn(subsTotals(game.subs.filter((x) => x.who === (teen ? 'teen' : 'kid'))).total)} BYN в
                            месяц
                        </b>
                        <span className="tiny muted">Сколько списывается каждый месяц</span>
                    </div>
                </button>

                <div className="stack" style={{ gap: 4 }}>
                    <span className="h2" style={{ marginBottom: 6 }}>
                        Операции
                    </span>
                    {game.ops.slice(0, 12).map((o) => (
                        <OpRow
                            key={o.id}
                            op={o}
                            action={
                                o.status === 'done' && !o.income
                                    ? {
                                          label: 'Не узнаю операцию — оспорить',
                                          onClick: () => {
                                              action.mutate({ type: 'op/dispute', id: o.id });
                                              toast('Заявка отправлена в банк. Мама тоже получила уведомление');
                                          },
                                      }
                                    : undefined
                            }
                        />
                    ))}
                </div>

                <div className="stack" style={{ gap: 10 }}>
                    <span className="h2">Потерял карту?</span>
                    {[
                        'Сразу заблокируй карту здесь — деньги останутся на счёте',
                        'Мама получит уведомление и закажет новую карту',
                        'Пока новая едет, плати цифровой картой в Moby',
                    ].map((t, n) => (
                        <div key={t} className="num-step">
                            <span className="num-disc">{n + 1}</span>
                            <span style={{ paddingTop: 4 }}>{t}</span>
                        </div>
                    ))}
                    {c.lost ? (
                        <span className="small">Карта заблокирована. Новую закажет мама в разделе «Контроль».</span>
                    ) : confirmLost ? (
                        <div className="row" style={{ gap: 8 }}>
                            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setConfirmLost(false)}>
                                Отмена
                            </button>
                            <button
                                className="btn danger"
                                style={{ flex: 2 }}
                                onClick={() => {
                                    action.mutate({ type: 'card/block', lost: true });
                                    setConfirmLost(false);
                                    toast('Карта заблокирована. Мама получила уведомление');
                                }}
                            >
                                Да, заблокировать
                            </button>
                        </div>
                    ) : (
                        <button className="btn block tall danger" onClick={() => setConfirmLost(true)}>
                            <WarningIcon size={22} weight="duotone" />
                            Заблокировать — потерял карту
                        </button>
                    )}
                    <span className="tiny muted row" style={{ gap: 6 }}>
                        <PhoneCallIcon size={16} />
                        Если кто-то звонит «из банка» и просит код — положи трубку и расскажи маме.
                    </span>
                </div>
            </div>
        </div>
    );
}
