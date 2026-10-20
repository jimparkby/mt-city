import { useEffect, useRef, useState } from 'react';
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
    const parentToast = useUi((s) => s.parentToast);
    const wide = useMedia('(min-width: 900px)');
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

    // На компьютере (демо) показываем ребёнка и родителя рядом, на телефоне — переключатель
    const both = isDemoMode && wide;
    const showChild = both || role === 'child';
    const showParent = both || role === 'parent';

    return (
        <div className="stage">
            {isDemoMode && (
                <div className="demo-bar">
                    {!both && (
                        <div className="segmented">
                            <button aria-pressed={role === 'child'} onClick={() => setRole('child')}>
                                Ребёнок
                            </button>
                            <button aria-pressed={role === 'parent'} onClick={() => setRole('parent')}>
                                Родитель
                            </button>
                        </div>
                    )}
                    <button className="link-button" onClick={() => reset.mutate()}>
                        Сбросить демо
                    </button>
                </div>
            )}
            {login.isError && (
                <div className="stack" style={{ padding: 20 }}>
                    <p className="body">{t('login.error')}</p>
                    <button className="btn" onClick={() => login.mutate()}>
                        {t('common.retry')}
                    </button>
                </div>
            )}
            <div className={`phones ${both ? 'both' : ''}`}>
                {showChild && (
                    <div className="phone-col">
                        <span className="phone-label">Ребёнок · Город</span>
                        <div className="phone child">
                            {me && game && (
                                <>
                                    <ChildHome me={me} game={game} />
                                    <ChildSheets me={me} game={game} />
                                    <ChildOverlays game={game} />
                                </>
                            )}
                            {toast && <div className="toast">{toast}</div>}
                            <MobyMockModal />
                        </div>
                    </div>
                )}
                {showParent && (
                    <div className="phone-col">
                        <span className="phone-label">Родитель · Moby</span>
                        <div className="phone">
                            {me && game && <ParentHome me={me} game={game} />}
                            {parentToast && <div className="toast top">{parentToast}</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function useMedia(query: string) {
    const [match, setMatch] = useState(() => window.matchMedia(query).matches);
    useEffect(() => {
        const mq = window.matchMedia(query);
        const on = () => setMatch(mq.matches);
        mq.addEventListener('change', on);
        return () => mq.removeEventListener('change', on);
    }, [query]);
    return match;
}

export default App;
