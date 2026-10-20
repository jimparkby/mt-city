import { GameObjects, Scene } from 'phaser';
import * as Phaser from 'phaser';
import type { BuildingDef } from '@mt/shared';
import { emit } from '../EventBus';
import { iconKey } from '../cityIcons';

export const TILE_W = 96;
export const TILE_H = 48;

/** Краски рисографа: верх, правая и левая грани */
export interface Palette {
    top: number;
    right: number;
    left: number;
}

export const LOCKED: Palette = { top: 0xe4ddcf, right: 0xd2c9b8, left: 0xbfb5a2 };

const FOOT = 1.5; // сторона основания в тайлах
const HEIGHT = 46;

/** Здание на изометрической карте: объёмный блок, значок с иконкой и подпись */
export class Building extends GameObjects.Container {
    private shape: GameObjects.Graphics;
    private badge: GameObjects.Graphics;
    private icon: GameObjects.Image;
    private label: GameObjects.Text;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        readonly def: BuildingDef,
        private readonly palette: Palette,
    ) {
        super(scene, x, y);

        this.shape = scene.add.graphics();
        this.badge = scene.add.graphics();
        this.icon = scene.add.image(0, -HEIGHT - 44, iconKey(def.id)).setDisplaySize(30, 30);
        this.label = scene.add
            .text(0, (TILE_H * FOOT) / 2 + 16, def.name, {
                fontFamily: 'Onest, system-ui, sans-serif',
                fontSize: '19px',
                fontStyle: '600',
                color: '#201e1d',
                backgroundColor: '#f5f1e8',
                padding: { x: 8, y: 4 },
            })
            .setOrigin(0.5);

        this.add([this.shape, this.badge, this.icon, this.label]);
        this.setInteractive(
            new Phaser.Geom.Rectangle(-TILE_W, -HEIGHT - 72, TILE_W * 2, HEIGHT + 72 + TILE_H * FOOT),
            Phaser.Geom.Rectangle.Contains,
        );
        scene.add.existing(this);
        this.setLocked(false);
    }

    setLocked(locked: boolean) {
        const p = locked ? LOCKED : this.palette;
        const w = (TILE_W * FOOT) / 2;
        const h = (TILE_H * FOOT) / 2;

        const g = this.shape.clear();
        // Тень
        g.fillStyle(0x201e1d, 0.12);
        g.fillPoints(diamond(w * 2 + 10, h * 2 + 6, 0, 4), true);
        // Левая грань
        g.fillStyle(p.left, 1);
        g.fillPoints([v(-w, 0), v(0, h), v(0, h - HEIGHT), v(-w, -HEIGHT)], true);
        // Правая грань
        g.fillStyle(p.right, 1);
        g.fillPoints([v(w, 0), v(0, h), v(0, h - HEIGHT), v(w, -HEIGHT)], true);
        // Крыша
        g.fillStyle(p.top, 1);
        g.fillPoints(diamond(w * 2, h * 2, 0, -HEIGHT), true);
        // Окна
        g.fillStyle(0xf5f1e8, locked ? 0.5 : 0.85);
        // Точка на нижнем ребре грани: s = 0…1 от угла к переднему краю; side = −1 левая, 1 правая
        const edge = (side: number, s: number, up: number) => v(side * (w - w * s), h * s - up);
        for (const side of [-1, 1]) {
            for (const s of [0.15, 0.45, 0.75]) {
                g.fillPoints(
                    [edge(side, s, 32), edge(side, s + 0.14, 32), edge(side, s + 0.14, 18), edge(side, s, 18)],
                    true,
                );
            }
        }

        // Значок с иконкой над крышей
        const b = this.badge.clear();
        b.fillStyle(0x201e1d, 0.15);
        b.fillCircle(2, -HEIGHT - 42, 24);
        b.fillStyle(0xf5f1e8, 1);
        b.fillCircle(0, -HEIGHT - 44, 24);
        b.lineStyle(2, locked ? 0xbfb5a2 : 0x201e1d, 1);
        b.strokeCircle(0, -HEIGHT - 44, 24);

        this.icon.setAlpha(locked ? 0.35 : 1);
        this.label.setText(locked ? `${this.def.name} · ур. ${this.def.minBankLevel}` : this.def.name);
        this.label.setColor(locked ? '#9a938a' : '#201e1d');
    }

    /** Вызывается сценой, если тап не был перетаскиванием камеры */
    open() {
        emit('building:open', { id: this.def.id });
    }
}

const v = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

export function diamond(w: number, h: number, cx = 0, cy = 0) {
    return [v(cx, cy - h / 2), v(cx + w / 2, cy), v(cx, cy + h / 2), v(cx - w / 2, cy)];
}
