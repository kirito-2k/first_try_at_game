import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

// Portrait phone-shaped game area. FIT scales it to any screen.
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1b1b2f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 360,
    height: 640,
  },
  input: { activePointers: 3 },
  scene: [GameScene],
});
