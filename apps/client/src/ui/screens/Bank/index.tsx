import { useBankOverview } from '../../../api/hooks';
import { t } from '../../../i18n';
import { Coins } from '../../components/Coins';
import { Modal } from '../../components/Modal';

// TODO(feat/bank): открыть/закрыть вклад, кредит с графиком платежей (POST /bank/loans/quote)
export function Bank({ onClose }: { onClose: () => void }) {
    const { data } = useBankOverview();

    return (
        <Modal title={t('bank.title')} onClose={onClose}>
            {!data ? (
                <p>…</p>
            ) : (
                <div className="stack">
                    <section className="card">
                        <h3>{t('bank.account')}</h3>
                        <Coins value={data.account.balance} />
                        <p className="muted">
                            {t('bank.creditScore')}: {data.creditScore}
                        </p>
                    </section>
                    <section className="card">
                        <h3>{t('bank.deposits')}</h3>
                        {data.deposits.length === 0 && <p className="muted">{t('bank.empty')}</p>}
                        {data.deposits.map((d) => (
                            <div key={d.id}>
                                <Coins value={d.current} />
                            </div>
                        ))}
                    </section>
                    <section className="card">
                        <h3>{t('bank.loans')}</h3>
                        {data.loans.length === 0 && <p className="muted">{t('bank.empty')}</p>}
                    </section>
                </div>
            )}
        </Modal>
    );
}
