import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        const { width, height } = this.scale;
        const barWidth = Math.min(300, width - 64);

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(width / 2, height / 2, barWidth, 16).setStrokeStyle(2, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(width / 2 - barWidth / 2 + 2, height / 2, 4, 12, 0xffffff).setOrigin(0, 0.5);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (barWidth - 8) * progress;
        });
    }

    preload() {
        this.load.setPath('assets');

        // TODO(feat/city): карта из Tiled и тайлы Kenney
        // this.load.tilemapTiledJSON('city', 'maps/city.tmj');
        // this.load.image('tiles', 'tiles/city.png');
    }

    create() {
        this.scene.start('City');
    }
}
