import { useDevTimeSkip, useMe } from '../../api/hooks';
import { t } from '../../i18n';
import { Coins } from '../components/Coins';

export function Hud() {
    const { data: me } = useMe();
    const timeSkip = useDevTimeSkip();
    if (!me) return null;

    return (
        <div className="hud">
            <div className="hud-item">
                <Coins value={me.account.balance} /> <small>{t('hud.balance')}</small>
            </div>
            <div className="hud-item" title="Очки знаний">
                🧠 {me.knowledge}
            </div>
            <div className="hud-item" title="Энергия">
                ⚡ {me.energy}
            </div>
            <div className="hud-item" title="Уровень банка">
                🏦 {me.bankLevel}
            </div>
            {import.meta.env.DEV && (
                <button className="hud-item hud-dev" onClick={() => timeSkip.mutate(1)}>
                    {t('dev.timeSkip')}
                </button>
            )}
        </div>
    );
}
