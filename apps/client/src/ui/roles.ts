// Персонажи демо (макет v7): в пилоте имя, возраст и падежи придут из профиля Moby.

import type { GameState } from '@mt/shared';
import { useUi } from '../store/ui';

export interface Child {
    name: string;
    age: number;
    /** Родительный и дательный падеж: «карта Алисы», «отправить Алисе» */
    gen: string;
    dat: string;
    /** «нажала» / «нажал» */
    pressed: string;
    did: string;
    card: string;
    mask: string;
}

export const KID: Child = {
    name: 'Алиса',
    age: 10,
    gen: 'Алисы',
    dat: 'Алисе',
    pressed: 'нажала',
    did: 'выполнила',
    card: 'Moby Kids',
    mask: '5*7310',
};

export const TEEN: Child = {
    name: 'Марк',
    age: 15,
    gen: 'Марка',
    dat: 'Марку',
    pressed: 'нажал',
    did: 'выполнил',
    card: 'Moby Teen',
    mask: '5*5521',
};

export const PARENT_NAME = 'Ольга';

/** Подросток 14–17: без MTcoin, вместо них кешбэк и знания */
export const useTeen = () => useUi((s) => s.role === 'teen');

/** Ребёнок, которого видит родитель: зависит от возраста в оформленном пакете Moby Семья */
export const familyChild = (game: GameState) => (game.pkg?.age === 'teen' ? TEEN : KID);
