import { t } from '../../i18n';
import { Modal } from './Modal';

/** Временный экран для секторов, которые ещё не сделаны */
export function Placeholder({ title, onClose, todo }: { title: string; onClose: () => void; todo: string }) {
    return (
        <Modal title={title} onClose={onClose}>
            <p>{t('common.inProgress')}</p>
            <p className="muted">{todo}</p>
        </Modal>
    );
}
