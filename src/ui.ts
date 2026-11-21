import Phaser from 'phaser';

export const FONT = 'Trebuchet MS, Verdana, sans-serif';

export function textStyle(size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: 'bold',
    color,
    stroke: '#05070f',
    strokeThickness: Math.max(3, Math.round(size / 7)),
  };
}

/** A tappable rounded-look button. Returns its parts so the caller can destroy them later. */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onTap: () => void,
  primary = false,
  depth = 60,
): Phaser.GameObjects.GameObject[] {
  const bg = scene.add
    .rectangle(x, y, w, h, primary ? 0x3a4fc4 : 0x1a2144, 0.96)
    .setStrokeStyle(3, primary ? 0x9fb4ff : 0x4a5aa8)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });
  const text = scene.add
    .text(x, y, label, textStyle(primary ? 40 : 34, '#ffffff'))
    .setOrigin(0.5)
    .setDepth(depth + 1);
  bg.on('pointerdown', onTap);
  return [bg, text];
}
