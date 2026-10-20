import { create } from 'zustand';
import type { BuildingId } from '@mt/shared';

const TOKEN_KEY = 'mt-city:session';

function readToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

function writeToken(token: string | null) {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch {
        // ignore
    }
}

export type ScreenId = BuildingId | 'onboarding' | 'business-builder' | 'parent' | 'lessons';

interface SessionState {
    token: string | null;
    screen: ScreenId | null;
    setToken: (token: string | null) => void;
    open: (screen: ScreenId) => void;
    close: () => void;
}

export const useSession = create<SessionState>((set) => ({
    token: readToken(),
    screen: null,
    setToken: (token) => {
        writeToken(token);
        set({ token });
    },
    open: (screen) => set({ screen }),
    close: () => set({ screen: null }),
}));
