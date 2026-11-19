import React, { useEffect, useRef, useState } from 'react';
import '../css/LossLandscape.scss';
import {
  SURFACES, ALGOS, DEFAULTS, MAX_ITERS,
  createField, setDomain, clearSculpt, sampleSculpt, stamp, loss, makeRunner, step, wake,
  encodeState, decodeState,
} from './lossLandscape/math';
import { createGLRenderer } from './lossLandscape/glRenderer';

/*
 * Interactive home-page background: a lit 3D loss surface with optimizers descending it.
 * WebGL2 draws the mesh; a 2D canvas on top draws trails, the cross-section and the sculpt
 * brush. Without WebGL2 the mesh is drawn on the 2D canvas instead (painter's algorithm).
 *
 *  - drag empty background        -> orbit the camera
 *  - click empty background       -> restart every active optimizer from that point
 *  - sculpt mode / shift-drag     -> dig a well (alt+shift or "Raise" builds a hill)
 *  - scroll                       -> camera tilts from top-down to under the sheet
 *  - "Optimizer lab" panel        -> surface, optimizers, loss curves, lr, speed, noise, share link
 *
 * Domain coords: x in [0, W/S], y in [0, H/S], S = max(W, H). The mesh extends past
 * that by MARGIN so its edges never show while orbiting.
 */

const MARGIN = 0.65; // large: the sheet extends past the screen so it reads as infinite
const BASE_Z = -1.6; // bottom of the cross-section curtain
const HEIGHT = 0.36; // vertical exaggeration, in units of S
const DEFAULT_YAW = 0.2;
const DEFAULT_PITCH = 0.66; // camera elevation (radians)
const HERO_SEL = '.content-right';
const HORIZON_GAP = -170; // css px from the bio to the sheet's far edge; negative because the far
// strip is fogged out, so the visible landscape starts ~250px below the geometric edge
const BRUSH_RADIUS = 0.045; // domain units
const BRUSH_RATE = 0.02; // sculpt depth added per frame while held

// Coarse grid: picking, 2D fallback and the shader's grid-line spacing. Cells stay roughly
// square and ~constant on-screen size: 84x52 on a 1440x900 desktop, ~32x69 on a phone.
const GRID_REF = 84 / 1440;
const gridSize = (w, h) => {
  const nx = Math.round(Math.min(96, Math.max(32, GRID_REF * w)));
  const ny = Math.round(Math.min(96, Math.max(24, nx * (h / w))));
  return [nx, ny];
};
const FINE = 3; // WebGL mesh is FINE x denser than the coarse grid
const FINE_CAP = 288;

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

// Anything a visitor might want to read, select or click is never treated as background.
const MOD_KEYS = new Set(['Shift', 'Alt', 'Meta', 'Control']);
const INTERACTIVE =
  'a,button,input,select,textarea,label,img,p,h1,h2,h3,h4,h5,h6,li,span,b,strong,em,svg,video,nav,footer,.header-row,.ll-panel';
// Blocks of copy the mesh dims behind.

const readHashState = () => {
  try {
    return decodeState(window.location.hash);
  } catch (e) {
    return null;
  }
};

const LossLandscape = () => {
  const glRef = useRef(null);
  const canvasRef = useRef(null);
  const curveRef = useRef(null);
  const api = useRef({});
  const lRefs = useRef({});

  // Initial settings: defaults, overridden by a shared #lab link.
  const [initial] = useState(() => {
    const fromHash = readHashState();
    return { s: { ...DEFAULTS, ...(fromHash || {}) }, shared: !!(fromHash && Object.keys(fromHash).length) };
  });
  const cfg = useRef({ ...initial.s, paused: false, sculpt: 'off' });

  const [surface, setSurface] = useState(initial.s.surface);
  const [algos, setAlgos] = useState(initial.s.algos);
  const [lrMul, setLrMul] = useState(initial.s.lrMul);
  const [speed, setSpeed] = useState(initial.s.speed);
  const [noise, setNoise] = useState(initial.s.noise);
  const [slice, setSlice] = useState(initial.s.slice);
  const [paused, setPaused] = useState(false);
  const [sculpt, setSculpt] = useState('off');
  const [sculpted, setSculpted] = useState(false);
  const [open, setOpen] = useState(initial.shared);
  const [copied, setCopied] = useState('');
  const [dark, setDark] = useState(() => document.body.classList.contains('theme-futuristic'));

  useEffect(() => {
    const canvas = canvasRef.current;
    const glCanvas = glRef.current;
    if (!canvas || !glCanvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    let glr = createGLRenderer(glCanvas);
    if (!glr) glCanvas.style.display = 'none';
    const useGL = () => !!glr && !glr.lost;

    let W = 0, H = 0, S = 1, dpr = 1;
    const f = createField();
    f.surface = cfg.current.surface;
    let colors = null;
    let runners = [];
    let roundFade = 1, lingerFrames = 0, frame = 0, stepAcc = 0;
    let raf = 0;
    const t0 = performance.now();

    // ----- coarse grid (picking + 2D fallback) -----
    let NX = 0, NY = 0, V = 0, quadCount = 0;
    let zBase, zGrid, px, py, pk, pd, quadFill, quadDepth, quadDist, order;
    let gx0 = 0, gy0 = 0, gdx = 0, gdy = 0;
    const alloc = (nx, ny) => {
      if (nx === NX && ny === NY) return;
      NX = nx; NY = ny;
      V = (NX + 1) * (NY + 1);
      quadCount = NX * NY;
      zBase = new Float32Array(V); zGrid = new Float32Array(V);
      px = new Float32Array(V); py = new Float32Array(V); pk = new Float32Array(V); pd = new Float32Array(V);
      quadFill = new Array(quadCount);
      quadDepth = new Float32Array(quadCount);
      quadDist = new Float32Array(quadCount);
      order = new Uint32Array(quadCount);
      for (let q = 0; q < quadCount; q++) order[q] = q;
    };

    // ----- fine grid (WebGL mesh) -----
    let FX = 0, FY = 0, fdx = 0, fdy = 0;
    let fBase = null, fZ = null, fN = null;

    // Camera state: user-driven yaw/pitch (drag) + hover offset + scroll tilt, all damped.
    const view = { yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, tYaw: DEFAULT_YAW, tPitch: DEFAULT_PITCH, hx: 0, hy: 0, thx: 0, thy: 0, sp: 0, tsp: 0, sy: 0, tsy: 0 };
    const mouse = { x: -9999, y: -9999, shift: false, alt: false };
    const cam = { cy: 0, sy: 0, cp: 0, sp: 0, F: 1, ox: 0, oy: 0, z: 1 };
    let sliceX = null, sliceY = null; // cross-section plane position (follows the lead optimizer)

    const L = (x, y) => loss(f, x, y);
    const baseLoss = (x, y) => SURFACES[f.surface].fn(x, y, f);

    const readColors = () => {
      const isDark = document.body.classList.contains('theme-futuristic');
      const pal = isDark ? PALETTES.dark : PALETTES.light;
      colors = {
        dark: isDark,
        bg: parseHex(cssVar('--bg-primary', '#fafafa'), [250, 250, 250]),
        accent: parseHex(cssVar('--accent-color', '#1a365d'), [26, 54, 93]),
        accentCss: cssVar('--accent-color', '#1a365d'),
        text2: cssVar('--text-secondary', '#4a5568'),
        border: cssVar('--glass-border', 'rgba(0,0,0,0.15)'),
        pal,
        palRgb: Object.fromEntries(Object.entries(pal).map(([k, hex]) => [k, parseHex(hex, [128, 128, 128])])),
        slice: isDark ? '#ff6b35' : cssVar('--accent-color', '#1a365d'),
      };
      const op = isDark ? '1' : '0.82';
      canvas.style.opacity = op;
      glCanvas.style.opacity = op;
      setDark(isDark);
    };

    const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

    // zBase/fBase + sculpt -> current heights, normals (GL) and face colors (2D fallback).
    const applyHeights = () => {
      const cols = NX + 1;
      for (let j = 0; j <= NY; j++) {
        for (let i = 0; i <= NX; i++) {
          const n = j * cols + i;
          zGrid[n] = zBase[n] + sampleSculpt(f, gx0 + i * gdx, gy0 + j * gdy);
        }
      }
      if (useGL()) {
        const fc = FX + 1;
        for (let j = 0; j <= FY; j++) {
          for (let i = 0; i <= FX; i++) {
            const n = j * fc + i;
            fZ[n] = fBase[n] + sampleSculpt(f, gx0 + i * fdx, gy0 + j * fdy);
          }
        }
        for (let j = 0; j <= FY; j++) {
          for (let i = 0; i <= FX; i++) {
            const n = j * fc + i;
            const zl = fZ[i > 0 ? n - 1 : n], zr = fZ[i < FX ? n + 1 : n];
            const zu = fZ[j > 0 ? n - fc : n], zd = fZ[j < FY ? n + fc : n];
            const dzdx = ((zr - zl) / (((i < FX ? 1 : 0) + (i > 0 ? 1 : 0)) * fdx)) * HEIGHT;
            const dzdy = ((zd - zu) / (((j < FY ? 1 : 0) + (j > 0 ? 1 : 0)) * fdy)) * HEIGHT;
            const nl = Math.hypot(dzdx, dzdy, 1);
            fN[n * 3] = -dzdx / nl; fN[n * 3 + 1] = -dzdy / nl; fN[n * 3 + 2] = 1 / nl;
          }
        }
        glr.setHeights(fZ, fN);
        return;
      }
      // Static per-face shading from a fixed light, so slopes read as slopes.
      const Lv = [-0.55, -0.45, 0.7];
      const ln = Math.hypot(...Lv);
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const z00 = zGrid[j * cols + i], z10 = zGrid[j * cols + i + 1];
          const z01 = zGrid[(j + 1) * cols + i], z11 = zGrid[(j + 1) * cols + i + 1];
          const dzdx = ((z10 + z11) - (z00 + z01)) / (2 * gdx) * HEIGHT;
          const dzdy = ((z01 + z11) - (z00 + z10)) / (2 * gdy) * HEIGHT;
          const nl = Math.hypot(dzdx, dzdy, 1);
          const lam = Math.max(0, (-dzdx * Lv[0] - dzdy * Lv[1] + Lv[2]) / (nl * ln));
          const depth = Math.min(1, Math.max(0, -(z00 + z11) / 2 / 1.3));
          const t = colors.dark ? 0.02 + 0.2 * lam * lam + 0.12 * depth : 0.03 + 0.2 * (1 - lam) + 0.13 * depth;
          quadFill[j * NX + i] = rgb(mix(colors.bg, colors.accent, Math.min(0.6, t)));
          quadDepth[j * NX + i] = depth;
        }
      }
    };

    // Base heights only change with the surface or the viewport; sculpting adds on top.
    const buildBase = () => {
      const w = W / S, h = H / S;
      setDomain(f, w, h, MARGIN);
      gx0 = -MARGIN * w; gy0 = -MARGIN * h;
      gdx = (w * (1 + 2 * MARGIN)) / NX;
      gdy = (h * (1 + 2 * MARGIN)) / NY;
      const cols = NX + 1;
      for (let j = 0; j <= NY; j++) {
        for (let i = 0; i <= NX; i++) zBase[j * cols + i] = baseLoss(gx0 + i * gdx, gy0 + j * gdy);
      }
      if (useGL()) {
        const fx = Math.min(FINE_CAP, NX * FINE), fy = Math.min(FINE_CAP, NY * FINE);
        if (fx !== FX || fy !== FY) {
          FX = fx; FY = fy;
          const fv = (FX + 1) * (FY + 1);
          fBase = new Float32Array(fv); fZ = new Float32Array(fv); fN = new Float32Array(fv * 3);
        }
        fdx = (w * (1 + 2 * MARGIN)) / FX;
        fdy = (h * (1 + 2 * MARGIN)) / FY;
        glr.setGrid(FX, FY, gx0, gy0, fdx, fdy);
        const fc = FX + 1;
        for (let j = 0; j <= FY; j++) {
          for (let i = 0; i <= FX; i++) fBase[j * fc + i] = baseLoss(gx0 + i * fdx, gy0 + j * fdy);
        }
      }
      applyHeights();
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
      // Keep the sheet's far edge (its horizon) below the hero copy: the sheet sits under
      // the bio like a landscape, rises with the page as it scrolls, and settles into its
      // usual framing once the copy has moved past.
      const anchor = heroBottom();
      if (anchor != null) {
        const top = sheetTop();
        if (Number.isFinite(top)) cam.oy = Math.max(cam.oy, anchor + HORIZON_GAP - top);
      }
    };

    // Bottom of the hero bio in viewport px, or null when it isn't on the page.
    let heroEl = null;
    const heroBottom = () => {
      if (!heroEl || !heroEl.isConnected) heroEl = document.querySelector(HERO_SEL);
      return heroEl ? heroEl.getBoundingClientRect().bottom : null;
    };

    // Highest screen y of the sheet's boundary with the origin at 0 (oy is a pure offset).
    const sheetTop = () => {
      const oy = cam.oy;
      cam.oy = 0;
      let top = Infinity;
      const cols = NX + 1;
      const edge = (i, j) => {
        proj(gx0 + i * gdx, gy0 + j * gdy, zGrid[j * cols + i], tmp);
        // points past the near plane (camera under/inside the sheet) project to garbage: skip
        if (tmp[3] > -0.6 * cam.F && tmp[1] < top) top = tmp[1];
      };
      for (let i = 0; i <= NX; i++) { edge(i, 0); edge(i, NY); }
      for (let j = 1; j < NY; j++) { edge(0, j); edge(NX, j); }
      cam.oy = oy;
      return top;
    };

    // Must match the vertex shader in glRenderer.js.
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

    const tmp = [0, 0, 0, 0], tmp2 = [0, 0, 0, 0], tmp3 = [0, 0, 0, 0];
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

    // ----- drawing -----
    const glParams = {
      cam, W: 0, H: 0, S: 1, dpr: 1, center: [0, 0], height: HEIGHT, near: 0, far: 0,
      bg: null, accent: null, dark: false, cell: [0, 0], gridO: [0, 0], mouse: [0, 0],
    };
    const drawMeshGL = () => {
      const p = glParams;
      p.W = W; p.H = H; p.S = S; p.dpr = dpr;
      p.center[0] = (W / S) * 0.5; p.center[1] = (H / S) * 0.5;
      p.near = 0.6 * cam.F; p.far = 6 * S;
      p.bg = colors.bg; p.accent = colors.accent; p.dark = colors.dark;
      p.cell[0] = gdx; p.cell[1] = gdy; p.gridO[0] = gx0; p.gridO[1] = gy0;
      p.mouse[0] = mouse.x; p.mouse[1] = mouse.y;
      return glr.render(p);
    };

    const drawMesh2D = () => {
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

    const rTmp = [0, 0, 0, 0], rPrev = [0, 0, 0], rFloor = [0, 0, 0, 0];
    const drawRunner = (r) => {
      const n = r.pts.length;
      if (n < 2) return;
      const col = colors.pal[r.id];
      const o = rTmp, prev = rPrev, floor = rFloor;
      ctx.strokeStyle = col;
      ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        proj(r.pts[i][0], r.pts[i][1], r.pts[i][2] - 0.04, o);
        if (i > 0) {
          const age = i / n;
          ctx.globalAlpha = Math.min(1, age * 1.1) * roundFade;
          ctx.lineWidth = 0.8 + age * 2.6;
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(o[0], o[1]); ctx.stroke();
        }
        prev[0] = o[0]; prev[1] = o[1]; prev[2] = o[2];
      }
      // Drop line from the head toward the z=0 reference plane: a depth cue. It fades out
      // along its length so it never ends in a stray mark over the page content.
      const hd = r.pts[n - 1];
      proj(hd[0], hd[1], 0, floor);
      const c3 = colors.palRgb[r.id];
      const g = ctx.createLinearGradient(prev[0], prev[1], floor[0], floor[1]);
      g.addColorStop(0, `rgba(${c3[0]},${c3[1]},${c3[2]},0.55)`);
      g.addColorStop(0.6, `rgba(${c3[0]},${c3[1]},${c3[2]},0.12)`);
      g.addColorStop(1, `rgba(${c3[0]},${c3[1]},${c3[2]},0)`);
      ctx.strokeStyle = g;
      ctx.globalAlpha = roundFade;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(floor[0], floor[1]); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = colors.dark ? 16 : 6;
      ctx.beginPath(); ctx.arc(prev[0], prev[1], 4 * Math.max(0.7, prev[2]), 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    // Cross-section: a vertical slice through the surface at the lead optimizer's position.
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
        proj(x, y, L(x, y), tmp);
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
        proj(mx, my, L(mx, my), tmp);
        ctx.globalAlpha = roundFade;
        ctx.fillStyle = colors.pal[lead.id];
        ctx.beginPath(); ctx.arc(tmp[0], tmp[1], 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = col;
      ctx.font = '600 10px Inter, sans-serif';
      ctx.fillText('CROSS-SECTION', sTx[2] + 4, sTy[2] - 10);
      ctx.globalAlpha = 1;
    };

    // ----- picking: screen point -> domain point on the (sculpted) surface -----
    const pick = (sx, sy) => {
      let best = -1, bestD = Infinity;
      for (let n = 0; n < V; n++) {
        const d = (px[n] - sx) ** 2 + (py[n] - sy) ** 2;
        if (d < bestD) { bestD = d; best = n; }
      }
      if (best < 0 || bestD > 80 * 80) return null;
      // Several vertices can overlap on screen on steep faces: take the one nearest the camera.
      let p0 = best;
      for (let n = 0; n < V; n++) {
        const d = (px[n] - sx) ** 2 + (py[n] - sy) ** 2;
        if (d <= bestD + 144 && pd[n] < pd[p0]) p0 = n;
      }
      const j = (p0 / (NX + 1)) | 0, i = p0 - j * (NX + 1);
      let x = gx0 + i * gdx, y = gy0 + j * gdy;
      // Refine below grid resolution with a few Newton steps on the projection.
      const h = 1e-3;
      for (let it = 0; it < 6; it++) {
        proj(x, y, L(x, y), tmp);
        const ex = tmp[0] - sx, ey = tmp[1] - sy;
        if (ex * ex + ey * ey < 0.25) break;
        proj(x + h, y, L(x + h, y), tmp2);
        proj(x, y + h, L(x, y + h), tmp3);
        const a = (tmp2[0] - tmp[0]) / h, c = (tmp2[1] - tmp[1]) / h;
        const b = (tmp3[0] - tmp[0]) / h, d = (tmp3[1] - tmp[1]) / h;
        const det = a * d - b * c;
        if (Math.abs(det) < 1e-9) break;
        const stepX = (d * ex - b * ey) / det, stepY = (-c * ex + a * ey) / det;
        const sl = Math.hypot(stepX, stepY), lim = 1.5 * Math.max(gdx, gdy);
        const sc = sl > lim ? lim / sl : 1;
        x -= stepX * sc; y -= stepY * sc;
      }
      return [x, y];
    };

    // ----- sculpting -----
    const sculptState = { on: false, sign: -1, x: 0, y: 0 };
    let brushPt = null; // domain point under the cursor while a sculpt tool is armed
    const sculptArmed = () => cfg.current.sculpt !== 'off' || mouse.shift;
    const brushSign = () => (cfg.current.sculpt === 'raise' || mouse.alt ? 1 : -1);

    const applySculpt = (pt, amount) => {
      stamp(f, pt[0], pt[1], amount, BRUSH_RADIUS);
      applyHeights();
      for (const r of runners) wake(r);
      roundFade = 1; lingerFrames = 0;
      setSculpted(true);
    };

    const drawBrush = () => {
      if (!brushPt || (!sculptState.on && !sculptArmed())) return;
      const sign = sculptState.on ? sculptState.sign : brushSign();
      ctx.strokeStyle = colors.accentCss;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;
      ctx.setLineDash(sign < 0 ? [] : [4, 3]);
      // A flat ring at the cursor's height: reads as a brush footprint even over steep pits.
      const zc = L(brushPt[0], brushPt[1]);
      ctx.beginPath();
      for (let k = 0; k <= 40; k++) {
        const a = (k / 40) * Math.PI * 2;
        proj(brushPt[0] + Math.cos(a) * BRUSH_RADIUS * 1.6, brushPt[1] + Math.sin(a) * BRUSH_RADIUS * 1.6, zc, tmp);
        if (k === 0) ctx.moveTo(tmp[0], tmp[1]); else ctx.lineTo(tmp[0], tmp[1]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      proj(brushPt[0], brushPt[1], zc, tmp);
      ctx.font = '600 10px Inter, sans-serif';
      ctx.fillStyle = colors.accentCss;
      ctx.fillText(sign < 0 ? 'DIG' : 'RAISE', tmp[0] + 10, tmp[1] - 10);
      ctx.globalAlpha = 1;
    };

    const render = (now) => {
      setCamera(now);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      projectGrid();
      if (!(useGL() && drawMeshGL())) {
        if (glr && glr.lost) {
          // Context lost mid-session: switch to the 2D mesh for good.
          glCanvas.style.display = 'none';
          glr = null;
          applyHeights();
        }
        drawMesh2D();
      }
      drawSlice();
      for (const r of runners) drawRunner(r);
      drawBrush();
    };

    // ----- optimizers + readouts -----
    const drawCurve = () => {
      const cv = curveRef.current;
      if (!cv) return;
      const cw = cv.clientWidth, ch = cv.clientHeight;
      if (!cw || !ch) return;
      const r2 = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(cw * r2)) { cv.width = Math.round(cw * r2); cv.height = Math.round(ch * r2); }
      const c = cv.getContext('2d');
      c.setTransform(r2, 0, 0, r2, 0, 0);
      c.clearRect(0, 0, cw, ch);
      let lo = Infinity, hi = -Infinity, iters = 60;
      for (const r of runners) {
        for (const v of r.hist) { if (v < lo) lo = v; if (v > hi) hi = v; }
        iters = Math.max(iters, r.hist.length - 1);
      }
      if (!Number.isFinite(lo)) return;
      if (hi - lo < 0.02) { hi += 0.01; lo -= 0.01; }
      const padT = 6, padB = 14, padL = 2, padR = 2;
      const X = (i) => padL + (i / iters) * (cw - padL - padR);
      const Y = (v) => padT + ((hi - v) / (hi - lo)) * (ch - padT - padB);
      c.strokeStyle = colors.border;
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(padL, ch - padB + 0.5); c.lineTo(cw - padR, ch - padB + 0.5); c.stroke();
      c.lineJoin = 'round';
      c.lineWidth = 1.6;
      for (const r of runners) {
        const n = r.hist.length;
        const stride = Math.max(1, Math.floor(n / cw));
        c.strokeStyle = colors.pal[r.id];
        c.beginPath();
        for (let i = 0; i < n; i += stride) { if (i === 0) c.moveTo(X(i), Y(r.hist[i])); else c.lineTo(X(i), Y(r.hist[i])); }
        c.lineTo(X(n - 1), Y(r.hist[n - 1]));
        c.stroke();
      }
      c.fillStyle = colors.text2;
      c.font = '10px Inter, sans-serif';
      c.fillText('step 0', padL, ch - 2);
      const lbl = `${iters}`;
      c.fillText(lbl, cw - padR - c.measureText(lbl).width, ch - 2);
    };

    const updateReadouts = () => {
      for (const id of Object.keys(ALGOS)) {
        const el = lRefs.current[id];
        if (!el) continue;
        const r = runners.find((x) => x.id === id);
        el.textContent = r ? r.pts[r.pts.length - 1][2].toFixed(3) : '—';
      }
      drawCurve();
    };

    const startRound = (at) => {
      const x = at ? at[0] : (0.08 + Math.random() * 0.84) * (W / S);
      const y = at ? at[1] : (0.08 + Math.random() * 0.84) * (H / S);
      runners = cfg.current.algos.map((id) => makeRunner(f, id, x, y));
      roundFade = 1; lingerFrames = 0;
      if (reduced) {
        runners.forEach((r) => { while (!r.done) step(f, r, cfg.current.lrMul, cfg.current.noise); });
        render(performance.now());
      }
      updateReadouts();
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

      if (sculptState.on) {
        const pt = pick(sculptState.x, sculptState.y);
        if (pt) { brushPt = pt; applySculpt(pt, sculptState.sign * BRUSH_RATE); }
      } else if (sculptArmed() && mouse.x > -9999 && frame % 2 === 0) {
        brushPt = pick(mouse.x, mouse.y);
      }

      if (!cfg.current.paused) {
        stepAcc += 0.5 * cfg.current.speed; // ~30 iterations/s at 1x, so the descent is readable
        while (stepAcc >= 1) {
          stepAcc -= 1;
          for (const r of runners) if (!r.done) step(f, r, cfg.current.lrMul, cfg.current.noise);
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
    const hasOwnText = (el) => {
      for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
      return false;
    };
    const isBackground = (el) => !!el && !!el.closest && !el.closest(INTERACTIVE) && !hasOwnText(el);
    const drag = { on: false, moved: false, x: 0, y: 0, touch: false };
    const redrawIfStatic = () => { if (reduced) render(performance.now()); };

    // Shift arms the brush only on its own: ⌘/Ctrl+Shift belongs to system shortcuts (screenshots, etc.)
    const readMods = (e) => {
      const sys = e.metaKey || e.ctrlKey;
      mouse.shift = e.shiftKey && !sys;
      mouse.alt = e.altKey && !sys;
    };
    const onDown = (e) => {
      if (e.button !== 0 || !isBackground(e.target)) return;
      readMods(e);
      if (e.pointerType === 'mouse' && sculptArmed()) {
        const pt = pick(e.clientX, e.clientY);
        if (!pt) return;
        e.preventDefault();
        sculptState.on = true; sculptState.sign = brushSign();
        sculptState.x = e.clientX; sculptState.y = e.clientY;
        document.body.style.userSelect = 'none';
        if (reduced) { applySculpt(pt, sculptState.sign * BRUSH_RATE * 4); render(performance.now()); }
        return;
      }
      drag.on = true; drag.moved = false; drag.x = e.clientX; drag.y = e.clientY;
      drag.touch = e.pointerType !== 'mouse';
    };
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return; // touch/pen: no hover glow, parallax or orbit
      mouse.x = e.clientX; mouse.y = e.clientY;
      readMods(e);
      if (!reduced) {
        view.thx = (e.clientX / W - 0.5) * 0.22;
        view.thy = (e.clientY / H - 0.5) * -0.12;
      }
      if (sculptState.on) {
        sculptState.x = e.clientX; sculptState.y = e.clientY;
        if (reduced) {
          const pt = pick(e.clientX, e.clientY);
          if (pt) { brushPt = pt; applySculpt(pt, sculptState.sign * BRUSH_RATE * 2); render(performance.now()); }
        }
        return;
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
        const bg = isBackground(e.target);
        document.body.style.cursor = bg ? (sculptArmed() ? 'crosshair' : 'grab') : '';
        if (!bg) brushPt = null;
        else if (reduced && sculptArmed()) { brushPt = pick(e.clientX, e.clientY); render(performance.now()); }
      }
    };
    const endDrag = (e, cancelled) => {
      if (sculptState.on) {
        sculptState.on = false;
        document.body.style.userSelect = '';
        return;
      }
      if (!drag.on) return;
      // A touch counts as a tap only if the finger barely moved (otherwise it was a scroll).
      const tapMoved = drag.touch && e && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10;
      const wasClick = !drag.moved && !cancelled && !tapMoved;
      drag.on = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      if (wasClick && e && isBackground(e.target)) {
        const pt = pick(e.clientX, e.clientY);
        if (!pt) return;
        if (drag.touch && cfg.current.sculpt !== 'off') {
          applySculpt(pt, (cfg.current.sculpt === 'raise' ? 1 : -1) * 0.25);
          redrawIfStatic();
        } else {
          startRound(pt);
        }
      }
    };
    const onUp = (e) => endDrag(e, false);
    const onCancel = () => endDrag(null, true);
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; brushPt = null; view.thx = 0; view.thy = 0; };
    const onKey = (e) => {
      if (!MOD_KEYS.has(e.key)) return;
      readMods(e);
      if (!sculptArmed()) brushPt = null;
      redrawIfStatic();
    };
    // A system shortcut (e.g. ⌘⇧4) can take focus before keyup arrives: drop held modifiers.
    const onBlur = () => { mouse.shift = false; mouse.alt = false; brushPt = null; redrawIfStatic(); };

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
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', onBlur);
    document.addEventListener('mouseleave', onLeave);

    const resize = (initial) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // On phones the URL bar showing/hiding fires resize with only the height changing.
      // Keep the tallest height seen at this width so scrolling never rebuilds the scene.
      if (!initial && coarse && w === W && h <= H) return;
      if (!initial && w === W && h === H) return;
      W = w; H = h; S = Math.max(W, H);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      for (const c of [canvas, glCanvas]) {
        c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
        c.style.width = `${W}px`; c.style.height = `${H}px`;
      }
      if (glr) glr.resize(glCanvas.width, glCanvas.height);
      alloc(...gridSize(W, H));
      readColors();
      buildBase(); // also resets the sculpt field: it lives in the old domain's coordinates
      setSculpted(false);
      if (!initial) startRound();
      else if (reduced) render(performance.now());
    };
    const onResize = () => resize(false);

    api.current = {
      restart: () => {
        if (f.surface !== cfg.current.surface) {
          f.surface = cfg.current.surface;
          clearSculpt(f);
          setSculpted(false);
          buildBase();
        }
        startRound();
      },
      clearSculpt: () => {
        clearSculpt(f);
        applyHeights();
        for (const r of runners) wake(r);
        setSculpted(false);
        redrawIfStatic();
      },
      stepOnce: () => {
        for (const r of runners) if (!r.done) step(f, r, cfg.current.lrMul, cfg.current.noise);
        updateReadouts();
        redrawIfStatic();
      },
      resetView: () => {
        view.tYaw = DEFAULT_YAW; view.tPitch = DEFAULT_PITCH;
        if (reduced) { view.yaw = DEFAULT_YAW; view.pitch = DEFAULT_PITCH; render(performance.now()); }
      },
      redraw: () => { updateReadouts(); redrawIfStatic(); },
    };

    resize(true);
    startRound();
    onScroll();
    view.sp = view.tsp; view.sy = view.tsy;
    window.addEventListener('resize', onResize);

    const observer = new MutationObserver(() => { readColors(); applyHeights(); updateReadouts(); redrawIfStatic(); });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', onVisibility);
    if (!reduced) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      observer.disconnect();
      if (glr) glr.dispose();
    };
  }, []);

  // Keep the URL hash in sync with the lab settings so the current setup can be shared.
  useEffect(() => {
    const hash = encodeState({ surface, algos, lrMul, speed, noise, slice });
    const { pathname, search } = window.location;
    if (window.location.hash === hash) return;
    if (!hash && !window.location.hash.startsWith('#lab')) return;
    try {
      window.history.replaceState(window.history.state, '', `${pathname}${search}${hash}`);
    } catch (e) {
      // ignore: some embedded browsers forbid replaceState
    }
  }, [surface, algos, lrMul, speed, noise, slice]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Draw the loss chart as soon as the panel (and its canvas) mounts.
  useEffect(() => {
    if (open && api.current.redraw) api.current.redraw();
  }, [open]);

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
  const onSpeed = (v) => { setSpeed(v); apply({ speed: v }, false); };
  const onNoise = (v) => { setNoise(v); apply({ noise: v }, true); };
  const onSlice = (v) => { setSlice(v); apply({ slice: v }, false); };
  const onSculpt = (m) => { setSculpt(m); apply({ sculpt: m }, false); };
  const togglePause = () => { const p = !paused; setPaused(p); apply({ paused: p }, false); };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied('Link copied');
    } catch (e) {
      setCopied('Copy failed: use the address bar');
    }
    setTimeout(() => setCopied(''), 1800);
  };
  const pal = dark ? PALETTES.dark : PALETTES.light;

  return (
    <>
      <canvas ref={glRef} aria-hidden="true" className="ll-canvas" />
      <canvas ref={canvasRef} aria-hidden="true" className="ll-canvas" />
      <aside className={`ll-panel ${open ? 'open' : ''}`} aria-label="Optimizer lab">
        <button className="ll-head" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="ll-body">
          <span>Optimizer lab</span>
          <span className="ll-caret" aria-hidden="true">{open ? '–' : '+'}</span>
        </button>
        {open && (
          <div className="ll-body" id="ll-body">
            <div className="ll-row" role="group" aria-label="Loss surface">
              {Object.entries(SURFACES).map(([k, s]) => (
                <button key={k} className={`ll-seg ${surface === k ? 'on' : ''}`} onClick={() => pickSurface(k)} aria-pressed={surface === k}>{s.label}</button>
              ))}
            </div>
            <div className="ll-algos" role="group" aria-label="Optimizers (current loss)">
              {Object.entries(ALGOS).map(([k, a]) => (
                <button key={k} className={`ll-chip ${algos.includes(k) ? 'on' : ''}`} onClick={() => toggleAlgo(k)} aria-pressed={algos.includes(k)}>
                  <i style={{ background: pal[k] }} />
                  <span>{a.label}</span>
                  <em ref={(el) => { lRefs.current[k] = el; }}>—</em>
                </button>
              ))}
            </div>
            <figure className="ll-curve">
              <canvas ref={curveRef} role="img" aria-label="Loss versus step for each active optimizer" />
              <figcaption>Loss vs. step (max {MAX_ITERS})</figcaption>
            </figure>
            <label className="ll-slider">
              <span>Learning rate <b>{lrMul.toFixed(2)}×</b></span>
              <input type="range" min="0.25" max="3" step="0.05" value={lrMul} onChange={(e) => onLr(parseFloat(e.target.value))} />
            </label>
            <label className="ll-slider">
              <span>Speed <b>{speed.toFixed(2)}×</b></span>
              <input type="range" min="0.1" max="3" step="0.05" value={speed} onChange={(e) => onSpeed(parseFloat(e.target.value))} />
            </label>
            <label className="ll-slider">
              <span>Gradient noise (SGD) <b>{noise === 0 ? 'off' : noise.toFixed(2)}</b></span>
              <input type="range" min="0" max="1" step="0.05" value={noise} onChange={(e) => onNoise(parseFloat(e.target.value))} />
            </label>
            <label className="ll-check">
              <input type="checkbox" checked={slice} onChange={(e) => onSlice(e.target.checked)} />
              <span>Cross-section slice (follows the lead optimizer)</span>
            </label>
            <div className="ll-sculpt">
              <span className="ll-label">Sculpt</span>
              <div className="ll-row" role="group" aria-label="Sculpt tool">
                {[['off', 'Off'], ['dig', 'Dig'], ['raise', 'Raise']].map(([k, label]) => (
                  <button key={k} className={`ll-seg ${sculpt === k ? 'on' : ''}`} onClick={() => onSculpt(k)} aria-pressed={sculpt === k}>{label}</button>
                ))}
                <button className="ll-btn" onClick={() => api.current.clearSculpt()} disabled={!sculpted}>Clear</button>
              </div>
            </div>
            <div className="ll-row">
              <button className="ll-btn" onClick={() => api.current.restart()}>Restart</button>
              <button className="ll-btn" onClick={togglePause}>{paused ? 'Play' : 'Pause'}</button>
              <button className="ll-btn" onClick={() => api.current.stepOnce()} title="Advance one iteration">Step</button>
              <button className="ll-btn" onClick={() => api.current.resetView()} title="Reset camera">View</button>
            </div>
            <button className="ll-btn ll-share" onClick={copyLink}>{copied || 'Copy link to this setup'}</button>
            <p className="ll-hint">
              Drag the background to orbit · click it to drop a start point · shift-drag digs, alt+shift-drag raises · scroll tilts under the sheet
            </p>
          </div>
        )}
      </aside>
    </>
  );
};

export default LossLandscape;
