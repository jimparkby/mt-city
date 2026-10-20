import { useEffect, useRef } from 'react';
import { useDevReset, useGame, useMe, useMobyLogin } from './api/hooks';
import { isDemoMode } from './api/client';
import { t } from './i18n';
import { moby } from './moby';
import { MobyMockModal } from './moby/MobyMockModal';
import { useUi } from './store/ui';
import { ChildHome } from './ui/child/ChildHome';
import { ChildOverlays } from './ui/child/Overlays';
import { ChildSheets } from './ui/child/Sheets';
import { ParentHome } from './ui/parent/ParentHome';

function App() {
    const login = useMobyLogin();
    const loginStarted = useRef(false);
    const { data: me } = useMe();
    const { data: game } = useGame();
    const role = useUi((s) => s.role);
    const setRole = useUi((s) => s.setRole);
    const toast = useUi((s) => s.toast);
    const reset = useDevReset();

    // При каждом запуске входим по свежему токену Moby (он одноразовый)
    useEffect(() => {
        if (loginStarted.current) return;
        loginStarted.current = true;
        login.mutate();
    }, [login]);

    // Android «назад»: закрыть шторку/оверлей, иначе — вернуться в Moby
    useEffect(() => {
        const onPop = () => {
            const ui = useUi.getState();
            if (ui.overlay) ui.closeOverlay();
            else if (ui.sheet) ui.closeSheet();
            else return moby.close();
            history.pushState(null, '');
        };
        history.pushState(null, '');
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    return (
        <div className="stage">
            {isDemoMode && (
                <div className="demo-bar">
                    <div className="segmented">
                        <button aria-pressed={role === 'child'} onClick={() => setRole('child')}>
                            Ребёнок
                        </button>
                        <button aria-pressed={role === 'parent'} onClick={() => setRole('parent')}>
                            Родитель
                        </button>
                    </div>
                    <button className="link-button" onClick={() => reset.mutate()}>
                        Сбросить демо
                    </button>
                </div>
            )}
            <div className="phone">
                <div className="phone-status">
                    <span>9:41</span>
                    <span>МТ Сити</span>
                </div>
                {login.isError && (
                    <div className="section">
                        <p className="body">{t('login.error')}</p>
                        <button className="btn" onClick={() => login.mutate()}>
                            {t('common.retry')}
                        </button>
                    </div>
                )}
                {me && game && role === 'child' && (
                    <>
                        <ChildHome me={me} game={game} />
                        <ChildSheets me={me} game={game} />
                        <ChildOverlays game={game} />
                    </>
                )}
                {me && game && role === 'parent' && <ParentHome me={me} game={game} />}
                {toast && <div className="toast">{toast}</div>}
                <MobyMockModal />
            </div>
        </div>
    );
}

export default App;
