import { INSURANCE, PARTNERS, type GameState } from '@mt/shared';
import { HeartbeatIcon, StarIcon } from '@phosphor-icons/react';
import { useUi } from '../../store/ui';
import { byn } from '../format';

/** Связь здания с реальным банком: партнёр семьи (скидка и баллы) и страховка в Медцентре */
export function LocationExtras({ game, loc }: { game: GameState; loc: string }) {
    const set = useUi((s) => s.set);
    const partner = PARTNERS.find((p) => p.city === loc);

    return (
        <>
            {partner && (
                <button
                    className="partner-banner"
                    onClick={() => set({ page: 'partners', bankTab: 'home', loc: null })}
                >
                    <StarIcon size={26} weight="fill" color="var(--yellow)" />
                    <div className="stack grow" style={{ gap: 2 }}>
                        <span className="bubble-kicker" style={{ margin: 0 }}>
                            ПАРТНЁР В НАСТОЯЩЕМ ГОРОДЕ
                        </span>
                        <b>{partner.offer}</b>
                        <span className="tiny muted">
                            Плати детской картой в {partner.name} — получишь {partner.cb}% баллами. Твои баллы:{' '}
                            {game.points.child}
                        </span>
                    </div>
                </button>
            )}
            {loc === 'med' && (
                <div className="partner-banner static">
                    <HeartbeatIcon size={26} weight="duotone" color="var(--accent-2-700)" />
                    <div className="stack grow" style={{ gap: 2 }}>
                        <span className="bubble-kicker" style={{ margin: 0 }}>
                            СТРАХОВКА РЕБЁНКА
                        </span>
                        <b>{game.insurance ? 'Ты застрахован' : 'Страховка пока не подключена'}</b>
                        <span className="tiny muted">
                            {game.insurance
                                ? `Если случится травма, страховка оплатит лечение до ${byn(INSURANCE.cover)} BYN.`
                                : `Страховка стоит ${byn(INSURANCE.monthly)} BYN в месяц и покрывает лечение до ${byn(INSURANCE.cover)} BYN. Подключает родитель в Moby Семье.`}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
}
