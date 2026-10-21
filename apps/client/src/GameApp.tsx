import { useEffect, useRef } from 'react';
import { useGame, useMe, useMobyLogin } from './api/hooks';
import { t } from './i18n';
import { useUi, type Role } from './store/ui';
import { Game } from './ui/child/Game';

const AGES: [Role, string, string][] = [
    ['kid', '7–13 лет', 'Копи MTcoin за уроки и квизы, выбирай дизайны карты'],
    ['teen', '14–17 лет', 'Набирай очки знаний и разбирайся с кешбэком по карте'],
];

/** Отдельная игра в браузере: выбор возраста и город, без банка Moby, вкладок и демо-панели */
function GameApp() {
    const login = useMobyLogin();
    const loginStarted = useRef(false);
    const { data: me } = useMe();
    const { data: game } = useGame();
    const ageChosen = useUi((s) => s.ageChosen);

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
                {!ageChosen ? (
                    <AgePick />
                ) : (
                    me &&
                    game && (
                        <div className="screen">
                            <Game game={game} />
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

/** Стартовый экран: от возраста зависят задания и награды */
function AgePick() {
    const role = useUi((s) => s.role);
    const pickAge = useUi((s) => s.pickAge);

    return (
        <div className="age-pick">
            <span className="kicker light">MOBY · ИГРА</span>
            <span className="display age-title">Сколько тебе лет?</span>
            <span className="body age-sub">От возраста зависят задания в городе и награды за них.</span>
            <div className="stack" style={{ gap: 12, width: '100%' }}>
                {AGES.map(([id, label, sub]) => (
                    <button key={id} className={`age-card ${role === id ? 'on' : ''}`} onClick={() => pickAge(id)}>
                        <b>{label}</b>
                        <span>{sub}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default GameApp;
