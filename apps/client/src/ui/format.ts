import { formatCoins } from '@mt/shared';

/** Копейки BYN → "12,50" */
export const byn = (kopecks: number) => formatCoins(kopecks);

/** Копейки MTcoin → целые монеты для шапки ("240") */
export const coins = (kopecks: number) => Math.floor(kopecks / 100).toLocaleString('ru-RU');
