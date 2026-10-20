import { create } from 'zustand';
import type { BuildingId } from '@mt/shared';

export type Role = 'child' | 'parent';
export type Sheet =
    | { type: 'node'; id: number }
    | { type: 'week' }
    | { type: 'profile' }
    | { type: 'path' }
    | { type: 'tasks' }
    /** Карточка здания с описанием */
    | { type: 'building'; id: BuildingId }
    /** Экран внутри здания (банк, магазин…) */
    | { type: 'screen'; id: BuildingId };
export type Overlay = 'dream' | 'quiz' | 'levelup';

interface UiState {
    /** Демо-переключатель на узком экране. В жизни родитель видит свой кабинет в Moby, а не в игре. */
    role: Role;
    sheet: Sheet | null;
    overlay: Overlay | null;
    /** Тосты у ребёнка и у родителя раздельные: на компьютере оба телефона видны сразу */
    toast: string | null;
    parentToast: string | null;
    setRole: (role: Role) => void;
    openSheet: (sheet: Sheet) => void;
    closeSheet: () => void;
    openOverlay: (overlay: Overlay) => void;
    closeOverlay: () => void;
    flash: (message: string) => void;
    flashParent: (message: string) => void;
}

const timers: Record<string, ReturnType<typeof setTimeout>> = {};

export const useUi = create<UiState>((set) => {
    const show = (key: 'toast' | 'parentToast', message: string) => {
        clearTimeout(timers[key]);
        set({ [key]: message });
        timers[key] = setTimeout(() => set({ [key]: null }), 2400);
    };
    return {
        role: 'child',
        sheet: null,
        overlay: null,
        toast: null,
        parentToast: null,
        setRole: (role) => set({ role, sheet: null, overlay: null }),
        openSheet: (sheet) => set({ sheet }),
        closeSheet: () => set({ sheet: null }),
        openOverlay: (overlay) => set({ overlay, sheet: null }),
        closeOverlay: () => set({ overlay: null }),
        flash: (message) => show('toast', message),
        flashParent: (message) => show('parentToast', message),
    };
});
