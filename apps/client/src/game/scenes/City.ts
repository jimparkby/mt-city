import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { BUILDINGS, type BuildingId } from '@mt/shared';
import { EventBus, on } from '../EventBus';
import { Building, TILE_H, TILE_W, diamond } from '../objects/Building';

const MAP_SIZE = 12;
const DRAG_THRESHOLD = 8;

// Временная раскладка до появления карты в Tiled (TODO(feat/city): брать позиции из object layer city.tmj)
const LAYOUT: Record<BuildingId, { col: number; row: number; color: number }> = {
    bank: { col: 5, row: 5, color: 0x0b3d91 },
    sosedi: { col: 2, row: 3, color: 0xe85d04 },
    green: { col: 8, row: 3, color: 0x2a9d8f },
    cofix: { col: 3, row: 8, color: 0x6f4e37 },
    legal: { col: 8, row: 8, color: 0x7b2cbf },
    medical: { col: 10, row: 5, color: 0xd62828 },
    market: { col: 5, row: 1, color: 0xf4a261 },
    jobs: { col: 1, row: 6, color: 0x457b9d },
    plot: { col: 6, row: 10, color: 0x80b918 },
};

export class City extends Scene {
    private buildings: Building[] = [];

    constructor() {
        super('City');
    }

    create() {
        this.drawGround();
        this.placeBuildings();
        this.setupCamera();

        const off = on('city:refresh', () => this.refresh());
        this.events.once('shutdown', off);

        EventBus.emit('current-scene-ready', this);
    }

    private iso(col: number, row: number) {
        return { x: ((col - row) * TILE_W) / 2, y: ((col + row) * TILE_H) / 2 };
    }

    private drawGround() {
        const g = this.add.graphics();
        for (let row = 0; row < MAP_SIZE; row++) {
            for (let col = 0; col < MAP_SIZE; col++) {
                const { x, y } = this.iso(col, row);
                const road = col === 5 || row === 5;
                g.fillStyle(road ? 0x9e9e9e : (col + row) % 2 ? 0x7cc576 : 0x6fb86a, 1);
                g.fillPoints(
                    diamond(TILE_W, TILE_H).map((p) => p.add({ x, y })),
                    true,
                );
            }
        }
    }

    private placeBuildings() {
        // Сортировка по глубине: дальние здания рисуются первыми
        const defs = [...BUILDINGS].sort(
            (a, b) => LAYOUT[a.id].col + LAYOUT[a.id].row - (LAYOUT[b.id].col + LAYOUT[b.id].row),
        );
        for (const def of defs) {
            const { col, row, color } = LAYOUT[def.id];
            const { x, y } = this.iso(col, row);
            this.buildings.push(new Building(this, x, y, def, color));
        }
    }

    /** Перетаскивание одним пальцем, зум двумя пальцами или колесом; тап без сдвига — открыть здание */
    private setupCamera() {
        const cam = this.cameras.main;
        const center = this.iso(MAP_SIZE / 2, MAP_SIZE / 2);
        cam.centerOn(center.x, center.y);
        cam.setZoom(this.scale.width < 500 ? 0.6 : 1);

        let dragDistance = 0;
        let pinchStart = 0;
        let zoomStart = 1;

        this.input.on('pointerdown', () => {
            dragDistance = 0;
        });

        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            const p1 = this.input.pointer1;
            const p2 = this.input.pointer2;
            if (p1.isDown && p2.isDown) {
                const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
                if (!pinchStart) {
                    pinchStart = dist;
                    zoomStart = cam.zoom;
                }
                cam.setZoom(Phaser.Math.Clamp((zoomStart * dist) / pinchStart, 0.4, 2));
                dragDistance = Infinity;
                return;
            }
            pinchStart = 0;
            if (!p.isDown) return;
            const dx = p.x - p.prevPosition.x;
            const dy = p.y - p.prevPosition.y;
            dragDistance += Math.abs(dx) + Math.abs(dy);
            cam.scrollX -= dx / cam.zoom;
            cam.scrollY -= dy / cam.zoom;
        });

        this.input.on('gameobjectup', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
            if (dragDistance < DRAG_THRESHOLD && obj instanceof Building) obj.open();
        });

        this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
            cam.setZoom(Phaser.Math.Clamp(cam.zoom * (dy > 0 ? 0.9 : 1.1), 0.4, 2));
        });
    }

    private refresh() {
        // TODO(feat/city): перерисовать уровни зданий по данным GET /player/me
    }

    startMinigame(scene: string, jobId: string) {
        this.scene.launch(scene, { jobId });
        this.scene.pause();
    }
}
