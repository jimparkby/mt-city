import { useEffect, useRef } from 'react';
import { useGame, useMe, useMobyLogin } from './api/hooks';
import { t } from './i18n';
import { useUi } from './store/ui';
import { Game } from './ui/child/Game';

/** Отдельная игра в браузере: только город ребёнка, без банка Moby, вкладок и демо-панели */
function GameApp() {
    const login = useMobyLogin();
    const loginStarted = useRef(false);
    const { data: me } = useMe();
    const { data: game } = useGame();

    useEffect(() => {
        if (loginStarted.current) return;
        loginStarted.current = true;
        login.mutate();
    }, [login]);

    // «Назад» в браузере закрывает верхний слой игры
    useEffect(() => {
        const onPop = () => {
            const s = useUi.getState();
            if (s.step) s.openStep(null);
            else if (s.overlay) s.closeOverlay();
            else if (s.sheet) s.closeSheet();
            else if (s.loc) s.closeLoc();
            else return;
            history.pushState(null, '');
        };
        history.pushState(null, '');
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    return (
        <div className="stage solo">
            {login.isError && (
                <div className="stack" style={{ padding: 20 }}>
                    <p className="body">{t('login.error')}</p>
                    <button className="btn" onClick={() => login.mutate()}>
                        {t('common.retry')}
                    </button>
                </div>
            )}
            <div className="phone solo">
                {me && game && (
                    <div className="screen">
                        <Game game={game} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default GameApp;
