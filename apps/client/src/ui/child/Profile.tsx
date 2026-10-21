import { CARD_TIERS, SHOP, isOwned, tierIndex, type GameState } from '@mt/shared';
import { CheckIcon, CoinsIcon, HandTapIcon, LockSimpleIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn, coins } from '../format';
import { KID, TEEN, useTeen } from '../roles';
import { SKIN_LOOKS, TIER_LOOKS, avatarSVG, fullBg } from '../art/avatar';
import { BankCard, MiniCard } from '../components/BankCard';

/** Профиль: у ребёнка — персонаж и дизайны карты за MTcoin, у подростка — уровни карты и кешбэк по тратам */
export function Profile({ game }: { game: GameState }) {
    const teen = useTeen();
    return (
        <div className="stack" style={{ gap: 22 }}>
            {teen ? <TeenCard game={game} /> : <KidShop game={game} />}
        </div>
    );
}

function KidShop({ game }: { game: GameState }) {
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const balance = Math.floor(game.coins / 100);

    const pick = (id: string) => {
        const it = SHOP.card[id];
        if (game.skin === id) return;
        if (isOwned(game, 'card', id)) return action.mutate({ type: 'shop/equip', cat: 'card', id });
        if (balance < it.price) return flash(`Не хватает ${it.price - balance} MTcoin — выполни задание или квест`);
        action.mutate({ type: 'shop/buy', cat: 'card', id });
        flash(`Куплено: ${it.name} · −${it.price} MTcoin`);
    };

    return (
        <>
            <div className="kid-hero">
                <div className="kid-hero-figure">
                    <div className="kid-hero-shadow" />
                    <img src={avatarSVG(game.outfit, 5.2)} alt="Персонаж" draggable={false} />
                </div>
                <div className="stack grow" style={{ gap: 6, paddingBottom: 18 }}>
                    <span className="kicker light">МОЙ ПЕРСОНАЖ</span>
                    <span className="display" style={{ fontSize: 22 }}>
                        {KID.name}
                    </span>
                    <span className="coins-line">
                        <CoinsIcon size={20} weight="duotone" />
                        {coins(game.coins)} MTcoin
                    </span>
                    <span className="tiny">Монеты дают за квесты и задания. Тратить их можно только в игре.</span>
                </div>
            </div>
            <div className="stack" style={{ gap: 12 }}>
                <span className="h2">Дизайн карты</span>
                <BankCard
                    look={SKIN_LOOKS[game.skin]}
                    title="Moby Kids"
                    subtitle={`Дизайн «${SHOP.card[game.skin].name}»`}
                    number="5310 •••• •••• 7310"
                    holder={KID.name.toUpperCase()}
                    brand="mc"
                />
                <div className="shop-grid">
                    {Object.entries(SHOP.card).map(([id, it]) => {
                        const owned = isOwned(game, 'card', id);
                        const on = game.skin === id;
                        const can = balance >= it.price;
                        const state = on ? 'on' : owned ? 'owned' : can ? 'can' : 'no';
                        const PriceIcon = on ? CheckIcon : owned ? HandTapIcon : can ? CoinsIcon : LockSimpleIcon;
                        return (
                            <button key={id} className={`shop-item ${on ? 'on' : ''}`} onClick={() => pick(id)}>
                                <div
                                    className="shop-tile"
                                    style={{ background: fullBg(SKIN_LOOKS[id as keyof typeof SKIN_LOOKS]) }}
                                >
                                    <MiniCard />
                                </div>
                                <b>{it.name}</b>
                                <span className={`price ${state}`}>
                                    <PriceIcon
                                        size={15}
                                        weight={on ? 'bold' : state === 'can' ? 'duotone' : 'regular'}
                                    />
                                    {on ? 'Выбрано' : owned ? 'Выбрать' : `${it.price} MTcoin`}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

function TeenCard({ game }: { game: GameState }) {
    const ti = tierIndex(game.spent.month);
    const tier = CARD_TIERS[ti];
    const next = CARD_TIERS[ti + 1];
    const spent = game.spent.month;
    const pct = next ? Math.min(100, Math.round(((spent - tier.min) / (next.min - tier.min)) * 100)) : 100;

    return (
        <>
            <BankCard
                look={TIER_LOOKS[ti]}
                title="Moby Teen"
                subtitle={`Уровень карты: ${tier.n}`}
                number="4255 •••• •••• 5521"
                holder={TEEN.name.toUpperCase()}
                brand="visa"
            >
                <div className="cashback">
                    <b>{tier.cb}%</b>
                    <span>кешбэк</span>
                </div>
            </BankCard>
            <div className="card stack" style={{ gap: 8 }}>
                <div
                    className="row wrap"
                    style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: '4px 8px' }}
                >
                    <b style={{ fontSize: 15 }}>{next ? `Далее: ${next.cb}% · ${next.n}` : 'Максимальный кешбэк'}</b>
                    {next && <span className="small nowrap">ещё {byn(next.min - spent)} BYN</span>}
                </div>
                <div className="progress">
                    <div style={{ width: `${pct}%` }} />
                </div>
                <span className="small">
                    Кешбэк зависит от трат по карте за месяц: чем больше платишь картой, тем выше процент. В этом месяце
                    потрачено {byn(spent)} BYN.
                </span>
            </div>
            <div className="stack" style={{ gap: 8 }}>
                <span className="h2">Уровни карты</span>
                {CARD_TIERS.map((t, k) => (
                    <div key={t.n} className={`tier-row ${k === ti ? 'now' : ''} ${k > ti + 1 ? 'far' : ''}`}>
                        <div className="tier-swatch" style={{ background: fullBg(TIER_LOOKS[k]) }} />
                        <div className="grow">
                            <b>{t.n}</b>
                            <span className="small">{t.min ? `от ${byn(t.min)} BYN трат в месяц` : 'без порога'}</span>
                        </div>
                        {k <= ti && <span className="tier-tag">{k === ti ? 'сейчас' : 'пройден'}</span>}
                        <span className="tier-cb">{t.cb}%</span>
                    </div>
                ))}
            </div>
        </>
    );
}
