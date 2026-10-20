import { useEffect, useRef } from 'react';
import { useMe, useMobyLogin } from './api/hooks';
import { on } from './game/EventBus';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { moby } from './moby';
import { MobyMockModal } from './moby/MobyMockModal';
import { useSession } from './store/session';
import { Hud } from './ui/hud/Hud';
import { ScreenHost } from './ui/ScreenHost';
import { Modal } from './ui/components/Modal';
import { Onboarding } from './ui/screens/Onboarding';
import { t } from './i18n';

function App() {
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const open = useSession((s) => s.open);
    const { data: me } = useMe();
    const login = useMobyLogin();
    const loginStarted = useRef(false);

    // При каждом запуске входим по свежему токену Moby (он одноразовый)
    useEffect(() => {
        if (loginStarted.current) return;
        loginStarted.current = true;
        login.mutate();
    }, [login]);

    // Тап по зданию в Phaser → открыть React-экран
    useEffect(() => on('building:open', ({ id }) => open(id)), [open]);

    // Android «назад»: закрыть экран, а если экранов нет — вернуться в Moby
    useEffect(() => {
        const onPop = () => {
            const { screen, close } = useSession.getState();
            if (screen) {
                close();
                history.pushState(null, '');
            } else {
                moby.close();
            }
        };
        history.pushState(null, '');
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    const needsOnboarding = me && !me.onboarded;

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
            <div className="ui-layer">
                <Hud />
                {login.isError && (
                    <Modal title={t('login.error')}>
                        <button className="button" onClick={() => login.mutate()}>
                            {t('common.retry')}
                        </button>
                    </Modal>
                )}
                {needsOnboarding ? <Onboarding /> : <ScreenHost />}
                <MobyMockModal />
            </div>
        </div>
    );
}

export default App;
