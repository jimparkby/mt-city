import { formatCoins } from '@mt/shared';
import { useProducts } from '../../../api/hooks';
import { t } from '../../../i18n';
import { Coins } from '../../components/Coins';
import { Modal } from '../../components/Modal';

// TODO(feat/shop): корзина, POST /shops/:id/buy, экран чека
export function Shop({ shopId, title, onClose }: { shopId: string; title: string; onClose: () => void }) {
    const { data: products = [] } = useProducts(shopId);

    return (
        <Modal title={title || t('shop.title')} onClose={onClose}>
            <ul className="stack list">
                {products.map((p) => (
                    <li key={p.id} className="card row">
                        <span>{p.name}</span>
                        <span>
                            <Coins value={p.price} />
                            {p.bulkMinQty && p.bulkPrice && (
                                <small className="muted">
                                    {' '}
                                    {t('shop.bulk', { qty: p.bulkMinQty, price: formatCoins(p.bulkPrice) })}
                                </small>
                            )}
                        </span>
                    </li>
                ))}
            </ul>
        </Modal>
    );
}
