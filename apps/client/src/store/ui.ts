import { create } from 'zustand';
import type { BuildingId } from '@mt/shared';

export type Role = 'child' | 'parent';
export type Sheet =
    | { type: 'node'; id: number }
    | { type: 'week' }
    | { type: 'profile' }
    | { type: 'path' }
    | { type: 'tasks' }
    | { type: 'building'; id: BuildingId };
export type Overlay = 'dream' | 'quiz' | 'levelup';

interface UiState {
    /** Демо-переключатель. В жизни родитель видит свой кабинет в Moby, а не в игре. */
    role: Role;
    sheet: Sheet | null;
    overlay: Overlay | null;
    toast: string | null;
    setRole: (role: Role) => void;
    openSheet: (sheet: Sheet) => void;
    closeSheet: () => void;
    openOverlay: (overlay: Overlay) => void;
    closeOverlay: () => void;
    flash: (message: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUi = create<UiState>((set) => ({
    role: 'child',
    sheet: null,
    overlay: null,
    toast: null,
    setRole: (role) => set({ role, sheet: null, overlay: null }),
    openSheet: (sheet) => set({ sheet }),
    closeSheet: () => set({ sheet: null }),
    openOverlay: (overlay) => set({ overlay, sheet: null }),
    closeOverlay: () => set({ overlay: null }),
    flash: (message) => {
        clearTimeout(toastTimer);
        set({ toast: message });
        toastTimer = setTimeout(() => set({ toast: null }), 2600);
    },
}));
