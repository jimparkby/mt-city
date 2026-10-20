import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { CITY_BONUSES, type GameState } from '@mt/shared';
import { BriefcaseIcon, CoinsIcon, PiggyBankIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { MAP_BUILDINGS, MAP_H, MAP_W, P, buildMapSvg, buildingName, minLevel, pinTop } from './cityArt';

const ACT_ICONS = { piggy: PiggyBankIcon, briefcase: BriefcaseIcon, coins: CoinsIcon };
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.6;

interface Pan {
    x: number;
    y: number;
    s: number;
}

/** Город: SVG-карта с перетаскиванием и зумом, поверх — таблички зданий и бонусы */
export function CityMap({ game }: { game: GameState }) {
    const openSheet = useUi((s) => s.openSheet);
    const flash = useUi((s) => s.flash);
    const action = useGameAction();
    const box = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState<Pan>({ x: -180, y: 125, s: 0.66 });

    // Карта перерисовывается только при смене уровня (стройки ↔ здания)
    const src = useMemo(
        () => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildMapSvg(game.level))}`,
        [game.level],
    );

    // Вписываем карту в ширину экрана при первом показе
    useEffect(() => {
        const w = box.current?.clientWidth ?? 372;
        const s = Math.min(1, 0.66 * (w / 372));
        // Как в макете: при ширине 372 px карта сдвинута на −180 px, чтобы банк и Биржа были в кадре
        setPan({ x: -180 * (s / 0.66) + (w - 372 * (s / 0.66)) / 2, y: 125 * (s / 0.66), s });
    }, []);

    // Жесты: один палец — сдвиг, два — зум. Тап без сдвига срабатывает как клик по кнопке.
    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const gesture = useRef<{ pan: Pan; x: number; y: number; dist: number } | null>(null);
    const dragged = useRef(false);

    const start = () => {
        const list = [...pointers.current.values()];
        const cx = list.reduce((a, p) => a + p.x, 0) / list.length;
        const cy = list.reduce((a, p) => a + p.y, 0) / list.length;
        const dist = list.length > 1 ? Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y) : 0;
        gesture.current = { pan, x: cx, y: cy, dist };
    };

    const onDown = (e: PointerEvent) => {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 1) dragged.current = false;
        start();
    };

    const onMove = (e: PointerEvent) => {
        if (!pointers.current.has(e.pointerId) || !gesture.current) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const g = gesture.current;
        const list = [...pointers.current.values()];
        const cx = list.reduce((a, p) => a + p.x, 0) / list.length;
        const cy = list.reduce((a, p) => a + p.y, 0) / list.length;
        if (!dragged.current && Math.hypot(cx - g.x, cy - g.y) < 6 && list.length < 2) return;
        if (!dragged.current) {
            dragged.current = true;
            try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            } catch {
                // ignore
            }
        }
        let s = g.pan.s;
        if (list.length > 1 && g.dist > 0) {
            const dist = Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y);
            s = clamp((g.pan.s * dist) / g.dist);
        }
        // Зум вокруг центра жеста
        const rect = box.current!.getBoundingClientRect();
        const ox = g.x - rect.left;
        const oy = g.y - rect.top;
        const k = s / g.pan.s;
        setPan({
            s,
            x: ox - (ox - g.pan.x) * k + (cx - g.x),
            y: oy - (oy - g.pan.y) * k + (cy - g.y),
        });
    };

    const onUp = (e: PointerEvent) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size > 0) start();
        else gesture.current = null;
        setTimeout(() => (dragged.current = pointers.current.size > 0 && dragged.current), 0);
    };

    const onWheel = (e: WheelEvent) => {
        const rect = box.current!.getBoundingClientRect();
        const ox = e.clientX - rect.left;
        const oy = e.clientY - rect.top;
        setPan((p) => {
            const s = clamp(p.s * (e.deltaY > 0 ? 0.9 : 1.1));
            const k = s / p.s;
            return { s, x: ox - (ox - p.x) * k, y: oy - (oy - p.y) * k };
        });
    };

    const tap = (fn: () => void) => () => {
        if (!dragged.current) fn();
    };

    return (
        <div
            ref={box}
            className="city"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onWheel={onWheel}
        >
            <div
                className="city-map"
                style={{ width: MAP_W, height: MAP_H, transform: `translate(${pan.x}px, ${pan.y}px) scale(${pan.s})` }}
            >
                <img src={src} alt="Карта города" draggable={false} />
                {MAP_BUILDINGS.map((b) => {
                    const locked = game.level < minLevel(b.id);
                    const [x, y] = P(b.i + b.w / 2, b.j + b.d / 2);
                    const showAct = b.act && !locked && !(b.act.alert ? false : game.collected[b.id]);
                    const ActIcon = b.act ? ACT_ICONS[b.act.icon] : null;
                    return (
                        <div
                            key={b.id}
                            className={`pin ${b.id === 'bank' ? 'act-below' : b.id === 'cofix' ? 'act-left' : ''}`}
                            style={{
                                left: x,
                                top: y - pinTop(b, locked),
                                transform: `translate(-50%, -100%) scale(${0.85 / pan.s})`,
                            }}
                        >
                            {showAct && ActIcon && (
                                <button
                                    className={`pin-act ${b.act!.alert ? 'alert' : ''}`}
                                    onClick={tap(() => {
                                        if (b.act!.alert) return openSheet({ type: 'building', id: b.id });
                                        action.mutate({ type: 'city/collect', id: b.id });
                                        flash(`+${CITY_BONUSES[b.id] / 100} MTcoin · ${buildingName(b.id)}`);
                                    })}
                                >
                                    <ActIcon size={18} weight={b.act!.alert ? 'bold' : 'duotone'} />
                                    {b.act!.label}
                                </button>
                            )}
                            <button
                                className={`pin-plate ${locked ? 'locked' : ''}`}
                                onClick={tap(() => openSheet({ type: 'building', id: b.id }))}
                            >
                                {buildingName(b.id)}
                                {locked && <span>· ур. {minLevel(b.id)}</span>}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const clamp = (s: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s));
