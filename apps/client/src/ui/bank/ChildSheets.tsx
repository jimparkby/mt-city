import { useState } from 'react';
import { MERCHANTS, PARTNERS, checkPurchase, type GameState } from '@mt/shared';
import { GlobeIcon, StarIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn } from '../format';
import { CAT_ICONS } from '../icons';
import { useTeen } from '../roles';
import { Sheet } from '../components/Sheet';

/** Шторки Moby у ребёнка */
export function ChildBankSheets({ game }: { game: GameState }) {
    const sheet = useUi((s) => s.bankSheet);
    const set = useUi((s) => s.set);
    if (!sheet) return null;
    const close = () => set({ bankSheet: null });
    return <Sheet onClose={close}>{sheet === 'pay' ? <PaySheet game={game} /> : <AskSheet onDone={close} />}</Sheet>;
}

/** Демо-оплата: ребёнок «покупает», а банк проверяет её по настройкам родителя */
function PaySheet({ game }: { game: GameState }) {
    const teen = useTeen();
    const flash = useUi((s) => s.flash);
    const set = useUi((s) => s.set);
    const action = useGameAction();

    return (
        <>
            <span className="display sheet-title" style={{ marginTop: 0 }}>
                Оплатить картой
            </span>
            <span className="small">Выбери покупку — банк проверит её по правилам, которые настроила мама.</span>
            <div className="stack" style={{ gap: 6 }}>
                {MERCHANTS.map((m) => {
                    const Ico = CAT_ICONS[m.cat];
                    const partner = PARTNERS.find((p) => p.id === m.partner);
                    return (
                        <button
                            key={m.id}
                            className="merchant"
                            onClick={() => {
                                const r = checkPurchase(game, m, teen);
                                action.mutate({ type: 'op/pay', merchant: m.id, teen });
                                set({ bankSheet: null });
                                flash(
                                    r.status === 'done'
                                        ? `Оплачено: ${m.title} · ${byn(m.amt)} BYN${partner ? ` · +${Math.round((m.amt * partner.cb) / 100)} баллов` : ''}`
                                        : r.status === 'pending'
                                          ? 'Покупка ждёт подтверждения мамы'
                                          : `Отклонено: ${r.reason}`,
                                    'bankToast',
                                );
                            }}
                        >
                            <span className="op-cat">
                                <Ico size={22} weight="duotone" />
                            </span>
                            <div className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                                <b className="ellipsis">{m.title}</b>
                                <span className="tiny muted row" style={{ gap: 4 }}>
                                    {m.online && <GlobeIcon size={13} />}
                                    {m.online ? 'в интернете' : 'в магазине'}
                                    {partner && (
                                        <>
                                            {' · '}
                                            <StarIcon size={13} weight="fill" color="var(--yellow)" /> партнёр{' '}
                                            {partner.cb}%
                                        </>
                                    )}
                                </span>
                            </div>
                            <b className="num">{byn(m.amt)}</b>
                        </button>
                    );
                })}
            </div>
        </>
    );
}

const AMOUNTS = [200, 500, 1_000, 2_000];

/** Попросить у родителя денег */
function AskSheet({ onDone }: { onDone: () => void }) {
    const action = useGameAction();
    const flash = useUi((s) => s.flash);
    const [amt, setAmt] = useState(500);
    const [note, setNote] = useState('');

    return (
        <>
            <span className="display sheet-title" style={{ marginTop: 0 }}>
                Попросить у мамы
            </span>
            <span className="small">Мама получит просьбу в Moby и сможет сразу перевести деньги на твою карту.</span>
            <div className="row" style={{ gap: 6 }}>
                {AMOUNTS.map((v) => (
                    <button key={v} className={`seg-btn tall ${amt === v ? 'on' : ''}`} onClick={() => setAmt(v)}>
                        {v / 100} BYN
                    </button>
                ))}
            </div>
            <input
                className="text-input"
                value={note}
                maxLength={60}
                onChange={(e) => setNote(e.target.value)}
                placeholder="На что? Например: на подарок другу"
            />
            <button
                className="btn block tall"
                onClick={() => {
                    action.mutate({ type: 'req/create', kind: 'money', amt, note: note.trim() });
                    flash('Просьба отправлена маме', 'bankToast');
                    onDone();
                }}
            >
                Попросить {byn(amt)} BYN
            </button>
        </>
    );
}
