import Phaser from 'phaser';

// ---- Tuning numbers (change these to adjust the feel) ----
const PLAYER_SIZE = 24;
const PLAYER_SPEED = 210; // pixels per second
const PLAYER_MAX_HP = 5;
const HIT_INVULN_MS = 900; // safe time after being hit
const JOY_RADIUS = 50;

const FIRE_INTERVAL_MS = 650; // time between bolts
const BOLT_SPEED = 380;
const BOLT_DAMAGE = 1;
const BOLT_RANGE = 260; // mage only fires at ghosts closer than this
const BOLT_LIFE_MS = 1200;

const GHOST_SIZE = 22;
const GHOST_HP = 2;
const GHOST_SPEED = 55;
const WAVE_BREAK_MS = 1500;

const BEST_KEY = 'hauntedwood.bestWave';

interface Ghost extends Phaser.GameObjects.Rectangle {
  hp: number;
}
interface Bolt extends Phaser.GameObjects.Arc {
  vx: number;
  vy: number;
  bornAt: number;
}

/**
 * M2 scene: mage auto-fires at the nearest ghost, ghosts chase you in waves,
 * 5 HP, death screen, tap to restart. Best wave is saved on the device.
 * Placeholder shapes only; art and sound come later.
 */
export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

  private joyBase!: Phaser.GameObjects.Arc;
  private joyKnob!: Phaser.GameObjects.Arc;
  private joyPointerId: number | null = null;
  private joyOrigin = new Phaser.Math.Vector2();
  private joyVec = new Phaser.Math.Vector2(0, 0);

  private ghosts: Ghost[] = [];
  private bolts: Bolt[] = [];

  private hp = PLAYER_MAX_HP;
  private wave = 0;
  private kills = 0;
  private lastShotAt = 0;
  private invulnUntil = 0;
  private waveBreakUntil = 0;
  private dead = false;
  private deadAt = 0;

  private hudText!: Phaser.GameObjects.Text;
  private bannerText!: Phaser.GameObjects.Text;
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super('GameScene');
  }

  create(): void {
    // Scene objects are rebuilt on restart, so reset all run state here.
    this.ghosts = [];
    this.bolts = [];
    this.hp = PLAYER_MAX_HP;
    this.wave = 0;
    this.kills = 0;
    this.lastShotAt = 0;
    this.invulnUntil = 0;
    this.dead = false;
    this.overlay = undefined;
    this.joyPointerId = null;
    this.joyVec.set(0, 0);

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width - 8, height - 8).setStrokeStyle(2, 0x44446a);

    this.player = this.add
      .rectangle(width / 2, height / 2, PLAYER_SIZE, PLAYER_SIZE, 0x8ab4ff)
      .setDepth(5);

    this.hudText = this.add
      .text(12, 10, '', { fontFamily: 'sans-serif', fontSize: '16px', color: '#e0e0ff' })
      .setDepth(20);
    this.bannerText = this.add
      .text(width / 2, height / 2 - 120, '', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0);

    this.joyBase = this.add
      .circle(0, 0, JOY_RADIUS, 0xffffff, 0.12)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setVisible(false)
      .setDepth(10);
    this.joyKnob = this.add.circle(0, 0, 22, 0xffffff, 0.35).setVisible(false).setDepth(11);

    const keyboard = this.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;

    // Remove old listeners so restarting does not stack them.
    this.input.removeAllListeners();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onPointerUp(p));
    this.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.onPointerUp(p));

    this.startNextWave();
    this.updateHud();
  }

  // ---------- Input ----------

  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (this.dead) {
      // Small delay so the tap that killed you does not instantly restart.
      if (this.time.now - this.deadAt > 700) this.scene.restart();
      return;
    }
    if (this.joyPointerId !== null) return;
    this.joyPointerId = p.id;
    this.joyOrigin.set(p.x, p.y);
    this.joyBase.setPosition(p.x, p.y).setVisible(true);
    this.joyKnob.setPosition(p.x, p.y).setVisible(true);
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
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
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    if (p.id !== this.joyPointerId) return;
    this.joyPointerId = null;
    this.joyVec.set(0, 0);
    this.joyBase.setVisible(false);
    this.joyKnob.setVisible(false);
  }

  // ---------- Main loop ----------

  update(time: number, delta: number): void {
    if (this.dead) {
      // Keyboard restart for desktop testing.
      if (time - this.deadAt > 700 && Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        this.scene.restart();
      }
      return;
    }
    const dt = delta / 1000;

    this.movePlayer(dt);
    this.autoFire(time);
    this.moveBolts(time, dt);
    this.moveGhosts(dt);
    this.checkBoltHits();
    this.checkGhostContact(time);

    // Blink while invulnerable.
    this.player.setAlpha(time < this.invulnUntil ? (Math.floor(time / 80) % 2 ? 0.35 : 1) : 1);

    // Wave cleared -> short break -> next wave.
    if (this.ghosts.length === 0 && this.waveBreakUntil === 0) {
      this.waveBreakUntil = time + WAVE_BREAK_MS;
      this.showBanner(`Wave ${this.wave} cleared!`);
    }
    if (this.waveBreakUntil !== 0 && time >= this.waveBreakUntil) {
      this.waveBreakUntil = 0;
      this.startNextWave();
    }
  }

  private movePlayer(dt: number): void {
    const { width, height } = this.scale;
    let vx = this.joyVec.x;
    let vy = this.joyVec.y;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;
    const len = Math.hypot(vx, vy);
    if (len > 1) {
      vx /= len;
      vy /= len;
    }
    const half = PLAYER_SIZE / 2 + 4;
    this.player.x = Phaser.Math.Clamp(this.player.x + vx * PLAYER_SPEED * dt, half, width - half);
    this.player.y = Phaser.Math.Clamp(this.player.y + vy * PLAYER_SPEED * dt, half, height - half);
  }

  // ---------- Combat ----------

  private autoFire(time: number): void {
    if (time - this.lastShotAt < FIRE_INTERVAL_MS) return;
    const target = this.nearestGhost(BOLT_RANGE);
    if (!target) return;
    this.lastShotAt = time;
    const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const bolt = this.add.circle(this.player.x, this.player.y, 5, 0xffe066).setDepth(4) as Bolt;
    bolt.vx = Math.cos(angle) * BOLT_SPEED;
    bolt.vy = Math.sin(angle) * BOLT_SPEED;
    bolt.bornAt = time;
    this.bolts.push(bolt);
  }

  private nearestGhost(maxDist: number): Ghost | null {
    let best: Ghost | null = null;
    let bestDist = maxDist;
    for (const g of this.ghosts) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, g.x, g.y);
      if (d < bestDist) {
        bestDist = d;
        best = g;
      }
    }
    return best;
  }

  private moveBolts(time: number, dt: number): void {
    const { width, height } = this.scale;
    this.bolts = this.bolts.filter((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const gone = time - b.bornAt > BOLT_LIFE_MS || b.x < 0 || b.x > width || b.y < 0 || b.y > height;
      if (gone) b.destroy();
      return !gone;
    });
  }

  private moveGhosts(dt: number): void {
    for (const g of this.ghosts) {
      const angle = Math.atan2(this.player.y - g.y, this.player.x - g.x);
      g.x += Math.cos(angle) * GHOST_SPEED * dt;
      g.y += Math.sin(angle) * GHOST_SPEED * dt;
    }
  }

  private checkBoltHits(): void {
    for (const b of [...this.bolts]) {
      for (const g of this.ghosts) {
        if (Math.abs(b.x - g.x) < GHOST_SIZE / 2 + 5 && Math.abs(b.y - g.y) < GHOST_SIZE / 2 + 5) {
          g.hp -= BOLT_DAMAGE;
          b.destroy();
          this.bolts.splice(this.bolts.indexOf(b), 1);
          if (g.hp <= 0) {
            g.destroy();
            this.ghosts.splice(this.ghosts.indexOf(g), 1);
            this.kills += 1;
            this.updateHud();
          } else {
            g.setFillStyle(0xffffff); // flash white on hit
            this.time.delayedCall(80, () => g.active && g.setFillStyle(0xc9c9e8));
          }
          break;
        }
      }
    }
  }

  private checkGhostContact(time: number): void {
    if (time < this.invulnUntil) return;
    const reach = PLAYER_SIZE / 2 + GHOST_SIZE / 2 - 4;
    for (const g of this.ghosts) {
      if (Math.abs(g.x - this.player.x) < reach && Math.abs(g.y - this.player.y) < reach) {
        this.hp -= 1;
        this.invulnUntil = time + HIT_INVULN_MS;
        this.cameras.main.shake(120, 0.006);
        this.updateHud();
        if (this.hp <= 0) this.die(time);
        return;
      }
    }
  }

  // ---------- Waves ----------

  private startNextWave(): void {
    this.wave += 1;
    const count = 3 + this.wave * 2; // wave 1 = 5 ghosts, wave 2 = 7, ...
    const { width, height } = this.scale;
    for (let i = 0; i < count; i++) {
      // Spawn on a random edge.
      const edge = Phaser.Math.Between(0, 3);
      const x = edge === 0 ? 10 : edge === 1 ? width - 10 : Phaser.Math.Between(10, width - 10);
      const y = edge === 2 ? 10 : edge === 3 ? height - 10 : Phaser.Math.Between(10, height - 10);
      const ghost = this.add
        .rectangle(x, y, GHOST_SIZE, GHOST_SIZE, 0xc9c9e8)
        .setDepth(3) as unknown as Ghost;
      ghost.hp = GHOST_HP;
      this.ghosts.push(ghost);
    }
    this.showBanner(`Wave ${this.wave}`);
    this.updateHud();
  }

  // ---------- UI ----------

  private updateHud(): void {
    const hearts = '♥'.repeat(Math.max(this.hp, 0)) + '♡'.repeat(Math.max(PLAYER_MAX_HP - this.hp, 0));
    this.hudText.setText(`${hearts}\nWave ${this.wave}   Kills ${this.kills}`);
  }

  private showBanner(text: string): void {
    this.bannerText.setText(text).setAlpha(1);
    this.tweens.add({ targets: this.bannerText, alpha: 0, delay: 700, duration: 600 });
  }

  private die(time: number): void {
    this.dead = true;
    this.deadAt = time;
    this.joyVec.set(0, 0);
    this.joyBase.setVisible(false);
    this.joyKnob.setVisible(false);

    let best = 0;
    try {
      best = Number(localStorage.getItem(BEST_KEY)) || 0;
      if (this.wave > best) {
        best = this.wave;
        localStorage.setItem(BEST_KEY, String(best));
      }
    } catch {
      // Storage can be blocked (private mode). The game still works without it.
      best = Math.max(best, this.wave);
    }

    const { width, height } = this.scale;
    const shade = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);
    const title = this.add
      .text(width / 2, height / 2 - 70, 'You died', {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        color: '#ff7a7a',
      })
      .setOrigin(0.5);
    const stats = this.add
      .text(width / 2, height / 2, `Wave reached: ${this.wave}\nKills: ${this.kills}\nBest wave: ${best}`, {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);
    const again = this.add
      .text(width / 2, height / 2 + 90, 'Tap to play again', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#8ab4ff',
      })
      .setOrigin(0.5);
    this.overlay = this.add.container(0, 0, [shade, title, stats, again]).setDepth(50);
  }
}
