import { CARD_TIERS, SHOP, isOwned, tierIndex, weekQuests, type GameState, type ShopCategory } from '@mt/shared';
import {
    BaseballCapIcon,
    CheckIcon,
    CoinsIcon,
    CreditCardIcon,
    HandHeartIcon,
    HandTapIcon,
    HeadphonesIcon,
    LockSimpleIcon,
    PercentIcon,
    PiggyBankIcon,
    TShirtIcon,
    type Icon,
} from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi, type ShopTab } from '../../store/ui';
import { coins } from '../format';
import { KID, TEEN, useTeen } from '../roles';
import { SKIN_LOOKS, TIER_LOOKS, avatarSVG, fullBg } from '../art/avatar';
import { BankCard, MiniCard } from '../components/BankCard';

/** Профиль: у ребёнка — персонаж и магазин за MTcoin, у подростка — уровни карты и кешбэк */
export function Profile({ game }: { game: GameState }) {
    const teen = useTeen();
    const approved = game.tasks.filter((t) => t.status === 'paid').length;
    const badges: [string, boolean, Icon][] = [
        ['Первый вклад', true, PiggyBankIcon],
        ['Мечтатель', game.dreamDone, HeadphonesIcon],
        ['Помощник', approved >= 2, HandHeartIcon],
        ['Знаток процентов', game.quizDone, PercentIcon],
    ];
    const doneList = [
        { t: 'Откуда берутся деньги', pts: '+20' },
        { t: 'Нужды и хотелки', pts: '+20' },
        { t: 'Бюджет на неделю', pts: '+20' },
        ...(game.dreamDone ? [{ t: 'Накопи на мечту', pts: '+60' }] : []),
        ...(game.quizDone ? [{ t: 'Копилка и проценты', pts: '+40' }] : []),
    ];

    return (
        <div className="stack" style={{ gap: 22 }}>
            {teen ? <TeenCard game={game} /> : <KidShop game={game} />}
            <div className="stack" style={{ gap: 12 }}>
                <span className="h2">Награды</span>
                <div className="badges">
                    {badges.map(([t, on, Ico]) => (
                        <div key={t} className={`award ${on ? 'on' : ''}`}>
                            <div className="disc">
                                <Ico size={30} weight="duotone" />
                            </div>
                            <span>{t}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="stack" style={{ gap: 4 }}>
                <span className="h2" style={{ marginBottom: 6 }}>
                    Пройдено
                </span>
                {doneList.map((d) => (
                    <div key={d.t} className="done-row">
                        <span>{d.t}</span>
                        <b>{d.pts}</b>
                    </div>
                ))}
            </div>
        </div>
    );
}

const SHOP_TABS: [ShopTab, string, Icon][] = [
    ['top', 'Одежда', TShirtIcon],
    ['hat', 'Шапки', BaseballCapIcon],
    ['card', 'Карта', CreditCardIcon],
];

function KidShop({ game }: { game: GameState }) {
    const cat = useUi((s) => s.shopTab);
    const set = useUi((s) => s.set);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const balance = Math.floor(game.coins / 100);

    const pick = (c: ShopCategory, id: string) => {
        const it = SHOP[c][id];
        const on = c === 'card' ? game.skin === id : game.outfit[c] === id;
        if (on) return;
        if (isOwned(game, c, id)) return action.mutate({ type: 'shop/equip', cat: c, id });
        if (balance < it.price) return flash(`Не хватает ${it.price - balance} MTcoin — выполни задание или квест`);
        action.mutate({ type: 'shop/buy', cat: c, id });
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
                <span className="h2">Магазин</span>
                <div className="row" style={{ gap: 6 }}>
                    {SHOP_TABS.map(([id, label, Ico]) => (
                        <button
                            key={id}
                            className={`seg-btn ${cat === id ? 'on' : ''}`}
                            onClick={() => set({ shopTab: id })}
                        >
                            <Ico size={18} weight="duotone" />
                            {label}
                        </button>
                    ))}
                </div>
                {cat === 'card' && (
                    <BankCard
                        look={SKIN_LOOKS[game.skin]}
                        title="Moby Kids"
                        subtitle={`Дизайн «${SHOP.card[game.skin].name}»`}
                        number="5310 •••• •••• 7310"
                        holder={KID.name.toUpperCase()}
                        brand="mc"
                    />
                )}
                <div className="shop-grid">
                    {Object.entries(SHOP[cat]).map(([id, it]) => {
                        const isCard = cat === 'card';
                        const owned = isOwned(game, cat, id);
                        const on = isCard ? game.skin === id : game.outfit[cat] === id;
                        const can = balance >= it.price;
                        const state = on ? 'on' : owned ? 'owned' : can ? 'can' : 'no';
                        const PriceIcon = on ? CheckIcon : owned ? HandTapIcon : can ? CoinsIcon : LockSimpleIcon;
                        return (
                            <button key={id} className={`shop-item ${on ? 'on' : ''}`} onClick={() => pick(cat, id)}>
                                <div
                                    className="shop-tile"
                                    style={{
                                        background: isCard
                                            ? fullBg(SKIN_LOOKS[id as keyof typeof SKIN_LOOKS])
                                            : undefined,
                                    }}
                                >
                                    {isCard ? (
                                        <MiniCard />
                                    ) : (
                                        <img
                                            src={avatarSVG({ ...game.outfit, [cat]: id }, 2.5)}
                                            alt=""
                                            draggable={false}
                                        />
                                    )}
                                </div>
                                <b>{it.name}</b>
                                <span className={`price ${state}`}>
                                    <PriceIcon
                                        size={15}
                                        weight={on ? 'bold' : state === 'can' ? 'duotone' : 'regular'}
                                    />
                                    {on
                                        ? isCard
                                            ? 'Выбрано'
                                            : 'Надето'
                                        : owned
                                          ? isCard
                                              ? 'Выбрать'
                                              : 'Надеть'
                                          : `${it.price} MTcoin`}
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
    const ti = tierIndex(game.level);
    const tier = CARD_TIERS[ti];
    const next = CARD_TIERS[ti + 1];
    const weekDone = weekQuests(game).filter((q) => q.done).length;
    const pct = next
        ? Math.min(100, Math.round(((game.level - tier.lvl + weekDone / 5) / (next.lvl - tier.lvl)) * 100))
        : 100;

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
                    {next && <span className="small nowrap">на уровне {next.lvl}</span>}
                </div>
                <div className="progress">
                    <div style={{ width: `${pct}%` }} />
                </div>
                <span className="small">
                    Кешбэк растёт вместе с уровнем в МТ Сити. Новый уровень даёт сундук недели — выполни 5 квестов.
                </span>
            </div>
            <div className="stack" style={{ gap: 8 }}>
                <span className="h2">Уровни карты</span>
                {CARD_TIERS.map((t, k) => (
                    <div key={t.n} className={`tier-row ${k === ti ? 'now' : ''} ${k > ti + 1 ? 'far' : ''}`}>
                        <div className="tier-swatch" style={{ background: fullBg(TIER_LOOKS[k]) }} />
                        <div className="grow">
                            <b>{t.n}</b>
                            <span className="small">с уровня {t.lvl}</span>
                        </div>
                        {k <= ti && <span className="tier-tag">{k === ti ? 'сейчас' : 'пройден'}</span>}
                        <span className="tier-cb">{t.cb}%</span>
                    </div>
                ))}
            </div>
        </>
    );
}
