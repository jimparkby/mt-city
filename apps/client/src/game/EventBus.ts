import { Events } from 'phaser';
import type { BuildingId } from '@mt/shared';

// Used to emit events between components, HTML and Phaser scenes
export const EventBus = new Events.EventEmitter();

/** Контракт событий Phaser ↔ React. Добавляя событие — опишите его здесь. */
export interface GameEvents {
    'current-scene-ready': Phaser.Scene;
    /** Тап по зданию в City → React открывает экран */
    'building:open': { id: BuildingId };
    /** React изменил состояние города → сцена перерисовывает здания */
    'city:refresh': void;
    /** React просит запустить мини-игру */
    'minigame:start': { jobId: string; scene: string };
    /** Мини-игра закончилась → React отправляет POST /jobs/:id/shift */
    'minigame:done': { jobId: string; score: number };
}

export function emit<K extends keyof GameEvents>(
    event: K,
    ...payload: GameEvents[K] extends void ? [] : [GameEvents[K]]
) {
    EventBus.emit(event, ...payload);
}

export function on<K extends keyof GameEvents>(event: K, fn: (payload: GameEvents[K]) => void) {
    EventBus.on(event, fn);
    return () => {
        EventBus.off(event, fn);
    };
}
