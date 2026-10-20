import { BUILDINGS } from '@mt/shared';
import { useSession } from '../store/session';
import { Bank } from './screens/Bank';
import { Shop } from './screens/Shop';
import { BusinessBuilder, Jobs, LegalCenter, Lessons, Market, Medical, Parent } from './screens/placeholders';

/** Показывает экран, открытый через useSession().open() (обычно — тапом по зданию) */
export function ScreenHost() {
    const screen = useSession((s) => s.screen);
    const close = useSession((s) => s.close);

    switch (screen) {
        case null:
            return null;
        case 'bank':
            return <Bank onClose={close} />;
        case 'sosedi':
        case 'green':
        case 'cofix':
            return <Shop shopId={screen} title={BUILDINGS.find((b) => b.id === screen)?.name ?? ''} onClose={close} />;
        case 'legal':
            return <LegalCenter onClose={close} />;
        case 'jobs':
            return <Jobs onClose={close} />;
        case 'medical':
            return <Medical onClose={close} />;
        case 'market':
            return <Market onClose={close} />;
        case 'plot':
        case 'business-builder':
            return <BusinessBuilder onClose={close} />;
        case 'lessons':
            return <Lessons onClose={close} />;
        case 'parent':
            return <Parent onClose={close} />;
        case 'onboarding':
            return null; // показывается из App
    }
}
