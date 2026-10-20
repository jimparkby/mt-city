import type { ReactNode } from 'react';
import { t } from '../../i18n';

interface Props {
    title: string;
    onClose?: () => void;
    children: ReactNode;
}

/** Шторка поверх карты. alert/confirm не используем — в WebView они блокируют мост. */
export function Modal({ title, onClose, children }: Props) {
    return (
        <div className="modal-backdrop">
            <div className="modal" role="dialog" aria-label={title}>
                <header className="modal-header">
                    <h2>{title}</h2>
                    {onClose && (
                        <button className="icon-button" onClick={onClose} aria-label={t('common.close')}>
                            ✕
                        </button>
                    )}
                </header>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}
