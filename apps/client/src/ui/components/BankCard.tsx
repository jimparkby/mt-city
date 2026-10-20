import type { ReactNode } from 'react';
import { WifiHighIcon } from '@phosphor-icons/react';
import type { CardLook } from '../art/avatar';

interface Props {
    look: CardLook;
    title: string;
    subtitle: string;
    number: string;
    holder: string;
    /** Логотип платёжной системы: Mastercard (Moby Kids) или VISA (Moby Teen) */
    brand: 'mc' | 'visa';
    children?: ReactNode;
}

/** Банковская карта Moby в натуральную величину: фон, узор, блик, чип и реквизиты */
export function BankCard({ look, title, subtitle, number, holder, brand, children }: Props) {
    return (
        <div className="bank-card" style={{ background: look.bg }}>
            <div className="bank-card-pattern" style={{ background: look.pat }} />
            <div className="bank-card-gloss" />
            <div className="bank-card-head">
                <div className="row" style={{ gap: 8 }}>
                    <span className="mt-mark">MT</span>
                    <div className="bank-card-title">
                        <b>{title}</b>
                        <span>{subtitle}</span>
                    </div>
                </div>
                <WifiHighIcon size={26} style={{ transform: 'rotate(90deg)' }} />
            </div>
            <div className="chip" />
            <div className="bank-card-foot">
                <span className="pan">{number}</span>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
                    <div className="row" style={{ gap: 16, alignItems: 'flex-end' }}>
                        <b className="holder">{holder}</b>
                        <span className="exp">12/29</span>
                    </div>
                    {brand === 'visa' ? (
                        <span className="visa">VISA</span>
                    ) : (
                        <span className="mc">
                            <i />
                            <i />
                        </span>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
}

/** Маленькое превью карты для плитки магазина */
export function MiniCard() {
    return (
        <div className="mini-card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="mt-mark small">MT</span>
                <WifiHighIcon size={14} style={{ transform: 'rotate(90deg)' }} />
            </div>
            <div className="chip small" />
            <div className="row" style={{ justifyContent: 'flex-end' }}>
                <span className="mc small">
                    <i />
                    <i />
                </span>
            </div>
        </div>
    );
}
