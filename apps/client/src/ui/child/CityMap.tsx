import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode, type WheelEvent } from 'react';
import { CITY_BONUSES, PATHS, stepStatuses, type GameState } from '@mt/shared';
import { BriefcaseIcon, CoinsIcon, LockSimpleIcon, PiggyBankIcon } from '@phosphor-icons/react';
import { useGameAction } from '../../api/hooks';
import { avatar, boat, cars, movers, peds } from './cityState';
import { useUi } from '../../store/ui';
import { KID, TEEN, useTeen } from '../roles';
import { KID_DEFAULT, TEEN_LOOK, avatarSVG, type Look } from '../art/avatar';
import {
    BLD,
    LANES,
    MAP_H,
    MAP_W,
    N,
    P,
    boatSVG,
    buildingById,
    carSVG,
    groundUri,
    personSVG,
    r1,
    routeTo,
    spritesFor,
} from '../art/city';

const ACT_ICONS = { piggy: PiggyBankIcon, briefcase: BriefcaseIcon, coins: CoinsIcon };
const MIN_ZOOM = 0.42;
const MAX_ZOOM = 1.2;

interface Pan {
    x: number;
    y: number;
    s: number;
}

/** Город: изометрическая карта с перетаскиванием и зумом, машинами, пешеходами и персонажем */
export function CityMap({ game }: { game: GameState }) {
    const teen = useTeen();
    const flash = useUi((s) => s.flash);
    const openSheet = useUi((s) => s.openSheet);
    const openLoc = useUi((s) => s.openLoc);
    const walk = useUi((s) => s.walk);
    const action = useGameAction();
    const box = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState<Pan>({ x: -270, y: 110, s: 0.55 });

    const look: Look = teen ? TEEN_LOOK : (game.outfit ?? KID_DEFAULT);
    const avatarSrc = useMemo(() => avatarSVG(look, 1.45), [look.top, look.hat, look.hair]); // eslint-disable-line react-hooks/exhaustive-deps

    // Вписываем карту в экран при первом показе: как в макете при ширине 372 px
    useEffect(() => {
        const w = box.current?.clientWidth ?? 372;
        const k = w / 372;
        setPan({ x: -270 * k, y: 110 * k, s: 0.55 * k });
    }, []);

    // Персонаж идёт к зданию по тротуарам, потом открывается локация
    const walkTo = (id: string) => {
        const b = buildingById(id);
        avatar.path = routeTo(avatar, b);
        avatar.onArrive = () => openLoc(id);
        flash(`${teen ? TEEN.name : KID.name} идёт: ${b.name}`);
    };
    useEffect(() => {
        if (walk) walkTo(walk.id);
    }, [walk?.n]); // eslint-disable-line react-hooks/exhaustive-deps

    // Анимация: светофоры, машины тормозят на красный, пешеходы, лодка, шаги персонажа
    useEffect(() => {
        let raf = 0;
        let last = performance.now();
        let phase = -1;
        const place = (
            el: HTMLElement | null | undefined,
            i: number,
            j: number,
            ax: number,
            ay: number,
            flip: boolean,
            lift = 0,
            op?: number,
        ) => {
            if (!el) return;
            const p = P(i, j);
            el.style.transform = `translate(${r1(p[0] - ax)}px,${r1(p[1] - ay - lift)}px)${flip ? ' scaleX(-1)' : ''}`;
            el.style.zIndex = String(Math.round((i + j) * 10) + 14);
            if (op != null) el.style.opacity = String(op);
        };
        const tick = (now: number) => {
            raf = requestAnimationFrame(tick);
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (document.hidden) return;
            const t = now / 1000;
            const mv = movers;
            const ph = t % 14,
                gJ = ph < 6,
                gI = ph >= 7 && ph < 13,
                ph2 = gJ ? 1 : gI ? 2 : 0;
            if (phase !== ph2) {
                phase = ph2;
                (
                    [
                        ['tl0', gJ],
                        ['tl1', gI],
                    ] as const
                ).forEach(([id, g]) => {
                    const el = mv[id];
                    if (!el) return;
                    el.style.background = g ? '#3ee07a' : '#ff3b4a';
                    el.style.boxShadow = '0 0 8px ' + (g ? '#3ee07a' : '#ff3b4a');
                });
            }
            const loop = N + 1;
            LANES.forEach((lane, li) => {
                const own = cars.filter((c) => c.lane === li).sort((a, b) => a.s - b.s),
                    green = lane.axis === 'j' ? gJ : gI,
                    stop = lane.dir > 0 ? 6.7 : N - 8.3;
                own.forEach((c, k) => {
                    const lead = own[(k + 1) % own.length];
                    let gap = own.length > 1 ? lead.s - c.s : Infinity;
                    if (gap <= 0) gap += loop;
                    let free = gap - (c.len + lead.len) / 2 - 0.35;
                    if (!green && c.s <= stop + 0.02) free = Math.min(free, stop - c.s);
                    const want = Math.max(0, Math.min(c.max, free * 2.2));
                    c.v += (want - c.v) * Math.min(1, dt * 3);
                    c.s += Math.max(0, Math.min(c.v * dt, Math.max(0, free)));
                    if (c.s > loop) c.s -= loop;
                    const co = lane.dir > 0 ? c.s - 0.5 : N + 0.5 - c.s,
                        i = lane.axis === 'j' ? lane.at : co,
                        j = lane.axis === 'j' ? co : lane.at;
                    const fade = Math.max(0, Math.min(1, (Math.min(co, N - co) + 0.1) / 0.6));
                    place(mv['car' + cars.indexOf(c)], i, j, 28, 36, lane.axis === 'j', 0, fade);
                });
            });
            peds.forEach((p, k) => {
                p.t += dt * p.sp;
                const len = p.b - p.a,
                    q = p.t % (2 * len),
                    fwd = q < len,
                    pos = p.a + (fwd ? q : 2 * len - q);
                const i = p.line === 'i' ? p.at : pos,
                    j = p.line === 'i' ? pos : p.at;
                place(mv['ped' + k], i, j, 10, 29, (p.line === 'i') === fwd, Math.abs(Math.sin(t * 9 + k)) * 1.6);
            });
            boat.s = (boat.s + dt * 0.45) % (N + 1);
            const bj = boat.s - 0.5,
                under = bj > 6.3 && bj < 8.7;
            place(
                mv.boat,
                13.75,
                bj,
                28,
                36,
                true,
                Math.sin(t * 2) * 0.8,
                under ? 0 : Math.max(0, Math.min(1, (Math.min(bj, N - bj) + 0.1) / 0.8)),
            );
            let walking = false;
            if (avatar.path.length) {
                walking = true;
                const tg = avatar.path[0],
                    di = tg.i - avatar.i,
                    dj = tg.j - avatar.j,
                    dist = Math.hypot(di, dj),
                    step = 2.6 * dt;
                if (dist <= step) {
                    avatar.i = tg.i;
                    avatar.j = tg.j;
                    avatar.path.shift();
                    if (!avatar.path.length && avatar.onArrive) {
                        const cb = avatar.onArrive;
                        avatar.onArrive = null;
                        cb();
                    }
                } else {
                    avatar.i += (di / dist) * step;
                    avatar.j += (dj / dist) * step;
                    avatar.face = di - dj < 0 ? -1 : 1;
                }
            }
            place(mv.av, avatar.i, avatar.j, 15, 44, avatar.face < 0, walking ? Math.abs(Math.sin(t * 12)) * 2.2 : 0);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    const layer = useMemo(() => <StaticLayer level={game.level} />, [game.level]);

    // Жесты: один палец — сдвиг, два — зум. Тап без сдвига срабатывает как клик.
    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const gesture = useRef<{ pan: Pan; x: number; y: number; dist: number } | null>(null);
    const dragged = useRef(false);

    const clampPan = (p: Pan): Pan => {
        const w = box.current?.clientWidth ?? 372,
            h = box.current?.clientHeight ?? 700;
        return {
            s: p.s,
            x: Math.max(w - MAP_W * p.s - 60, Math.min(60, p.x)),
            y: Math.max(h - MAP_H * p.s - 100, Math.min(140, p.y)),
        };
    };

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
            s = clampZoom((g.pan.s * dist) / g.dist);
        }
        const rect = box.current!.getBoundingClientRect();
        const ox = g.x - rect.left;
        const oy = g.y - rect.top;
        const k = s / g.pan.s;
        setPan(clampPan({ s, x: ox - (ox - g.pan.x) * k + (cx - g.x), y: oy - (oy - g.pan.y) * k + (cy - g.y) }));
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
            const s = clampZoom(p.s * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
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
                style={{
                    width: MAP_W,
                    height: MAP_H,
                    transform: `translate(${r1(pan.x)}px,${r1(pan.y)}px) scale(${pan.s})`,
                }}
            >
                {layer}
                <div className="avatar-walker" ref={(el) => void (movers.av = el)}>
                    <div className="ring" />
                    <img src={avatarSrc} alt="" draggable={false} />
                    <div className="marker" />
                </div>
                {BLD.map((b) => {
                    const locked = game.level < b.minL;
                    const [x, y] = P(b.i + b.w / 2, b.j + b.d / 2);
                    const sts = PATHS[b.id] && !locked ? stepStatuses(game, b.id, teen) : null;
                    const doneN = sts ? sts.filter((s) => s === 'done').length : 0;
                    const showAct =
                        !!b.act && !locked && !game.collected[b.id] && (b.alert || !teen) && b.id in CITY_BONUSES;
                    const ActIcon = b.actIcon ? ACT_ICONS[b.actIcon] : null;
                    return (
                        <div
                            key={b.id}
                            className="pin"
                            style={{
                                left: x,
                                top: y - (locked ? 104 : b.lab),
                                transform: `translate(-50%,-100%) scale(${(0.85 / pan.s).toFixed(3)})`,
                            }}
                        >
                            {showAct && ActIcon && (
                                <button
                                    className={`pin-act ${b.alert ? 'alert' : ''} ${b.actLeft ? 'left' : ''}`}
                                    onClick={tap(() => {
                                        action.mutate({ type: 'city/collect', id: b.id });
                                        if (b.alert) return walkTo(b.id);
                                        flash(`+${b.coin} MTcoin · ${b.name}`);
                                    })}
                                >
                                    <ActIcon size={18} weight={b.alert ? 'bold' : 'duotone'} />
                                    {b.act}
                                </button>
                            )}
                            <button
                                className={`pin-plate ${locked ? 'locked' : ''}`}
                                onClick={tap(() =>
                                    locked || !PATHS[b.id] ? openSheet({ type: 'building', id: b.id }) : walkTo(b.id),
                                )}
                            >
                                {locked && <LockSimpleIcon size={14} weight="duotone" />}
                                <span>{b.name}</span>
                                {sts && (
                                    <span className={`prog ${doneN === sts.length ? 'full' : ''}`}>
                                        {doneN}/{sts.length}
                                    </span>
                                )}
                                {locked && <span className="lvl">ур. {b.minL}</span>}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const clampZoom = (s: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s));

/** Неподвижная часть карты и элементы, которые двигает анимация (через refs) */
function StaticLayer({ level }: { level: number }) {
    const refs = movers;
    const kids: ReactNode[] = [];
    kids.push(<img key="g" src={groundUri()} draggable={false} alt="" className="map-ground" />);
    const a = P(12.95, N),
        b = P(14.55, N),
        fw = b[0] - a[0],
        fh = b[1] - a[1];
    kids.push(
        <div
            key="wf"
            className="waterfall"
            style={{
                left: a[0],
                top: a[1],
                width: fw,
                height: fh + 46,
                clipPath: `polygon(0 0,${fw}px ${fh}px,${fw}px ${fh + 46}px,0 46px)`,
            }}
        />,
    );
    for (let k = 0; k < 8; k++) {
        const c = P(13.1 + ((k * 3) % 5) * 0.3, 1 + k * 2);
        kids.push(
            <div
                key={'sp' + k}
                className="sparkle"
                style={{ left: c[0] - 2, top: c[1] - 2, animationDelay: `${k * 0.37}s` }}
            />,
        );
    }
    spritesFor(level).forEach((sp, k) =>
        kids.push(
            <img
                key={'s' + k}
                src={sp.src}
                alt=""
                draggable={false}
                style={{ position: 'absolute', left: sp.x, top: sp.y, width: sp.w, height: sp.h, zIndex: sp.z }}
            />,
        ),
    );
    (
        [
            [6.42, 6.42, 'tl0'],
            [8.58, 8.58, 'tl1'],
        ] as const
    ).forEach(([i, j, id]) => {
        const c = P(i, j);
        kids.push(
            <div
                key={id}
                ref={(el) => void (refs[id] = el)}
                className="tlight"
                style={{ left: c[0] - 2.5, top: c[1] - 37, zIndex: Math.round((i + j) * 10) + 11 }}
            />,
        );
    });
    const mover = (id: string, src: string, w: number, h: number, ox: number, oy: number) =>
        kids.push(
            <img
                key={id}
                ref={(el) => void (refs[id] = el)}
                src={src}
                alt=""
                draggable={false}
                className="mover"
                style={{ width: w, height: h, transformOrigin: `${ox}px ${oy}px` }}
            />,
        );
    cars.forEach((c, k) => mover('car' + k, carSVG(c.col, c.len, c.bus), 56, 54, 28, 36));
    peds.forEach((p, k) => mover('ped' + k, personSVG(p.shirt, p.hair, 1), 20, 32, 10, 29));
    mover('boat', boatSVG(), 56, 54, 28, 36);
    (
        [
            [60, 0, 80],
            [300, -40, 110],
        ] as const
    ).forEach(([y, d, dur], k) => {
        const anim = `v7drift ${dur}s linear ${d - k * 30}s infinite`;
        kids.push(<div key={'cs' + k} className="cloud shadow" style={{ top: y + 150, animation: anim }} />);
        kids.push(<div key={'cl' + k} className="cloud" style={{ top: y, animation: anim }} />);
    });
    return <div className="map-layer">{kids}</div>;
}
