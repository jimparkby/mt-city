import {
    ArrowDownLeftIcon,
    BankIcon,
    BriefcaseIcon,
    CoffeeIcon,
    FirstAidKitIcon,
    HouseLineIcon,
    ScalesIcon,
    ShoppingCartIcon,
    StampIcon,
    StorefrontIcon,
    BroomIcon,
    BusIcon,
    DiceFiveIcon,
    DropIcon,
    FilmSlateIcon,
    ForkKnifeIcon,
    GameControllerIcon,
    ProhibitIcon,
    ShoppingBagIcon,
    StarIcon,
    TrashIcon,
    type Icon,
} from '@phosphor-icons/react';
import type { BuildingId, SpendCat, TaskIcon } from '@mt/shared';

/** Иконки зданий для старой Phaser-карты (src/game) */
export const BUILDING_ICONS: Record<BuildingId, Icon> = {
    bank: BankIcon,
    sosedi: ShoppingCartIcon,
    green: StorefrontIcon,
    cofix: CoffeeIcon,
    jobs: BriefcaseIcon,
    medical: FirstAidKitIcon,
    plot: HouseLineIcon,
    market: ScalesIcon,
    legal: StampIcon,
};

export const TASK_ICONS: Record<TaskIcon, Icon> = {
    trash: TrashIcon,
    drop: DropIcon,
    broom: BroomIcon,
    star: StarIcon,
};

export const CAT_ICONS: Record<SpendCat | 'income', Icon> = {
    food: ForkKnifeIcon,
    transport: BusIcon,
    shops: ShoppingBagIcon,
    fun: FilmSlateIcon,
    games: GameControllerIcon,
    gambling: DiceFiveIcon,
    adult: ProhibitIcon,
    income: ArrowDownLeftIcon,
};
