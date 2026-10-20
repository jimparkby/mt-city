import { useState } from 'react';
import { TEEN_DEPOSITS, depositIncome, type GameState } from '@mt/shared';
import { CaretLeftIcon, CheckCircleIcon, CircleIcon, StarIcon, VaultIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn } from '../format';

/** Вклады в BYN для подростка: МТБелки и базовые, калькулятор дохода, открытие с детской карты */
export function Deposits({ game }: { game: GameState }) {
    const set = useUi((s) => s.set);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const [sel, setSel] = useState('b6');
    const [amt, setAmt] = useState(1_000);

    const d = TEEN_DEPOSITS.find((x) => x.id === sel) ?? TEEN_DEPOSITS[2];
    const star = TEEN_DEPOSITS[0];
    const inc = depositIncome(amt, d.rate, d.months);
    const can = amt <= game.byn;

    const open = () => {
        if (!can) return flash('Не хватает денег на карте', 'bankToast');
        action.mutate({ type: 'deposit/open', id: d.id, amt });
        flash(`Вклад «${d.name}» открыт на ${byn(amt)} BYN`, 'bankToast');
    };

    return (
        <div className="bank-page deposits scroll">
            <div className="page-bar">
                <div className="page-bar-inner">
                    <button className="icon-btn" onClick={() => set({ depositsOpen: false })} aria-label="Назад">
                        <CaretLeftIcon size={22} />
                    </button>
                    <div className="stack grow" style={{ minWidth: 0, lineHeight: 1.15 }}>
                        <span className="page-kicker orange">ВКЛАДЫ В BYN</span>
                        <span className="display" style={{ fontSize: 18 }}>
                            Деньги под проценты
                        </span>
                    </div>
                    <div className="stack right" style={{ lineHeight: 1.15 }}>
                        <b className="num">{byn(game.byn)}</b>
                        <span className="tiny muted">на карте</span>
                    </div>
                </div>
            </div>
            <div className="stack" style={{ padding: '6px 16px 28px', gap: 22 }}>
                <button className={`star-deposit ${sel === 'mtb' ? 'on' : ''}`} onClick={() => setSel('mtb')}>
                    <div className="star-blob one" />
                    <div className="star-blob two" />
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <span className="star-chip">
                            <StarIcon size={14} weight="fill" color="#ffd23f" />
                            ВКЛАД МТБАНКА
                        </span>
                        {sel === 'mtb' && <CheckCircleIcon size={26} weight="fill" />}
                    </div>
                    <div className="stack" style={{ gap: 2 }}>
                        <span className="display" style={{ fontSize: 26 }}>
                            {star.name}
                        </span>
                        <span className="star-sub">{star.sub}</span>
                    </div>
                    <div className="grid-3" style={{ gap: 6 }}>
                        {[
                            [star.rateT, 'ставка'],
                            ['от 10', 'BYN'],
                            [star.term, 'срок'],
                        ].map(([v, l]) => (
                            <div key={l} className="star-stat">
                                <b>{v}</b>
                                <span>{l}</span>
                            </div>
                        ))}
                    </div>
                </button>
                <div className="stack" style={{ gap: 8 }}>
                    <span className="h2">Базовые вклады</span>
                    {TEEN_DEPOSITS.slice(1).map((x) => (
                        <button
                            key={x.id}
                            className={`choice-row ${sel === x.id ? 'on' : ''}`}
                            onClick={() => setSel(x.id)}
                        >
                            <div className="rate-tile">{x.rateT}</div>
                            <div className="stack grow" style={{ minWidth: 0, gap: 2 }}>
                                <b>{x.name}</b>
                                <span className="tiny muted">
                                    {x.type} · {x.sub}
                                </span>
                            </div>
                            {sel === x.id ? (
                                <CheckCircleIcon size={24} weight="fill" color="var(--accent-700)" />
                            ) : (
                                <CircleIcon size={24} color="var(--n-500)" />
                            )}
                        </button>
                    ))}
                    <span className="tiny muted">
                        Отзывный — можно забрать досрочно. Безотзывный — деньги лежат до конца срока, зато ставка обычно
                        выше.
                    </span>
                </div>
                <div className="card stack" style={{ gap: 14, borderRadius: 22, padding: 16 }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                        <span className="h2" style={{ fontSize: 16 }}>
                            Калькулятор
                        </span>
                        <span className="tiny muted right">
                            {d.name} · {d.rateT}
                        </span>
                    </div>
                    <div className="row" style={{ gap: 10 }}>
                        <button className="step-btn" onClick={() => setAmt((a) => Math.max(1_000, a - 500))}>
                            −
                        </button>
                        <div className="stack grow center">
                            <span className="display num" style={{ fontSize: 28 }}>
                                {byn(amt)}
                            </span>
                            <span className="tiny muted">BYN на вклад</span>
                        </div>
                        <button className="step-btn" onClick={() => setAmt((a) => Math.min(100_000, a + 500))}>
                            +
                        </button>
                    </div>
                    <div className="grid-2">
                        <div className="stat-tile dark">
                            <span>Доход за {d.months} мес.</span>
                            <b className="pos">+{byn(inc)}</b>
                        </div>
                        <div className="stat-tile dark">
                            <span>Получишь в конце</span>
                            <b>{byn(amt + inc)}</b>
                        </div>
                    </div>
                    <button className="btn block tall" disabled={!can} onClick={open}>
                        {can ? `Открыть вклад на ${byn(amt)} BYN` : `На карте только ${byn(game.byn)} BYN`}
                    </button>
                </div>
                {game.deposits.length > 0 && (
                    <div className="stack" style={{ gap: 8 }}>
                        <span className="h2">Мои вклады</span>
                        {game.deposits.map((m, k) => (
                            <div key={k} className="card row" style={{ gap: 12, padding: '12px 14px' }}>
                                <VaultIcon size={26} weight="duotone" color="#ffb070" />
                                <div className="stack grow" style={{ minWidth: 0, gap: 2 }}>
                                    <b>{m.name}</b>
                                    <span className="tiny muted">
                                        {m.rateT} · {m.months} мес. · доход +{byn(m.inc)} BYN
                                    </span>
                                </div>
                                <b className="num">{byn(m.amt)}</b>
                            </div>
                        ))}
                    </div>
                )}
                <span className="tiny" style={{ color: 'var(--n-500)' }}>
                    Ставки и условия в демо приблизительные. Актуальные — на mtbank.by.
                </span>
            </div>
        </div>
    );
}
