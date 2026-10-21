// Оболочка Moby для демо: главная, продукты, чат и «Ещё». В пилоте это экраны самого приложения банка,
// а МТ Сити открывается в нём как WebView.

import { CARD_TIERS, SHOP, subsTotals, tierIndex, weekQuests, type GameState } from '@mt/shared';
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    ArrowsClockwiseIcon,
    BankIcon,
    BellIcon,
    BriefcaseIcon,
    BuildingsIcon,
    CaretLeftIcon,
    CaretRightIcon,
    CardsIcon,
    ChatsIcon,
    ClockCounterClockwiseIcon,
    CreditCardIcon,
    CurrencyCircleDollarIcon,
    DotsThreeOutlineIcon,
    EyeIcon,
    EyeSlashIcon,
    FileTextIcon,
    GearIcon,
    HouseIcon,
    IdentificationCardIcon,
    InfoIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    PaperclipIcon,
    PiggyBankIcon,
    SmileyIcon,
    TrayArrowDownIcon,
    UserIcon,
    UsersThreeIcon,
    WalletIcon,
    HandCoinsIcon,
    LockSimpleIcon,
    StarIcon,
    RepeatIcon,
    type Icon,
} from '@phosphor-icons/react';
import { useUi, type BankTab } from '../../store/ui';
import { byn, when } from '../format';
import { KID, PARENT_NAME, TEEN, familyChild } from '../roles';
import { useGameAction } from '../../api/hooks';
import { SKIN_LOOKS, TIER_LOOKS, fullBg } from '../art/avatar';

const useNotInDemo = () => {
    const flash = useUi((s) => s.flash);
    return () => flash('В демо этот раздел не работает', 'bankToast');
};

/** Открыть МТ Сити (для родителя — Moby Семья) */
const useToCity = () => {
    const goBank = useUi((s) => s.goBank);
    return () => goBank('city');
};

export function BankHome({ game }: { game: GameState }) {
    const role = useUi((s) => s.role);
    const family = !!game.pkg;
    const hide = useUi((s) => s.hideBalance);
    const set = useUi((s) => s.set);
    const flash = useUi((s) => s.flash);
    const famChild = familyChild(game);
    const notInDemo = useNotInDemo();
    const toCity = useToCity();
    const isParent = role === 'parent',
        teen = role === 'teen';
    const child = teen ? TEEN : KID;
    const ti = tierIndex(game.spent.month),
        tier = CARD_TIERS[ti],
        next = CARD_TIERS[ti + 1];
    const reviewN = game.tasks.filter((t) => t.status === 'review').length;
    const decideN =
        game.ops.filter((o) => o.status === 'pending').length + game.requests.filter((r) => r.status === 'open').length;
    const lastOp = game.ops[0];
    const c = game.controls;
    const weekDone = weekQuests(game).filter((q) => q.done).length;
    const famTeen = famChild === TEEN;

    const banner = isParent
        ? !family
            ? 'Создайте семью, чтобы выпустить детскую карту'
            : decideN
              ? `${famChild.name} ждёт вашего решения: ${decideN}`
              : reviewN
                ? `${famChild.name} ${famChild.did} задание — проверьте и переведите награду`
                : 'Поставьте ребёнку новое задание'
        : teen
          ? next
              ? `Потрать картой ещё ${byn(next.min - game.spent.month)} BYN — и кешбэк ${next.cb}%`
              : 'У тебя максимальный кешбэк 3%'
          : `Квесты недели ${weekDone} из 5 · в магазине новые вещи`;

    interface HomeCard {
        kicker: string;
        value: string;
        art: string;
        mark: string;
        tag: string;
        onTap: () => void;
    }
    const kidCard: HomeCard = teen
        ? {
              kicker: `Moby Teen · кешбэк ${tier.cb}%`,
              value: `${byn(game.byn)} BYN`,
              art: fullBg(TIER_LOOKS[ti]),
              mark: 'MT',
              tag: c.blocked ? 'Заблокирована' : next ? `до ${next.cb}%` : '',
              onTap: () => set({ page: 'card' }),
          }
        : {
              kicker: `Moby Kids · ${SHOP.card[game.skin].name}`,
              value: `${byn(game.byn)} BYN`,
              art: fullBg(SKIN_LOOKS[game.skin]),
              mark: 'MT',
              tag: c.blocked ? 'Заблокирована' : '',
              onTap: () => set({ page: 'card' }),
          };
    const partnersCard: HomeCard = {
        kicker: 'Партнёры и баллы',
        value: `${isParent ? game.points.parent : game.points.child} баллов`,
        art: 'linear-gradient(135deg,#ffd23f,#e0218a)',
        mark: '★',
        tag: '',
        onTap: () => set({ page: 'partners' }),
    };
    const cards: HomeCard[] = isParent
        ? [
              {
                  kicker: 'Prime Line EUR',
                  value: '5.14 EUR',
                  art: 'linear-gradient(135deg,#2a2d39,#0e0f14)',
                  mark: '',
                  tag: '',
                  onTap: notInDemo,
              },
              family
                  ? {
                        kicker: `Детская карта · ${famChild.name}`,
                        value: `${byn(game.byn)} BYN`,
                        art: famTeen ? fullBg(TIER_LOOKS[ti]) : fullBg(SKIN_LOOKS[game.skin]),
                        mark: 'MT',
                        tag: decideN || reviewN ? `${decideN + reviewN} ждут вас` : '',
                        onTap: toCity,
                    }
                  : {
                        kicker: 'Moby Семья',
                        value: 'Создать семью',
                        art: 'linear-gradient(135deg,#ff4fa8,#2f6bf0)',
                        mark: '+',
                        tag: 'Новое',
                        onTap: toCity,
                    },
              partnersCard,
          ]
        : [
              kidCard,
              {
                  kicker: `Копилка · ${game.kop.name}`,
                  value: `${byn(Math.round(game.kop.saved * 100))} из ${byn(Math.round(game.kop.target * 100))} BYN`,
                  art: 'linear-gradient(135deg,#3ecf6e,#1d6b3a)',
                  mark: '',
                  tag: game.kop.planned ? '' : 'План',
                  onTap: () => set({ page: 'kopilka' }),
              },
              ...(teen
                  ? [
                        {
                            kicker: 'Вклады в BYN',
                            value: game.deposits.length
                                ? `${byn(game.deposits.reduce((a, d) => a + d.amt, 0))} BYN`
                                : 'от 3% годовых',
                            art: 'linear-gradient(135deg,#ff9a3d 0%,#e0218a 100%)',
                            mark: '%',
                            tag: game.deposits.length ? '' : 'Новое',
                            onTap: () => set({ page: 'deposits' }),
                        },
                    ]
                  : []),
              partnersCard,
          ];

    const actions: [string, Icon, () => void][] = isParent
        ? [
              ['Пополнить', TrayArrowDownIcon, notInDemo],
              ['Перевести', ArrowsClockwiseIcon, notInDemo],
              ['Оплатить', WalletIcon, notInDemo],
          ]
        : [
              ['Попросить', HandCoinsIcon, () => set({ bankSheet: 'ask' })],
              [
                  'Перевести',
                  ArrowsClockwiseIcon,
                  () =>
                      flash(
                          c.features.transfers
                              ? 'В демо переводы не работают'
                              : 'Переводы выключены мамой — попроси включить на экране карты',
                          'bankToast',
                      ),
              ],
              ['Оплатить', WalletIcon, () => set({ bankSheet: 'pay' })],
          ];

    return (
        <div className="bank-scroll scroll" style={{ gap: 14, paddingBottom: 24 }}>
            <div className="bank-hero">
                <div className="row" style={{ gap: 12 }}>
                    <div className="user-tile">
                        <UserIcon size={26} />
                        <span className="dot-badge">4</span>
                    </div>
                    <span style={{ fontSize: 22, fontWeight: 800 }}>{isParent ? PARENT_NAME : child.name}</span>
                </div>
                <div className="row" style={{ gap: 6 }}>
                    <span className="glass-chip">{isParent ? 'Prime Line BYN' : child.card}</span>
                    <span className="glass-chip">{isParent ? '5*4821' : child.mask}</span>
                    <InfoIcon size={20} color="rgba(255,255,255,.8)" />
                </div>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="balance num">
                        {hide ? '•••• BYN' : `${byn(isParent ? game.parentCard : game.byn)} BYN`}
                    </span>
                    <button
                        className="icon-btn plain light"
                        onClick={() => set({ hideBalance: !hide })}
                        aria-label="Скрыть баланс"
                    >
                        {hide ? <EyeIcon size={30} /> : <EyeSlashIcon size={30} />}
                    </button>
                </div>
                <div className="grid-3">
                    {actions.map(([label, Ico, onTap]) => (
                        <button key={label} className="quick-action" onClick={onTap}>
                            <span>
                                <Ico size={32} />
                            </span>
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="row pad" style={{ gap: 10, alignItems: 'stretch' }}>
                <div className="history-tile">
                    <ClockCounterClockwiseIcon size={26} />
                </div>
                <button
                    className="op-card"
                    onClick={() => (isParent ? set({ bankTab: 'city', parentTab: 'ops' }) : set({ page: 'card' }))}
                >
                    <div className="op-icon">
                        <ArrowUpRightIcon size={24} />
                    </div>
                    <div className="stack grow" style={{ minWidth: 0, lineHeight: 1.25 }}>
                        <b className="ellipsis">
                            {isParent ? `Карта ${famChild.gen}` : (lastOp?.title ?? 'Операций нет')}
                        </b>
                        <span className="small ellipsis" style={{ fontSize: 13 }}>
                            {isParent ? (lastOp?.title ?? 'Операций нет') : lastOp ? when(lastOp.at) : ''}
                        </span>
                    </div>
                    {lastOp && (
                        <b className={`num ${lastOp.status === 'declined' ? 'neg' : ''}`}>
                            {lastOp.income ? '+' : '−'}
                            {byn(lastOp.amt)}
                        </b>
                    )}
                </button>
            </div>
            <div className="pad">
                <button className="city-banner" onClick={toCity}>
                    <div className="city-banner-icon">
                        <BuildingsIcon size={32} weight="duotone" />
                    </div>
                    <div className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                        <span className="display" style={{ fontSize: 17 }}>
                            МТ СИТИ
                        </span>
                        <span className="banner-sub">{banner}</span>
                    </div>
                    <CaretRightIcon size={22} />
                </button>
            </div>
            <div className="home-cards">
                {cards.map((c) => (
                    <button key={c.kicker} className="home-card" onClick={c.onTap}>
                        <div className="card-thumb" style={{ background: c.art }}>
                            {c.mark}
                        </div>
                        <div className="stack grow" style={{ minWidth: 0, lineHeight: 1.25 }}>
                            <span className="home-card-kicker">{c.kicker}</span>
                            <b className="num" style={{ fontSize: 19 }}>
                                {c.value}
                            </b>
                        </div>
                        {c.tag && <span className="new-tag">{c.tag}</span>}
                        <CaretRightIcon size={20} color="var(--n-600)" />
                    </button>
                ))}
            </div>
        </div>
    );
}

export function BankProducts({ game }: { game: GameState }) {
    const role = useUi((s) => s.role);
    const family = !!game.pkg;
    const set = useUi((s) => s.set);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const famChild = familyChild(game);
    const allowed = game.controls.products;
    /** Продукт, который родитель не разрешил: просим доступ */
    const ask = (key: 'kopilka' | 'deposits') => () => {
        action.mutate({ type: 'req/create', kind: 'product', key, note: '' });
        flash('Нужно разрешение мамы — просьба отправлена', 'bankToast');
    };
    const notInDemo = useNotInDemo();
    const toCity = useToCity();
    const teen = role === 'teen';

    const products: { title: string; sub: string; Icon: Icon; isNew?: boolean; locked?: boolean; go?: () => void }[] =
        role === 'parent'
            ? [
                  { title: 'Карты и счета', sub: 'Ваши карты и счета', Icon: CardsIcon },
                  { title: 'Кредиты', sub: 'Ваши кредитные продукты', Icon: WalletIcon },
                  { title: 'Вклады', sub: 'Ваши сбережения и вклады', Icon: PiggyBankIcon },
                  {
                      title: 'Moby Семья',
                      sub: family
                          ? `Детская карта ${famChild.gen} и задания`
                          : 'Создайте семью, чтобы выпустить детскую карту',
                      Icon: UsersThreeIcon,
                      isNew: !family,
                      go: toCity,
                  },
                  {
                      title: 'Подписки семьи',
                      sub: `${byn(subsTotals(game.subs).total)} BYN в месяц · кто что подключил`,
                      Icon: RepeatIcon,
                      go: () => set({ page: 'subs' }),
                  },
                  {
                      title: 'Партнёры и баллы',
                      sub: 'Скидки и семейный кешбэк у партнёров',
                      Icon: StarIcon,
                      go: () => set({ page: 'partners' }),
                  },
              ]
            : [
                  {
                      title: 'Моя карта',
                      sub: teen
                          ? 'Moby Teen · кешбэк растёт с тратами по карте'
                          : 'Moby Kids · дизайн из магазина МТ Сити',
                      Icon: CardsIcon,
                      go: () => set({ page: 'card' }),
                  },
                  {
                      title: 'Копилка',
                      sub: allowed.kopilka ? 'План накопления на твою цель' : 'Нужно разрешение мамы',
                      Icon: PiggyBankIcon,
                      locked: !allowed.kopilka,
                      go: allowed.kopilka ? () => set({ page: 'kopilka' }) : ask('kopilka'),
                  },
                  ...(teen
                      ? [
                            {
                                title: 'Вклады',
                                sub: allowed.deposits
                                    ? 'МТБелки и базовые вклады от 3% годовых'
                                    : 'Нужно разрешение мамы',
                                Icon: BankIcon,
                                isNew: allowed.deposits,
                                locked: !allowed.deposits,
                                go: allowed.deposits ? () => set({ page: 'deposits' }) : ask('deposits'),
                            },
                        ]
                      : []),
                  {
                      title: 'Мои подписки',
                      sub: `${byn(subsTotals(game.subs.filter((x) => x.who === (teen ? 'teen' : 'kid'))).total)} BYN в месяц`,
                      Icon: RepeatIcon,
                      go: () => set({ page: 'subs' }),
                  },
                  {
                      title: 'Партнёры и баллы',
                      sub: 'Скидки и баллы у партнёров семьи',
                      Icon: StarIcon,
                      go: () => set({ page: 'partners' }),
                  },
                  { title: 'МТ Сити', sub: 'Город, квесты и задания от мамы', Icon: BuildingsIcon, go: toCity },
              ];

    return (
        <div className="bank-scroll scroll pad-all" style={{ gap: 6 }}>
            {products.map((p) => (
                <button key={p.title} className="product-row" onClick={p.go ?? notInDemo}>
                    <p.Icon size={30} weight={p.Icon === BuildingsIcon ? 'duotone' : 'regular'} />
                    <div className="stack grow" style={{ gap: 4 }}>
                        <span className="product-title">
                            {p.title}
                            {p.isNew && <span className="new-tag small">Новое</span>}
                            {p.locked && <LockSimpleIcon size={18} color="var(--n-500)" />}
                        </span>
                        <span className="small">{p.sub}</span>
                    </div>
                </button>
            ))}
            <div className="divider" />
            <div className="product-row static">
                <BriefcaseIcon size={30} />
                <div className="stack" style={{ gap: 4 }}>
                    <span className="product-title">Заявки на продукты</span>
                    <span className="small">Ваши заявки на кредитные и иные продукты банка</span>
                </div>
            </div>
            <div className="grow" />
            <button className="btn-bank" onClick={notInDemo}>
                <CreditCardIcon size={26} />
                <u>Оформить</u>
            </button>
        </div>
    );
}

export function BankChat() {
    return (
        <div className="chat">
            <div className="chat-head">
                <CaretLeftIcon size={24} color="var(--accent-600)" />
                <span className="grow">Чат</span>
                <MagnifyingGlassIcon size={24} color="var(--n-700)" />
            </div>
            <div className="chat-empty">Отправьте сообщение, чтобы начать чат</div>
            <div className="chat-input">
                <PaperclipIcon size={24} color="var(--accent-600)" />
                <div className="chat-field">
                    Новое сообщение
                    <SmileyIcon size={24} color="var(--accent-600)" />
                </div>
                <div className="chat-send">
                    <ArrowRightIcon size={22} />
                </div>
            </div>
        </div>
    );
}

export function BankMore() {
    const role = useUi((s) => s.role);
    const notInDemo = useNotInDemo();
    const toCity = useToCity();
    const isParent = role === 'parent';
    const items: [string, Icon, boolean?, boolean?][] = [
        ['Настройки', GearIcon],
        ['Персональные данные', IdentificationCardIcon],
        ['Документы', FileTextIcon],
        ['Уведомления', BellIcon, true],
        [isParent ? 'Moby Семья' : 'МТ Сити', isParent ? UsersThreeIcon : BuildingsIcon, false, true],
        ['Курсы валют', CurrencyCircleDollarIcon],
        ['Банк на карте', MapPinIcon],
        ['О Банке', InfoIcon],
    ];
    return (
        <div className="bank-scroll scroll pad-all" style={{ gap: 12 }}>
            {items.map(([label, Ico, badge, city]) => (
                <button key={label} className={`more-row ${city ? 'city' : ''}`} onClick={city ? toCity : notInDemo}>
                    <span className="more-icon">
                        <Ico size={26} weight={city && !isParent ? 'duotone' : 'regular'} />
                        {badge && <span className="dot-badge small">4</span>}
                    </span>
                    <span className="grow">{label}</span>
                    <CaretRightIcon size={22} color="var(--n-800)" />
                </button>
            ))}
            <span className="small center">Версия приложения 1.0.196</span>
        </div>
    );
}

const BANK_NAV: [BankTab, string, Icon][] = [
    ['home', 'Главная', HouseIcon],
    ['products', 'Продукты', CardsIcon],
    ['city', 'МТ Сити', BuildingsIcon],
    ['chat', 'Чат', ChatsIcon],
    ['more', 'Ещё', DotsThreeOutlineIcon],
];

export function BankNav({ game }: { game: GameState }) {
    const tab = useUi((s) => s.bankTab);
    const role = useUi((s) => s.role);
    const goBank = useUi((s) => s.goBank);
    const reviewN = game.tasks.filter((t) => t.status === 'review').length;

    return (
        <nav className="nav bank">
            {BANK_NAV.map(([id, label, Ico]) => {
                const badge = id === 'more' ? 4 : id === 'city' && role === 'parent' ? reviewN : 0;
                return (
                    <button
                        key={id}
                        className={id === 'city' ? 'city-tab' : ''}
                        aria-current={tab === id ? 'page' : undefined}
                        onClick={() => goBank(id)}
                    >
                        <Ico size={26} weight={id === 'city' ? 'duotone' : 'regular'} />
                        {label}
                        {badge > 0 && <span className="count">{badge}</span>}
                    </button>
                );
            })}
        </nav>
    );
}
