import type { ReactNode } from 'react';
import {
    CHILD_PRODUCTS,
    FEATURES,
    INSURANCE,
    PERIOD_NAMES,
    SPEND_CATS,
    childCardTail,
    type Controls,
    type GameState,
    type Pocket,
} from '@mt/shared';
import { DeviceMobileIcon, HeartbeatIcon, LockSimpleIcon, SnowflakeIcon, WalletIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn } from '../format';
import { CAT_ICONS } from '../icons';
import { familyChild } from '../roles';

/** Переключатель-строка: заголовок, подсказка, тумблер */
export function SwitchRow({
    title,
    hint,
    on,
    onToggle,
    icon,
    locked,
}: {
    title: string;
    hint?: string;
    on: boolean;
    onToggle?: () => void;
    icon?: ReactNode;
    locked?: boolean;
}) {
    return (
        <button
            className="switch-row"
            role="switch"
            aria-checked={on}
            disabled={locked || !onToggle}
            onClick={onToggle}
        >
            {icon}
            <div className="stack grow" style={{ gap: 2 }}>
                <b>{title}</b>
                {hint && <span className="tiny muted">{hint}</span>}
            </div>
            {locked ? <LockSimpleIcon size={20} color="var(--n-500)" /> : <span className="toggle" />}
        </button>
    );
}

function Stepper({
    value,
    step,
    min,
    max,
    onChange,
}: {
    value: number;
    step: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className="row" style={{ gap: 8 }}>
            <button className="step-btn small" onClick={() => onChange(Math.max(min, value - step))}>
                −
            </button>
            <b className="num" style={{ minWidth: 72, textAlign: 'center' }}>
                {byn(value)}
            </b>
            <button className="step-btn small" onClick={() => onChange(Math.min(max, value + step))}>
                +
            </button>
        </div>
    );
}

/** Родительский контроль: карта, лимиты, категории, функции, продукты, доступ, карманные деньги, страховка */
export function ControlTab({ game }: { game: GameState }) {
    const action = useGameAction();
    const flash = useUi((s) => s.flash);
    const c = game.controls;
    const child = familyChild(game);
    const teen = game.pkg?.age === 'teen';
    const set = (patch: Partial<Controls>) => action.mutate({ type: 'controls/set', patch });
    const setPocket = (patch: Partial<Pocket>) => action.mutate({ type: 'pocket/set', patch });
    const toast = (m: string) => flash(m, 'parentToast');

    return (
        <div className="stack" style={{ gap: 24 }}>
            <div className="stack" style={{ gap: 8 }}>
                <span className="h2">Карта {child.gen}</span>
                <div className={`card-state ${c.blocked ? 'blocked' : ''}`}>
                    <SnowflakeIcon size={26} weight="duotone" />
                    <div className="stack grow" style={{ gap: 2 }}>
                        <b className="nowrap">Карта •• {childCardTail(game)}</b>
                        <span className="tiny muted">
                            {game.pkg?.card === 'digital' ? 'Цифровая' : 'Физическая'} ·{' '}
                            {c.lost ? 'потеряна' : c.blocked ? 'заблокирована' : 'активна'}
                        </span>
                    </div>
                    {c.lost ? (
                        <button
                            className="btn compact"
                            onClick={() => {
                                action.mutate({ type: 'card/reissue' });
                                toast('Новая карта будет готова за 2–3 дня, цифровая уже в Moby');
                            }}
                        >
                            Перевыпустить
                        </button>
                    ) : (
                        <button
                            className={`btn compact ${c.blocked ? '' : 'ghost'}`}
                            onClick={() => {
                                action.mutate({ type: c.blocked ? 'card/unblock' : 'card/block' });
                                toast(c.blocked ? 'Карта разблокирована' : 'Карта заблокирована');
                            }}
                        >
                            {c.blocked ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                    )}
                </div>
            </div>

            <div className="stack" style={{ gap: 8 }}>
                <span className="h2">Лимиты</span>
                <div className="card stack" style={{ gap: 12 }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                        <div className="stack">
                            <b>В день</b>
                            <span className="tiny muted">потрачено {byn(game.spent.day)}</span>
                        </div>
                        <Stepper
                            value={c.dayLimit}
                            step={500}
                            min={500}
                            max={30_000}
                            onChange={(v) => set({ dayLimit: v })}
                        />
                    </div>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                        <div className="stack">
                            <b>В месяц</b>
                            <span className="tiny muted">потрачено {byn(game.spent.month)}</span>
                        </div>
                        <Stepper
                            value={c.monthLimit}
                            step={2_000}
                            min={2_000}
                            max={200_000}
                            onChange={(v) => set({ monthLimit: v })}
                        />
                    </div>
                    <div className="stack" style={{ gap: 8 }}>
                        <b>Подтверждать покупки дороже</b>
                        <div className="row" style={{ gap: 6 }}>
                            {[0, 1_000, 3_000, 5_000].map((v) => (
                                <button
                                    key={v}
                                    className={`seg-btn ${c.approveOver === v ? 'on' : ''}`}
                                    onClick={() => set({ approveOver: v })}
                                >
                                    {v ? `${v / 100} BYN` : 'Не нужно'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="stack" style={{ gap: 8 }}>
                <span className="h2">Категории покупок</span>
                <div className="list-card">
                    {SPEND_CATS.map((cat) => {
                        const Ico = CAT_ICONS[cat.id];
                        return (
                            <SwitchRow
                                key={cat.id}
                                title={cat.name}
                                hint={cat.forbidden ? 'Запрещено для детских карт всегда' : cat.hint}
                                on={!cat.forbidden && c.cats[cat.id]}
                                locked={cat.forbidden}
                                icon={
                                    <Ico
                                        size={22}
                                        weight="duotone"
                                        color={cat.forbidden ? 'var(--accent-2-700)' : 'var(--accent-700)'}
                                    />
                                }
                                onToggle={() => set({ cats: { ...c.cats, [cat.id]: !c.cats[cat.id] } })}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="stack" style={{ gap: 8 }}>
                <span className="h2">Что можно делать</span>
                <div className="list-card">
                    {FEATURES.map((f) => (
                        <SwitchRow
                            key={f.id}
                            title={f.name}
                            hint={f.hint}
                            on={c.features[f.id]}
                            onToggle={() => set({ features: { ...c.features, [f.id]: !c.features[f.id] } })}
                        />
                    ))}
                    <SwitchRow
                        title="Подписки — с моего согласия"
                        hint={
                            teen
                                ? 'С 14 лет подписки подключаются без согласия — вы видите их в «Подписках семьи»'
                                : 'Списание начнётся, только когда вы разрешите'
                        }
                        on={!teen && c.subsApproval}
                        locked={teen}
                        onToggle={() => set({ subsApproval: !c.subsApproval })}
                    />
                </div>
            </div>

            <div className="stack" style={{ gap: 8 }}>
                <span className="h2">Продукты, которые {child.name} может открыть</span>
                <div className="list-card">
                    {CHILD_PRODUCTS.map((p) => (
                        <SwitchRow
                            key={p.id}
                            title={p.name}
                            hint={p.teenOnly && !teen ? 'Доступно с 14 лет' : p.hint}
                            on={(!p.teenOnly || teen) && c.products[p.id]}
                            locked={p.teenOnly && !teen}
                            onToggle={() => set({ products: { ...c.products, [p.id]: !c.products[p.id] } })}
                        />
                    ))}
                </div>
            </div>

            <div className="stack" style={{ gap: 8 }}>
                <span className="h2">Карманные деньги</span>
                <div className="card stack" style={{ gap: 12 }}>
                    <SwitchRow
                        title={
                            game.pocket.on
                                ? `${byn(game.pocket.amt)} BYN ${PERIOD_NAMES[game.pocket.period]}`
                                : 'Выключены'
                        }
                        hint="Автоперевод с вашей карты •• 4821"
                        icon={<WalletIcon size={22} weight="duotone" color="var(--green)" />}
                        on={game.pocket.on}
                        onToggle={() => setPocket({ on: !game.pocket.on })}
                    />
                    <div className="row" style={{ gap: 6 }}>
                        {[300, 500, 1_000, 2_000].map((v) => (
                            <button
                                key={v}
                                className={`seg-btn ${game.pocket.amt === v ? 'on' : ''}`}
                                onClick={() => setPocket({ amt: v })}
                            >
                                {v / 100} BYN
                            </button>
                        ))}
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                        {(['day', 'week', 'month'] as const).map((p) => (
                            <button
                                key={p}
                                className={`seg-btn ${game.pocket.period === p ? 'on' : ''}`}
                                onClick={() => setPocket({ period: p })}
                            >
                                {{ day: 'День', week: 'Неделя', month: 'Месяц' }[p]}
                            </button>
                        ))}
                    </div>
                    <button
                        className="btn ghost"
                        onClick={() => {
                            action.mutate({ type: 'pocket/pay' });
                            toast(`Отправлено ${byn(game.pocket.amt)} BYN ${child.dat}`);
                        }}
                    >
                        Отправить сейчас
                    </button>
                </div>
            </div>

            <div className="stack" style={{ gap: 8 }}>
                <span className="h2">Доступ и защита</span>
                <div className="list-card">
                    <SwitchRow
                        title={`Вход ${child.gen} в Moby`}
                        hint={`Код входа ${game.pkg?.invite} · телефон ${child.gen}`}
                        icon={<DeviceMobileIcon size={22} weight="duotone" color="var(--accent-700)" />}
                        on={c.childAccess}
                        onToggle={() => set({ childAccess: !c.childAccess })}
                    />
                    <SwitchRow
                        title="Страховка ребёнка"
                        hint={`${byn(INSURANCE.monthly)} BYN в месяц · покрытие до ${byn(INSURANCE.cover)} BYN`}
                        icon={<HeartbeatIcon size={22} weight="duotone" color="var(--accent-2-700)" />}
                        on={game.insurance}
                        onToggle={() => {
                            action.mutate({ type: 'insurance/set', on: !game.insurance });
                            toast(game.insurance ? 'Страховка отключена' : 'Страховка подключена с завтрашнего дня');
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
