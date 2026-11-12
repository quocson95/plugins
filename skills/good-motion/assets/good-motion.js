/**
 * Good Motion: reference implementations of the six public Good Motion components.
 * Source collection: https://goodmotion.vercel.app (accessed 2026-11-12).
 *
 * Zero dependencies besides GSAP 3.12+. Pass `gsap` in the options object, or load
 * GSAP globally. Every mount returns a controller with `destroy()`.
 *
 * These are re-builds that reproduce the published behaviour, API surface and
 * default numbers. They are not the vendor's source, which is login-gated.
 */

const REDUCED = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia(REDUCED).matches;
}

function requireGsap(options) {
  const gsap = options.gsap || (typeof window !== 'undefined' ? window.gsap : undefined);
  if (!gsap) throw new Error('good-motion: pass `gsap` in options or load GSAP globally');
  return gsap;
}

function node(tag, css = {}, attrs = {}) {
  const el = document.createElement(tag);
  Object.assign(el.style, css);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function colorAlpha(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/* ------------------------------------------------------------------ *
 * 1. Circle Reveal Loader: Loading Screen
 *    Three concentric ripple layers cover the viewport, hold, then
 *    collapse back to the centre to reveal the page.
 * ------------------------------------------------------------------ */

export function mountCircleRevealLoader(options = {}) {
  const gsap = requireGsap(options);
  const {
    color1 = '#F5C225',
    color2 = '#F05C15',
    color3 = '#CE2518',
    duration = 0.85,
    staggerOverlap = 0.58,
    ease = 'power3.inOut',
    hold = 300, // ms covered before the collapse; null waits for controller.reveal()
    zIndex = 9999,
    className = '',
    style,
    children,
    onComplete,
  } = options;

  const reduce = prefersReducedMotion();
  const root = node('div', {
    position: 'fixed',
    inset: '0',
    zIndex: String(zIndex),
    pointerEvents: 'none',
    overflow: 'hidden',
  }, { 'data-gm': 'circle-reveal-loader', 'aria-hidden': 'true' });
  if (className) root.className = className;
  if (style) Object.assign(root.style, style);

  const radius = Math.hypot(window.innerWidth, window.innerHeight) * 0.55;
  const layers = [color1, color2, color3].map((background) => {
    const layer = node('div', {
      position: 'absolute',
      inset: '0',
      background,
      clipPath: reduce ? `circle(${radius}px at 50% 50%)` : 'circle(0px at 50% 50%)',
      willChange: 'clip-path',
    });
    root.append(layer);
    return layer;
  });

  if (children) {
    const holder = node('div', { position: 'absolute', inset: '0', display: 'grid', placeItems: 'center' });
    holder.append(children);
    root.append(holder);
  }

  document.body.append(root);

  const cover = gsap.timeline({ paused: true });
  if (!reduce) {
    layers.forEach((layer, i) => {
      cover.fromTo(
        layer,
        { clipPath: 'circle(0px at 50% 50%)' },
        { clipPath: `circle(${radius}px at 50% 50%)`, duration, ease },
        i * staggerOverlap,
      );
    });
  }
  cover.play();

  let collapseTl = null;
  let holdTimer = 0;
  let finished = false;

  const release = () => {
    if (collapseTl || finished) return;
    window.clearTimeout(holdTimer);
    collapseTl = gsap.timeline({
      onComplete: () => {
        finished = true;
        root.remove();
        onComplete?.();
      },
    });
    if (reduce) {
      collapseTl.to(root, { autoAlpha: 0, duration: 0.2, ease: 'none' });
      return;
    }
    // outermost first, quicker than the entry, half the stagger
    [...layers].reverse().forEach((layer, i) => {
      collapseTl.to(layer, {
        clipPath: 'circle(0px at 50% 50%)',
        duration: duration * 0.8,
        ease,
      }, i * staggerOverlap * 0.5);
    });
    collapseTl.set(root, { autoAlpha: 0 });
  };

  if (hold !== null) holdTimer = window.setTimeout(release, Math.max(0, hold));

  return {
    element: root,
    timeline: cover,
    reveal: release,
    destroy() {
      window.clearTimeout(holdTimer);
      cover.kill();
      collapseTl?.kill();
      root.remove();
    },
  };
}

/* ------------------------------------------------------------------ *
 * 2. Googly Eye Cursor: Cursor
 *    A pill with two eyes; pupils track the pointer, blink on a timer,
 *    wink on click, glance with scroll, and an accent pill appears over
 *    interactive elements.
 * ------------------------------------------------------------------ */

export function mountGooglyEyeCursor(options = {}) {
  const gsap = requireGsap(options);
  const {
    accentColor = '#E53935',
    hideDefaultCursor = true,
    zIndex = 2147483647,
    className = '',
    style,
    size = 60,
  } = options;

  if (window.matchMedia('(hover: none)').matches) {
    return { element: null, destroy() {} };
  }

  const eyeSize = size * 0.36;
  const pupilSize = size * 0.13;
  const maxOffset = (eyeSize - pupilSize) / 2 - 1;

  const root = node('div', {
    position: 'fixed',
    left: '0',
    top: '0',
    width: `${size}px`,
    height: `${size}px`,
    zIndex: String(zIndex),
    pointerEvents: 'none',
    willChange: 'transform',
    transform: 'translate3d(-100px, -100px, 0)',
  }, { 'data-gm': 'googly-eye-cursor', 'aria-hidden': 'true' });
  if (className) root.className = className;
  if (style) Object.assign(root.style, style);

  const pill = node('div', {
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${size * 0.08}px`,
    background: '#FFFFFF',
    border: '1.5px solid rgba(0,0,0,0.85)',
    borderRadius: '50%',
    boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
    overflow: 'hidden',
  });
  root.append(pill);

  const eyes = [0, 1].map(() => {
    const eye = node('div', {
      width: `${eyeSize}px`,
      height: `${eyeSize}px`,
      borderRadius: '50%',
      background: '#FFFFFF',
      border: '1.5px solid rgba(0,0,0,0.85)',
      position: 'relative',
      overflow: 'hidden',
      willChange: 'transform',
    });
    const pupil = node('span', {
      position: 'absolute',
      width: `${pupilSize}px`,
      height: `${pupilSize}px`,
      borderRadius: '50%',
      background: '#000000',
      left: `${(eyeSize - pupilSize) / 2}px`,
      top: `${(eyeSize - pupilSize) / 2}px`,
      willChange: 'transform',
    });
    eye.append(pupil);
    pill.append(eye);
    return { eye, pupil };
  });

  const hint = node('div', {
    position: 'absolute',
    left: '50%',
    top: `${size + 8}px`,
    transform: 'translate(-50%, -4px) scale(0.85)',
    padding: '4px 10px',
    borderRadius: '999px',
    background: accentColor,
    color: '#fff',
    font: '600 11px/1 ui-sans-serif, system-ui, sans-serif',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    opacity: '0',
    pointerEvents: 'none',
  });
  hint.textContent = 'click';
  root.append(hint);

  document.body.append(root);

  if (hideDefaultCursor) {
    document.documentElement.style.setProperty('cursor', 'none');
    document.documentElement.classList.add('gm-cursor-hidden');
    if (!document.getElementById('gm-cursor-style')) {
      const styleEl = node('style', {}, { id: 'gm-cursor-style' });
      styleEl.textContent = '.gm-cursor-hidden, .gm-cursor-hidden * { cursor: none !important; }';
      document.head.append(styleEl);
    }
  }

  const xTo = gsap.quickTo(root, 'x', { duration: 0.32, ease: 'power3' });
  const yTo = gsap.quickTo(root, 'y', { duration: 0.32, ease: 'power3' });
  const pupilTo = eyes.map(({ pupil }) => ({
    x: gsap.quickTo(pupil, 'x', { duration: 0.18, ease: 'power2' }),
    y: gsap.quickTo(pupil, 'y', { duration: 0.18, ease: 'power2' }),
  }));

  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let centres = [];
  let blinkTimer = 0;
  let scrollBias = 0;
  let cleanScroll = () => {};

  const measure = () => {
    centres = eyes.map(({ eye }) => {
      const r = eye.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
  };

  const glance = () => {
    centres.forEach((c, i) => {
      const dx = pointer.x - c.x;
      const dy = pointer.y - c.y + scrollBias;
      const len = Math.hypot(dx, dy) || 1;
      const pull = Math.min(1, len / 120);
      pupilTo[i].x((dx / len) * maxOffset * pull);
      pupilTo[i].y((dy / len) * maxOffset * pull);
    });
  };

  const onMove = (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    xTo(pointer.x - size / 2);
    yTo(pointer.y - size / 2);
    glance();
  };

  const blink = () => {
    const target = eyes[Math.random() > 0.5 ? 0 : 1].eye;
    gsap.fromTo(target, { scaleY: 1 }, {
      scaleY: 0.08,
      duration: 0.07,
      yoyo: true,
      repeat: 1,
      ease: 'power1.inOut',
      onComplete: scheduleBlink,
    });
  };

  const scheduleBlink = () => {
    blinkTimer = window.setTimeout(blink, 2400 + Math.random() * 2600);
  };

  const wink = (event) => {
    if (event.target.closest('a, button, [role="button"], input, select, textarea')) {
      gsap.fromTo(hint, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'back.out(2)' });
      window.setTimeout(() => gsap.to(hint, { opacity: 0, scale: 0.9, duration: 0.15 }), 260);
    }
    gsap.fromTo(eyes[0].eye, { scaleY: 1 }, { scaleY: 0.08, duration: 0.08, yoyo: true, repeat: 1 });
  };

  const onOver = (event) => {
    if (event.target.closest('a, button, [role="button"]')) {
      gsap.to(pill, { scale: 1.12, duration: 0.2, ease: 'back.out(2)' });
    }
  };
  const onOut = (event) => {
    if (event.target.closest('a, button, [role="button"]')) {
      gsap.to(pill, { scale: 1, duration: 0.2, ease: 'power2.out' });
    }
  };

  const onScroll = () => {
    const delta = window.scrollY - (onScroll.last || window.scrollY);
    onScroll.last = window.scrollY;
    scrollBias = gsap.utils.clamp(-maxOffset, maxOffset, scrollBias + delta * 0.35);
    glance();
    gsap.to({ v: scrollBias }, {
      v: 0,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate() {
        scrollBias = this.targets()[0].v;
        glance();
      },
    });
  };

  gsap.set(root, { x: pointer.x - size / 2, y: pointer.y - size / 2 });
  measure();
  glance();
  scheduleBlink();

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', wink, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('pointerover', onOver);
  document.addEventListener('pointerout', onOut);

  return {
    element: root,
    destroy() {
      window.clearTimeout(blinkTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', wink);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      cleanScroll();
      gsap.killTweensOf([root, pill, hint, ...eyes.map((e) => e.eye), ...eyes.map((e) => e.pupil)]);
      root.remove();
      if (hideDefaultCursor) {
        document.documentElement.style.removeProperty('cursor');
        document.documentElement.classList.remove('gm-cursor-hidden');
      }
    },
  };
}

/* ------------------------------------------------------------------ *
 * 3. Elastic Trail Cursor: Cursor
 *    A lead dot with a six-step chromatic tail. Each trailing dot is
 *    pulled toward the one in front, clamped to maxSpacing, so fast
 *    movement stretches the chain and stopping tucks it back in.
 * ------------------------------------------------------------------ */

export function mountElasticTrailCursor(options = {}) {
  const gsap = requireGsap(options);
  const {
    dotSize = 22,
    maxSpacing = 4.5,
    leadResponsiveness = 0.65,
    trailDrag = 0.55,
    leadColor = '#0F172A',
    trailColors = ['#FF9800', '#FF7043', '#F4511E', '#E53935', '#8E24AA', '#00BCD4'],
    hideNativeCursor = true,
    zIndex = 999999,
  } = options;

  if (window.matchMedia('(hover: none)').matches) {
    return { element: null, destroy() {} };
  }

  const root = node('div', {
    position: 'fixed',
    inset: '0',
    zIndex: String(zIndex),
    pointerEvents: 'none',
    overflow: 'hidden',
  }, { 'data-gm': 'elastic-trail-cursor', 'aria-hidden': 'true' });

  const colors = [leadColor, ...trailColors];
  const dots = colors.map((background, i) => {
    const dot = node('div', {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${dotSize}px`,
      height: `${dotSize}px`,
      marginLeft: `${-dotSize / 2}px`,
      marginTop: `${-dotSize / 2}px`,
      borderRadius: '50%',
      background,
      zIndex: String(colors.length - i), // the lead dot paints last
      willChange: 'transform, opacity',
      opacity: i === 0 ? '1' : '0',
    });
    root.append(dot);
    return dot;
  });
  document.body.append(root);

  if (hideNativeCursor) {
    document.documentElement.classList.add('gm-cursor-hidden');
    if (!document.getElementById('gm-cursor-style')) {
      const styleEl = node('style', {}, { id: 'gm-cursor-style' });
      styleEl.textContent = '.gm-cursor-hidden, .gm-cursor-hidden * { cursor: none !important; }';
      document.head.append(styleEl);
    }
  }

  const maxGap = dotSize * 0.9 + maxSpacing;
  const points = dots.map(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const previous = { ...pointer };
  let speed = 0;
  let idleFor = 0;
  let running = false;

  const alphaFor = (i) => (i === 0 ? 1 : gsap.utils.clamp(0.25, 0.9, 1 - i / (dots.length + 2)));

  const render = () => {
    dots.forEach((dot, i) => {
      dot.style.transform = `translate3d(${points[i].x}px, ${points[i].y}px, 0)`;
      if (i > 0) dot.style.opacity = String(alphaFor(i) * gsap.utils.clamp(0, 1, speed / 3));
    });
  };

  const update = (_time, deltaTime) => {
    const dt = Math.min(3, deltaTime / 16.666);
    // lead follows the pointer with the published responsiveness
    const leadK = 1 - Math.pow(1 - leadResponsiveness, dt);
    points[0].x += (pointer.x - points[0].x) * leadK;
    points[0].y += (pointer.y - points[0].y) * leadK;

    for (let i = 1; i < points.length; i++) {
      const k = 1 - Math.pow(1 - trailDrag, dt);
      const prev = points[i - 1];
      let nx = points[i].x + (prev.x - points[i].x) * k;
      let ny = points[i].y + (prev.y - points[i].y) * k;
      // cap the gap so the chain reads as a trail: dots sit edge to edge at rest,
      // and maxSpacing widens the cap for a longer tail
      const dx = nx - prev.x;
      const dy = ny - prev.y;
      const dist = Math.hypot(dx, dy);
      if (dist > maxGap) {
        nx = prev.x + (dx / dist) * maxGap;
        ny = prev.y + (dy / dist) * maxGap;
      }
      points[i].x = nx;
      points[i].y = ny;
    }

    speed = speed * 0.9 + Math.hypot(pointer.x - previous.x, pointer.y - previous.y) * 0.1;
    previous.x = pointer.x;
    previous.y = pointer.y;

    idleFor = speed < 0.15 ? idleFor + dt : 0;
    render();

    if (idleFor > 90) {
      running = false;
      gsap.ticker.remove(update);
    }
  };

  const onMove = (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (!running) {
      running = true;
      gsap.ticker.add(update);
    }
    idleFor = 0;
  };

  render();
  gsap.ticker.add(update);
  running = true;
  window.addEventListener('pointermove', onMove, { passive: true });

  return {
    element: root,
    destroy() {
      gsap.ticker.remove(update);
      window.removeEventListener('pointermove', onMove);
      root.remove();
      if (hideNativeCursor) document.documentElement.classList.remove('gm-cursor-hidden');
    },
  };
}

/* ------------------------------------------------------------------ *
 * 4. Y2K Dreamy Text Glow: Typography
 *    Grapheme-level tokenizer, a slow auto-sweeping band of bloom, and
 *    a cursor-proximity bloom. No SplitText, no layout thrash.
 * ------------------------------------------------------------------ */

export function mountY2KDreamyTextGlow(container, options = {}) {
  const gsap = requireGsap(options);
  const {
    text = 'code component...',
    color = '#FFFFFF',
    fontSize = 58,
    fontWeight = 700,
    letterSpacing = -6,
    lineHeight = 0.85,
    rimLightRadius = 5.5,
    maxStrokeWidth = 6,
    scaleBoost = 1.21,
    hoverProximity = 150,
    autoSweepDuration = 10,
    edgeBlur = 1,
  } = options;

  const reduce = prefersReducedMotion();
  const host = typeof container === 'string' ? document.querySelector(container) : container;
  if (!host) throw new Error('good-motion: mount target not found');

  const previous = {
    html: host.innerHTML,
    css: ['fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'color', 'margin', 'display']
      .map((prop) => [prop, host.style[prop]]),
  };

  host.style.fontSize = typeof fontSize === 'number' ? `${fontSize}px` : fontSize;
  host.style.fontWeight = String(fontWeight);
  host.style.letterSpacing = typeof letterSpacing === 'number' ? `${letterSpacing}px` : letterSpacing;
  host.style.lineHeight = String(lineHeight);
  host.style.color = color;
  host.style.margin = '0';
  host.style.display = 'block';

  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  host.textContent = '';

  const chars = [];
  const lines = String(text).split('\n');
  lines.forEach((line, lineIndex) => {
    const row = node('span', { display: 'block', whiteSpace: 'pre' });
    for (const { segment } of segmenter.segment(line)) {
      const span = node('span', {
        display: 'inline-block',
        willChange: 'transform, text-shadow, -webkit-text-stroke-width',
        textShadow: `0 0 ${rimLightRadius}px ${colorAlpha(color, 0.55)}, 0 0 ${rimLightRadius * 2.2}px ${colorAlpha(color, 0.22)}`,
        WebkitTextStrokeWidth: '0px',
        WebkitTextStrokeColor: 'transparent',
        transformOrigin: '50% 50%',
      });
      span.textContent = segment === ' ' ? '\u00a0' : segment;
      row.append(span);
      chars.push({ el: span, x: 0, y: 0 });
    }
    if (lineIndex < lines.length - 1) row.append(node('br'));
    host.append(row);
  });

  const bounds = { x: 0, y: 0 };
  let cursor = null;

  const measure = () => {
    const hostRect = host.getBoundingClientRect();
    bounds.x = hostRect.left;
    bounds.y = hostRect.top;
    chars.forEach((c) => {
      const r = c.el.getBoundingClientRect();
      c.x = r.left + r.width / 2;
      c.y = r.top + r.height / 2;
    });
  };

  const apply = (sweepPhase) => {
    for (const c of chars) {
      let proximity = 0;
      if (cursor) {
        const d = Math.hypot(cursor.x - c.x, cursor.y - c.y);
        proximity = Math.max(0, 1 - d / hoverProximity);
      }
      // the sweep is a travelling window in normalised x, so it crosses the line once per period
      const unit = (c.x - bounds.x) / Math.max(1, host.offsetWidth);
      const sweep = Math.max(0, Math.sin((unit * Math.PI * 2) - sweepPhase * Math.PI * 2));
      const intensity = Math.max(proximity, sweep * sweep * 0.9);
      const stroke = maxStrokeWidth * intensity;
      c.el.style.webkitTextStrokeWidth = `${stroke.toFixed(2)}px`;
      c.el.style.webkitTextStrokeColor = stroke > 0.05 ? colorAlpha(color, 0.5 + intensity * 0.5) : 'transparent';
      c.el.style.transform = `scale(${(1 + (scaleBoost - 1) * intensity).toFixed(3)})`;
      c.el.style.filter = `blur(${(edgeBlur * intensity * 0.35).toFixed(2)}px)`;
      c.el.style.textShadow = intensity > 0.02
        ? `0 0 ${(rimLightRadius + intensity * maxStrokeWidth).toFixed(1)}px ${colorAlpha(color, 0.75)}, 0 0 ${(rimLightRadius * 2.2 + intensity * 10).toFixed(1)}px ${colorAlpha(color, 0.28)}`
        : `0 0 ${rimLightRadius}px ${colorAlpha(color, 0.35)}`;
    }
  };

  measure();
  apply(0);

  const restore = () => {
    gsap.ticker.remove(tick);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('pointerleave', onLeave);
    for (const [prop, value] of previous.css) host.style[prop] = value;
    host.innerHTML = previous.html;
  };

  if (reduce) {
    return { element: host, destroy: restore };
  }

  const onMove = (event) => {
    cursor = { x: event.clientX, y: event.clientY };
  };
  const onLeave = () => { cursor = null; };
  const onResize = () => measure();

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('pointerleave', onLeave);

  let elapsed = 0;
  const tick = (_time, deltaTime) => {
    elapsed += deltaTime / 1000;
    apply((elapsed % autoSweepDuration) / autoSweepDuration);
  };
  gsap.ticker.add(tick);

  return { element: host, destroy: restore };
}

/* ------------------------------------------------------------------ *
 * 5. X-RAY Text: Typography
 *    White text on mix-blend-mode: difference. Inverts whatever passes
 *    underneath. Portal mode escapes a parent stacking context.
 * ------------------------------------------------------------------ */

export function mountXRayText(text, options = {}) {
  const {
    as = 'h1',
    mode = 'inline', // inline | sticky | fixed
    fontSize = 'inherit',
    fontWeight = 900,
    letterSpacing = 'normal',
    lineHeight = 1,
    textTransform = 'uppercase',
    textAlign = 'left',
    top,
    left,
    right,
    bottom,
    usePortal = false,
    pointerEvents = 'none',
    zIndex = 9999,
    className = '',
    style,
  } = options;

  const el = document.createElement(as);
  el.textContent = text ?? 'GOODMOTION';
  el.className = className;
  Object.assign(el.style, {
    color: '#FFFFFF',
    mixBlendMode: 'difference',
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    fontWeight: String(fontWeight),
    letterSpacing,
    lineHeight: String(lineHeight),
    textTransform,
    textAlign,
    margin: '0',
    pointerEvents,
    zIndex: String(zIndex),
    position: mode === 'inline' ? 'relative' : mode,
    ...(mode === 'sticky' ? { position: 'sticky' } : {}),
    ...(mode === 'fixed' ? { position: 'fixed' } : {}),
  });
  if (top !== undefined) el.style.top = typeof top === 'number' ? `${top}px` : top;
  if (left !== undefined) el.style.left = typeof left === 'number' ? `${left}px` : left;
  if (right !== undefined) el.style.right = typeof right === 'number' ? `${right}px` : right;
  if (bottom !== undefined) el.style.bottom = typeof bottom === 'number' ? `${bottom}px` : bottom;
  if (style) Object.assign(el.style, style);

  let host = null;
  if (usePortal) {
    host = document.createElement('div');
    host.setAttribute('data-gm', 'x-ray-text');
    Object.assign(host.style, {
      display: 'contents', // the portal wrapper must not create a stacking context
    });
    host.append(el);
    document.body.append(host);
  }

  // diagnostic: a transformed/isolated ancestor silences difference blending
  let warning = null;
  if (!usePortal) {
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      const cs = getComputedStyle(parent);
      if (cs.isolation === 'isolate' || cs.transform !== 'none' || cs.filter !== 'none' || parseFloat(cs.opacity) < 1) {
        warning = parent;
        break;
      }
      parent = parent.parentElement;
    }
    if (warning && typeof console !== 'undefined') {
      console.warn('[good-motion] x-ray-text: blending is isolated by an ancestor', warning);
    }
  }

  return {
    element: el,
    isolatedBy: warning,
    destroy() {
      if (host) host.remove();
      else el.remove();
    },
  };
}

/* ------------------------------------------------------------------ *
 * 6. Text Distortion: Typography / WebGL
 *    The text is rasterised to a texture once, then a fragment shader
 *    warps it with pointer velocity and splits the RGB channels.
 * ------------------------------------------------------------------ */

const DISTORTION_VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const DISTORTION_FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform float uTime;
uniform float uForce;
uniform float uShift;
uniform float uRadius;
uniform float uAspect;
varying vec2 vUv;

void main() {
  vec2 d = vUv - uMouse;
  d.x *= uAspect;
  float dist = length(d);
  float infl = 1.0 - smoothstep(0.0, max(uRadius, 0.0001), dist);
  vec2 dir = dist > 0.0001 ? normalize(d) : vec2(0.0);
  float wave = sin(vUv.y * 16.0 + uTime * 2.2) * 0.5 + 0.5;
  vec2 warp = dir * infl * uForce * 0.008 * wave + uVel * 0.00022 * infl;
  float s = uShift * infl + 0.0015 + 0.004 * wave;
  vec4 cr = texture2D(uTex, vUv + warp + dir * s);
  vec4 cg = texture2D(uTex, vUv + warp);
  vec4 cb = texture2D(uTex, vUv + warp - dir * s);
  float a = max(max(cr.a, cg.a), cb.a);
  if (a < 0.01) discard;
  gl_FragColor = vec4(cr.r, cg.g, cb.b, a);
}`;

function createProgram(gl, vertSrc, fragSrc) {
  const compile = (type, src) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'shader compile failed');
    }
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'program link failed');
  }
  return program;
}

export function mountTextDistortion(container, options = {}) {
  const gsap = requireGsap(options);
  const {
    text = 'GOODMOTION',
    textColor = '#000000',
    fontFamily = 'Impact, sans-serif',
    fontWeight = 900,
    displacementForce = 2.0,
    rgbShiftStrength = 0.06,
    mouseRadius = 140,
    decaySpeed = 0.06,
    width = null,
    height = null,
  } = options;

  const host = typeof container === 'string' ? document.querySelector(container) : container;
  if (!host) throw new Error('good-motion: mount target not found');
  // remember what we touch so destroy() leaves the page as it was
  const restore = ['width', 'height', 'position'].map((prop) => [prop, host.style[prop]]);
  // the vendor component sizes itself 100%/100%; a mount target must already have a size
  if (width !== null) host.style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== null) host.style.height = typeof height === 'number' ? `${height}px` : height;
  host.style.position = host.style.position || 'relative';

  const fallback = node('div', {
    position: 'absolute',
    inset: '0',
    display: 'grid',
    placeItems: 'center',
    color: textColor,
    fontFamily,
    fontWeight: String(fontWeight),
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  });
  fallback.textContent = text;

  const canvas = node('canvas', {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
  });

  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true, antialias: true });
  if (!gl) {
    host.append(fallback);
    return { element: fallback, destroy() { fallback.remove(); } };
  }
  host.append(canvas);

  const reduce = prefersReducedMotion();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const program = createProgram(gl, DISTORTION_VERT, DISTORTION_FRAG);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {};
  ['uTex', 'uMouse', 'uVel', 'uTime', 'uForce', 'uShift', 'uRadius', 'uAspect'].forEach((name) => {
    uniforms[name] = gl.getUniformLocation(program, name);
  });

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const size = { w: 0, h: 0 };
  const raster = () => {
    const rect = host.getBoundingClientRect();
    size.w = Math.max(1, Math.round(rect.width * dpr));
    size.h = Math.max(1, Math.round(rect.height * dpr));
    canvas.width = size.w;
    canvas.height = size.h;
    gl.viewport(0, 0, size.w, size.h);

    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    const ctx = off.getContext('2d');
    let px = size.h * 0.42;
    ctx.font = `${fontWeight} ${px}px ${fontFamily}`;
    // shrink until it fits with a little side margin
    while (ctx.measureText(text).width > size.w * 0.92 && px > 8) {
      px -= 2;
      ctx.font = `${fontWeight} ${px}px ${fontFamily}`;
    }
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size.w / 2, size.h / 2);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    // canvas rows are top-down, GL texture rows are bottom-up
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
  };

  raster();

  const state = {
    // off-screen until the first pointer move, so the resting text is undistorted
    mouse: { x: -5, y: -5 },
    target: { x: -5, y: -5 },
    vel: { x: 0, y: 0 },
  };
  let elapsed = 0;
  let destroyed = false;

  const onMove = (event) => {
    const rect = host.getBoundingClientRect();
    // GL reads textures from the bottom-left, the DOM from the top-left
    state.target.x = (event.clientX - rect.left) / rect.width;
    state.target.y = 1 - (event.clientY - rect.top) / rect.height;
  };
  const onResize = () => raster();

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('resize', onResize);

  const draw = (_time, deltaTime) => {
    if (destroyed) return;
    const dt = Math.max(0.5, deltaTime / 16.666);
    elapsed += deltaTime / 1000;

    const prevX = state.mouse.x;
    const prevY = state.mouse.y;
    state.mouse.x += (state.target.x - state.mouse.x) * Math.min(1, 0.18 * dt);
    state.mouse.y += (state.target.y - state.mouse.y) * Math.min(1, 0.18 * dt);
    state.vel.x += ((state.mouse.x - prevX) * 1200 - state.vel.x) * decaySpeed * dt;
    state.vel.y += ((state.mouse.y - prevY) * 1200 - state.vel.y) * decaySpeed * dt;

    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uniforms.uTex, 0);
    gl.uniform2f(uniforms.uMouse, state.mouse.x, state.mouse.y);
    gl.uniform2f(uniforms.uVel, state.vel.x, state.vel.y);
    gl.uniform1f(uniforms.uTime, reduce ? 0 : elapsed);
    gl.uniform1f(uniforms.uForce, reduce ? 0 : displacementForce);
    gl.uniform1f(uniforms.uShift, reduce ? 0 : rgbShiftStrength * 0.02);
    gl.uniform1f(uniforms.uRadius, mouseRadius / Math.max(1, size.h));
    gl.uniform1f(uniforms.uAspect, size.w / Math.max(1, size.h));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  gsap.ticker.add(draw);

  return {
    element: canvas,
    // exposed for previews and tests: read `debug.state.mouse` to see the shader input
    debug: { state, size, gl },
    destroy() {
      destroyed = true;
      gsap.ticker.remove(draw);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
      for (const [prop, value] of restore) host.style[prop] = value;
    },
  };
}

export const GOOD_MOTION = {
  'circle-reveal-loader': mountCircleRevealLoader,
  'googly-eye-cursor': mountGooglyEyeCursor,
  'elastic-trail-cursor': mountElasticTrailCursor,
  'y2k-dreamy-text-glow': mountY2KDreamyTextGlow,
  'x-ray-text': mountXRayText,
  'text-distortion': mountTextDistortion,
};
