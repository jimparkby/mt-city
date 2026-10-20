import type { MobyBridge, MobyScreen } from './MobyBridge';

const KEY = 'mt-city:moby-mock';

interface MockState {
    cardBalance: number;
    notifications: { title: string; body: string; at: string }[];
}

function load(): MockState {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw) as MockState;
    } catch {
        // localStorage недоступен (приватный режим) — работаем в памяти
    }
    return { cardBalance: 2_500, notifications: [] };
}

function save(state: MockState) {
    try {
        localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
        // ignore
    }
}

type Listener = (screen: MobyScreen | null, params?: Record<string, string>) => void;

/** Mock для хакатона и локальной разработки: «нативные» экраны показываются React-модалкой MobyMockModal. */
export class MockMobyBridge implements MobyBridge {
    private state = load();
    private listeners = new Set<Listener>();

    async getAuthToken() {
        return 'mock-token';
    }

    async getCardBalance() {
        return { amount: this.state.cardBalance, currency: 'BYN' as const };
    }

    async openScreen(screen: MobyScreen, params?: Record<string, string>) {
        this.listeners.forEach((fn) => fn(screen, params));
    }

    async notify(title: string, body: string) {
        this.state.notifications.unshift({ title, body, at: new Date().toISOString() });
        save(this.state);
    }

    close() {
        this.listeners.forEach((fn) => fn(null));
    }

    /** Только для mock: подписка UI на «открытие нативного экрана» */
    subscribe(fn: Listener) {
        this.listeners.add(fn);
        return () => {
            this.listeners.delete(fn);
        };
    }
}
