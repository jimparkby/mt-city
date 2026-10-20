// Единственная точка доступа игры к Moby (ТЗ, раздел 9).

export type MobyScreen = 'savings-goal' | 'pocket-money' | 'kids-card';

export interface MobyBridge {
    /** Одноразовый токен для входа; сервер обменивает его у банка на профиль */
    getAuthToken(): Promise<string>;
    /** Реальный баланс детской карты, в копейках BYN */
    getCardBalance(): Promise<{ amount: number; currency: 'BYN' }>;
    /** Открыть нативный экран Moby: цель накопления, перевод, детская карта */
    openScreen(screen: MobyScreen, params?: Record<string, string>): Promise<void>;
    /** Push-уведомление через Moby */
    notify(title: string, body: string): Promise<void>;
    /** Закрыть игру и вернуться в Moby */
    close(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isInsideMoby = () => typeof (window as any).MobyNative !== 'undefined';
