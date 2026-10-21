import { useState } from 'react';
import { INSURANCE, defaultControls, type AgeGroup } from '@mt/shared';
import {
    BuildingsIcon,
    CaretLeftIcon,
    CheckSquareIcon,
    CoinsIcon,
    CreditCardIcon,
    DeviceMobileIcon,
    GiftIcon,
    HeartbeatIcon,
    PercentIcon,
    PiggyBankIcon,
    ShieldCheckIcon,
    SquareIcon,
    StorefrontIcon,
    TruckIcon,
    WalletIcon,
    type Icon,
} from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn } from '../format';
import { KID, PARENT_NAME, TEEN } from '../roles';

const CONTENTS: [Icon, string, string][] = [
    [CreditCardIcon, 'Карта ребёнка', 'Физическая или цифровая Moby Kids / Moby Teen к вашему счёту'],
    [WalletIcon, 'Карманные деньги', 'Автоперевод раз в день, неделю или месяц'],
    [PiggyBankIcon, 'Копилка и вклады', 'Накопление на цель; с 14 лет — вклады в BYN'],
    [ShieldCheckIcon, 'Родительский контроль', 'Лимиты, категории, подтверждение покупок, блокировка'],
    [BuildingsIcon, 'Игра Moby', 'Финграмотность, задания от родителей и награды'],
    [StorefrontIcon, 'Партнёры семьи', 'Скидки и семейный кешбэк баллами: ребёнку и вам'],
    [HeartbeatIcon, 'Страховка ребёнка', 'По желанию, от несчастного случая'],
];

const TERMS: [string, string][] = [
    ['Обслуживание пакета', '0 BYN'],
    ['Детская карта и доставка', '0 BYN'],
    ['Семейный кешбэк у партнёров', 'до 7%'],
    ['Вклады подростка', '+0,5% к ставке'],
    ['Страховка ребёнка', `${byn(INSURANCE.monthly)} BYN/мес.`],
];

const STEPS = ['Пакет', 'Возраст', 'Карта', 'Согласия', 'Доступ'];

const CONSENTS = [
    { id: 'terms', text: 'Принимаю условия пакета «Moby Семья» и договора по детской карте', required: true },
    {
        id: 'data',
        text: 'Даю согласие на обработку персональных данных ребёнка как его законный представитель',
        required: true,
    },
    {
        id: 'access',
        text: 'Разрешаю ребёнку вход в Moby на его телефоне в рамках настроенных мною ограничений',
        required: true,
    },
    { id: 'marketing', text: 'Хочу получать персональные предложения партнёров для семьи', required: false },
];

/** Оформление пакета родителем: что получит семья → возраст → карта → согласия → доступ ребёнка */
export function PackageWizard() {
    const action = useGameAction();
    const flash = useUi((s) => s.flash);
    const [step, setStep] = useState(0);
    const [age, setAge] = useState<AgeGroup>('kid');
    const [card, setCard] = useState<'physical' | 'digital'>('physical');
    const [delivery, setDelivery] = useState<'courier' | 'office'>('courier');
    const [insurance, setInsurance] = useState(false);
    const [consents, setConsents] = useState<Record<string, boolean>>({});
    const child = age === 'teen' ? TEEN : KID;
    const ctl = defaultControls(age);
    const consentsOk = CONSENTS.every((c) => !c.required || consents[c.id]);

    const issue = () => {
        action.mutate({ type: 'pkg/issue', pkg: { age, card, delivery, marketing: !!consents.marketing }, insurance });
        flash(`Пакет оформлен. Карта для ${child.gen} ${card === 'physical' ? 'в пути' : 'уже в Moby'}`, 'parentToast');
    };

    return (
        <div className="parent-scroll scroll" style={{ gap: 20 }}>
            <div className="parent-hero">
                <div className="row" style={{ gap: 10 }}>
                    {step > 0 && (
                        <button className="icon-btn dark" onClick={() => setStep(step - 1)} aria-label="Назад">
                            <CaretLeftIcon size={22} />
                        </button>
                    )}
                    <div className="row grow" style={{ gap: 4 }}>
                        {STEPS.map((s, i) => (
                            <div key={s} className={`wiz-step ${i <= step ? 'on' : ''}`}>
                                <span />
                                {s}
                            </div>
                        ))}
                    </div>
                </div>
                {step === 0 && (
                    <>
                        <div className="row">
                            <div className="face-disc">{PARENT_NAME[0]}</div>
                            <div className="face-disc add">
                                <GiftIcon size={22} weight="duotone" />
                            </div>
                        </div>
                        <span className="display" style={{ fontSize: 24, lineHeight: 1.15 }}>
                            Пакет «Moby Семья»
                        </span>
                        <span className="hero-text">
                            Карта для ребёнка, карманные деньги, накопления и родительский контроль в одном приложении.
                            А ещё — игра, где ребёнок учится обращаться с деньгами.
                        </span>
                    </>
                )}
                {step > 0 && (
                    <span className="display" style={{ fontSize: 22, lineHeight: 1.15 }}>
                        {['', 'Сколько лет ребёнку?', 'Карта для ребёнка', 'Согласия', 'Доступ ребёнка в Moby'][step]}
                    </span>
                )}
            </div>

            {step === 0 && (
                <>
                    <div className="stack" style={{ gap: 10 }}>
                        <span className="h2">Что получит семья</span>
                        {CONTENTS.map(([Ico, t, d]) => (
                            <div key={t} className="feature-row">
                                <span className="feature-icon">
                                    <Ico size={24} weight="duotone" />
                                </span>
                                <div className="stack grow" style={{ gap: 2 }}>
                                    <b>{t}</b>
                                    <span className="small" style={{ fontSize: 13 }}>
                                        {d}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="stack" style={{ gap: 6 }}>
                        <span className="h2">Условия для семьи</span>
                        <div className="list-card">
                            {TERMS.map(([t, v]) => (
                                <div key={t} className="term-row">
                                    <span className="grow">{t}</span>
                                    <b>{v}</b>
                                </div>
                            ))}
                        </div>
                        <span className="tiny muted">
                            Условия в демо приблизительные. Один пакет — на всех детей семьи.
                        </span>
                    </div>
                    <button className="btn block tall" onClick={() => setStep(1)}>
                        Оформить пакет
                    </button>
                </>
            )}

            {step === 1 && (
                <>
                    <div className="grid-2">
                        {(
                            [
                                [
                                    'kid',
                                    '7–13 лет',
                                    CoinsIcon,
                                    'Карта к вашему счёту. Игровые MTcoin за обучение и задания.',
                                ],
                                [
                                    'teen',
                                    '14–17 лет',
                                    PercentIcon,
                                    'Своя карта с кешбэком до 3%. Может открыть вклад сам.',
                                ],
                            ] as const
                        ).map(([id, label, Ico, desc]) => (
                            <button key={id} className={`choice ${age === id ? 'on' : ''}`} onClick={() => setAge(id)}>
                                <Ico size={28} weight="duotone" />
                                <b>{label}</b>
                                <span>{desc}</span>
                            </button>
                        ))}
                    </div>
                    <div className="tip">
                        <ShieldCheckIcon size={24} weight="duotone" />
                        <span>
                            {age === 'kid'
                                ? 'До 14 лет договоры за ребёнка заключает родитель как законный представитель: карта выпускается к вашему счёту, а ребёнок пользуется ею в пределах ваших лимитов.'
                                : 'С 14 лет подросток по Гражданскому кодексу РБ сам распоряжается своими доходами и может вносить вклады. Карту он оформляет с вашего согласия, а вы сохраняете контроль.'}
                        </span>
                    </div>
                    <div className="stack" style={{ gap: 6 }}>
                        <span className="h2">Что будет включено сразу</span>
                        <span className="small">
                            Лимит {byn(ctl.dayLimit)} BYN в день и {byn(ctl.monthLimit)} BYN в месяц, покупки дороже{' '}
                            {byn(ctl.approveOver)} BYN — с вашего подтверждения. Азартные игры и 18+ запрещены всегда.{' '}
                            {age === 'kid'
                                ? 'Интернет-покупки, наличные и переводы выключены.'
                                : 'Интернет-покупки, наличные и переводы включены.'}{' '}
                            Всё можно изменить в разделе «Контроль».
                        </span>
                    </div>
                    <button className="btn block tall" onClick={() => setStep(2)}>
                        Дальше
                    </button>
                </>
            )}

            {step === 2 && (
                <>
                    <div className="grid-2">
                        {(
                            [
                                ['physical', 'Физическая', CreditCardIcon, 'Пластик с бесконтактной оплатой'],
                                ['digital', 'Цифровая', DeviceMobileIcon, 'Сразу в Moby, оплата телефоном'],
                            ] as const
                        ).map(([id, label, Ico, desc]) => (
                            <button
                                key={id}
                                className={`choice ${card === id ? 'on' : ''}`}
                                onClick={() => setCard(id)}
                            >
                                <Ico size={28} weight="duotone" />
                                <b>{label}</b>
                                <span>{desc}</span>
                            </button>
                        ))}
                    </div>
                    {card === 'physical' && (
                        <div className="stack" style={{ gap: 8 }}>
                            <span className="h2">Как получить</span>
                            {(
                                [
                                    ['courier', 'Курьером домой', 'за 2–3 дня, бесплатно'],
                                    ['office', 'В отделении МТБанка', 'на следующий день'],
                                ] as const
                            ).map(([id, t, d]) => (
                                <button
                                    key={id}
                                    className={`choice-row ${delivery === id ? 'on' : ''}`}
                                    onClick={() => setDelivery(id)}
                                >
                                    <TruckIcon size={26} weight="duotone" color="var(--accent-700)" />
                                    <div className="stack grow" style={{ gap: 2 }}>
                                        <b>{t}</b>
                                        <span className="tiny muted">{d}</span>
                                    </div>
                                </button>
                            ))}
                            <span className="tiny muted">
                                Пока карта едет, ребёнок уже платит цифровой картой в Moby.
                            </span>
                        </div>
                    )}
                    <button className={`choice-row ${insurance ? 'on' : ''}`} onClick={() => setInsurance(!insurance)}>
                        <HeartbeatIcon size={26} weight="duotone" color="var(--accent-2-700)" />
                        <div className="stack grow" style={{ gap: 2 }}>
                            <b>Страховка ребёнка</b>
                            <span className="tiny muted">
                                {byn(INSURANCE.monthly)} BYN в месяц · покрытие до {byn(INSURANCE.cover)} BYN · можно
                                подключить позже
                            </span>
                        </div>
                        <span className={`toggle-inline ${insurance ? 'on' : ''}`} />
                    </button>
                    <button className="btn block tall" onClick={() => setStep(3)}>
                        Дальше
                    </button>
                </>
            )}

            {step === 3 && (
                <>
                    <div className="stack" style={{ gap: 8 }}>
                        {CONSENTS.map((c) => (
                            <button
                                key={c.id}
                                className="consent"
                                onClick={() => setConsents((v) => ({ ...v, [c.id]: !v[c.id] }))}
                            >
                                {consents[c.id] ? (
                                    <CheckSquareIcon size={26} weight="fill" color="var(--accent)" />
                                ) : (
                                    <SquareIcon size={26} color="var(--n-600)" />
                                )}
                                <span className="grow">
                                    {c.text}
                                    {!c.required && <span className="muted"> · по желанию</span>}
                                </span>
                            </button>
                        ))}
                    </div>
                    <span className="tiny muted">
                        Согласия подтверждаются в Moby вашей биометрией или кодом. Их можно отозвать в «Настройках».
                    </span>
                    <button className="btn block tall" disabled={!consentsOk} onClick={() => setStep(4)}>
                        Подтвердить
                    </button>
                </>
            )}

            {step === 4 && (
                <>
                    <div className="invite-card">
                        <span className="small">Код для входа ребёнка</span>
                        <span className="display invite-code">MOBY-XXXX</span>
                        <span className="small">Код появится после выпуска карты и придёт вам в Moby</span>
                    </div>
                    <div className="stack">
                        {[
                            `${child.name} устанавливает Moby на свой телефон`,
                            'Вводит код и придумывает пароль — номер телефона подтверждаете вы',
                            'Видит свою карту, игру Moby и только разрешённые вами продукты',
                        ].map((t, n) => (
                            <div key={t} className="num-step">
                                <span className="num-disc">{n + 1}</span>
                                <span style={{ paddingTop: 4 }}>{t}</span>
                            </div>
                        ))}
                    </div>
                    <button className="btn block tall" onClick={issue}>
                        Выпустить карту и дать доступ
                    </button>
                </>
            )}
        </div>
    );
}
