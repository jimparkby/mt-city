import { useCompleteOnboarding, useMe } from '../../../api/hooks';
import { t } from '../../../i18n';
import { Modal } from '../../components/Modal';

/** Первый запуск: игрок уже известен из Moby, остаётся выбрать, с чего начать */
export function Onboarding() {
    const { data: me } = useMe();
    const complete = useCompleteOnboarding();
    if (!me) return null;

    // TODO(feat/onboarding): диалог-история + конструктор бизнес-идеи (screens/BusinessBuilder)
    return (
        <Modal title={t('onboarding.title', { name: me.name })}>
            <div className="stack">
                <p>{t('onboarding.choosePath')}</p>
                <button className="button" onClick={() => complete.mutate({ path: 'business' })}>
                    {t('onboarding.business')}
                </button>
                <button className="button" onClick={() => complete.mutate({ path: 'job' })}>
                    {t('onboarding.job')}
                </button>
            </div>
        </Modal>
    );
}
