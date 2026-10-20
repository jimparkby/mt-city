import { AUTO, Game, Scale } from 'phaser';
import { Boot } from './scenes/Boot';
import { City } from './scenes/City';
import { Preloader } from './scenes/Preloader';
import { Barista } from './scenes/minigames/Barista';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    parent: 'game-container',
    backgroundColor: '#f5f1e8',
    scale: {
        mode: Scale.RESIZE,
        width: '100%',
        height: '100%',
    },
    input: {
        activePointers: 2, // pinch-zoom
    },
    scene: [Boot, Preloader, City, Barista],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
