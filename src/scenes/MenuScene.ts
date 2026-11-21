import Phaser from 'phaser';
import { createTextures, W, H } from '../art';
import { loadBest, loadRun } from '../save';
import { makeButton, textStyle } from '../ui';

/**
 * Title screen. With no saved run it shows "TAP TO START".
 * With a saved run it shows Continue (next wave) and New run buttons.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    createTextures(this);
    this.input.removeAllListeners();

    this.add.image(W / 2, H / 2, 'bg').setDepth(0);

    // Slowly drifting fog.
    for (let i = 0; i < 3; i++) {
      const fog = this.add
        .image(Phaser.Math.Between(0, W), 260 + i * 380, 'fog')
        .setScale(Phaser.Math.FloatBetween(2, 3))
        .setAlpha(0.55)
        .setDepth(4);
      this.tweens.add({
        targets: fog,
        x: fog.x + Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(9000, 14000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }

    // Ghosts hovering around the mage, for atmosphere.
    const spots: Array<[number, number]> = [
      [140, 520],
      [590, 470],
      [110, 820],
      [610, 760],
    ];
    spots.forEach(([x, y], i) => {
      const g = this.add.image(x, y, 'ghost').setDepth(2).setAlpha(0.8).setScale(1.2);
      this.tweens.add({
        targets: g,
        y: y - 26,
        duration: 1600 + i * 250,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    });

    const mage = this.add.image(W / 2, 640, 'mage').setScale(2.2).setDepth(3);
    this.add.image(W / 2, 640, 'spark').setScale(11).setAlpha(0.14).setTint(0x7aa8ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    this.add.image(W / 2, 760, 'shadow').setScale(2.4).setDepth(1);
    this.tweens.add({ targets: mage, y: 620, duration: 1500, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

    this.add.image(W / 2, H / 2, 'vignette').setDepth(18);

    this.add.text(W / 2, 200, 'HAUNTED', textStyle(96, '#e6ecff')).setOrigin(0.5).setDepth(25);
    this.add.text(W / 2, 300, 'WOOD', textStyle(96, '#9ab8ff')).setOrigin(0.5).setDepth(25);

    const best = loadBest();
    if (best > 0) {
      this.add.text(W / 2, 400, `Best wave: ${best}`, textStyle(32, '#ffd66b')).setOrigin(0.5).setDepth(25);
    }

    const save = loadRun();
    if (save) {
      makeButton(this, W / 2, 1010, 520, 110, `Continue  ·  Wave ${save.wave}`, () => this.start(true), true, 30);
      makeButton(this, W / 2, 1140, 360, 84, 'New run', () => this.start(false), false, 30);
    } else {
      const tap = this.add.text(W / 2, 1060, 'TAP TO START', textStyle(52, '#ffffff')).setOrigin(0.5).setDepth(25);
      this.tweens.add({ targets: tap, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
      this.input.once('pointerdown', () => this.start(false));
      this.input.keyboard?.once('keydown-SPACE', () => this.start(false));
    }

    this.cameras.main.fadeIn(300);
  }

  private start(resume: boolean): void {
    this.scene.start('GameScene', { resume });
  }
}
