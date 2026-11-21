import Phaser from 'phaser';
import { createTextures, W, H } from '../art';

// ---- Tuning numbers (change these to adjust the feel) ----
// The game is 720x1280, so distances are double the old 360x640 values.
const PLAYER_SPEED = 420; // pixels per second
const PLAYER_MAX_HP = 5;
const PLAYER_MARGIN = 56; // how close to the screen edge the mage can walk
const HIT_INVULN_MS = 900; // safe time after being hit

const JOY_RADIUS = 90; // how far the knob can move
const JOY_BASE_ALPHA = 0.07; // joystick ring fill: 0 = invisible, 1 = solid
const JOY_LINE_ALPHA = 0.18; // joystick ring outline
const JOY_KNOB_ALPHA = 0.16; // joystick knob

const FIRE_INTERVAL_MS = 650; // time between bolts
const BOLT_SPEED = 760;
const BOLT_DAMAGE = 1;
const BOLT_RANGE = 520; // mage only fires at ghosts closer than this
const BOLT_LIFE_MS = 1200;

const GHOST_HP = 2;
const GHOST_SPEED = 110;
const GHOST_HIT_RADIUS = 30; // bolt vs ghost
const CONTACT_RADIUS = 40; // ghost touching the mage
const WAVE_BREAK_MS = 1500;

const BEST_KEY = 'hauntedwood.bestWave';
const FONT = 'Trebuchet MS, Verdana, sans-serif';

interface Ghost extends Phaser.GameObjects.Image {
  hp: number;
  shadow: Phaser.GameObjects.Image;
  phase: number;
}
interface Bolt extends Phaser.GameObjects.Image {
  vx: number;
  vy: number;
  bornAt: number;
}

function textStyle(size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: 'bold',
    color,
    stroke: '#05070f',
    strokeThickness: Math.max(3, Math.round(size / 7)),
  };
}

/**
 * M2.1: the same mage-vs-ghost waves as M2, with generated art (see art.ts),
 * shadows, particles, a heart HUD, animated banners and a nicer death panel.
 */
export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Image;
  private aura!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

  private joyBase!: Phaser.GameObjects.Arc;
  private joyKnob!: Phaser.GameObjects.Arc;
  private joyPointerId: number | null = null;
  private joyOrigin = new Phaser.Math.Vector2();
  private joyVec = new Phaser.Math.Vector2(0, 0);

  private ghosts: Ghost[] = [];
  private bolts: Bolt[] = [];
  private trail!: Phaser.GameObjects.Particles.ParticleEmitter;
  private burst!: Phaser.GameObjects.Particles.ParticleEmitter;

  private hp = PLAYER_MAX_HP;
  private wave = 0;
  private kills = 0;
  private lastShotAt = 0;
  private invulnUntil = 0;
  private waveBreakUntil = 0;
  private dead = false;
  private deadAt = 0;

  private hearts: Phaser.GameObjects.Image[] = [];
  private waveText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private bannerText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create(): void {
    createTextures(this);

    // Scene objects are rebuilt on restart, so reset all run state here.
    this.ghosts = [];
    this.bolts = [];
    this.hearts = [];
    this.hp = PLAYER_MAX_HP;
    this.wave = 0;
    this.kills = 0;
    this.lastShotAt = 0;
    this.invulnUntil = 0;
    this.waveBreakUntil = 0;
    this.dead = false;
    this.joyPointerId = null;
    this.joyVec.set(0, 0);

    // World.
    this.add.image(W / 2, H / 2, 'bg').setDepth(0);

    this.playerShadow = this.add.image(W / 2, H / 2 + 38, 'shadow').setDepth(1);
    this.aura = this.add
      .image(W / 2, H / 2, 'spark')
      .setScale(7)
      .setAlpha(0.12)
      .setTint(0x7aa8ff)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(2);
    this.player = this.add.image(W / 2, H / 2, 'mage').setDepth(6);

    this.trail = this.add
      .particles(0, 0, 'spark', {
        lifespan: 260,
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.7, end: 0 },
        tint: 0xffd966,
        blendMode: 'ADD',
        emitting: false,
      })
      .setDepth(7);
    this.burst = this.add
      .particles(0, 0, 'spark', {
        lifespan: { min: 300, max: 560 },
        speed: { min: 90, max: 280 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [0xcfe0ff, 0x9ab8ff, 0xffffff],
        blendMode: 'ADD',
        emitting: false,
      })
      .setDepth(8);

    // Drifting fog and a dark edge vignette sit above the action.
    for (let i = 0; i < 4; i++) {
      const fog = this.add
        .image(Phaser.Math.Between(0, W), 200 + i * 280, 'fog')
        .setScale(Phaser.Math.FloatBetween(2, 3))
        .setAlpha(0.55)
        .setDepth(16);
      this.tweens.add({
        targets: fog,
        x: fog.x + Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(9000, 14000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
    this.add.image(W / 2, H / 2, 'vignette').setDepth(18);

    this.createHud();

    // Joystick (very faint on purpose).
    this.joyBase = this.add
      .circle(0, 0, JOY_RADIUS, 0xffffff, JOY_BASE_ALPHA)
      .setStrokeStyle(3, 0xffffff, JOY_LINE_ALPHA)
      .setVisible(false)
      .setDepth(30);
    this.joyKnob = this.add.circle(0, 0, 34, 0xffffff, JOY_KNOB_ALPHA).setVisible(false).setDepth(31);

    const keyboard = this.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.removeAllListeners();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onPointerUp(p));
    this.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.onPointerUp(p));

    this.cameras.main.fadeIn(350);
    this.startNextWave();
    this.updateHud(false);
  }

  private createHud(): void {
    for (let i = 0; i < PLAYER_MAX_HP; i++) {
      this.hearts.push(this.add.image(46 + i * 54, 52, 'heart_full').setDepth(25));
    }
    this.waveText = this.add
      .text(W - 32, 26, '', textStyle(36, '#e6ecff'))
      .setOrigin(1, 0)
      .setDepth(25);
    this.killText = this.add
      .text(W - 32, 74, '', textStyle(26, '#9fb0e8'))
      .setOrigin(1, 0)
      .setDepth(25);
    this.bannerText = this.add
      .text(W / 2, H * 0.27, '', textStyle(64, '#ffffff'))
      .setOrigin(0.5)
      .setDepth(25)
      .setAlpha(0);
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
    this.joyBase.setPosition(p.x, p.y).setVisible(true).setAlpha(0);
    this.joyKnob.setPosition(p.x, p.y).setVisible(true).setAlpha(0);
    this.tweens.add({ targets: [this.joyBase, this.joyKnob], alpha: 1, duration: 120 });
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
      if (time - this.deadAt > 700 && Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        this.scene.restart();
      }
      return;
    }
    const dt = delta / 1000;

    this.movePlayer(time, dt);
    this.autoFire(time);
    this.moveBolts(time, dt);
    this.moveGhosts(time, dt);
    this.checkBoltHits();
    this.checkGhostContact(time);

    // Blink while invulnerable.
    this.player.setAlpha(time < this.invulnUntil ? (Math.floor(time / 80) % 2 ? 0.4 : 1) : 1);

    // Wave cleared -> short break -> next wave.
    if (this.ghosts.length === 0 && this.waveBreakUntil === 0) {
      this.waveBreakUntil = time + WAVE_BREAK_MS;
      this.showBanner(`Wave ${this.wave} cleared!`, '#9dffb0');
    }
    if (this.waveBreakUntil !== 0 && time >= this.waveBreakUntil) {
      this.waveBreakUntil = 0;
      this.startNextWave();
    }
  }

  private movePlayer(time: number, dt: number): void {
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

    this.player.x = Phaser.Math.Clamp(this.player.x + vx * PLAYER_SPEED * dt, PLAYER_MARGIN, W - PLAYER_MARGIN);
    this.player.y = Phaser.Math.Clamp(this.player.y + vy * PLAYER_SPEED * dt, PLAYER_MARGIN, H - PLAYER_MARGIN);

    if (Math.abs(vx) > 0.15) this.player.setFlipX(vx < 0);

    // Float bob, plus a lean into the direction of travel.
    const bob = Math.sin(time / 170) * (len > 0.1 ? 0.045 : 0.025);
    this.player.setScale(1 - bob * 0.5, 1 + bob);
    this.player.rotation = Phaser.Math.Linear(this.player.rotation, vx * 0.16, 0.2);

    this.playerShadow.setPosition(this.player.x, this.player.y + 40);
    this.aura.setPosition(this.player.x, this.player.y).setAlpha(0.11 + Math.sin(time / 300) * 0.025);
  }

  // ---------- Combat ----------

  private autoFire(time: number): void {
    if (time - this.lastShotAt < FIRE_INTERVAL_MS) return;
    const target = this.nearestGhost(BOLT_RANGE);
    if (!target) return;
    this.lastShotAt = time;

    this.player.setFlipX(target.x < this.player.x);
    const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const bolt = this.add
      .image(this.player.x, this.player.y - 6, 'bolt')
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD) as Bolt;
    bolt.vx = Math.cos(angle) * BOLT_SPEED;
    bolt.vy = Math.sin(angle) * BOLT_SPEED;
    bolt.bornAt = time;
    this.bolts.push(bolt);
    this.burst.explode(4, this.player.x, this.player.y - 6); // little cast flash
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
    this.bolts = this.bolts.filter((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rotation += dt * 10;
      this.trail.emitParticleAt(b.x, b.y, 1);
      const gone = time - b.bornAt > BOLT_LIFE_MS || b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20;
      if (gone) b.destroy();
      return !gone;
    });
  }

  private moveGhosts(time: number, dt: number): void {
    for (const g of this.ghosts) {
      const angle = Math.atan2(this.player.y - g.y, this.player.x - g.x);
      g.x += Math.cos(angle) * GHOST_SPEED * dt;
      g.y += Math.sin(angle) * GHOST_SPEED * dt;

      // Floaty wobble.
      const wob = Math.sin(time / 260 + g.phase);
      g.setScale(1 + wob * 0.05, 1 - wob * 0.05);
      g.rotation = Math.cos(angle) * 0.14 + wob * 0.04;
      g.shadow.setPosition(g.x, g.y + 44).setScale(1 - wob * 0.06);
    }
  }

  private checkBoltHits(): void {
    for (const b of [...this.bolts]) {
      for (const g of this.ghosts) {
        if (Phaser.Math.Distance.Between(b.x, b.y, g.x, g.y) < GHOST_HIT_RADIUS + 8) {
          g.hp -= BOLT_DAMAGE;
          this.burst.explode(6, b.x, b.y);
          b.destroy();
          this.bolts.splice(this.bolts.indexOf(b), 1);
          if (g.hp <= 0) {
            this.killGhost(g);
          } else {
            g.setTintFill(0xffffff); // flash white on hit
            this.time.delayedCall(90, () => g.active && g.clearTint());
          }
          break;
        }
      }
    }
  }

  private killGhost(g: Ghost): void {
    this.ghosts.splice(this.ghosts.indexOf(g), 1);
    this.kills += 1;
    this.burst.explode(16, g.x, g.y);
    g.shadow.destroy();
    this.tweens.add({
      targets: g,
      scale: 1.5,
      alpha: 0,
      duration: 180,
      onComplete: () => g.destroy(),
    });
    this.updateHud(false);
  }

  private checkGhostContact(time: number): void {
    if (time < this.invulnUntil) return;
    for (const g of this.ghosts) {
      if (Phaser.Math.Distance.Between(g.x, g.y, this.player.x, this.player.y) < CONTACT_RADIUS) {
        this.hp -= 1;
        this.invulnUntil = time + HIT_INVULN_MS;
        this.cameras.main.shake(140, 0.01);
        this.player.setTintFill(0xff5555);
        this.time.delayedCall(110, () => this.player.clearTint());
        this.burst.explode(10, this.player.x, this.player.y);
        this.updateHud(true);
        if (this.hp <= 0) this.die(time);
        return;
      }
    }
  }

  // ---------- Waves ----------

  private startNextWave(): void {
    this.wave += 1;
    const count = 3 + this.wave * 2; // wave 1 = 5 ghosts, wave 2 = 7, ...
    for (let i = 0; i < count; i++) {
      // Ghosts drift in from just outside a random edge.
      const edge = Phaser.Math.Between(0, 3);
      const x = edge === 0 ? -50 : edge === 1 ? W + 50 : Phaser.Math.Between(0, W);
      const y = edge === 2 ? -50 : edge === 3 ? H + 50 : Phaser.Math.Between(0, H);
      const ghost = this.add.image(x, y, 'ghost').setDepth(4 + Math.random() * 0.5) as Ghost;
      ghost.hp = GHOST_HP;
      ghost.phase = Math.random() * Math.PI * 2;
      ghost.shadow = this.add.image(x, y + 44, 'shadow').setDepth(1);
      this.ghosts.push(ghost);
    }
    this.showBanner(`Wave ${this.wave}`, '#ffffff');
    this.updateHud(false);
  }

  // ---------- UI ----------

  private updateHud(popLostHeart: boolean): void {
    this.hearts.forEach((h, i) => {
      const full = i < this.hp;
      const wasFull = h.texture.key === 'heart_full';
      h.setTexture(full ? 'heart_full' : 'heart_empty');
      if (popLostHeart && wasFull && !full) {
        h.setScale(1.5);
        this.tweens.add({ targets: h, scale: 1, duration: 260, ease: 'Back.easeOut' });
      }
    });
    this.waveText.setText(`WAVE ${this.wave}`);
    this.killText.setText(`Kills ${this.kills}`);
  }

  private showBanner(text: string, color: string): void {
    this.tweens.killTweensOf(this.bannerText);
    this.bannerText.setText(text).setColor(color).setAlpha(1).setScale(0.6);
    this.tweens.add({ targets: this.bannerText, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.bannerText, alpha: 0, delay: 900, duration: 500 });
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
    const newBest = this.wave >= best && this.wave > 1;

    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
    const panel = this.add.graphics();
    panel.fillStyle(0x0d1226, 0.95).fillRoundedRect(W / 2 - 270, H / 2 - 260, 540, 520, 30);
    panel.lineStyle(4, 0x4a5aa8, 1).strokeRoundedRect(W / 2 - 270, H / 2 - 260, 540, 520, 30);

    const title = this.add.text(W / 2, H / 2 - 180, 'YOU DIED', textStyle(72, '#ff6b6b')).setOrigin(0.5);
    const stats = this.add
      .text(
        W / 2,
        H / 2 - 30,
        `Wave reached   ${this.wave}\nGhosts banished   ${this.kills}\nBest wave   ${best}`,
        { ...textStyle(34, '#ffffff'), align: 'center', lineSpacing: 14 },
      )
      .setOrigin(0.5);
    const items: Phaser.GameObjects.GameObject[] = [shade, panel, title, stats];
    if (newBest) {
      items.push(this.add.text(W / 2, H / 2 + 100, 'NEW BEST!', textStyle(36, '#ffd66b')).setOrigin(0.5));
    }
    const again = this.add.text(W / 2, H / 2 + 190, 'Tap to play again', textStyle(36, '#8ab4ff')).setOrigin(0.5);
    items.push(again);

    const overlay = this.add.container(0, 0, items).setDepth(50).setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 350 });
    this.tweens.add({ targets: again, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });
  }
}
