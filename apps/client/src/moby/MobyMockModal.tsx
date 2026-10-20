import { useEffect, useState } from 'react';
import { Modal } from '../ui/components/Modal';
import { moby, MockMobyBridge, type MobyScreen } from '.';

const TITLES: Record<MobyScreen, string> = {
    'savings-goal': 'Moby · Цель накопления',
    'pocket-money': 'Moby · Перевод карманных',
    'kids-card': 'Moby · Детская карта',
};

/** Имитация нативных экранов Moby на защите. Внутри реального Moby не рендерится. */
export function MobyMockModal() {
    const [screen, setScreen] = useState<{ id: MobyScreen; params?: Record<string, string> } | null>(null);

    useEffect(() => {
        if (!(moby instanceof MockMobyBridge)) return;
        return moby.subscribe((id, params) => setScreen(id ? { id, params } : null));
    }, []);

    if (!screen) return null;
    return (
        <Modal title={TITLES[screen.id]} onClose={() => setScreen(null)}>
            <div className="card moby-mock">
                <p>Здесь откроется нативный экран приложения Moby.</p>
                {screen.params && <pre>{JSON.stringify(screen.params, null, 2)}</pre>}
            </div>
        </Modal>
    );
}
