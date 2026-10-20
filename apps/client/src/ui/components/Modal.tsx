import type { ReactNode } from 'react';
import { XIcon } from '@phosphor-icons/react';
import { t } from '../../i18n';
import { Sheet } from './Sheet';

interface Props {
    title: string;
    onClose?: () => void;
    children: ReactNode;
}

/** Экран здания: шторка с заголовком и крестиком */
export function Modal({ title, onClose, children }: Props) {
    return (
        <Sheet onClose={onClose}>
            <div className="row">
                <h2 className="h1">{title}</h2>
                {onClose && (
                    <button className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
                        <XIcon />
                    </button>
                )}
            </div>
            {children}
        </Sheet>
    );
}
