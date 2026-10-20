import { initialCars, initialPeds, type Cell } from '../art/city';

// Персонаж, машины и лодка живут между переключениями вкладок: город монтируется заново, а они продолжают с того же места

export const avatar: Cell & { path: Cell[]; face: number; onArrive: (() => void) | null } = {
    i: 1.9,
    j: 6.75,
    path: [],
    face: 1,
    onArrive: null,
};
export const cars = initialCars();
export const peds = initialPeds();
export const boat = { s: 2 };

/** Элементы карты, которые двигает анимация напрямую, мимо React */
export const movers: Record<string, HTMLElement | null> = {};

export function resetCity() {
    Object.assign(avatar, { i: 1.9, j: 6.75, path: [], face: 1, onArrive: null });
}
