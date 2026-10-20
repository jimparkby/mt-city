import { useState } from 'react';
import { useCompleteOnboarding, useCreateSession, useMe } from '../../../api/hooks';
import { t } from '../../../i18n';
import { Modal } from '../../components/Modal';

export function Onboarding() {
    const { data: me } = useMe();
    const createSession = useCreateSession();
    const complete = useCompleteOnboarding();
    const [name, setName] = useState('');
    const [age, setAge] = useState(10);

    if (!me) {
        return (
            <Modal title={t('onboarding.title')}>
                <form
                    className="stack"
                    onSubmit={(e) => {
                        e.preventDefault();
                        createSession.mutate({ name, age });
                    }}
                >
                    <label className="field">
                        {t('onboarding.name')}
                        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={32} required />
                    </label>
                    <label className="field">
                        {t('onboarding.age')}
                        <input
                            type="number"
                            min={6}
                            max={17}
                            value={age}
                            onChange={(e) => setAge(Number(e.target.value))}
                        />
                    </label>
                    {createSession.error && <p className="error">{createSession.error.message}</p>}
                    <button className="button" disabled={createSession.isPending}>
                        {t('onboarding.start')}
                    </button>
                </form>
            </Modal>
        );
    }

    // TODO(feat/onboarding): диалог-история + конструктор бизнес-идеи (screens/BusinessBuilder)
    return (
        <Modal title={t('onboarding.choosePath')}>
            <div className="stack">
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
