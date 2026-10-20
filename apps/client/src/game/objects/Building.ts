import { GameObjects, Scene } from 'phaser';
import * as Phaser from 'phaser';
import type { BuildingDef } from '@mt/shared';
import { emit } from '../EventBus';

export const TILE_W = 128;
export const TILE_H = 64;

/** Здание на изометрической карте. Пока — цветной ромб-заглушка; заменить спрайтом из ассетов. */
export class Building extends GameObjects.Container {
    constructor(
        scene: Scene,
        x: number,
        y: number,
        readonly def: BuildingDef,
        color: number,
    ) {
        super(scene, x, y);

        const base = scene.add.graphics();
        base.fillStyle(color, 1);
        base.fillPoints(diamond(TILE_W * 0.9, TILE_H * 0.9), true);
        base.fillStyle(Phaser.Display.Color.ValueToColor(color).darken(20).color, 1);
        base.fillRect(-TILE_W * 0.25, -TILE_H * 1.4, TILE_W * 0.5, TILE_H * 1.2);

        const label = scene.add
            .text(0, -TILE_H * 1.7, def.name, {
                fontFamily: 'system-ui, sans-serif',
                fontSize: '14px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
            })
            .setOrigin(0.5);

        this.add([base, label]);
        this.setSize(TILE_W, TILE_H * 2);
        this.setInteractive(
            new Phaser.Geom.Rectangle(-TILE_W / 2, -TILE_H * 1.5, TILE_W, TILE_H * 2),
            Phaser.Geom.Rectangle.Contains,
        );
        scene.add.existing(this);
    }

    /** Вызывается сценой, если тап не был перетаскиванием камеры */
    open() {
        emit('building:open', { id: this.def.id });
    }
}

export function diamond(w: number, h: number) {
    return [
        new Phaser.Math.Vector2(0, -h / 2),
        new Phaser.Math.Vector2(w / 2, 0),
        new Phaser.Math.Vector2(0, h / 2),
        new Phaser.Math.Vector2(-w / 2, 0),
    ];
}
