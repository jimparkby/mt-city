import type { ReactNode } from 'react';
import { useUi } from '../../store/ui';

/** Шторка снизу. alert/confirm не используем — в WebView они блокируют мост. */
export function Sheet({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
    const closeSheet = useUi((s) => s.closeSheet);
    return (
        <>
            <div className="backdrop" onClick={onClose ?? closeSheet} />
            <div className="sheet" role="dialog">
                <div className="grip" />
                {children}
            </div>
        </>
    );
}
