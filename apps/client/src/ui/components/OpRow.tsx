import { PARTNERS, type CardOp } from '@mt/shared';
import { byn, when } from '../format';
import { CAT_ICONS } from '../icons';

const STATUS: Record<CardOp['status'], string> = {
    done: '',
    declined: 'Отклонено',
    pending: 'Ждёт подтверждения',
    disputed: 'Оспаривается',
};

/** Операция по детской карте: иконка категории, сумма, статус и причина отказа */
export function OpRow({ op, action }: { op: CardOp; action?: { label: string; onClick: () => void } }) {
    const Ico = CAT_ICONS[op.cat];
    const partner = PARTNERS.find((p) => p.id === op.partner);
    return (
        <div className={`op-row ${op.status} ${op.income ? 'income' : ''}`}>
            <span className="op-cat">
                <Ico size={22} weight="duotone" />
            </span>
            <div className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                <b className="ellipsis">{op.title}</b>
                <span className="tiny muted">
                    {when(op.at)}
                    {partner && op.status === 'done' ? ` · партнёр, +${partner.cb}% баллами` : ''}
                </span>
                {op.status !== 'done' && (
                    <span className="op-status">
                        {STATUS[op.status]}
                        {op.reason && op.status !== 'pending' ? ` · ${op.reason}` : ''}
                    </span>
                )}
                {action && (
                    <button className="link-button op-action" onClick={action.onClick}>
                        {action.label}
                    </button>
                )}
            </div>
            <b className="num op-amt">
                {op.income ? '+' : '−'}
                {byn(op.amt)}
            </b>
        </div>
    );
}
