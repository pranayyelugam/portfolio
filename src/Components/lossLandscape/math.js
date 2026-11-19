/*
 * Pure model for the loss-landscape background: surfaces, the user-sculpted heightfield,
 * optimizer steps and the shareable URL state. No DOM, so it can be checked in node.
 *
 * Domain coords: x in [0, w], y in [0, h] where (w, h) = (W, H) / max(W, H).
 */

export const MAX_ITERS = 560;
export const GRAD_CLIP = 3;
export const NOISE_SCALE = 3; // gradient-noise std-dev at noise = 1 (gradients are clipped to 3)
export const NOISE_ANNEAL = 400; // noise decays linearly to 0 over this many steps, like an SGD lr schedule
const STALL_DIST = 0.012; // with noise: "settled" = moved less than this over the last 60 steps

const WELLS = [
  [0.8, 0.45, 1.0, 0.2],
  [0.2, 0.6, 0.9, 0.22],
  [0.5, 0.75, 0.6, 0.15],
  [0.12, 0.2, 0.5, 0.14],
];

export const SURFACES = {
  wells: {
    label: 'Wells',
    fn: (x, y, f) => {
      let l = 0;
      for (const w of f.wells) {
        const dx = x - w.x, dy = y - w.y;
        l -= w.a * Math.exp(-(dx * dx + dy * dy) / (2 * w.s * w.s));
      }
      return l + 0.015 * Math.sin(9 * x) * Math.cos(9 * y);
    },
  },
  himmelblau: {
    label: 'Himmelblau',
    fn: (x, y, f) => {
      const a = ((x / f.w) * 2 - 1) * 4.2;
      const b = ((y / f.h) * 2 - 1) * 4.2;
      const v = (a * a + b - 11) ** 2 + (a + b * b - 7) ** 2;
      return -1.4 * Math.exp(-v / 45);
    },
  },
  ripples: {
    label: 'Local minima',
    fn: (x, y, f) => {
      const X = (x / f.w) * 2 - 1;
      const Y = (y / f.h) * 2 - 1;
      return -1.2 * Math.exp(-0.7 * (X * X + Y * Y)) + 0.11 * Math.cos(5.5 * X) * Math.cos(5.5 * Y);
    },
  },
};

export const ALGOS = {
  gd: { label: 'GD', lr: 0.0045 },
  momentum: { label: 'Momentum', lr: 0.0032, beta: 0.9 },
  nesterov: { label: 'Nesterov', lr: 0.0032, beta: 0.9 },
  rmsprop: { label: 'RMSProp', lr: 0.006, beta: 0.9, eps: 1e-8 },
  adam: { label: 'Adam', lr: 0.0055, b1: 0.9, b2: 0.999, eps: 1e-8 },
};

export const DEFAULTS = { surface: 'wells', algos: ['gd', 'momentum', 'adam'], lrMul: 0.5, speed: 0.5, noise: 0, slice: false };

// ---------------------------------------------------------------- field

// Keep sculpted features on the scale of the built-in wells (depth ~1), or the near
// side of the sheet turns into a towering funnel under perspective.
const SCULPT_MIN = -0.9;
const SCULPT_MAX = 0.9;

export const createField = () => ({
  surface: DEFAULTS.surface,
  w: 1, h: 1, wells: [],
  // bounds the optimizers may roam in (the mesh extent)
  bx0: 0, by0: 0, bx1: 1, by1: 1,
  // sculpt heightfield over the same extent
  sculpt: null, sgx: 0, sgy: 0, sdx: 1, sdy: 1, sculpted: false,
});

export const setDomain = (f, w, h, margin) => {
  f.w = w; f.h = h;
  f.wells = WELLS.map(([cx, cy, a, s]) => ({ x: cx * w, y: cy * h, a, s }));
  f.bx0 = -margin * w; f.by0 = -margin * h;
  f.bx1 = w * (1 + margin); f.by1 = h * (1 + margin);
  f.sgx = 160;
  f.sgy = Math.max(60, Math.min(260, Math.round((160 * h) / w)));
  f.sdx = (f.bx1 - f.bx0) / f.sgx;
  f.sdy = (f.by1 - f.by0) / f.sgy;
  f.sculpt = new Float32Array((f.sgx + 1) * (f.sgy + 1));
  f.sculpted = false;
};

export const clearSculpt = (f) => {
  if (f.sculpt) f.sculpt.fill(0);
  f.sculpted = false;
};

export const sampleSculpt = (f, x, y) => {
  if (!f.sculpted) return 0;
  const gx = (x - f.bx0) / f.sdx, gy = (y - f.by0) / f.sdy;
  if (gx < 0 || gy < 0 || gx >= f.sgx || gy >= f.sgy) return 0;
  const i = gx | 0, j = gy | 0, tx = gx - i, ty = gy - j;
  const c = f.sgx + 1, s = f.sculpt, n = j * c + i;
  const top = s[n] + (s[n + 1] - s[n]) * tx;
  const bot = s[n + c] + (s[n + c + 1] - s[n + c]) * tx;
  return top + (bot - top) * ty;
};

/** Add a Gaussian bump (amount < 0 digs, > 0 raises) of std-dev `radius` at (x, y). */
export const stamp = (f, x, y, amount, radius) => {
  const c = f.sgx + 1;
  const i0 = Math.max(0, Math.floor((x - 3 * radius - f.bx0) / f.sdx));
  const i1 = Math.min(f.sgx, Math.ceil((x + 3 * radius - f.bx0) / f.sdx));
  const j0 = Math.max(0, Math.floor((y - 3 * radius - f.by0) / f.sdy));
  const j1 = Math.min(f.sgy, Math.ceil((y + 3 * radius - f.by0) / f.sdy));
  const r2 = 2 * radius * radius;
  for (let j = j0; j <= j1; j++) {
    const dy = f.by0 + j * f.sdy - y;
    for (let i = i0; i <= i1; i++) {
      const dx = f.bx0 + i * f.sdx - x;
      const n = j * c + i;
      const v = f.sculpt[n] + amount * Math.exp(-(dx * dx + dy * dy) / r2);
      f.sculpt[n] = Math.min(SCULPT_MAX, Math.max(SCULPT_MIN, v));
    }
  }
  f.sculpted = true;
};

export const loss = (f, x, y) => SURFACES[f.surface].fn(x, y, f) + sampleSculpt(f, x, y);

export const grad = (f, x, y) => {
  const e = 1e-3;
  let gx = (loss(f, x + e, y) - loss(f, x - e, y)) / (2 * e);
  let gy = (loss(f, x, y + e) - loss(f, x, y - e)) / (2 * e);
  const n = Math.hypot(gx, gy);
  if (n > GRAD_CLIP) { gx *= GRAD_CLIP / n; gy *= GRAD_CLIP / n; }
  return [gx, gy];
};

// ---------------------------------------------------------------- optimizers

const gauss = (rand) => {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

export const TRAIL = 150;

export const makeRunner = (f, id, x, y) => {
  const l = loss(f, x, y);
  return { id, x, y, vx: 0, vy: 0, s: [0, 0], m: [0, 0], t: 0, iter: 0, pts: [[x, y, l]], hist: [l], done: false };
};

/**
 * One optimizer iteration. `noise` in [0, 1] adds annealed Gaussian noise to the gradient
 * (minibatch SGD). While noise is active the gradient never vanishes, so "done" means the
 * runner stopped making progress; once it has decayed the usual small-gradient test applies.
 */
export const step = (f, r, lrMul, noise = 0, rand = Math.random) => {
  const c = ALGOS[r.id];
  const lr = c.lr * lrMul;
  let [gx, gy] = r.id === 'nesterov' ? grad(f, r.x + c.beta * r.vx, r.y + c.beta * r.vy) : grad(f, r.x, r.y);
  const cleanNorm = Math.hypot(gx, gy);
  const sigma = noise * NOISE_SCALE * Math.max(0, 1 - r.iter / NOISE_ANNEAL);
  if (sigma > 0) {
    gx += sigma * gauss(rand);
    gy += sigma * gauss(rand);
  }
  let dx, dy;
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
  const l = loss(f, r.x, r.y);
  r.pts.push([r.x, r.y, l]);
  if (r.pts.length > TRAIL) r.pts.shift();
  r.hist.push(l);
  const out = r.x < f.bx0 || r.x > f.bx1 || r.y < f.by0 || r.y > f.by1;
  let settled;
  if (sigma > 0) {
    const n = r.pts.length;
    settled = r.iter > 250 && n > 60 && Math.hypot(r.x - r.pts[n - 61][0], r.y - r.pts[n - 61][1]) < STALL_DIST;
  } else {
    settled = cleanNorm < 0.01;
  }
  r.done = r.iter >= MAX_ITERS || settled || out;
};

/** Let finished runners continue (e.g. after the surface was sculpted under them). */
export const wake = (r) => {
  if (r.iter < MAX_ITERS) r.done = false;
};

// ---------------------------------------------------------------- URL state

const num = (v, lo, hi) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : undefined;
};

/** Settings that differ from DEFAULTS, as a hash string ('' when everything is default). */
export const encodeState = (s) => {
  const p = new URLSearchParams();
  if (s.surface !== DEFAULTS.surface) p.set('surface', s.surface);
  if (s.algos.join(',') !== DEFAULTS.algos.join(',')) p.set('opt', s.algos.join(','));
  if (s.lrMul !== DEFAULTS.lrMul) p.set('lr', String(+s.lrMul.toFixed(2)));
  if (s.speed !== DEFAULTS.speed) p.set('speed', String(+s.speed.toFixed(2)));
  if (s.noise !== DEFAULTS.noise) p.set('noise', String(+s.noise.toFixed(2)));
  if (s.slice !== DEFAULTS.slice) p.set('slice', s.slice ? '1' : '0');
  const q = p.toString();
  return q ? `#lab&${q}` : '';
};

/** Parse a `#lab&...` hash into validated settings; returns null if the hash isn't lab state. */
export const decodeState = (hash) => {
  if (!hash || !hash.startsWith('#lab')) return null;
  const p = new URLSearchParams(hash.slice(4).replace(/^&/, ''));
  const out = {};
  const surface = p.get('surface');
  if (surface && SURFACES[surface]) out.surface = surface;
  const opt = p.get('opt');
  if (opt) {
    const ids = Object.keys(ALGOS).filter((k) => opt.split(',').includes(k));
    if (ids.length) out.algos = ids;
  }
  const lr = num(p.get('lr'), 0.25, 3);
  if (lr !== undefined) out.lrMul = lr;
  const speed = num(p.get('speed'), 0.1, 3);
  if (speed !== undefined) out.speed = speed;
  const noise = num(p.get('noise'), 0, 1);
  if (noise !== undefined) out.noise = noise;
  if (p.has('slice')) out.slice = p.get('slice') === '1';
  return out;
};
