import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { emit } from '../../EventBus';

const DURATION_MS = 20_000;
const TARGET_ORDERS = 10;

/**
 * Мини-игра «Бариста» (заглушка механики): тапай по заказам, пока не кончилось время.
 * Результат 0–100 уходит в React → POST /jobs/:id/shift; оплату считает сервер.
 */
export class Barista extends Scene {
    private jobId = '';
    private served = 0;

    constructor() {
        super('Barista');
    }

    init(data: { jobId: string }) {
        this.jobId = data.jobId;
        this.served = 0;
    }

    create() {
        const { width, height } = this.scale;
        this.add.rectangle(0, 0, width, height, 0x3e2723, 0.95).setOrigin(0);
        const title = this.add.text(width / 2, 40, '', { fontSize: '20px', color: '#fff' }).setOrigin(0.5);

        const spawn = () => {
            const cup = this.add
                .text(Phaser.Math.Between(40, width - 40), Phaser.Math.Between(120, height - 80), '☕', {
                    fontSize: '48px',
                })
                .setOrigin(0.5)
                .setInteractive();
            cup.once('pointerdown', () => {
                this.served++;
                cup.destroy();
                spawn();
            });
        };
        spawn();

        const timer = this.time.addEvent({ delay: DURATION_MS, callback: () => this.finish() });
        this.events.on('update', () => {
            const left = Math.ceil(timer.getRemaining() / 1000);
            title.setText(`Заказов: ${this.served}   Осталось: ${left} с`);
        });
    }

    private finish() {
        const score = Math.min(100, Math.round((this.served / TARGET_ORDERS) * 100));
        emit('minigame:done', { jobId: this.jobId, score });
        this.scene.resume('City');
        this.scene.stop();
    }
}
