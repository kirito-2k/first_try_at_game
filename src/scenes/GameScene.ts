import Phaser from 'phaser';

const PLAYER_SIZE = 24;
const PLAYER_SPEED = 160; // pixels per second
const JOY_RADIUS = 50; // how far the knob can move from its centre

/**
 * Milestone 1 scene: a green square you can move around.
 * - Touch: press anywhere, a joystick appears under your finger. Drag to move.
 * - Keyboard (desktop / Codespaces): arrow keys or WASD.
 * Later milestones replace the square with the real player and add enemies.
 */
export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

  private joyBase!: Phaser.GameObjects.Arc;
  private joyKnob!: Phaser.GameObjects.Arc;
  private joyPointerId: number | null = null;
  private joyOrigin = new Phaser.Math.Vector2();
  private joyVec = new Phaser.Math.Vector2(0, 0); // each axis from -1 to 1

  constructor() {
    super('GameScene');
  }

  create(): void {
    const { width, height } = this.scale;

    // Arena border so you can see the edges of the play area.
    this.add.rectangle(width / 2, height / 2, width - 8, height - 8).setStrokeStyle(2, 0x44446a);

    this.player = this.add.rectangle(width / 2, height / 2, PLAYER_SIZE, PLAYER_SIZE, 0x4ade80);

    this.add
      .text(width / 2, height - 60, 'Touch and drag to move', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    // Joystick graphics (hidden until a finger is down).
    this.joyBase = this.add
      .circle(0, 0, JOY_RADIUS, 0xffffff, 0.12)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setVisible(false)
      .setDepth(10);
    this.joyKnob = this.add.circle(0, 0, 22, 0xffffff, 0.35).setVisible(false).setDepth(11);

    // Keyboard controls.
    const keyboard = this.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;

    // Touch / mouse joystick.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.joyPointerId !== null) return; // already using one finger
      this.joyPointerId = p.id;
      this.joyOrigin.set(p.x, p.y);
      this.joyBase.setPosition(p.x, p.y).setVisible(true);
      this.joyKnob.setPosition(p.x, p.y).setVisible(true);
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joyPointerId) return;
      const dx = p.x - this.joyOrigin.x;
      const dy = p.y - this.joyOrigin.y;
      const dist = Math.min(Math.hypot(dx, dy), JOY_RADIUS);
      const angle = Math.atan2(dy, dx);
      this.joyKnob.setPosition(
        this.joyOrigin.x + Math.cos(angle) * dist,
        this.joyOrigin.y + Math.sin(angle) * dist,
      );
      this.joyVec.set((Math.cos(angle) * dist) / JOY_RADIUS, (Math.sin(angle) * dist) / JOY_RADIUS);
    });

    const release = (p: Phaser.Input.Pointer): void => {
      if (p.id !== this.joyPointerId) return;
      this.joyPointerId = null;
      this.joyVec.set(0, 0);
      this.joyBase.setVisible(false);
      this.joyKnob.setVisible(false);
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
  }

  update(_time: number, delta: number): void {
    const { width, height } = this.scale;

    let vx = this.joyVec.x;
    let vy = this.joyVec.y;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    // Keep diagonal movement from being faster.
    const len = Math.hypot(vx, vy);
    if (len > 1) {
      vx /= len;
      vy /= len;
    }

    const dt = delta / 1000;
    const half = PLAYER_SIZE / 2 + 4;
    this.player.x = Phaser.Math.Clamp(this.player.x + vx * PLAYER_SPEED * dt, half, width - half);
    this.player.y = Phaser.Math.Clamp(this.player.y + vy * PLAYER_SPEED * dt, half, height - half);
  }
}
