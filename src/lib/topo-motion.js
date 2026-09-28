/* ============================================================
   DN Creative Studio — topo-motion.js
   Living topographic background: seeded 3D noise field,
   marching-squares contours, self-drawing lines, cursor warp,
   scan sweep with cross marks. New pattern on every load.

   Live:   <canvas data-topo-motion></canvas>  (auto-init)
           options via data attributes, e.g. data-topo-intensity="0.6"
           data-topo-scanlines="0" data-topo-levels="12"
   Still:  TopoMotion.renderStill({ width, height, format: 'png' })
           → Promise<{ blob, url, seed }>
   ============================================================ */

(function () {
  'use strict';

  const DEFAULTS = {
    cell: 10,             // sample grid in CSS px (lower = smoother, heavier)
    levels: 14,           // contour count
    range: 0.66,          // contour levels span [-range, range]
    scale: 1 / 460,       // noise frequency (lower = bigger landforms)
    speed: 0.00003,       // field evolution per ms
    drift: 0.15,          // lateral flow as the field evolves
    intensity: 1,         // global line opacity multiplier
    mouseRadius: 180,     // px
    mouseStrength: 0.28,  // 0–1, how far contours bulge around the cursor
    crossSpacing: 60,     // matches .bg-grid
    crosses: true,
    scanlines: 0.05,      // opacity of 1px/4px scanlines, 0 = off
    sweepDuration: 7000,  // ms for the scan line to cross the hero
    sweepPause: 3000,
    seed: null,           // null = random each load
    // Still / offscreen rendering
    static: false,        // true = single fully-drawn frame, no loop
    width: null,          // fixed CSS px size (skips layout measuring)
    height: null,
    dpr: null,            // override pixel ratio
    background: null,     // fill colour for stills, e.g. '#0A0A0A'
    theme: 'dark',        // 'light' = Pitch Black lines for Warm White grounds
  };

  /* ---------- helpers ---------- */

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomSeed() {
    if (window.crypto && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint32Array(1))[0];
    }
    return (Math.random() * 4294967296) >>> 0;
  }

  // cubic-bezier(0.16, 1, 0.3, 1) — brand easing
  function cubicBezier(p1x, p1y, p2x, p2y) {
    const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
    const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
    const sx = t => ((ax * t + bx) * t + cx) * t;
    const sy = t => ((ay * t + by) * t + cy) * t;
    const dx = t => (3 * ax * t + 2 * bx) * t + cx;
    return x => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x, d = dx(t);
        if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      return sy(Math.min(1, Math.max(0, t)));
    };
  }
  const ease = cubicBezier(0.16, 1, 0.3, 1);
  const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/./g, c => c + c) : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const rgba = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`;

  /* ---------- seeded 3D simplex noise (Gustavson) ---------- */

  function makeNoise3(rand) {
    const g = [1,1,0, -1,1,0, 1,-1,0, -1,-1,0, 1,0,1, -1,0,1, 1,0,-1, -1,0,-1, 0,1,1, 0,-1,1, 0,1,-1, 0,-1,-1];
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    const perm = new Uint8Array(512), pm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm[i] = (perm[i] % 12) * 3; }
    const F3 = 1 / 3, G3 = 1 / 6;

    return function (x, y, z) {
      const s = (x + y + z) * F3;
      const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
      const t = (i + j + k) * G3;
      const x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);
      let i1, j1, k1, i2, j2, k2;
      if (x0 >= y0) {
        if (y0 >= z0)      { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
        else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
        else               { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
      } else {
        if (y0 < z0)       { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
        else if (x0 < z0)  { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
        else               { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      }
      const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
      const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
      const x3 = x0 - 1 + 0.5, y3 = y0 - 1 + 0.5, z3 = z0 - 1 + 0.5;
      const ii = i & 255, jj = j & 255, kk = k & 255;
      let n = 0, tt, gi;

      tt = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (tt > 0) { gi = pm[ii + perm[jj + perm[kk]]]; tt *= tt; n += tt * tt * (g[gi] * x0 + g[gi + 1] * y0 + g[gi + 2] * z0); }
      tt = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (tt > 0) { gi = pm[ii + i1 + perm[jj + j1 + perm[kk + k1]]]; tt *= tt; n += tt * tt * (g[gi] * x1 + g[gi + 1] * y1 + g[gi + 2] * z1); }
      tt = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (tt > 0) { gi = pm[ii + i2 + perm[jj + j2 + perm[kk + k2]]]; tt *= tt; n += tt * tt * (g[gi] * x2 + g[gi + 1] * y2 + g[gi + 2] * z2); }
      tt = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (tt > 0) { gi = pm[ii + 1 + perm[jj + 1 + perm[kk + 1]]]; tt *= tt; n += tt * tt * (g[gi] * x3 + g[gi + 1] * y3 + g[gi + 2] * z3); }

      return 32 * n;
    };
  }

  /* ============================================================
     CREATE
     ============================================================ */

  function create(canvas, options) {
    const opts = Object.assign({}, DEFAULTS, options || {});
    const host = opts.host || canvas.parentElement;
    const ctx = canvas.getContext('2d');
    const reduced = opts.static || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const C = {
      orange:  hexToRgb(cssVar('--blaze-orange', '#FF5E1A')),
      light:   hexToRgb(cssVar('--orange-light', '#FF8050')),
      dark:    hexToRgb(cssVar('--orange-dark',  '#CC4C16')),
      white:   hexToRgb(cssVar('--warm-white',   '#F5F3EE')),
    };
    // Light grounds: black topo, per brand texture rules
    const themeAlpha = opts.theme === 'light' ? 0.55 : 1;
    if (opts.theme === 'light') {
      const black = hexToRgb(cssVar('--pitch-black', '#0A0A0A'));
      C.orange = C.light = C.dark = C.white = black;
    }

    let W = 0, H = 0, dpr = 1;
    let cols = 0, rows = 0, field, px, py, la, lb, stamp, vis, buf;
    let touched = [], gen = 0;
    let noise, rand, zOff, xOff, yOff;
    let time = 0, last = 0, raf = 0, running = false, visible = true;
    let levels = [], nextCycle = 0;
    let crosses = null, crossCols = 0, crossRows = 0;
    let sweepStart = 0, sweepPrevY = -1;

    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, s: 0, ts: 0 };

    /* ---------- seeding + level state ---------- */

    function seed(value) {
      const s = value == null ? randomSeed() : value;
      rand = mulberry32(s);
      noise = makeNoise3(rand);
      zOff = rand() * 1000;
      xOff = rand() * 1000;
      yOff = rand() * 1000;
      time = 0;
      initLevels(performance.now());
      return s;
    }

    function initLevels(now) {
      levels = [];
      for (let k = 0; k < opts.levels; k++) {
        const kind = k % 4 === 0 ? 'major' : k % 4 === 2 ? 'dotted' : 'minor';
        // Loads with most of the map present; the rest draws itself in.
        const drawIn = !reduced && (kind === 'major' || rand() < 0.35);
        levels.push({
          kind,
          s: 0,
          e: drawIn ? 0 : 1,
          mode: drawIn ? 'draw' : 'idle',
          t0: now + 200 + rand() * 1600,
          dur: 2200 + rand() * 1200,
        });
      }
      nextCycle = now + 4200;
    }

    function styleFor(kind) {
      const I = opts.intensity * themeAlpha;
      if (kind === 'major')  return { stroke: rgba(C.light, 0.40 * I),  width: 1.35, dash: null };
      if (kind === 'dotted') return { stroke: rgba(C.orange, 0.42 * I), width: 1.3,  dash: [0.1, 5] };
      return                        { stroke: rgba(C.orange, 0.26 * I), width: 1,    dash: null };
    }

    /* ---------- sizing ---------- */

    function resize() {
      if (opts.width && opts.height) {
        W = opts.width; H = opts.height;
      } else {
        const r = canvas.getBoundingClientRect();
        W = Math.max(1, r.width);
        H = Math.max(1, r.height);
      }
      dpr = opts.dpr || Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(W / opts.cell) + 2;
      rows = Math.ceil(H / opts.cell) + 2;
      const nEdges = cols * rows * 2;
      field = new Float32Array(cols * rows);
      px = new Float32Array(nEdges);
      py = new Float32Array(nEdges);
      la = new Int32Array(nEdges);
      lb = new Int32Array(nEdges);
      stamp = new Int32Array(nEdges);
      vis = new Int32Array(nEdges);
      buf = new Float32Array(nEdges * 2 + 4);
      gen = 0;

      crossCols = Math.floor(W / opts.crossSpacing) + 1;
      crossRows = Math.floor(H / opts.crossSpacing) + 1;
      crosses = new Float32Array(crossCols * crossRows);

      if (!running) { if (reduced) seedStillCrosses(); renderStatic(); }
    }

    /* ---------- field ---------- */

    function sampleField() {
      const z = zOff + time;
      const drift = time * opts.drift;
      const sc = opts.scale, cell = opts.cell;
      const mR2 = 1 / (opts.mouseRadius * opts.mouseRadius);
      const mS = opts.mouseStrength * mouse.s;
      const mx = mouse.x, my = mouse.y;

      let idx = 0;
      for (let j = 0; j < rows; j++) {
        const y0 = j * cell;
        for (let i = 0; i < cols; i++) {
          let x = i * cell, y = y0;
          if (mS > 0.001) {
            // Sample closer to the cursor → landforms swell outward around it
            const dx = x - mx, dy = y - my;
            const w = mS * Math.exp(-(dx * dx + dy * dy) * mR2);
            x -= dx * w;
            y -= dy * w;
          }
          const nx = x * sc + xOff + drift, ny = y * sc + yOff;
          field[idx++] =
            noise(nx, ny, z) * 0.74 +
            noise(nx * 2.1 + 5.2, ny * 2.1 + 1.3, z * 1.6) * 0.22 +
            noise(nx * 4.3 + 9.7, ny * 4.3 + 3.1, z * 2.2) * 0.04;
        }
      }
    }

    /* ---------- marching squares → chained polylines ---------- */

    function link(e, o) {
      if (stamp[e] !== gen) { stamp[e] = gen; la[e] = o; lb[e] = -1; touched.push(e); }
      else lb[e] = o;
    }

    function contour(v) {
      gen++;
      touched.length = 0;
      const cell = opts.cell, off = cols * rows;

      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = field[j * cols + i];
          const b = field[j * cols + i + 1];
          const c = field[(j + 1) * cols + i + 1];
          const d = field[(j + 1) * cols + i];
          const id = (a > v ? 8 : 0) | (b > v ? 4 : 0) | (c > v ? 2 : 0) | (d > v ? 1 : 0);
          if (id === 0 || id === 15) continue;

          const T = j * cols + i, B = (j + 1) * cols + i;
          const L = off + j * cols + i, R = off + j * cols + i + 1;
          // Edge crossing points. Non-crossing edges get junk values but
          // are never linked, and shared edges resolve identically.
          px[T] = (i + (v - a) / (b - a)) * cell; py[T] = j * cell;
          px[R] = (i + 1) * cell;                 py[R] = (j + (v - b) / (c - b)) * cell;
          px[B] = (i + (v - d) / (c - d)) * cell; py[B] = (j + 1) * cell;
          px[L] = i * cell;                       py[L] = (j + (v - a) / (d - a)) * cell;

          switch (id) {
            case 1: case 14: link(L, B); link(B, L); break;
            case 2: case 13: link(B, R); link(R, B); break;
            case 3: case 12: link(L, R); link(R, L); break;
            case 4: case 11: link(T, R); link(R, T); break;
            case 6: case 9:  link(T, B); link(B, T); break;
            case 7: case 8:  link(L, T); link(T, L); break;
            case 5:
              if ((a + b + c + d) * 0.25 > v) { link(T, L); link(L, T); link(B, R); link(R, B); }
              else                            { link(T, R); link(R, T); link(L, B); link(B, L); }
              break;
            case 10:
              if ((a + b + c + d) * 0.25 > v) { link(T, R); link(R, T); link(L, B); link(B, L); }
              else                            { link(T, L); link(L, T); link(B, R); link(R, B); }
              break;
          }
        }
      }
    }

    // Walk one chain into buf; returns point count
    function walk(s) {
      let n = 0, prev = -1, cur = s;
      for (;;) {
        buf[n * 2] = px[cur]; buf[n * 2 + 1] = py[cur]; n++;
        vis[cur] = gen;
        const nx = la[cur] !== prev ? la[cur] : lb[cur];
        if (nx < 0) break;
        if (vis[nx] === gen) {
          if (nx === s) { buf[n * 2] = px[s]; buf[n * 2 + 1] = py[s]; n++; }
          break;
        }
        prev = cur; cur = nx;
      }
      return n;
    }

    // Stroke buf[0..n) between fractions s..e, return head point if drawing
    function tracePartial(n, s, e, heads) {
      if (n < 2 || e <= s) return;
      const last = n - 1;
      const i0 = Math.floor(s * last);
      const endF = e * last;
      const i1 = Math.min(last, Math.floor(endF));
      const f = endF - i1;

      ctx.moveTo(buf[i0 * 2], buf[i0 * 2 + 1]);
      for (let k = i0 + 1; k < i1; k++) {
        const x = buf[k * 2], y = buf[k * 2 + 1];
        ctx.quadraticCurveTo(x, y, (x + buf[k * 2 + 2]) * 0.5, (y + buf[k * 2 + 3]) * 0.5);
      }
      let hx = buf[i1 * 2], hy = buf[i1 * 2 + 1];
      if (i1 < last && f > 0) {
        hx += (buf[i1 * 2 + 2] - hx) * f;
        hy += (buf[i1 * 2 + 3] - hy) * f;
      }
      ctx.lineTo(hx, hy);
      if (heads && e < 1 && n > 14) heads.push(hx, hy);
    }

    function drawLevel(k, v) {
      const L = levels[k];
      if (L.e <= L.s) return null;
      contour(v);

      const st = styleFor(L.kind);
      const heads = L.mode === 'draw' ? [] : null;
      ctx.beginPath();
      // Open chains first (start at an end), then closed loops
      for (let t = 0; t < touched.length; t++) {
        const e = touched[t];
        if (vis[e] !== gen && lb[e] < 0) tracePartial(walk(e), L.s, L.e, heads);
      }
      for (let t = 0; t < touched.length; t++) {
        const e = touched[t];
        if (vis[e] !== gen) tracePartial(walk(e), L.s, L.e, heads);
      }
      ctx.strokeStyle = st.stroke;
      ctx.lineWidth = st.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash(st.dash || []);
      ctx.stroke();
      return heads;
    }

    /* ---------- level choreography ---------- */

    function updateLevels(now) {
      let active = 0;
      for (const L of levels) {
        if (L.mode === 'idle') continue;
        const p = Math.min(1, Math.max(0, (now - L.t0) / L.dur));
        if (L.mode === 'draw') {
          L.s = 0; L.e = ease(p);
          if (p >= 1) { L.mode = 'idle'; L.e = 1; }
        } else if (L.mode === 'erase') {
          L.s = easeInOut(p); L.e = 1;
          if (p >= 1) {
            L.mode = 'draw'; L.s = 0; L.e = 0;
            L.t0 = now + 250; L.dur = 2400 + rand() * 1400;
          }
        }
        if (L.mode !== 'idle') active++;
      }

      // Keep redrawing itself: every few seconds a random contour
      // erases and re-inks. Never more than 2 at once.
      if (now >= nextCycle) {
        if (active < 2) {
          const idle = levels.filter(L => L.mode === 'idle');
          if (idle.length) {
            const L = idle[Math.floor(rand() * idle.length)];
            L.mode = 'erase'; L.t0 = now; L.dur = 1400 + rand() * 800;
          }
        }
        nextCycle = now + 1600 + rand() * 1800;
      }
    }

    /* ---------- scan sweep + cross marks ---------- */

    function updateScan(now, dt) {
      const period = opts.sweepDuration + opts.sweepPause;
      const t = (now - sweepStart) % period;
      const y = t < opts.sweepDuration ? (t / opts.sweepDuration) * (H + 40) - 20 : -1;

      // Decay
      const decay = dt / 2600;
      for (let i = 0; i < crosses.length; i++) {
        if (crosses[i] > 0) crosses[i] = Math.max(0, crosses[i] - decay);
      }

      // Sweep lights up crosses as it passes their row
      if (y >= 0 && sweepPrevY >= 0 && y > sweepPrevY) {
        const sp = opts.crossSpacing;
        for (let r = 0; r < crossRows; r++) {
          const ry = r * sp;
          if (ry > sweepPrevY && ry <= y) {
            for (let c = 0; c < crossCols; c++) {
              if (rand() < 0.16) crosses[r * crossCols + c] = 1;
            }
          }
        }
      }
      sweepPrevY = y;

      // Occasional stray twinkle
      if (rand() < dt * 0.0012) crosses[Math.floor(rand() * crosses.length)] = 1;

      return y;
    }

    let scanPattern = null, scanPatternAlpha = -1;
    function drawScanlines() {
      if (!opts.scanlines) return;
      const key = opts.scanlines + '@' + dpr;
      if (!scanPattern || scanPatternAlpha !== key) {
        // 1 CSS px line every 4 CSS px, built at device resolution
        const tile = document.createElement('canvas');
        tile.width = 1; tile.height = Math.max(2, Math.round(4 * dpr));
        const t = tile.getContext('2d');
        t.fillStyle = rgba(C.white, opts.scanlines);
        t.fillRect(0, 0, 1, Math.max(1, Math.round(dpr)));
        scanPattern = ctx.createPattern(tile, 'repeat');
        scanPatternAlpha = key;
      }
      // Pattern is in device px, so draw with an identity transform
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = scanPattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Stills: a frozen scatter of cross marks mid-fade
    function seedStillCrosses() {
      if (!crosses) return;
      for (let i = 0; i < crosses.length; i++) crosses[i] = rand() < 0.14 ? 0.3 + rand() * 0.7 : 0;
    }

    function drawScan(y) {
      if (!opts.crosses) y = -1;
      const sp = opts.crossSpacing, arm = 3.5;
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.lineCap = 'butt';
      for (let r = 0; opts.crosses && r < crossRows; r++) {
        for (let c = 0; c < crossCols; c++) {
          const life = crosses[r * crossCols + c];
          if (life <= 0) continue;
          const x = c * sp + 0.5, yy = r * sp + 0.5;
          ctx.strokeStyle = rgba(C.white, 0.38 * ease(life));
          ctx.beginPath();
          ctx.moveTo(x - arm, yy); ctx.lineTo(x + arm, yy);
          ctx.moveTo(x, yy - arm); ctx.lineTo(x, yy + arm);
          ctx.stroke();
        }
      }

      if (y >= 0) {
        const g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0,    rgba(C.orange, 0));
        g.addColorStop(0.15, rgba(C.orange, 0.08));
        g.addColorStop(0.5,  rgba(C.orange, 0.35));
        g.addColorStop(0.85, rgba(C.orange, 0.08));
        g.addColorStop(1,    rgba(C.orange, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, y, W, 1.5);
      }
    }

    /* ---------- frame ---------- */

    function render(now) {
      ctx.clearRect(0, 0, W, H);
      if (opts.background) { ctx.fillStyle = opts.background; ctx.fillRect(0, 0, W, H); }
      sampleField();

      const allHeads = [];
      const n = opts.levels;
      for (let k = 0; k < n; k++) {
        const v = -opts.range + (2 * opts.range * (k + 0.5)) / n;
        const heads = drawLevel(k, v);
        if (heads && heads.length) allHeads.push(heads);
      }

      // Pen tips on contours that are actively drawing
      ctx.fillStyle = rgba(C.light, 0.7 * opts.intensity);
      ctx.beginPath();
      for (const h of allHeads) {
        for (let i = 0; i < h.length; i += 2) {
          ctx.moveTo(h[i] + 1.6, h[i + 1]);
          ctx.arc(h[i], h[i + 1], 1.6, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    }

    function frame(now) {
      raf = 0;
      if (!running) return;
      const dt = Math.min(64, now - (last || now));
      last = now;

      time += dt * opts.speed;
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      mouse.s += (mouse.ts - mouse.s) * 0.06;

      updateLevels(now);
      render(now);
      drawScan(updateScan(now, dt));
      drawScanlines();
      schedule();
    }

    function renderStatic() {
      render(performance.now());
      drawScan(-1);
      drawScanlines();
    }

    function schedule() {
      if (running && visible && !document.hidden && !raf) raf = requestAnimationFrame(frame);
    }

    /* ---------- input ---------- */

    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - r.left;
      mouse.ty = e.clientY - r.top;
      if (mouse.ts === 0 && mouse.s < 0.01) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      mouse.ts = 1;
    }
    function onLeave() { mouse.ts = 0; }
    function onVis() { last = 0; schedule(); }

    /* ---------- boot ---------- */

    const ro = opts.width ? null : new ResizeObserver(resize);
    const io = reduced ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; last = 0; schedule(); });

    const usedSeed = seed(opts.seed);
    resize();
    if (ro) ro.observe(canvas);

    if (!reduced) {
      running = true;
      sweepStart = performance.now() + 1200;
      host.addEventListener('pointermove', onMove, { passive: true });
      host.addEventListener('pointerleave', onLeave);
      document.addEventListener('visibilitychange', onVis);
      io.observe(canvas);
      schedule();
    }

    return {
      seed: usedSeed,
      reseed(value) {
        const s = seed(value);
        if (!running) { seedStillCrosses(); renderStatic(); }
        return s;
      },
      set(partial) {
        const needsResize = 'cell' in partial || 'crossSpacing' in partial;
        const needsLevels = 'levels' in partial;
        Object.assign(opts, partial);
        if (needsLevels) initLevels(performance.now());
        if (needsResize) resize();
        else if (!running) renderStatic();
      },
      get options() { return Object.assign({}, opts); },
      destroy() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        if (io) io.disconnect();
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerleave', onLeave);
        document.removeEventListener('visibilitychange', onVis);
      },
    };
  }

  /* ============================================================
     STILL EXPORT — same generator, one fully-drawn frame
     ============================================================ */

  function renderStill(options) {
    const o = Object.assign({
      width: 1920,
      height: 1080,
      dpr: 1,
      format: 'png',          // 'png' | 'jpg'
      quality: 0.92,
      background: undefined,  // default: Pitch Black (dark) / Warm White (light); null = transparent PNG
    }, options || {}, { static: true });
    const ground = o.theme === 'light' ? '#F5F3EE' : '#0A0A0A';
    if (o.background === undefined || (o.format === 'jpg' && !o.background)) o.background = ground;

    const canvas = document.createElement('canvas');
    const inst = create(canvas, o);
    const type = o.format === 'jpg' ? 'image/jpeg' : 'image/png';

    return new Promise(resolve => {
      canvas.toBlob(blob => {
        resolve({ blob, url: URL.createObjectURL(blob), seed: inst.seed, canvas });
      }, type, o.quality);
    });
  }

  async function downloadStill(options) {
    const o = Object.assign({ format: 'png' }, options);
    const { url, seed } = await renderStill(o);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dn-topo-${seed}-${o.width || 1920}x${o.height || 1080}.${o.format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return seed;
  }

  // data-topo-intensity="0.6" → { intensity: 0.6 }
  function optionsFromData(el) {
    const out = {};
    for (const [k, v] of Object.entries(el.dataset)) {
      if (!k.startsWith('topo') || k === 'topoMotion') continue;
      const key = k.charAt(4).toLowerCase() + k.slice(5);
      out[key] = v === 'true' ? true : v === 'false' ? false : isNaN(+v) ? v : +v;
    }
    return out;
  }

  window.TopoMotion = { create, renderStill, downloadStill, defaults: DEFAULTS };

  // Auto-init every topo canvas on the page
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('canvas[data-topo-motion]').forEach(canvas => {
      const host = canvas.closest('section, header') || canvas.parentElement;
      canvas._topo = create(canvas, Object.assign({ host }, optionsFromData(canvas)));
    });
  });
})();
