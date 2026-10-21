import { create } from 'zustand';
import { isStandalone } from '../api/client';

/** Демо-роли из макета v7: ребёнок 7–13 (MTcoin), подросток 14–17 (кешбэк), родитель (Moby Семья) */
export type Role = 'kid' | 'teen' | 'parent';
/** Вкладки нижнего меню Moby */
export type BankTab = 'home' | 'products' | 'city' | 'chat' | 'more';
/** Вкладки игры */
export type GameTab = 'city' | 'tasks' | 'profile';
export type Sheet = { type: 'week' } | { type: 'building'; id: string };
export type Overlay = 'dream' | 'levelup';
/** Экран Moby поверх вкладки: продукты ребёнка, карта, партнёры */
export type Page = 'deposits' | 'kopilka' | 'card' | 'partners' | 'subs';
/** Шторки Moby у ребёнка: демо-оплата и просьба к родителю */
export type BankSheet = 'pay' | 'ask';
/** Вкладки кабинета родителя */
export type ParentTab = 'tasks' | 'control' | 'ops';

export interface StepOpen {
    loc: string;
    k: number;
    /** Выбранный ответ квиза */
    picked: number | null;
}

type ToastKey = 'toast' | 'parentToast' | 'bankToast';

interface UiState {
    role: Role;
    /** Отдельная игра: возраст выбран на стартовом экране */
    ageChosen: boolean;
    bankTab: BankTab;
    tab: GameTab;
    sheet: Sheet | null;
    overlay: Overlay | null;
    /** Открытый экран здания и шаг пути в нём */
    loc: string | null;
    step: StepOpen | null;
    /** Запрос «дойти до здания»: город ведёт туда персонажа и открывает локацию */
    walk: { id: string; n: number } | null;
    page: Page | null;
    bankSheet: BankSheet | null;
    parentTab: ParentTab;
    hideBalance: boolean;
    /** Обучение с Мони пройдено (по ролям) и текущий шаг */
    onboarded: Partial<Record<Role, boolean>>;
    obStep: number;
    toast: string | null;
    parentToast: string | null;
    bankToast: string | null;

    setRole: (role: Role) => void;
    /** Отдельная игра: выбрать возраст и начать */
    pickAge: (role: Role) => void;
    goBank: (tab: BankTab) => void;
    setTab: (tab: GameTab) => void;
    openSheet: (sheet: Sheet) => void;
    closeSheet: () => void;
    openOverlay: (overlay: Overlay) => void;
    closeOverlay: () => void;
    openLoc: (id: string) => void;
    closeLoc: () => void;
    openStep: (step: StepOpen | null) => void;
    walkTo: (id: string) => void;
    set: (patch: Partial<UiState>) => void;
    finishOnboarding: () => void;
    restartOnboarding: () => void;
    flash: (message: string, key?: ToastKey) => void;
    resetUi: () => void;
}

const STORE_KEY = isStandalone ? 'moby-game:ui:v1' : 'mt-city:ui:v7';

interface Saved {
    role: Role;
    ageChosen: boolean;
    bankTab: BankTab;
    onboarded: Partial<Record<Role, boolean>>;
}

function loadSaved(): Partial<Saved> {
    try {
        return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') as Partial<Saved>;
    } catch {
        return {};
    }
}

const timers: Partial<Record<ToastKey, ReturnType<typeof setTimeout>>> = {};
let walkN = 0;

const transient = {
    tab: 'city' as GameTab,
    sheet: null,
    overlay: null,
    loc: null,
    step: null,
    walk: null,
    page: null,
    bankSheet: null,
    obStep: 0,
};

export const useUi = create<UiState>((set, get) => {
    const saved = loadSaved();
    return {
        role: saved.role ?? 'kid',
        ageChosen: !isStandalone || !!saved.ageChosen,
        bankTab: saved.bankTab ?? 'home',
        hideBalance: false,
        parentTab: 'tasks',
        onboarded: saved.onboarded ?? {},
        toast: null,
        parentToast: null,
        bankToast: null,
        ...transient,

        setRole: (role) =>
            set({ role, sheet: null, overlay: null, loc: null, step: null, obStep: 0, page: null, bankSheet: null }),
        pickAge: (role) => set({ ...transient, role, ageChosen: true }),
        goBank: (bankTab) => set({ bankTab, sheet: null, page: null, bankSheet: null }),
        setTab: (tab) => set({ tab, sheet: null, loc: null, step: null }),
        openSheet: (sheet) => set({ sheet }),
        closeSheet: () => set({ sheet: null }),
        openOverlay: (overlay) => set({ overlay, sheet: null }),
        closeOverlay: () => set({ overlay: null }),
        openLoc: (loc) => set({ loc, step: null, sheet: null }),
        closeLoc: () => set({ loc: null, step: null }),
        openStep: (step) => set({ step }),
        walkTo: (id) => set({ walk: { id, n: ++walkN }, sheet: null }),
        set: (patch) => set(patch),
        finishOnboarding: () => set({ onboarded: { ...get().onboarded, [get().role]: true }, obStep: 0 }),
        restartOnboarding: () => {
            const onboarded = { ...get().onboarded };
            delete onboarded[get().role];
            set({
                onboarded,
                obStep: 0,
                bankTab: 'city',
                tab: 'city',
                loc: null,
                step: null,
                page: null,
                bankSheet: null,
            });
        },
        flash: (message, key = 'toast') => {
            clearTimeout(timers[key]);
            set({ [key]: message });
            timers[key] = setTimeout(() => set({ [key]: null }), 2600);
        },
        resetUi: () => set({ ...transient }),
    };
});

// Роль, вкладка Moby, семья и пройденное обучение переживают перезагрузку
useUi.subscribe((s) => {
    const saved: Saved = {
        role: s.role,
        ageChosen: s.ageChosen,
        bankTab: s.bankTab,
        onboarded: s.onboarded,
    };
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(saved));
    } catch {
        // localStorage недоступен
    }
});
