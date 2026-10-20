import { formatCoins } from '@mt/shared';

/** Копейки BYN → "12,50" */
export const byn = (kopecks: number) => formatCoins(kopecks);

/** Копейки MTcoin → целые монеты для шапки ("240") */
export const coins = (kopecks: number) => Math.floor(kopecks / 100).toLocaleString('ru-RU');

/**
 * Родительный и дательный падеж имени для подписей («Задания Алисы», «Отправить Алисе»).
 * Простое правило для имён на -а/-я; в пилоте формы придут из профиля Moby.
 */
export function nameCases(name: string): { gen: string; dat: string } {
    const stem = name.slice(0, -1);
    if (name.endsWith('а')) return { gen: stem + (/[гкхжчшщ]$/.test(stem) ? 'и' : 'ы'), dat: stem + 'е' };
    if (name.endsWith('я')) return { gen: stem + 'и', dat: stem + (stem.endsWith('и') ? 'и' : 'е') };
    return { gen: name + 'а', dat: name + 'у' };
}

/** Время операции: «сегодня, 14:20», «вчера, 09:05» или «12 окт.» */
export function when(at: number) {
    const d = new Date(at);
    const now = new Date();
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const days = Math.round(
        (new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000,
    );
    if (days === 0) return `сегодня, ${time}`;
    if (days === 1) return `вчера, ${time}`;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
