/*
 * WebGL2 renderer for the loss surface mesh. The engine owns the camera and heights; this only
 * uploads them and draws. The vertex shader reproduces the engine's JS `proj()` exactly (so the
 * 2D overlay — trails, slice, brush — lines up), and adds a near plane + depth for occlusion.
 *
 * Fragment shader: per-pixel Lambert shading, anti-aliased grid lines at the coarse-grid spacing,
 * distance fog and a cursor glow.
 */

const VS = `#version 300 es
in vec2 aPos;
in float aZ;
in vec3 aN;
uniform vec4 uCam;      // cos(yaw), sin(yaw), cos(pitch), sin(pitch)
uniform vec2 uO;        // projection origin (css px)
uniform vec2 uView;     // viewport (css px)
uniform vec2 uCenter;   // domain center
uniform float uF, uS, uH, uZoom, uNear, uFar;
out vec2 vPos;
out float vZ;
out vec3 vN;
out float vK;
void main() {
  float u = (aPos.x - uCenter.x) * uS * uZoom;
  float v = (aPos.y - uCenter.y) * uS * uZoom;
  float hgt = aZ * uH * uS * uZoom;
  float x1 = u * uCam.x - v * uCam.y;
  float y1 = u * uCam.y + v * uCam.x;
  float sy = -y1 * uCam.w - hgt * uCam.z;
  float d = y1 * uCam.z - hgt * uCam.w;
  float w = (uF + d) / uF;            // screen = origin + offset / w  (== JS: k = F / (F + d))
  float zn = 2.0 * (d + uNear) / (uFar + uNear) - 1.0;
  gl_Position = vec4(2.0 * (uO.x * w + x1) / uView.x - w,
                     w - 2.0 * (uO.y * w + sy) / uView.y,
                     zn * w, w);
  vPos = aPos; vZ = aZ; vN = aN; vK = 1.0 / w;
}`;

const FS = `#version 300 es
precision highp float;
in vec2 vPos;
in float vZ;
in vec3 vN;
in float vK;
uniform vec3 uBg, uAccent;
uniform float uDark, uDpr;
uniform vec2 uView;
uniform vec2 uCell, uGridO;
uniform vec3 uMouse;    // css px x, y, 2*sigma^2
out vec4 outColor;

void main() {
  vec2 p = vec2(gl_FragCoord.x / uDpr, uView.y - gl_FragCoord.y / uDpr); // css px, top-left origin
  vec3 L = normalize(vec3(-0.55, -0.45, 0.7));
  vec3 n = normalize(vN);
  float lam = max(0.0, dot(n, L));
  float depth = clamp(-vZ / 1.3, 0.0, 1.0);
  float t = uDark > 0.5 ? 0.02 + 0.2 * lam * lam + 0.12 * depth
                        : 0.03 + 0.2 * (1.0 - lam) + 0.13 * depth;
  t = min(0.6, t);
  vec3 fill = mix(uBg, uAccent, t);

  // Grid lines, 1 css px wide, faded out where cells get too small to resolve (no moire).
  vec2 g = (vPos - uGridO) / uCell;
  vec2 fw = max(fwidth(g), vec2(1e-5));
  vec2 dpx = abs(fract(g - 0.5) - 0.5) / fw;
  float line = clamp(0.5 * uDpr + 0.5 - min(dpx.x, dpx.y), 0.0, 1.0);
  line *= 1.0 - smoothstep(0.18, 0.45, max(fw.x, fw.y));

  float fade = clamp((vK - 0.5) / 0.5, 0.2, 1.0);
  vec2 md = p - uMouse.xy;
  float glow = exp(-dot(md, md) / uMouse.z);
  float la = min(1.0, (0.11 + 0.58 * depth) * fade * (uDark > 0.5 ? 1.0 : 0.9) + 0.6 * glow);
  vec3 col = mix(fill, uAccent, line * la);

  // Distance fog toward the page background.
  float fog = clamp((0.8 - vK) / 0.55, 0.0, 0.55);
  outColor = vec4(mix(col, uBg, fog), 1.0);
}`;

const compile = (gl, type, src) => {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(log);
  }
  return s;
};

/** Returns a renderer, or null when WebGL2 is unavailable (the caller falls back to Canvas 2D). */
export const createGLRenderer = (canvas) => {
  let gl;
  try {
    gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true, depth: true, powerPreference: 'low-power' });
  } catch (e) {
    return null;
  }
  if (!gl) return null;

  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) {
    console.warn('[LossLandscape] WebGL shader setup failed, using 2D fallback:', e.message);
    return null;
  }

  let lost = false;
  const onLost = (e) => { e.preventDefault(); lost = true; };
  canvas.addEventListener('webglcontextlost', onLost);

  const U = {};
  for (const name of ['uCam', 'uO', 'uView', 'uCenter', 'uF', 'uS', 'uH', 'uZoom', 'uNear', 'uFar', 'uBg', 'uAccent', 'uDark', 'uDpr', 'uCell', 'uGridO', 'uMouse']) {
    U[name] = gl.getUniformLocation(prog, name);
  }
  const aPos = gl.getAttribLocation(prog, 'aPos');
  const aZ = gl.getAttribLocation(prog, 'aZ');
  const aN = gl.getAttribLocation(prog, 'aN');

  const vao = gl.createVertexArray();
  const bPos = gl.createBuffer(), bZ = gl.createBuffer(), bN = gl.createBuffer(), bIdx = gl.createBuffer();
  let indexCount = 0;

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, bPos);
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bZ);
  gl.enableVertexAttribArray(aZ);
  gl.vertexAttribPointer(aZ, 1, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bN);
  gl.enableVertexAttribArray(aN);
  gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
  gl.bindVertexArray(null);

  return {
    get lost() { return lost; },

    /** Static grid topology + xy positions; (nx+1)*(ny+1) vertices. */
    setGrid(nx, ny, x0, y0, dx, dy) {
      const cols = nx + 1;
      const pos = new Float32Array(cols * (ny + 1) * 2);
      for (let j = 0; j <= ny; j++) {
        for (let i = 0; i <= nx; i++) {
          const n = (j * cols + i) * 2;
          pos[n] = x0 + i * dx; pos[n + 1] = y0 + j * dy;
        }
      }
      const idx = new Uint32Array(nx * ny * 6);
      let k = 0;
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = j * cols + i, b = a + 1, d = a + cols, c = d + 1;
          idx[k++] = a; idx[k++] = b; idx[k++] = c;
          idx[k++] = a; idx[k++] = c; idx[k++] = d;
        }
      }
      indexCount = k;
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, bPos);
      gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
    },

    /** Heights (one per vertex) and unit normals (three per vertex). */
    setHeights(z, normals) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bZ);
      gl.bufferData(gl.ARRAY_BUFFER, z, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, bN);
      gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
    },

    resize(wDev, hDev) {
      gl.viewport(0, 0, wDev, hDev);
    },

    render(p) {
      if (lost) return false;
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LESS);
      gl.useProgram(prog);
      gl.uniform4f(U.uCam, p.cam.cy, p.cam.sy, p.cam.cp, p.cam.sp);
      gl.uniform2f(U.uO, p.cam.ox, p.cam.oy);
      gl.uniform2f(U.uView, p.W, p.H);
      gl.uniform2f(U.uCenter, p.center[0], p.center[1]);
      gl.uniform1f(U.uF, p.cam.F);
      gl.uniform1f(U.uS, p.S);
      gl.uniform1f(U.uH, p.height);
      gl.uniform1f(U.uZoom, p.cam.z);
      gl.uniform1f(U.uNear, p.near);
      gl.uniform1f(U.uFar, p.far);
      gl.uniform3f(U.uBg, p.bg[0] / 255, p.bg[1] / 255, p.bg[2] / 255);
      gl.uniform3f(U.uAccent, p.accent[0] / 255, p.accent[1] / 255, p.accent[2] / 255);
      gl.uniform1f(U.uDark, p.dark ? 1 : 0);
      gl.uniform1f(U.uDpr, p.dpr);
      gl.uniform2f(U.uCell, p.cell[0], p.cell[1]);
      gl.uniform2f(U.uGridO, p.gridO[0], p.gridO[1]);
      gl.uniform3f(U.uMouse, p.mouse[0], p.mouse[1], 2 * 120 * 120);
      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
      gl.bindVertexArray(null);
      return true;
    },

    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteBuffer(bPos); gl.deleteBuffer(bZ); gl.deleteBuffer(bN); gl.deleteBuffer(bIdx);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    },
  };
};
