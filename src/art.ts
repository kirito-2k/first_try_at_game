import Phaser from 'phaser';

// Logical game size. 720x1280 is portrait phone shaped and renders sharp on most screens.
export const W = 720;
export const H = 1280;

type Draw = (c: CanvasRenderingContext2D) => void;

function makeTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw): void {
  if (scene.textures.exists(key)) return; // textures survive scene restarts
  const tex = scene.textures.createCanvas(key, w, h)!;
  draw(tex.getContext());
  tex.refresh();
}

// Small seeded random generator so the forest looks the same every run.
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pine(c: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
  c.fillStyle = color;
  c.fillRect(x - 5 * s, y, 10 * s, 26 * s); // trunk
  for (let i = 0; i < 4; i++) {
    const top = y - 120 * s + i * 38 * s;
    const half = (28 + i * 16) * s;
    c.beginPath();
    c.moveTo(x, top);
    c.lineTo(x + half, top + 70 * s);
    c.lineTo(x - half, top + 70 * s);
    c.closePath();
    c.fill();
  }
}

function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, inner: string, outer: string): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

export function createTextures(scene: Phaser.Scene): void {
  // ---------- Forest floor ----------
  makeTexture(scene, 'bg', W, H, (c) => {
    const rand = rng(7);

    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0b1226');
    sky.addColorStop(0.5, '#10202e');
    sky.addColorStop(1, '#0a1a14');
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);

    // Moonlight pool.
    const moon = c.createRadialGradient(W * 0.72, 220, 10, W * 0.72, 220, 620);
    moon.addColorStop(0, 'rgba(140,170,255,0.30)');
    moon.addColorStop(1, 'rgba(140,170,255,0)');
    c.fillStyle = moon;
    c.fillRect(0, 0, W, H);

    // Dark moss patches.
    for (let i = 0; i < 46; i++) {
      c.save();
      c.translate(rand() * W, rand() * H);
      c.scale(1, 0.5);
      glow(c, 0, 0, 40 + rand() * 90, 'rgba(18,48,36,0.35)', 'rgba(18,48,36,0)');
      c.restore();
    }

    // Grass tufts.
    c.lineCap = 'round';
    for (let i = 0; i < 260; i++) {
      const x = rand() * W;
      const y = rand() * H;
      const h = 6 + rand() * 10;
      c.strokeStyle = `rgba(${60 + rand() * 30},${110 + rand() * 50},${80 + rand() * 30},${0.15 + rand() * 0.2})`;
      c.lineWidth = 2;
      for (let k = -1; k <= 1; k++) {
        c.beginPath();
        c.moveTo(x + k * 4, y);
        c.lineTo(x + k * 7, y - h);
        c.stroke();
      }
    }

    // Stones.
    for (let i = 0; i < 26; i++) {
      const x = rand() * W;
      const y = rand() * H;
      const r = 5 + rand() * 9;
      c.fillStyle = 'rgba(10,14,22,0.45)';
      c.beginPath();
      c.ellipse(x + 2, y + 3, r * 1.2, r * 0.6, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = `rgba(${70 + rand() * 25},${80 + rand() * 25},${100 + rand() * 25},0.55)`;
      c.beginPath();
      c.ellipse(x, y, r * 1.1, r * 0.65, 0, 0, Math.PI * 2);
      c.fill();
    }

    // Trees framing the arena: far row (lighter) then near row (darker).
    const rows: Array<[string, number, number]> = [
      ['#0c1a17', 0.85, 70],
      ['#070f0d', 1.1, 46],
    ];
    for (const [color, scale, inset] of rows) {
      const spots: Array<[number, number]> = [];
      for (let y = -20; y < H + 60; y += 70 + rand() * 40) {
        spots.push([rand() * inset - 10, y]);
        spots.push([W - rand() * inset + 10, y + rand() * 30]);
      }
      for (let x = 30; x < W - 20; x += 80 + rand() * 50) {
        spots.push([x, rand() * inset - 20]);
        spots.push([x, H - rand() * inset + 20]);
      }
      spots.sort((a, b) => a[1] - b[1]);
      for (const [x, y] of spots) pine(c, x, y, scale * (0.8 + rand() * 0.5), color);
    }

    // A few pairs of glowing eyes hiding in the trees.
    for (let i = 0; i < 5; i++) {
      const left = rand() < 0.5;
      const x = left ? 14 + rand() * 20 : W - 34 + rand() * 20;
      const y = 120 + rand() * (H - 240);
      c.fillStyle = 'rgba(255,214,90,0.85)';
      c.beginPath();
      c.ellipse(x, y, 3, 2, 0, 0, Math.PI * 2);
      c.ellipse(x + 10, y, 3, 2, 0, 0, Math.PI * 2);
      c.fill();
    }
  });

  // ---------- Vignette (darkens the screen edges) ----------
  makeTexture(scene, 'vignette', W, H, (c) => {
    const g = c.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.7)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  });

  // ---------- Mage (80x104, body centre about 40,58) ----------
  makeTexture(scene, 'mage', 80, 104, (c) => {
    c.lineJoin = 'round';

    // Staff (right side).
    c.strokeStyle = '#6b4a2b';
    c.lineWidth = 5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(66, 44);
    c.lineTo(70, 98);
    c.stroke();
    glow(c, 66, 40, 20, 'rgba(120,220,255,0.55)', 'rgba(120,220,255,0)');
    glow(c, 66, 40, 8, '#ffffff', '#6fd8ff');

    // Robe.
    const robe = c.createLinearGradient(0, 40, 0, 100);
    robe.addColorStop(0, '#6a7cf0');
    robe.addColorStop(1, '#2b3796');
    c.fillStyle = robe;
    c.strokeStyle = '#161d52';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(30, 42);
    c.quadraticCurveTo(40, 36, 50, 42);
    c.lineTo(62, 96);
    c.quadraticCurveTo(40, 104, 18, 96);
    c.closePath();
    c.fill();
    c.stroke();

    // Belt and hem trim.
    c.strokeStyle = '#ffd66b';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(27, 62);
    c.quadraticCurveTo(40, 68, 53, 62);
    c.stroke();
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(19, 93);
    c.quadraticCurveTo(40, 101, 61, 93);
    c.stroke();

    // Face in shadow with glowing eyes.
    c.fillStyle = '#12142b';
    c.beginPath();
    c.ellipse(40, 36, 13, 12, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#9ff3ff';
    c.beginPath();
    c.ellipse(35, 37, 2.6, 3.4, 0, 0, Math.PI * 2);
    c.ellipse(45, 37, 2.6, 3.4, 0, 0, Math.PI * 2);
    c.fill();

    // Hat.
    const hat = c.createLinearGradient(0, 0, 0, 34);
    hat.addColorStop(0, '#6d4fd1');
    hat.addColorStop(1, '#33237a');
    c.fillStyle = hat;
    c.strokeStyle = '#1a1050';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(22, 30);
    c.quadraticCurveTo(34, 14, 50, 2);
    c.quadraticCurveTo(60, 6, 58, 30);
    c.closePath();
    c.fill();
    c.stroke();
    c.beginPath(); // brim
    c.ellipse(40, 30, 25, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.strokeStyle = '#ffd66b'; // band
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(25, 28);
    c.quadraticCurveTo(40, 34, 56, 27);
    c.stroke();
  });

  // ---------- Ghost (76x92, body centre about 38,46) ----------
  makeTexture(scene, 'ghost', 76, 92, (c) => {
    c.translate(6, 6);
    c.beginPath();
    c.moveTo(4, 36);
    c.bezierCurveTo(4, 10, 18, 2, 32, 2);
    c.bezierCurveTo(46, 2, 60, 10, 60, 36);
    c.lineTo(60, 68);
    for (let k = 0; k < 4; k++) {
      const x1 = 60 - k * 14;
      const x2 = x1 - 14;
      c.quadraticCurveTo((x1 + x2) / 2, 82, x2, 68);
    }
    c.closePath();

    c.shadowColor = 'rgba(160,200,255,0.9)';
    c.shadowBlur = 14;
    const body = c.createLinearGradient(0, 0, 0, 80);
    body.addColorStop(0, 'rgba(240,246,255,0.97)');
    body.addColorStop(1, 'rgba(150,172,232,0.80)');
    c.fillStyle = body;
    c.fill();
    c.shadowBlur = 0;

    c.fillStyle = '#161b36';
    c.beginPath();
    c.ellipse(22, 34, 5, 8, 0, 0, Math.PI * 2);
    c.ellipse(42, 34, 5, 8, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(32, 54, 5, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.arc(24, 31, 1.8, 0, Math.PI * 2);
    c.arc(44, 31, 1.8, 0, Math.PI * 2);
    c.fill();
  });

  // ---------- Spell bolt ----------
  makeTexture(scene, 'bolt', 48, 48, (c) => {
    glow(c, 24, 24, 24, 'rgba(255,230,120,0.65)', 'rgba(255,200,60,0)');
    glow(c, 24, 24, 10, '#ffffff', 'rgba(255,225,110,0.95)');
  });

  // ---------- Soft dot used for particles and glows ----------
  makeTexture(scene, 'spark', 32, 32, (c) => {
    glow(c, 16, 16, 16, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  });

  // ---------- Ground shadow ----------
  makeTexture(scene, 'shadow', 80, 28, (c) => {
    c.translate(40, 14);
    c.scale(1, 0.35);
    glow(c, 0, 0, 40, 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0)');
  });

  // ---------- Fog puff ----------
  makeTexture(scene, 'fog', 512, 256, (c) => {
    c.translate(256, 128);
    c.scale(1, 0.5);
    glow(c, 0, 0, 256, 'rgba(190,210,255,0.16)', 'rgba(190,210,255,0)');
  });

  // ---------- Hearts ----------
  const heartPath = (c: CanvasRenderingContext2D): void => {
    c.beginPath();
    c.moveTo(22, 40);
    c.bezierCurveTo(-8, 22, 4, -4, 22, 10);
    c.bezierCurveTo(40, -4, 52, 22, 22, 40);
    c.closePath();
  };
  makeTexture(scene, 'heart_full', 44, 44, (c) => {
    heartPath(c);
    const g = c.createLinearGradient(0, 0, 0, 40);
    g.addColorStop(0, '#ff7a90');
    g.addColorStop(1, '#d3203f');
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = '#4a0b1a';
    c.lineWidth = 3;
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath();
    c.ellipse(13, 12, 4, 2.5, -0.6, 0, Math.PI * 2);
    c.fill();
  });
  makeTexture(scene, 'heart_empty', 44, 44, (c) => {
    heartPath(c);
    c.fillStyle = 'rgba(255,255,255,0.07)';
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.30)';
    c.lineWidth = 3;
    c.stroke();
  });
}
