import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { useUi, type Role } from '../store/ui';

interface ObStep {
    t: string;
    d: string;
    /** Что подсветить: data-ob у элемента; map — середина карты */
    target?: string;
}

const STEPS: Record<Role, ObStep[]> = {
    kid: [
        {
            t: 'Привет, я Мони!',
            d: 'Я помогу разобраться в МТ Сити. Здесь ты учишься обращаться с деньгами и получаешь за это награды.',
        },
        {
            t: 'Твой кошелёк',
            d: 'Сверху — MTcoin, деньги на твоей карте и очки знаний. Всё, что заработаешь, видно здесь.',
            target: 'wallet',
        },
        {
            t: 'Город',
            d: 'Нажми на любое здание — Алиса дойдёт до него. Внутри ждёт свой путь из коротких задач.',
            target: 'map',
        },
        { t: 'Следующий шаг', d: 'Не знаешь, куда идти? Тут всегда следующий шаг. Жми «Играть».', target: 'next' },
        {
            t: 'Задания от мамы',
            d: 'Сделай дело, нажми «Готово» — мама проверит и переведёт деньги на карту.',
            target: 'tasks',
        },
        { t: 'Профиль и магазин', d: 'За MTcoin покупай одежду персонажу и новые дизайны карты.', target: 'profile' },
        {
            t: 'Выход в банк',
            d: 'Через «Moby» выходишь в банк: там твоя карта, её дизайн и история покупок.',
            target: 'moby',
        },
    ],
    teen: [
        {
            t: 'Привет, я Мони!',
            d: 'Я помогу разобраться в МТ Сити. Проходи пути в зданиях — и карта будет прокачиваться.',
        },
        {
            t: 'Твой кешбэк',
            d: 'Сверху — кешбэк твоей карты, деньги и очки знаний. Игровой валюты у тебя нет: вместо неё растёт кешбэк.',
            target: 'wallet',
        },
        { t: 'Город', d: 'Нажми на здание — Марк дойдёт до него. Внутри путь из задач за очки знаний.', target: 'map' },
        { t: 'Следующий шаг', d: 'Тут всегда следующий непройденный шаг. Жми «Играть».', target: 'next' },
        { t: 'Задания', d: 'Задания от мамы: сделай, нажми «Готово» и получи деньги на карту.', target: 'tasks' },
        { t: 'Уровни карты', d: 'В профиле видно, сколько осталось до следующего кешбэка — до 3%.', target: 'profile' },
        {
            t: 'Копилка и вклады',
            d: 'Через «Moby» выходишь в банк. Там Копилка с планом цели и вклады в BYN: МТБелки и базовые от 3%.',
            target: 'moby',
        },
    ],
    parent: [
        { t: 'Привет, я Мони!', d: 'Я помощник Moby Семьи. Расскажу, как ставить ребёнку задания и платить за них.' },
        {
            t: 'Две карты',
            d: 'Сверху — баланс вашей карты и детской карты. Деньги за задания переходят с одной на другую.',
        },
        {
            t: 'Проверка',
            d: 'Ребёнок нажал «Готово» — задание появится в «Ждёт проверки». Примите, и деньги уйдут на его карту.',
        },
        {
            t: 'Новое задание',
            d: 'Выберите дело и награду. Деньги спишутся только после того, как вы примете задание.',
        },
    ],
};

interface Spot {
    x: number;
    y: number;
    w: number;
    h: number;
    r: number;
    /** Подсветка в верхней половине экрана — карточку Мони ставим вниз */
    upper: boolean;
}

/** Обучение с белкой Мони: приветствие и подсветка частей экрана по шагам */
export function Onboarding({ phone }: { phone: RefObject<HTMLDivElement | null> }) {
    const role = useUi((s) => s.role);
    const k0 = useUi((s) => s.obStep);
    const set = useUi((s) => s.set);
    const finish = useUi((s) => s.finishOnboarding);
    const steps = STEPS[role];
    const k = Math.min(k0, steps.length - 1);
    const step = steps[k];
    const last = k === steps.length - 1;
    const [spot, setSpot] = useState<Spot | null>(null);

    // Подсветка показывает карту и меню города: обучение всегда идёт на вкладке «Город»
    useEffect(() => {
        if (role !== 'parent') set({ tab: 'city', loc: null, step: null, sheet: null });
    }, [role, set]);

    // Меряем подсвечиваемый элемент относительно телефона
    useLayoutEffect(() => {
        const measure = () => {
            const root = phone.current;
            if (!root || !step.target) return setSpot(null);
            const box = root.getBoundingClientRect();
            if (step.target === 'map') {
                const w = Math.min(300, box.width - 72);
                const top = box.height * 0.23;
                return setSpot({ x: (box.width - w) / 2, y: top, w, h: w, r: w / 2, upper: true });
            }
            const el = root.querySelector(`[data-ob="${step.target}"]`);
            if (!el) return setSpot(null);
            const r = el.getBoundingClientRect();
            const pad = step.target === 'wallet' || step.target === 'next' ? 0 : 2;
            setSpot({
                x: r.left - box.left - pad,
                y: r.top - box.top - pad,
                w: r.width + pad * 2,
                h: r.height + pad * 2,
                r: step.target === 'wallet' || step.target === 'next' ? 20 : 18,
                upper: r.top + r.height / 2 - box.top < box.height / 2,
            });
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [phone, step]);

    const next = () => (last ? finish() : set({ obStep: k + 1 }));

    if (k === 0)
        return (
            <div className="ob">
                <div className="ob-welcome">
                    <img src="/assets/moni.jpg" alt="Белка Мони" className="ob-moni" />
                    <div className="ob-welcome-head">
                        <span className="ob-pill">МТ СИТИ · ОБУЧЕНИЕ</span>
                        <span className="display" style={{ fontSize: 28, lineHeight: 1.1 }}>
                            {step.t}
                        </span>
                    </div>
                    <div className="ob-welcome-foot">
                        <span className="ob-text">{step.d}</span>
                        <button className="btn block tall raised" onClick={next}>
                            Покажи, что тут есть
                        </button>
                        <button className="link-button muted" onClick={finish}>
                            Я разберусь сам
                        </button>
                    </div>
                </div>
            </div>
        );

    return (
        <div className="ob">
            {spot ? (
                <div
                    className="ob-spot"
                    style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h, borderRadius: spot.r }}
                />
            ) : (
                <div className="ob-dim" />
            )}
            <div className="ob-card" style={spot ? (spot.upper ? { bottom: 104 } : { top: 150 }) : { bottom: 120 }}>
                <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                    <img src="/assets/moni-face.jpg" alt="Белка Мони" className="ob-face" />
                    <div className="stack grow" style={{ gap: 3, minWidth: 0 }}>
                        <span className="ob-count">
                            МОНИ · {k} / {steps.length - 1}
                        </span>
                        <span className="display" style={{ fontSize: 18, lineHeight: 1.15 }}>
                            {step.t}
                        </span>
                    </div>
                </div>
                <span className="ob-card-text">{step.d}</span>
                <div className="row" style={{ gap: 10 }}>
                    <div className="row grow" style={{ gap: 4 }}>
                        {steps.slice(1).map((_, i) => (
                            <span key={i} className={`ob-dot ${i + 1 <= k ? 'on' : ''} ${i + 1 === k ? 'now' : ''}`} />
                        ))}
                    </div>
                    <button className="link-button muted" onClick={finish}>
                        Пропустить
                    </button>
                    <button className="btn compact raised" onClick={next}>
                        {last ? 'Поехали!' : 'Дальше'}
                    </button>
                </div>
            </div>
        </div>
    );
}
