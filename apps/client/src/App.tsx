import { useEffect, useRef } from 'react';
import { useMe } from './api/hooks';
import { on } from './game/EventBus';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { moby } from './moby';
import { MobyMockModal } from './moby/MobyMockModal';
import { useSession } from './store/session';
import { Hud } from './ui/hud/Hud';
import { ScreenHost } from './ui/ScreenHost';
import { Onboarding } from './ui/screens/Onboarding';

function App() {
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const token = useSession((s) => s.token);
    const open = useSession((s) => s.open);
    const { data: me } = useMe();

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

    const needsOnboarding = !token || (me && !me.onboarded);

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
            <div className="ui-layer">
                <Hud />
                {needsOnboarding ? <Onboarding /> : <ScreenHost />}
                <MobyMockModal />
            </div>
        </div>
    );
}

export default App;
