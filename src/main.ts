import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { W, H } from './art';

// Portrait phone-shaped game area. FIT scales it to any screen.
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0a1124',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H,
  },
  render: { antialias: true, powerPreference: 'high-performance' },
  input: { activePointers: 3 },
  scene: [MenuScene, GameScene], // the first scene in the list starts automatically
});
