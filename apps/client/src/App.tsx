import { useEffect, useRef, useState } from 'react';
import { CellSignalFullIcon, NavigationArrowIcon } from '@phosphor-icons/react';
import { useDevReset, useGame, useMe, useMobyLogin } from './api/hooks';
import { isDemoMode } from './api/client';
import { t } from './i18n';
import { moby } from './moby';
import { MobyMockModal } from './moby/MobyMockModal';
import { useUi, type Role } from './store/ui';
import { BankChat, BankHome, BankMore, BankNav, BankProducts } from './ui/bank/BankScreens';
import { Deposits } from './ui/bank/Deposits';
import { Kopilka } from './ui/bank/Kopilka';
import { resetCity } from './ui/child/cityState';
import { Game, GameNav } from './ui/child/Game';
import { Onboarding } from './ui/Onboarding';
import { ParentHome } from './ui/parent/ParentHome';

const ROLES: [Role, string, string][] = [
    ['kid', '7–13 лет', 'Алиса · MTcoin'],
    ['teen', '14–17 лет', 'Марк · кешбэк'],
    ['parent', 'Родитель', 'Ольга · задания'],
];

function App() {
    const login = useMobyLogin();
    const loginStarted = useRef(false);
    const { data: me } = useMe();
    const { data: game } = useGame();
    const ui = useUi();
    const reset = useDevReset();
    const phone = useRef<HTMLDivElement>(null);
    // На компьютере телефон рисуется в рамке со статус-баром, на телефоне — на весь экран
    const framed = useMedia('(min-width: 600px)') && isDemoMode;

    // При каждом запуске входим по свежему токену Moby (он одноразовый)
    useEffect(() => {
        if (loginStarted.current) return;
        loginStarted.current = true;
        login.mutate();
    }, [login]);

    // Android «назад»: закрыть верхний слой, иначе — вернуться в Moby
    useEffect(() => {
        const onPop = () => {
            const s = useUi.getState();
            if (s.step) s.openStep(null);
            else if (s.overlay) s.closeOverlay();
            else if (s.sheet) s.closeSheet();
            else if (s.loc) s.closeLoc();
            else if (s.kopOpen || s.depositsOpen) s.set({ kopOpen: false, depositsOpen: false });
            else if (s.bankTab === 'city' && s.tab !== 'city') s.setTab('city');
            else if (isDemoMode && s.bankTab !== 'home') s.goBank('home');
            else return moby.close();
            history.pushState(null, '');
        };
        history.pushState(null, '');
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    // Внутри Moby банковские экраны рисует само приложение: показываем только МТ Сити
    const bankTab = isDemoMode ? ui.bankTab : 'city';
    const isParent = ui.role === 'parent';
    const teen = ui.role === 'teen';
    const inGame = bankTab === 'city' && !isParent;
    const showOnboarding = bankTab === 'city' && !ui.onboarded[ui.role] && !ui.overlay && !!game;
    const statusBg =
        bankTab === 'home' ? '#2f62e6' : bankTab === 'city' ? (isParent ? '#2f6bf0' : '#0f1a46') : '#1a1b22';

    return (
        <div className={`stage ${framed ? 'framed' : ''}`}>
            {isDemoMode && (
                <div className="demo-bar">
                    <div className="segmented">
                        {ROLES.map(([id, label, sub]) => (
                            <button key={id} aria-pressed={ui.role === id} onClick={() => ui.setRole(id)}>
                                <b>{label}</b>
                                <span>{sub}</span>
                            </button>
                        ))}
                    </div>
                    {isParent && (
                        <button
                            className="family-toggle"
                            role="switch"
                            aria-checked={ui.family}
                            onClick={() => ui.set({ family: !ui.family })}
                        >
                            <span className="toggle" />
                            Семья создана
                        </button>
                    )}
                    <button className="moni-btn" onClick={ui.restartOnboarding}>
                        <img src="/assets/moni-face.jpg" alt="" />
                        Обучение с Мони
                    </button>
                    <button
                        className="link-button"
                        onClick={() => {
                            reset.mutate();
                            resetCity();
                            ui.resetUi();
                        }}
                    >
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
            <div className={`phone ${framed ? 'framed' : ''}`} ref={phone}>
                {framed && (
                    <div className="statusbar" style={{ background: statusBg }}>
                        <span className="row" style={{ gap: 4 }}>
                            11:49
                            <NavigationArrowIcon size={13} weight="fill" style={{ transform: 'scaleX(-1)' }} />
                        </span>
                        <span className="row" style={{ gap: 6 }}>
                            <CellSignalFullIcon size={16} weight="fill" />
                            <span style={{ fontSize: 13 }}>3G</span>
                            <span className="battery">74</span>
                        </span>
                    </div>
                )}
                {me && game && (
                    <>
                        <div className="screen">
                            {bankTab === 'home' && <BankHome game={game} />}
                            {bankTab === 'products' && <BankProducts />}
                            {bankTab === 'chat' && <BankChat />}
                            {bankTab === 'more' && <BankMore />}
                            {bankTab === 'city' && (isParent ? <ParentHome game={game} /> : <Game game={game} />)}
                            {teen && ui.depositsOpen && <Deposits game={game} />}
                            {teen && ui.kopOpen && <Kopilka game={game} />}
                            {ui.bankToast && <div className="toast top">{ui.bankToast}</div>}
                        </div>
                        {inGame ? <GameNav game={game} /> : <BankNav game={game} />}
                        {showOnboarding && <Onboarding phone={phone} />}
                    </>
                )}
                <MobyMockModal />
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
