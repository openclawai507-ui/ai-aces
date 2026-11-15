/* AI Aces — visual effects (no dependencies)
   FX.net      neural-network particle field that follows the pointer
   FX.burst    casino-chip explosion
   FX.scramble decode-style text reveal
   FX.cursor   trailing ring cursor (desktop only)
   FX.magnetic button that leans toward the pointer */
window.FX = (() => {
  'use strict';

  function net(cv, opts = {}) {
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const small = matchMedia('(max-width:760px)').matches;
    const N = small ? 24 : 60;
    const R = small ? 110 : 150;
    const mouse = { x: -9999, y: -9999 };
    let w = 0, h = 0, pts = [], raf = 0;

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      pts = Array.from({ length: N }, (_, i) => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .45, vy: (Math.random() - .5) * .45,
        gold: i % 6 === 0, ph: Math.random() * 6.28
      }));
    }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < R) {
            ctx.strokeStyle = `rgba(61,240,255,${(1 - d / R) * .22})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < 220) {
          ctx.strokeStyle = `rgba(217,180,90,${(1 - md / 220) * .5})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        const tw = .5 + .5 * Math.sin(t / 700 + a.ph);
        ctx.fillStyle = a.gold ? `rgba(217,180,90,${.5 + tw * .4})` : `rgba(61,240,255,${.3 + tw * .4})`;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.gold ? 2.2 : 1.6, 0, 6.283); ctx.fill();
      }
      if (!opts.still) raf = requestAnimationFrame(frame);
    }
    size(); seed(); frame(0);
    addEventListener('resize', () => { size(); if (opts.still) frame(0); });
    if (opts.still) return;
    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    });
  }

  const burst = (() => {
    const COLORS = ['#d9b45a', '#d6344a', '#3df0ff', '#f4efe4'];
    let cv, ctx, chips = [], running = false, w = 0, h = 0;
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function loop() {
      ctx.clearRect(0, 0, w, h);
      chips = chips.filter(c => c.y < h + 60);
      for (const c of chips) {
        c.vy += .5; c.x += c.vx; c.y += c.vy; c.spin += c.vs; c.tilt += .03;
        const squash = Math.max(.12, Math.abs(Math.cos(c.spin)));
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.tilt); ctx.scale(1, squash);
        ctx.fillStyle = c.col; ctx.beginPath(); ctx.arc(0, 0, c.r, 0, 6.283); ctx.fill();
        ctx.strokeStyle = '#0d1014'; ctx.lineWidth = c.r * .22; ctx.setLineDash([c.r * .5, c.r * .5]);
        ctx.beginPath(); ctx.arc(0, 0, c.r * .78, 0, 6.283); ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle = '#0d1014';
        ctx.beginPath(); ctx.arc(0, 0, c.r * .36, 0, 6.283); ctx.fill();
        ctx.restore();
      }
      if (chips.length) requestAnimationFrame(loop);
      else { running = false; ctx.clearRect(0, 0, w, h); }
    }
    return function (canvas) {
      if (!canvas) return;
      if (!cv) { cv = canvas; ctx = cv.getContext('2d'); addEventListener('resize', size); }
      size();
      if (chips.length > 160) return;
      const n = w < 760 ? 40 : 80;
      for (let i = 0; i < n; i++) {
        chips.push({
          x: w / 2 + (Math.random() - .5) * w * .5, y: h + 20 + Math.random() * 40,
          vx: (Math.random() - .5) * 14, vy: -(h * .018 + Math.random() * h * .017),
          r: 9 + Math.random() * 11, spin: Math.random() * 6, vs: .1 + Math.random() * .25,
          tilt: Math.random() * 6, col: COLORS[i % COLORS.length]
        });
      }
      if (!running) { running = true; requestAnimationFrame(loop); }
    };
  })();

  function scramble(el, dur = 900, text) {
    const final = text || el.dataset.text || (el.dataset.text = el.textContent.trim());
    const run = el._run = (el._run || 0) + 1;
    const glyphs = '01<>/[]{}=+*#%&ΔΣΩ';
    const t0 = performance.now();
    el.setAttribute('aria-label', final);
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur), n = Math.floor(p * final.length);
      let s = final.slice(0, n);
      for (let i = n; i < final.length; i++) s += final[i] === ' ' ? ' ' : glyphs[Math.random() * glyphs.length | 0];
      el.textContent = s;
      if (p < 1 && el._run === run) requestAnimationFrame(tick);
    })(t0);
  }

  function cursor() {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches || !window.gsap) return;
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(ring);
    gsap.set(ring, { x: -100, y: -100 });
    const qx = gsap.quickTo(ring, 'x', { duration: .35, ease: 'power3' });
    const qy = gsap.quickTo(ring, 'y', { duration: .35, ease: 'power3' });
    addEventListener('pointermove', e => { qx(e.clientX); qy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', e => {
      ring.classList.toggle('on', !!(e.target.closest && e.target.closest('a,button,.svc,input,textarea')));
    });
  }

  function magnetic(el) {
    if (!el || !window.gsap || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const qx = gsap.quickTo(el, 'x', { duration: .4, ease: 'power3' });
    const qy = gsap.quickTo(el, 'y', { duration: .4, ease: 'power3' });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      qx((e.clientX - r.left - r.width / 2) * .35); qy((e.clientY - r.top - r.height / 2) * .35);
    });
    el.addEventListener('pointerleave', () => { qx(0); qy(0); });
  }

  return { net, burst, scramble, cursor, magnetic };
})();
