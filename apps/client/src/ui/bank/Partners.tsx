import { PARTNERS, type GameState } from '@mt/shared';
import { BuildingsIcon, CaretLeftIcon, StarIcon } from '@phosphor-icons/react';
import { useUi } from '../../store/ui';
import { byn } from '../format';
import { familyChild } from '../roles';

/** Партнёры семьи и баллы: у ребёнка и у родителя они копятся отдельно */
export function Partners({ game }: { game: GameState }) {
    const role = useUi((s) => s.role);
    const set = useUi((s) => s.set);
    const isParent = role === 'parent';
    const child = familyChild(game);
    const mine = isParent ? game.points.parent : game.points.child;
    const other = isParent ? game.points.child : game.points.parent;

    return (
        <div className="bank-page plain scroll">
            <div className="page-bar">
                <div className="page-bar-inner">
                    <button className="icon-btn" onClick={() => set({ page: null })} aria-label="Назад">
                        <CaretLeftIcon size={22} />
                    </button>
                    <div className="stack grow" style={{ lineHeight: 1.15 }}>
                        <span className="page-kicker">ПРОГРАММА ЛОЯЛЬНОСТИ</span>
                        <span className="display" style={{ fontSize: 18 }}>
                            Партнёры семьи
                        </span>
                    </div>
                </div>
            </div>
            <div className="stack" style={{ padding: '6px 16px 28px', gap: 20 }}>
                <div className="points-hero">
                    <StarIcon size={34} weight="fill" color="var(--yellow)" />
                    <div className="stack grow" style={{ gap: 2 }}>
                        <span className="tiny">{isParent ? 'Ваши баллы' : 'Твои баллы'}</span>
                        <span className="display" style={{ fontSize: 28 }}>
                            {mine}
                        </span>
                        <span className="tiny">≈ {byn(mine)} BYN · 100 баллов = 1 BYN</span>
                    </div>
                    <div className="stack right" style={{ gap: 2 }}>
                        <span className="tiny">{isParent ? `у ${child.gen}` : 'у мамы'}</span>
                        <b>{other}</b>
                    </div>
                </div>
                <span className="small">
                    {isParent
                        ? `Баллы ребёнка и ваши копятся отдельно. Когда ${child.name} платит у партнёров, вам начисляется семейный бонус 1%.`
                        : 'Плати детской картой у партнёров — получишь баллы. Их можно потратить на покупки у тех же партнёров.'}
                </span>
                <div className="stack" style={{ gap: 8 }}>
                    {PARTNERS.map((p) => (
                        <div key={p.id} className="partner-row">
                            <div className="partner-logo">{p.name.replace(/[«»]/g, '')[0]}</div>
                            <div className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                                <span className="tiny muted">{p.kind}</span>
                                <b>{p.name}</b>
                                <span className="small" style={{ fontSize: 13 }}>
                                    {p.offer}
                                </span>
                                {p.city && (
                                    <span className="city-tag">
                                        <BuildingsIcon size={14} weight="duotone" />
                                        есть в МТ Сити
                                    </span>
                                )}
                            </div>
                            {p.cb > 0 && <span className="cb-chip">{p.cb}%</span>}
                        </div>
                    ))}
                </div>
                <span className="tiny muted">Партнёры и условия в демо приблизительные.</span>
            </div>
        </div>
    );
}
