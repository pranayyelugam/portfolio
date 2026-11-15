import React, { useEffect, useRef, useState } from 'react';
import '../css/LossLandscape.scss';

/*
 * Interactive background: a lit 3D loss surface (perspective heightfield, valleys at
 * the minima) with optimizers descending it. Plain canvas 2D, no extra dependency.
 *
 *  - drag empty background  -> orbit the camera
 *  - move the mouse         -> slight parallax + the grid glows near the cursor
 *  - click empty background -> restart every active optimizer from that point
 *  - "Optimizer lab" panel  -> surface, algorithms, learning rate, pause, restart
 *
 * Domain coords: x in [0, W/S], y in [0, H/S], S = max(W, H). The mesh extends past
 * that by MARGIN so its edges never show while orbiting.
 */

const NX = 84;
const NY = 52;
const MARGIN = 0.65; // large: the sheet extends past the screen so it reads as infinite
const BASE_Z = -1.6; // bottom of the cross-section curtain
const HEIGHT = 0.36; // vertical exaggeration, in units of S
const DEFAULT_YAW = 0.2;
const DEFAULT_PITCH = 0.66; // camera elevation (radians)
const TRAIL = 150;
const MAX_ITERS = 560;
const GRAD_CLIP = 3;

const WELLS = [
  [0.8, 0.45, 1.0, 0.2],
  [0.2, 0.6, 0.9, 0.22],
  [0.5, 0.75, 0.6, 0.15],
  [0.12, 0.2, 0.5, 0.14],
];

const SURFACES = {
  wells: {
    label: 'Wells',
    fn: (x, y, ctx) => {
      let l = 0;
      for (const w of ctx.wells) {
        const dx = x - w.x, dy = y - w.y;
        l -= w.a * Math.exp(-(dx * dx + dy * dy) / (2 * w.s * w.s));
      }
      return l + 0.015 * Math.sin(9 * x) * Math.cos(9 * y);
    },
  },
  himmelblau: {
    label: 'Himmelblau',
    fn: (x, y, ctx) => {
      const a = ((x / ctx.w) * 2 - 1) * 4.2;
      const b = ((y / ctx.h) * 2 - 1) * 4.2;
      const f = (a * a + b - 11) ** 2 + (a + b * b - 7) ** 2;
      return -1.4 * Math.exp(-f / 45);
    },
  },
  ripples: {
    label: 'Local minima',
    fn: (x, y, ctx) => {
      const X = (x / ctx.w) * 2 - 1;
      const Y = (y / ctx.h) * 2 - 1;
      return -1.2 * Math.exp(-0.7 * (X * X + Y * Y)) + 0.11 * Math.cos(5.5 * X) * Math.cos(5.5 * Y);
    },
  },
};

const ALGOS = {
  gd: { label: 'GD', lr: 0.0045 },
  momentum: { label: 'Momentum', lr: 0.0032, beta: 0.9 },
  nesterov: { label: 'Nesterov', lr: 0.0032, beta: 0.9 },
  rmsprop: { label: 'RMSProp', lr: 0.006, beta: 0.9, eps: 1e-8 },
  adam: { label: 'Adam', lr: 0.0055, b1: 0.9, b2: 0.999, eps: 1e-8 },
};

const PALETTES = {
  dark: { gd: '#ffd166', momentum: '#ff6b35', nesterov: '#ff4d8d', rmsprop: '#5ce1e6', adam: '#ffffff' },
  light: { gd: '#1a365d', momentum: '#2b6cb0', nesterov: '#b83280', rmsprop: '#2f855a', adam: '#c05621' },
};

const cssVar = (name, fallback) =>
  getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;

const parseHex = (c, fallback) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((c || '').trim());
  if (!m) return fallback;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const INTERACTIVE =
  'a,button,input,select,textarea,label,img,p,h1,h2,h3,h4,h5,h6,li,span,b,strong,em,svg,video,nav,footer,.header-row,.ll-panel';

const LossLandscape = () => {
  const canvasRef = useRef(null);
  const api = useRef({});
  const lRefs = useRef({});
  const cfg = useRef({ surface: 'wells', algos: ['gd', 'momentum', 'adam'], lrMul: 1, paused: false, speed: 1, slice: false });

  const [surface, setSurface] = useState('wells');
  const [algos, setAlgos] = useState(['gd', 'momentum', 'adam']);
  const [lrMul, setLrMul] = useState(1);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [slice, setSlice] = useState(false);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => document.body.classList.contains('theme-futuristic'));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, S = 1, dpr = 1;
    const sctx = { wells: [], w: 1, h: 1 };
    let colors = null;
    let runners = [];
    let roundFade = 1, lingerFrames = 0, frame = 0, stepAcc = 0;
    let raf = 0;
    const t0 = performance.now();

    const V = (NX + 1) * (NY + 1);
    const zGrid = new Float32Array(V);
    const px = new Float32Array(V), py = new Float32Array(V), pk = new Float32Array(V), pd = new Float32Array(V);
    const quadCount = NX * NY;
    const quadFill = new Array(quadCount);
    const quadDepth = new Float32Array(quadCount);
    const quadDist = new Float32Array(quadCount);
    const order = new Uint32Array(quadCount);
    for (let q = 0; q < quadCount; q++) order[q] = q;
    let gx0 = 0, gy0 = 0, gdx = 0, gdy = 0;

    // Camera state: user-driven yaw/pitch (drag) + hover offset + idle sway, all damped.
    const view = { yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, tYaw: DEFAULT_YAW, tPitch: DEFAULT_PITCH, hx: 0, hy: 0, thx: 0, thy: 0, sp: 0, tsp: 0, sy: 0, tsy: 0 };
    const mouse = { x: -9999, y: -9999 };
    const cam = { cy: 0, sy: 0, cp: 0, sp: 0, F: 1, ox: 0, oy: 0, z: 1 };
    let sliceX = null, sliceY = null; // cross-section plane position (follows the lead optimizer)

    const loss = (x, y) => SURFACES[cfg.current.surface].fn(x, y, sctx);
    const grad = (x, y) => {
      const e = 1e-3;
      let gx = (loss(x + e, y) - loss(x - e, y)) / (2 * e);
      let gy = (loss(x, y + e) - loss(x, y - e)) / (2 * e);
      const n = Math.hypot(gx, gy);
      if (n > GRAD_CLIP) { gx *= GRAD_CLIP / n; gy *= GRAD_CLIP / n; }
      return [gx, gy];
    };

    const readColors = () => {
      const isDark = document.body.classList.contains('theme-futuristic');
      colors = {
        dark: isDark,
        bg: parseHex(cssVar('--bg-primary', '#fafafa'), [250, 250, 250]),
        accent: parseHex(cssVar('--accent-color', '#1a365d'), [26, 54, 93]),
        accentCss: cssVar('--accent-color', '#1a365d'),
        pal: isDark ? PALETTES.dark : PALETTES.light,
      };
      colors.slice = isDark ? '#ff6b35' : cssVar('--accent-color', '#1a365d');
      canvas.style.opacity = isDark ? '1' : '0.82';
      setDark(isDark);
    };

    const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

    const buildGrid = () => {
      const w = W / S, h = H / S;
      sctx.w = w; sctx.h = h;
      sctx.wells = WELLS.map(([cx, cy, a, s]) => ({ x: cx * w, y: cy * h, a, s }));
      gx0 = -MARGIN * w; gy0 = -MARGIN * h;
      gdx = (w * (1 + 2 * MARGIN)) / NX;
      gdy = (h * (1 + 2 * MARGIN)) / NY;
      const cols = NX + 1;
      for (let j = 0; j <= NY; j++) {
        for (let i = 0; i <= NX; i++) zGrid[j * cols + i] = loss(gx0 + i * gdx, gy0 + j * gdy);
      }
      // Static per-face shading from a fixed light, so slopes read as slopes.
      const L = [-0.55, -0.45, 0.7];
      const ln = Math.hypot(...L);
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const z00 = zGrid[j * cols + i], z10 = zGrid[j * cols + i + 1];
          const z01 = zGrid[(j + 1) * cols + i], z11 = zGrid[(j + 1) * cols + i + 1];
          const dzdx = ((z10 + z11) - (z00 + z01)) / (2 * gdx) * HEIGHT;
          const dzdy = ((z01 + z11) - (z00 + z10)) / (2 * gdy) * HEIGHT;
          const nl = Math.hypot(dzdx, dzdy, 1);
          const lam = Math.max(0, (-dzdx * L[0] - dzdy * L[1] + L[2]) / (nl * ln));
          const depth = Math.min(1, Math.max(0, -(z00 + z11) / 2 / 1.3));
          const t = colors.dark ? 0.02 + 0.2 * lam * lam + 0.12 * depth : 0.03 + 0.2 * (1 - lam) + 0.13 * depth;
          quadFill[j * NX + i] = rgb(mix(colors.bg, colors.accent, Math.min(0.6, t)));
          quadDepth[j * NX + i] = depth;
        }
      }
    };

    const setCamera = (now) => {
      const sway = reduced ? 0 : 0.1 * Math.sin((now - t0) * 0.00009);
      const yaw = view.yaw + view.hx + view.sy + sway;
      const pitch = Math.min(1.45, Math.max(-0.9, view.pitch + view.hy + view.sp));
      cam.cy = Math.cos(yaw); cam.sy = Math.sin(yaw);
      cam.cp = Math.cos(pitch); cam.sp = Math.sin(pitch);
      cam.F = 1.25 * S;
      cam.z = 1;
      cam.ox = W * 0.5;
      cam.oy = H * 0.42;
    };

    const proj = (x, y, z, o) => {
      const u = (x - (W / S) * 0.5) * S * cam.z;
      const v = (y - (H / S) * 0.5) * S * cam.z;
      const hgt = z * HEIGHT * S * cam.z;
      const x1 = u * cam.cy - v * cam.sy;
      const y1 = u * cam.sy + v * cam.cy;
      const sy = -y1 * cam.sp - hgt * cam.cp;
      const d = y1 * cam.cp - hgt * cam.sp;
      const k = cam.F / (cam.F + d);
      o[0] = cam.ox + x1 * k; o[1] = cam.oy + sy * k; o[2] = k; o[3] = d;
    };

    const tmp = [0, 0, 0, 0];
    const projectGrid = () => {
      const cols = NX + 1;
      for (let j = 0; j <= NY; j++) {
        for (let i = 0; i <= NX; i++) {
          const n = j * cols + i;
          proj(gx0 + i * gdx, gy0 + j * gdy, zGrid[n], tmp);
          px[n] = tmp[0]; py[n] = tmp[1]; pk[n] = tmp[2]; pd[n] = tmp[3];
        }
      }
    };

    const drawMesh = () => {
      const cols = NX + 1;
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const a = j * cols + i, c = (j + 1) * cols + i + 1;
          quadDist[j * NX + i] = (pd[a] + pd[c]) * 0.5;
        }
      }
      order.sort((a, b) => quadDist[b] - quadDist[a]); // far first
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.accentCss;
      const sigma2 = 2 * 120 * 120;
      const nearLimit = -0.6 * cam.F;
      for (let n = 0; n < quadCount; n++) {
        const q = order[n];
        const j = (q / NX) | 0, i = q - j * NX;
        const a = j * cols + i, b = a + 1, d = a + cols, c = d + 1;
        // Skip faces that end up behind / too close to the camera at low angles.
        if (pd[a] < nearLimit || pd[b] < nearLimit || pd[c] < nearLimit || pd[d] < nearLimit) continue;
        const fade = Math.max(0.2, Math.min(1, (pk[a] - 0.5) / 0.5));
        ctx.globalAlpha = 1;
        ctx.fillStyle = quadFill[q];
        ctx.beginPath();
        ctx.moveTo(px[a], py[a]); ctx.lineTo(px[b], py[b]); ctx.lineTo(px[c], py[c]); ctx.lineTo(px[d], py[d]);
        ctx.closePath();
        ctx.fill();

        const mx = (px[a] + px[c]) * 0.5 - mouse.x, my = (py[a] + py[c]) * 0.5 - mouse.y;
        const near = Math.exp(-(mx * mx + my * my) / sigma2);
        ctx.globalAlpha = Math.min(1, (0.11 + 0.58 * quadDepth[q]) * fade * (colors.dark ? 1 : 0.9) + 0.6 * near);
        ctx.beginPath();
        ctx.moveTo(px[d], py[d]); ctx.lineTo(px[a], py[a]); ctx.lineTo(px[b], py[b]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const drawRunner = (r) => {
      const n = r.pts.length;
      if (n < 2) return;
      const col = colors.pal[r.id];
      const o = [0, 0, 0, 0], floor = [0, 0, 0, 0];
      ctx.strokeStyle = col;
      ctx.lineCap = 'round';
      let prev = null;
      for (let i = 0; i < n; i++) {
        proj(r.pts[i][0], r.pts[i][1], r.pts[i][2] - 0.04, o);
        if (prev) {
          const age = i / n;
          ctx.globalAlpha = Math.min(1, age * 1.1) * roundFade;
          ctx.lineWidth = 0.8 + age * 2.6;
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(o[0], o[1]); ctx.stroke();
        }
        prev = [o[0], o[1], o[2]];
      }
      // Drop line from the head up to the reference plane: a strong depth cue.
      const hd = r.pts[n - 1];
      proj(hd[0], hd[1], 0, floor);
      ctx.globalAlpha = 0.45 * roundFade;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(floor[0], floor[1]); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(floor[0], floor[1], 2, 0, Math.PI * 2); ctx.globalAlpha = 0.5 * roundFade; ctx.fill();
      ctx.globalAlpha = roundFade;
      ctx.shadowColor = col;
      ctx.shadowBlur = colors.dark ? 16 : 6;
      ctx.beginPath(); ctx.arc(prev[0], prev[1], 4 * Math.max(0.7, prev[2]), 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    // Cross-section: a vertical slice through the surface at the lead optimizer's y.
    // The bright curve is the 1D loss profile (every minimum is a dip); the curtain hangs below it.
    const SN = 96;
    const sTx = new Float32Array(SN + 1), sTy = new Float32Array(SN + 1);
    const sBx = new Float32Array(SN + 1), sBy = new Float32Array(SN + 1);
    const drawSlice = () => {
      if (!cfg.current.slice) return;
      const lead = runners[0];
      const tx = lead ? lead.x : 0.5 * (W / S);
      const ty = lead ? lead.y : 0.5 * (H / S);
      sliceX = sliceX === null ? tx : sliceX + (tx - sliceX) * 0.15;
      sliceY = sliceY === null ? ty : sliceY + (ty - sliceY) * 0.15;
      // Cut along whichever axis faces the camera, so the profile is never edge-on.
      const alongX = Math.abs(cam.cy) >= Math.abs(cam.sy);
      const len = alongX ? W / S : H / S;
      const a0 = -0.25 * len, a1 = 1.25 * len;
      for (let t = 0; t <= SN; t++) {
        const u = a0 + ((a1 - a0) * t) / SN;
        const x = alongX ? u : sliceX, y = alongX ? sliceY : u;
        proj(x, y, loss(x, y), tmp);
        sTx[t] = tmp[0]; sTy[t] = tmp[1];
        proj(x, y, BASE_Z, tmp);
        sBx[t] = tmp[0]; sBy[t] = tmp[1];
      }
      const col = colors.slice;
      ctx.fillStyle = col;
      ctx.strokeStyle = col;
      ctx.globalAlpha = colors.dark ? 0.13 : 0.16;
      ctx.beginPath();
      for (let t = 0; t <= SN; t++) { if (t === 0) ctx.moveTo(sTx[t], sTy[t]); else ctx.lineTo(sTx[t], sTy[t]); }
      for (let t = SN; t >= 0; t--) ctx.lineTo(sBx[t], sBy[t]);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      for (let t = 0; t <= SN; t += 3) { ctx.moveTo(sTx[t], sTy[t]); ctx.lineTo(sBx[t], sBy[t]); }
      ctx.stroke();
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      for (let t = 0; t <= SN; t++) { if (t === 0) ctx.moveTo(sBx[t], sBy[t]); else ctx.lineTo(sBx[t], sBy[t]); }
      ctx.stroke();
      // The profile itself.
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.shadowColor = col;
      ctx.shadowBlur = colors.dark ? 12 : 0;
      ctx.beginPath();
      for (let t = 0; t <= SN; t++) { if (t === 0) ctx.moveTo(sTx[t], sTy[t]); else ctx.lineTo(sTx[t], sTy[t]); }
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (lead && lead.pts.length) {
        const mx = alongX ? lead.x : sliceX, my = alongX ? sliceY : lead.y;
        proj(mx, my, loss(mx, my), tmp);
        ctx.globalAlpha = roundFade;
        ctx.fillStyle = colors.pal[lead.id];
        ctx.beginPath(); ctx.arc(tmp[0], tmp[1], 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = colors.dark ? '#ffffff' : '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = col;
      ctx.font = '600 10px Inter, sans-serif';
      ctx.fillText('CROSS-SECTION', sTx[2] + 4, sTy[2] - 10);
      ctx.globalAlpha = 1;
    };

    const render = (now) => {
      setCamera(now);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      projectGrid();
      drawMesh();
      drawSlice();
      for (const r of runners) drawRunner(r);
    };

    const makeRunner = (id, x, y) => ({ id, x, y, vx: 0, vy: 0, s: [0, 0], m: [0, 0], t: 0, iter: 0, pts: [[x, y, loss(x, y)]], done: false });

    const step = (r) => {
      const c = ALGOS[r.id];
      const lr = c.lr * cfg.current.lrMul;
      let dx, dy;
      const [gx, gy] = r.id === 'nesterov' ? grad(r.x + c.beta * r.vx, r.y + c.beta * r.vy) : grad(r.x, r.y);
      if (r.id === 'gd') {
        dx = -lr * gx; dy = -lr * gy;
      } else if (r.id === 'momentum' || r.id === 'nesterov') {
        r.vx = c.beta * r.vx - lr * gx;
        r.vy = c.beta * r.vy - lr * gy;
        dx = r.vx; dy = r.vy;
      } else if (r.id === 'rmsprop') {
        r.s[0] = c.beta * r.s[0] + (1 - c.beta) * gx * gx;
        r.s[1] = c.beta * r.s[1] + (1 - c.beta) * gy * gy;
        dx = (-lr * gx) / (Math.sqrt(r.s[0]) + c.eps);
        dy = (-lr * gy) / (Math.sqrt(r.s[1]) + c.eps);
      } else {
        r.t += 1;
        r.m[0] = c.b1 * r.m[0] + (1 - c.b1) * gx;
        r.m[1] = c.b1 * r.m[1] + (1 - c.b1) * gy;
        r.s[0] = c.b2 * r.s[0] + (1 - c.b2) * gx * gx;
        r.s[1] = c.b2 * r.s[1] + (1 - c.b2) * gy * gy;
        const bc1 = 1 - Math.pow(c.b1, r.t), bc2 = 1 - Math.pow(c.b2, r.t);
        dx = (-lr * (r.m[0] / bc1)) / (Math.sqrt(r.s[0] / bc2) + c.eps);
        dy = (-lr * (r.m[1] / bc1)) / (Math.sqrt(r.s[1] / bc2) + c.eps);
      }
      r.x += dx; r.y += dy;
      r.iter += 1;
      r.pts.push([r.x, r.y, loss(r.x, r.y)]);
      if (r.pts.length > TRAIL) r.pts.shift();
      const out = r.x < gx0 || r.x > -gx0 + W / S || r.y < gy0 || r.y > -gy0 + H / S;
      r.done = r.iter > MAX_ITERS || Math.hypot(gx, gy) < 0.01 || out;
    };

    const startRound = (at) => {
      const x = at ? at[0] : (0.08 + Math.random() * 0.84) * (W / S);
      const y = at ? at[1] : (0.08 + Math.random() * 0.84) * (H / S);
      runners = cfg.current.algos.map((id) => makeRunner(id, x, y));
      roundFade = 1; lingerFrames = 0;
      if (reduced) { runners.forEach((r) => { while (!r.done) step(r); }); render(performance.now()); }
    };

    const updateReadouts = () => {
      for (const r of runners) {
        const el = lRefs.current[r.id];
        if (el) el.textContent = r.pts[r.pts.length - 1][2].toFixed(3);
      }
    };

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      frame += 1;
      view.yaw += (view.tYaw - view.yaw) * 0.12;
      view.pitch += (view.tPitch - view.pitch) * 0.12;
      view.hx += (view.thx - view.hx) * 0.06;
      view.hy += (view.thy - view.hy) * 0.06;
      view.sp += (view.tsp - view.sp) * 0.07;
      view.sy += (view.tsy - view.sy) * 0.07;

      if (!cfg.current.paused) {
        stepAcc += 0.5 * cfg.current.speed; // ~30 iterations/s at 1x, so the descent is readable
        while (stepAcc >= 1) {
          stepAcc -= 1;
          for (const r of runners) if (!r.done) step(r);
        }
        if (runners.every((r) => r.done)) {
          lingerFrames += 1;
          if (lingerFrames > 120) roundFade -= 0.01;
          if (roundFade <= 0) startRound();
        }
      }
      if (frame % 6 === 0) updateReadouts();
      render(now);
    };

    // ----- interaction -----
    const isBackground = (el) => el && el.closest && !el.closest(INTERACTIVE);
    const drag = { on: false, moved: false, x: 0, y: 0 };

    const pickDomainPoint = (sx, sy) => {
      let best = -1, bestD = Infinity;
      for (let n = 0; n < V; n++) {
        const d = (px[n] - sx) ** 2 + (py[n] - sy) ** 2;
        if (d < bestD) { bestD = d; best = n; }
      }
      if (best < 0 || bestD > 80 * 80) return null;
      // Several vertices can overlap on screen on steep faces: take the one nearest the camera.
      let pick = best;
      for (let n = 0; n < V; n++) {
        const d = (px[n] - sx) ** 2 + (py[n] - sy) ** 2;
        if (d <= bestD + 144 && pd[n] < pd[pick]) pick = n;
      }
      const j = (pick / (NX + 1)) | 0, i = pick - j * (NX + 1);
      return [gx0 + i * gdx, gy0 + j * gdy];
    };

    const onDown = (e) => {
      if (e.button !== 0 || !isBackground(e.target)) return;
      drag.on = true; drag.moved = false; drag.x = e.clientX; drag.y = e.clientY;
    };
    const onMove = (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (!reduced) {
        view.thx = (e.clientX / W - 0.5) * 0.22;
        view.thy = (e.clientY / H - 0.5) * -0.12;
      }
      if (drag.on) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 5) {
          drag.moved = true;
          document.body.style.userSelect = 'none';
        }
        if (drag.moved) {
          view.tYaw -= dx * 0.006;
          view.tPitch = Math.min(1.45, Math.max(0.2, view.tPitch + dy * 0.004));
          drag.x = e.clientX; drag.y = e.clientY;
          document.body.style.cursor = 'grabbing';
          if (reduced) { view.yaw = view.tYaw; view.pitch = view.tPitch; render(performance.now()); }
        }
      } else {
        document.body.style.cursor = isBackground(e.target) ? 'grab' : '';
      }
    };
    const endDrag = (e, cancelled) => {
      if (!drag.on) return;
      const wasClick = !drag.moved && !cancelled;
      drag.on = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      if (wasClick && e && isBackground(e.target)) {
        const pt = pickDomainPoint(e.clientX, e.clientY);
        if (pt) startRound(pt);
      }
    };
    const onUp = (e) => endDrag(e, false);
    const onCancel = () => endDrag(null, true);
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; view.thx = 0; view.thy = 0; };

    // Scrolling the page orbits the camera: top-down at the top, side-on mid-page, under the sheet at the bottom.
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      view.tsp = -p * 1.15;
      view.tsy = p * 0.75;
      if (reduced) { view.sp = view.tsp; view.sy = view.tsy; render(performance.now()); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    document.addEventListener('mouseleave', onLeave);

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight; S = Math.max(W, H);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      readColors();
      buildGrid();
      if (reduced) render(performance.now());
    };

    api.current = {
      restart: () => { buildGrid(); startRound(); },
      stepOnce: () => { for (const r of runners) if (!r.done) step(r); updateReadouts(); if (reduced) render(performance.now()); },
      resetView: () => {
        view.tYaw = DEFAULT_YAW; view.tPitch = DEFAULT_PITCH;
        if (reduced) { view.yaw = DEFAULT_YAW; view.pitch = DEFAULT_PITCH; render(performance.now()); }
      },
    };

    resize();
    startRound();
    onScroll();
    view.sp = view.tsp; view.sy = view.tsy;
    window.addEventListener('resize', resize);

    const observer = new MutationObserver(() => { readColors(); buildGrid(); if (reduced) render(performance.now()); });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', onVisibility);
    if (!reduced) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      observer.disconnect();
    };
  }, []);

  // Control handlers: mirror into the cfg ref synchronously (the engine reads it), then restart if needed.
  const apply = (next, restart) => {
    cfg.current = { ...cfg.current, ...next };
    if (restart && api.current.restart) api.current.restart();
  };
  const pickSurface = (s) => { setSurface(s); apply({ surface: s }, true); };
  const toggleAlgo = (id) => {
    const next = algos.includes(id) ? algos.filter((a) => a !== id) : [...algos, id];
    if (!next.length) return;
    const ordered = Object.keys(ALGOS).filter((a) => next.includes(a));
    setAlgos(ordered); apply({ algos: ordered }, true);
  };
  const onLr = (v) => { setLrMul(v); apply({ lrMul: v }, false); };
  const onSlice = (v) => { setSlice(v); apply({ slice: v }, false); };
  const onSpeed = (v) => { setSpeed(v); apply({ speed: v }, false); };
  const togglePause = () => { const p = !paused; setPaused(p); apply({ paused: p }, false); };
  const pal = dark ? PALETTES.dark : PALETTES.light;

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="ll-canvas" />
      <aside className={`ll-panel ${open ? 'open' : ''}`} aria-label="Optimizer lab">
        <button className="ll-head" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span>Optimizer lab</span>
          <span className="ll-caret">{open ? '–' : '+'}</span>
        </button>
        {open && (
          <div className="ll-body">
            <div className="ll-row">
              {Object.entries(SURFACES).map(([k, s]) => (
                <button key={k} className={`ll-seg ${surface === k ? 'on' : ''}`} onClick={() => pickSurface(k)}>{s.label}</button>
              ))}
            </div>
            <div className="ll-algos">
              {Object.entries(ALGOS).map(([k, a]) => (
                <button key={k} className={`ll-chip ${algos.includes(k) ? 'on' : ''}`} onClick={() => toggleAlgo(k)} aria-pressed={algos.includes(k)}>
                  <i style={{ background: pal[k] }} />
                  <span>{a.label}</span>
                  <em ref={(el) => { lRefs.current[k] = el; }}>—</em>
                </button>
              ))}
            </div>
            <label className="ll-slider">
              <span>Learning rate <b>{lrMul.toFixed(2)}×</b></span>
              <input type="range" min="0.25" max="3" step="0.05" value={lrMul} onChange={(e) => onLr(parseFloat(e.target.value))} />
            </label>
            <label className="ll-slider">
              <span>Speed <b>{speed.toFixed(2)}×</b></span>
              <input type="range" min="0.1" max="3" step="0.05" value={speed} onChange={(e) => onSpeed(parseFloat(e.target.value))} />
            </label>
            <label className="ll-check">
              <input type="checkbox" checked={slice} onChange={(e) => onSlice(e.target.checked)} />
              <span>Cross-section slice (follows the lead optimizer)</span>
            </label>
            <div className="ll-row">
              <button className="ll-btn" onClick={() => api.current.restart()}>Restart</button>
              <button className="ll-btn" onClick={togglePause}>{paused ? 'Play' : 'Pause'}</button>
              <button className="ll-btn" onClick={() => api.current.stepOnce()} title="Advance one iteration">Step</button>
              <button className="ll-btn" onClick={() => api.current.resetView()}>Reset</button>
            </div>
            <p className="ll-hint">Scroll to tilt under the sheet · drag the background to orbit · click it to drop a start point</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default LossLandscape;
