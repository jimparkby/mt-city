import type { MobyBridge, MobyScreen } from './MobyBridge';

/** Объект, который Moby внедряет в WebView. Точный контракт согласовать с банком (TODO(pilot)). */
export interface MobyNativeApi {
    postMessage(message: string): void;
}

/** Реальная реализация поверх postMessage-моста. Заглушка до получения спецификации от банка. */
export class NativeMobyBridge implements MobyBridge {
    private seq = 0;
    private pending = new Map<number, (value: unknown) => void>();

    constructor(private readonly native: MobyNativeApi) {
        window.addEventListener('message', (e) => {
            const msg = typeof e.data === 'string' ? safeParse(e.data) : e.data;
            if (msg && typeof msg.id === 'number' && this.pending.has(msg.id)) {
                this.pending.get(msg.id)!(msg.result);
                this.pending.delete(msg.id);
            }
        });
    }

    private call<T>(method: string, params?: unknown): Promise<T> {
        const id = ++this.seq;
        return new Promise<T>((resolve) => {
            this.pending.set(id, resolve as (v: unknown) => void);
            this.native.postMessage(JSON.stringify({ id, method, params }));
        });
    }

    getAuthToken() {
        return this.call<string>('getAuthToken');
    }

    getCardBalance() {
        return this.call<{ amount: number; currency: 'BYN' }>('getCardBalance');
    }

    openScreen(screen: MobyScreen, params?: Record<string, string>) {
        return this.call<void>('openScreen', { screen, params });
    }

    notify(title: string, body: string) {
        return this.call<void>('notify', { title, body });
    }

    close() {
        this.native.postMessage(JSON.stringify({ method: 'close' }));
    }
}

function safeParse(s: string) {
    try {
        return JSON.parse(s);
    } catch {
        return null;
    }
}
