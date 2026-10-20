import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { BUILDINGS, type BuildingId } from '@mt/shared';
import { EventBus, emit, on } from '../EventBus';
import { Building, TILE_H, TILE_W, diamond, type Palette } from '../objects/Building';

const MAP = 11;
const ROADS = [3, 7];
const DRAG_THRESHOLD = 8;

const MAGENTA: Palette = { top: 0xf3a6cb, right: 0xd6006c, left: 0xa10052 };
const CYAN: Palette = { top: 0xa9dcf3, right: 0x0091d2, left: 0x006a9a };
const YELLOW: Palette = { top: 0xfff1a0, right: 0xf2cf00, left: 0xc9a800 };
const INK: Palette = { top: 0x8a837a, right: 0x4a4540, left: 0x201e1d };

// Кварталы 3×3 между дорогами; здание стоит в центре своего квартала
const LAYOUT: Record<BuildingId, { col: number; row: number; palette: Palette }> = {
    sosedi: { col: 1, row: 1, palette: YELLOW },
    green: { col: 5, row: 1, palette: CYAN },
    cofix: { col: 9, row: 1, palette: INK },
    jobs: { col: 1, row: 5, palette: CYAN },
    bank: { col: 5, row: 5, palette: MAGENTA },
    medical: { col: 9, row: 5, palette: MAGENTA },
    plot: { col: 1, row: 9, palette: YELLOW },
    market: { col: 5, row: 9, palette: CYAN },
    legal: { col: 9, row: 9, palette: YELLOW },
};

export class City extends Scene {
    private buildings: Building[] = [];

    constructor() {
        super('City');
    }

    create() {
        this.drawGround();
        this.drawTrees();
        this.placeBuildings();
        this.setupCamera();

        const off = on('city:state', ({ level }) => this.setLevel(level));
        this.events.once('shutdown', off);

        EventBus.emit('current-scene-ready', this);
        emit('city:ready');
    }

    private iso(col: number, row: number) {
        return { x: ((col - row) * TILE_W) / 2, y: ((col + row) * TILE_H) / 2 };
    }

    private drawGround() {
        const g = this.add.graphics();
        for (let row = 0; row < MAP; row++) {
            for (let col = 0; col < MAP; col++) {
                const { x, y } = this.iso(col, row);
                const road = ROADS.includes(col) || ROADS.includes(row);
                g.fillStyle(road ? 0xd2c9b8 : (col + row) % 2 ? 0xebe4d6 : 0xe5ddcd, 1);
                g.fillPoints(diamond(TILE_W, TILE_H, x, y), true);
                if (road) {
                    // Разметка по центру дороги
                    g.fillStyle(0xf5f1e8, 0.9);
                    const along = ROADS.includes(col) && !ROADS.includes(row) ? 'row' : 'col';
                    if (!(ROADS.includes(col) && ROADS.includes(row))) {
                        const dx = along === 'row' ? -TILE_W / 8 : TILE_W / 8;
                        g.fillPoints(
                            [
                                new Phaser.Math.Vector2(x - dx - 3, y - TILE_H / 8),
                                new Phaser.Math.Vector2(x + dx - 3, y + TILE_H / 8),
                                new Phaser.Math.Vector2(x + dx + 3, y + TILE_H / 8),
                                new Phaser.Math.Vector2(x - dx + 3, y - TILE_H / 8),
                            ],
                            true,
                        );
                    }
                }
            }
        }
        // Рамка города
        g.lineStyle(2, 0x201e1d, 0.25);
        const tl = this.iso(-0.5, -0.5);
        const tr = this.iso(MAP - 0.5, -0.5);
        const br = this.iso(MAP - 0.5, MAP - 0.5);
        const bl = this.iso(-0.5, MAP - 0.5);
        g.strokePoints(
            [tl, tr, br, bl].map((p) => new Phaser.Math.Vector2(p.x, p.y)),
            true,
        );
    }

    /** Деревья «рисографом»: жёлтый и голубой круги, наложенные умножением, дают зелёный */
    private drawTrees() {
        const taken = new Set(Object.values(LAYOUT).map(({ col, row }) => `${col},${row}`));
        const rnd = new Phaser.Math.RandomDataGenerator(['mt-city']);
        for (let row = 0; row < MAP; row++) {
            for (let col = 0; col < MAP; col++) {
                if (ROADS.includes(col) || ROADS.includes(row) || taken.has(`${col},${row}`)) continue;
                const nearBuilding = Object.values(LAYOUT).some(
                    (b) => Math.abs(b.col - col) <= 1 && Math.abs(b.row - row) <= 1,
                );
                if (nearBuilding && rnd.frac() < 0.75) continue;
                if (rnd.frac() < 0.35) continue;
                const { x, y } = this.iso(col, row);
                const ox = rnd.between(-14, 14);
                const r = rnd.between(9, 14);
                const shadow = this.add.ellipse(x + ox, y + 4, r * 2, r, 0x201e1d, 0.12);
                const trunk = this.add.rectangle(x + ox, y - 4, 3, 10, 0x6d675f);
                const a = this.add.circle(x + ox, y - 14 - r / 2, r, 0xffe100);
                const b = this.add.circle(x + ox + 3, y - 12 - r / 2, r, 0x0091d2, 0.75);
                b.setBlendMode(Phaser.BlendModes.MULTIPLY);
                for (const o of [shadow, trunk, a, b]) o.setDepth(y);
            }
        }
    }

    private placeBuildings() {
        for (const def of BUILDINGS) {
            const { col, row, palette } = LAYOUT[def.id];
            const { x, y } = this.iso(col, row);
            const building = new Building(this, x, y, def, palette);
            building.setDepth(y + 1);
            this.buildings.push(building);
        }
    }

    private setLevel(level: number) {
        for (const b of this.buildings) b.setLocked(level < b.def.minBankLevel);
    }

    /** Перетаскивание одним пальцем, зум двумя пальцами или колесом; тап без сдвига — открыть здание */
    private setupCamera() {
        const cam = this.cameras.main;
        cam.setBackgroundColor(0xf5f1e8);
        const mapW = MAP * TILE_W;
        const center = this.iso(MAP / 2 - 0.5, MAP / 2 - 0.5);
        const fit = Phaser.Math.Clamp(this.scale.width / (mapW * 0.62), 0.45, 1.1);
        cam.setZoom(fit);
        // Город между шапкой и нижней панелью: сдвигаем центр карты чуть ниже середины экрана
        cam.centerOn(center.x, center.y - 50 / fit);
        const pad = 700;
        cam.setBounds(-mapW / 2 - pad, -pad, mapW + pad * 2, MAP * TILE_H + pad * 2);

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
                cam.setZoom(Phaser.Math.Clamp((zoomStart * dist) / pinchStart, 0.4, 1.8));
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
            cam.setZoom(Phaser.Math.Clamp(cam.zoom * (dy > 0 ? 0.9 : 1.1), 0.4, 1.8));
        });
    }

    startMinigame(scene: string, jobId: string) {
        this.scene.launch(scene, { jobId });
        this.scene.pause();
    }
}
