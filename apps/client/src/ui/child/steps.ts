import { LOC_ORDER, pathSteps, stepStatuses, type GameState } from '@mt/shared';
import { BookOpenIcon, CoffeeIcon, HeadphonesIcon, QuestionIcon, type Icon } from '@phosphor-icons/react';

export const STEP_ICONS: Record<string, Icon> = {
    lesson: BookOpenIcon,
    quiz: QuestionIcon,
    sim: HeadphonesIcon,
    work: CoffeeIcon,
};

/** Первый непройденный шаг по порядку зданий */
export function nextStep(game: GameState, teen: boolean) {
    for (const id of LOC_ORDER) {
        const k = stepStatuses(game, id, teen).indexOf('current');
        if (k >= 0) return { id, k, step: pathSteps(id, teen)[k] };
    }
    return null;
}
