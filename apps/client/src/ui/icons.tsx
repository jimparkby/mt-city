import {
    BankIcon,
    BriefcaseIcon,
    BroomIcon,
    CoffeeIcon,
    DropIcon,
    FirstAidKitIcon,
    HouseLineIcon,
    ScalesIcon,
    ShoppingCartIcon,
    StampIcon,
    StarIcon,
    StorefrontIcon,
    TrashIcon,
    type Icon,
} from '@phosphor-icons/react';
import type { BuildingId, TaskIcon } from '@mt/shared';

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
