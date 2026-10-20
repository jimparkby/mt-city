import { Scene } from 'phaser';
import { loadBuildingIcons } from '../cityIcons';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        const { width, height } = this.scale;
        const barWidth = Math.min(240, width - 64);

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(width / 2, height / 2, barWidth, 10).setStrokeStyle(2, 0x201e1d);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(width / 2 - barWidth / 2 + 2, height / 2, 4, 6, 0xd6006c).setOrigin(0, 0.5);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (barWidth - 8) * progress;
        });
    }

    preload() {
        // TODO(feat/city): заменить нарисованные здания артом (Kenney / дизайнер)
    }

    create() {
        loadBuildingIcons(this.textures).then(() => this.scene.start('City'));
    }
}
