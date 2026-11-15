/* AI Aces — page logic and scroll-driven story
   Needs GSAP + ScrollTrigger (and optionally Lenis). Without them, or when the
   visitor prefers reduced motion (or adds ?static to the URL), the page stays
   as a plain readable document. */
(() => {
  'use strict';
  window.__aa = true;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const FX = window.FX || {};
  const CFG = Object.assign({ email: 'hello@example.com', linkedin: '#', instagram: '#', x: '#' }, window.AIACES || {});
  const SPADE = 'M50 5C50 5 95 45 95 70c0 18-15 26-27 26-8 0-14-4-16-10 1 14 6 24 14 29H34c8-5 13-15 14-29-2 6-8 10-16 10C20 96 5 88 5 70 5 45 50 5 50 5Z';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]static\b/.test(location.search);
  const animated = !!(window.gsap && window.ScrollTrigger) && !reduce;

  buildWheel();
  buildPoker();
  wireContact();
  $('#yr').textContent = new Date().getFullYear();

  // tap to flip service cards on touch screens
  if (!matchMedia('(hover:hover)').matches) {
    $$('.svc').forEach(c => c.addEventListener('click', () => c.classList.toggle('flip')));
  }

  if (!animated) {
    root.classList.remove('js');
    FX.net && FX.net($('#net'), { still: true });
    return;
  }

  /* ================= animated mode ================= */
  root.classList.add('anim', 'noscroll');
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { duration: 1.8 }) : target.scrollIntoView({ behavior: 'smooth' });
  }));

  FX.net($('#net'));
  FX.cursor();
  FX.magnetic($('.magnetic'));

  const vw = () => innerWidth, vh = () => innerHeight;

  /* ---------- HUD ---------- */
  const hudN = $('#hud-n'), hudName = $('#hud-name'), hudPct = $('#hud-pct'), hudBar = $('.hud-bar i');
  let sceneNow = '';
  function setScene(n, name) {
    if (name === sceneNow) return;
    sceneNow = name; hudN.textContent = n;
    FX.scramble(hudName, 500, name);
  }
  gsap.ticker.add(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    hudBar.style.transform = `scaleX(${p})`;
    hudPct.textContent = String(Math.round(p * 100)).padStart(2, '0') + '%';
  });

  /* ---------- stage: ace → swipe → roulette → poker ---------- */
  const stage = $('#stage'), card = $('.ace-card'), inner = $('.ace-inner'), tilt = $('.ace-tilt');
  const heroChars = split($('#h-ace'), true);
  const rl1 = split($('.rl-h1')), rl2 = split($('.rl-h2')), pkWords = split($('#h-pk'));
  const pcs = $$('.pcard');

  // offsetLeft/Top ignore transforms, so this is the card's resting place inside the pinned stage
  function offsetIn(el, anc) { let x = 0, y = 0; while (el && el !== anc) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x, y }; }
  const toCentre = () => { const o = offsetIn(card, stage); return { x: stage.clientWidth / 2 - (o.x + card.offsetWidth / 2), y: stage.clientHeight / 2 - (o.y + card.offsetHeight / 2) }; };
  const cover = () => Math.max(vw() / card.offsetWidth, vh() / card.offsetHeight) * 1.4;
  const fan = i => {
    const cw = pcs[0].offsetWidth, sp = Math.min(cw * 1.12, vw() * .175);
    return { x: (i - 2) * sp, y: Math.abs(i - 2) ** 2 * 7, r: (i - 2) * 5 };
  };

  // starting states (the CSS describes the finished picture)
  gsap.set('.scene-roulette', { clipPath: 'circle(0% at 50% 50%)', visibility: 'hidden' });
  gsap.set('.scene-poker', { autoAlpha: 0 });
  gsap.set('.hand-part', { transformOrigin: '50% 100%' });
  gsap.set('.wheel-tilt', { rotationX: 58, scale: .8 });
  // wheel and ball angles are written straight to the SVG so the pivot can never drift
  const spin = { wheel: 0, ball: 0 }, wRot = $('.w-rot'), orbit = $('.orbit');
  const renderSpin = () => {
    wRot.setAttribute('transform', `rotate(${spin.wheel.toFixed(2)} 250 250)`);
    orbit.setAttribute('transform', `rotate(${spin.ball.toFixed(2)} 250 250)`);
  };
  gsap.set('.ball', { attr: { cy: 22 } });
  gsap.set('.pred-path', { strokeDashoffset: 1 });
  gsap.set('.pred-x', { autoAlpha: 0 });
  gsap.set('.lock', { autoAlpha: 0 });
  gsap.set(rl1, { yPercent: 120 });
  gsap.set(rl2, { yPercent: 120 });
  gsap.set('.scene-roulette .eyebrow, .readout', { autoAlpha: 0, y: 24 });
  gsap.set(pkWords, { yPercent: 120 });
  gsap.set('.scene-poker .eyebrow, .pk-sub', { autoAlpha: 0 });
  gsap.set(pcs, { x: 0, y: () => -vh(), rotation: i => 140 + i * 50, scale: .5 });
  gsap.set('.pcard-inner', { rotationY: 180 });
  gsap.set('.stamp', { autoAlpha: 0, scale: 3.2, rotation: -16 });
  gsap.set('.shock', { scale: 0, autoAlpha: 0 });

  const ro = { p: 0 };
  const roEl = {}; $$('[data-ro]').forEach(e => roEl[e.dataset.ro] = e);
  const roBar = $('.ro-bar i');
  function renderRo() {
    const p = ro.p, conf = 2.7 + 97 * p * p;
    roEl.vel.textContent = (12.4 * (1 - p)).toFixed(1) + ' m/s';
    roEl.pk.textContent = Math.round(37 - 36 * p);
    roEl.pred.textContent = p > .45 ? 'ACE' : String(Math.floor(Math.random() * 37)).padStart(2, '0');
    roEl.conf.textContent = conf.toFixed(1) + '%';
    roEl.status.textContent = p >= 1 ? 'LOCKED' : p > .45 ? 'TARGET ACQUIRED' : 'CALCULATING…';
    roBar.style.transform = `scaleX(${conf / 100})`;
  }
  renderRo();

  const SCENES = [[0, '01', 'THE ACE'], [1.1, '02', 'THE SWIPE'], [3.3, '03', 'THE WHEEL'], [9, '04', 'THE SHOWDOWN']];
  let tiltOn = true;

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: stage, start: 'top top', end: () => '+=' + vh() * 8.5,
      pin: true, scrub: .8, invalidateOnRefresh: true,
      onUpdate(self) {
        const t = self.progress * tl.duration();
        tiltOn = t < 1;
        let s = SCENES[0]; for (const c of SCENES) if (t >= c[0]) s = c;
        if (ScrollTrigger.isInViewport(stage)) setScene(s[1], s[2]);
      }
    }
  });

  // 1 → 2: the flick
  tl.to('.hero-copy', { yPercent: -18, autoAlpha: 0, duration: .8, ease: 'power2.in' }, .25)
    .to('.thumb', { rotation: -26, svgOrigin: '153 460', duration: .3, ease: 'power2.out' }, .95)
    .set(card, { zIndex: 6 }, 1.15)
    .to(card, { x: () => toCentre().x, y: () => toCentre().y, rotation: -360, scale: 1.25, duration: 1.1, ease: 'power2.inOut' }, 1.15)
    .to(inner, { rotationY: 180, duration: 1.1, ease: 'power2.inOut' }, 1.15)
    .to('.hand-part', { y: () => vh() * .95, rotation: 9, duration: 1, ease: 'power2.in' }, 1.3)
    .to(card, { scale: cover, duration: .9, ease: 'power3.in' }, 2.25);

  $$('.ghost').forEach((g, i) => {
    const d = 1.15 + .07 * (i + 1);
    tl.to(g, { autoAlpha: .55 - .14 * i, duration: .12 }, d)
      .to(g, { x: () => toCentre().x, y: () => toCentre().y, rotation: -360, scale: 1.25, duration: 1.1, ease: 'power2.inOut' }, d)
      .to(g, { autoAlpha: 0, duration: .3 }, d + .8);
  });

  // 3: roulette irises out of the card back
  tl.set('.scene-roulette', { visibility: 'visible' }, 3)
    .to('.scene-roulette', { clipPath: 'circle(75% at 50% 50%)', duration: .9, ease: 'power2.inOut' }, 3.05)
    .set('.scene-ace', { visibility: 'hidden' }, 3.95)
    .to('.wheel-tilt', { rotationX: 36, scale: 1, duration: 1.6, ease: 'power2.out' }, 3.1)
    .to('.scene-roulette .eyebrow, .readout', { autoAlpha: 1, y: 0, duration: .5, stagger: .15, ease: 'power2.out' }, 3.5)
    .to(rl1, { yPercent: 0, duration: .6, stagger: .04, ease: 'power3.out' }, 3.5)
    .to(spin, { wheel: 600, duration: 5, onUpdate: renderSpin }, 3.6)
    .to(spin, { ball: -1020, duration: 3.5, ease: 'power2.out' }, 3.6)
    .to(ro, { p: 1, duration: 3.5, ease: 'power1.in', onUpdate: renderRo }, 3.6)
    .to('.pred-path', { strokeDashoffset: 0, duration: 1, ease: 'power1.inOut' }, 4.3)
    .to('.pred-x', { autoAlpha: 1, duration: .25 }, 5.2)
    .to('.ball', { attr: { cy: 100 }, duration: 1.2, ease: 'bounce.out' }, 5.9)
    .to(rl1, { yPercent: -120, duration: .4, stagger: .03, ease: 'power3.in' }, 6.7)
    .to(rl2, { yPercent: 0, duration: .6, stagger: .04, ease: 'power3.out' }, 7.05)
    .to('.pred-path, .pred-x', { autoAlpha: 0, duration: .3 }, 7.1)
    .to('.lock', { autoAlpha: 1, duration: .15 }, 7.1)
    .to(spin, { ball: -840, duration: 1.5 }, 7.1);

  // 3 → 4: dive through the wheel onto the felt
  tl.to('.scene-roulette .eyebrow, .rl-heads, .readout', { autoAlpha: 0, y: -30, duration: .5, ease: 'power2.in' }, 8.6)
    .to('.wheel-tilt', { scale: 7, rotationX: 0, duration: 1, ease: 'power3.in' }, 8.6)
    .to('.scene-poker', { autoAlpha: 1, duration: .6 }, 9)
    .to('.scene-poker .eyebrow', { autoAlpha: 1, duration: .4 }, 9.5)
    .to(pkWords, { yPercent: 0, duration: .6, stagger: .04, ease: 'power3.out' }, 9.5);

  pcs.forEach((c, i) => {
    tl.to(c, { x: () => fan(i).x, y: () => fan(i).y, rotation: () => fan(i).r, scale: 1, duration: .8, ease: 'power3.out' }, 9.7 + i * .3);
  });
  [0, 1, 3, 4, 2].forEach((idx, k) => {
    const t = 11.4 + k * .35 + (k === 4 ? .35 : 0);
    tl.to(pcs[idx].querySelector('.pcard-inner'), { rotationY: 0, duration: .5, ease: 'power2.inOut' }, t)
      .to(pcs[idx], { y: () => fan(idx).y - 30, duration: .25, ease: 'power2.out', yoyo: true, repeat: 1 }, t);
  });
  tl.to('.stamp', { autoAlpha: 1, scale: 1, rotation: -5, duration: .35, ease: 'power4.in' }, 13.8)
    .call(() => FX.burst($('#burst')), null, 14.15)
    .to('.shock', { scale: 9, duration: .8, ease: 'power2.out' }, 14.15)
    .fromTo('.shock', { autoAlpha: 1 }, { autoAlpha: 0, duration: .8, ease: 'power1.in', immediateRender: false }, 14.15)
    .to('.pk-sub', { autoAlpha: 1, duration: .5 }, 14.4)
    .to({}, { duration: 1.2 });

  // pointer tilt on the hero card
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const rx = gsap.quickTo(tilt, 'rotationX', { duration: .6, ease: 'power3' });
    const ry = gsap.quickTo(tilt, 'rotationY', { duration: .6, ease: 'power3' });
    addEventListener('pointermove', e => {
      if (!tiltOn) { rx(0); ry(0); return; }
      rx((e.clientY / vh() - .5) * -16); ry((e.clientX / vw() - .5) * 22);
    }, { passive: true });
  }
  gsap.to('.hand-float', { y: -10, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  /* ---------- sections after the stage, set up in page order ---------- */
  function reveals(sec) {
    $$('[data-scramble]', sec).forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => FX.scramble(el) }));
    $$('[data-split]', sec).forEach(el => {
      const chars = el.dataset.split === 'chars';
      gsap.from(split(el, chars), { yPercent: 120, duration: chars ? 1 : .9, ease: 'power4.out', stagger: chars ? .035 : .05, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('[data-reveal]', sec).forEach(el => gsap.from(el, { y: 40, autoAlpha: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  }
  function sceneTag(sec, n) {
    ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: s => s.isActive && setScene(n, sec.dataset.scene) });
  }

  const services = $('.services');
  reveals(services);
  gsap.from('.svc', { y: 140, rotation: i => (i - 1.5) * 9, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: '.svc-grid', start: 'top 82%' } });
  sceneTag(services, '05');

  const process = $('.process'), track = $('.track'), pline = $('.pline'), chip = $('.pchip');
  reveals(process);
  const dist = () => Math.max(0, track.scrollWidth - vw());
  gsap.set('.pline i', { scaleX: 0 });
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: process, start: 'top top', end: () => '+=' + (dist() + vh() * .4), pin: true, scrub: .6, invalidateOnRefresh: true }
  })
    .to(track, { x: () => -dist() }, 0)
    .to(chip, { x: () => pline.offsetWidth - chip.offsetWidth, rotation: 720 }, 0)
    .to('.pline i', { scaleX: 1 }, 0);
  sceneTag(process, '06');

  const contact = $('.contact');
  reveals(contact);
  sceneTag(contact, '07');

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  /* ---------- preloader, then the hero entrance ---------- */
  const count = { v: 0 }, plNum = $('.pl-num');
  const fanOut = { rotation: i => (i - 2) * 14, x: i => (i - 2) * 36, y: i => Math.abs(i - 2) * 9, duration: .45, ease: 'power3.out' };
  const squareUp = { rotation: 0, x: 0, y: 0, duration: .3, ease: 'power3.in' };

  gsap.set('.hud', { autoAlpha: 0 });
  gsap.set('.hand-rig', { yPercent: 70, rotation: 10, autoAlpha: 0, transformOrigin: '50% 100%' });
  gsap.set(heroChars, { yPercent: 120 });
  gsap.set('.hero-copy .eyebrow, .hero-copy .lede, .hero-copy .actions', { y: 24, autoAlpha: 0 });

  gsap.timeline()
    .to(count, { v: 100, duration: 1.9, ease: 'power2.inOut', onUpdate: () => plNum.textContent = String(Math.round(count.v)).padStart(3, '0') }, 0)
    .from('.pl-card', { y: 90, autoAlpha: 0, stagger: .06, duration: .45, ease: 'back.out(1.6)' }, 0)
    .to('.pl-card', fanOut, .6).to('.pl-card', squareUp, 1.1)
    .to('.pl-card', fanOut, 1.4)
    .to('.pl-card', { y: () => -vh(), rotation: i => (i - 2) * 50, stagger: .05, duration: .55, ease: 'power3.in' }, 2)
    .to('.pl-meta', { autoAlpha: 0, duration: .3 }, 2)
    .to('.preloader', { clipPath: 'inset(0 0 100% 0)', duration: .7, ease: 'power4.inOut' }, 2.35)
    .set('.preloader', { display: 'none' })
    .add(() => { root.classList.remove('noscroll'); lenis && lenis.start(); }, 2.6)
    .to('.hand-rig', { yPercent: 0, rotation: 0, autoAlpha: 1, duration: 1.4, ease: 'power4.out' }, 2.5)
    .to(heroChars, { yPercent: 0, duration: .9, stagger: .018, ease: 'power4.out' }, 2.65)
    .to('.hero-copy .eyebrow, .hero-copy .lede, .hero-copy .actions', { y: 0, autoAlpha: 1, duration: .8, stagger: .1, ease: 'power3.out' }, 3.1)
    .to('.hud', { autoAlpha: 1, duration: .6 }, 3.2);

  /* ================= builders ================= */

  // Wrap words (or letters) in spans so they can slide up from behind a mask.
  function split(el, byChar) {
    if (!el) return [];
    const out = [];
    el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    (function walk(node) {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 1) return walk(n);
        if (n.nodeType !== 3) return;
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(tok => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) return frag.appendChild(document.createTextNode(' '));
          const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
          if (byChar) {
            [...tok].forEach(ch => { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; w.appendChild(c); out.push(c); });
          } else {
            const i = document.createElement('span'); i.className = 'wi'; i.textContent = tok; w.appendChild(i); out.push(i);
          }
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      });
    })(el);
    return out;
  }

  function buildWheel() {
    const g = $('.w-pockets'); if (!g) return;
    const nums = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    const step = 360 / nums.length, f = v => v.toFixed(2);
    const pt = (r, a) => { const t = (a - 90) * Math.PI / 180; return [250 + r * Math.cos(t), 250 + r * Math.sin(t)]; };
    const wedge = (r1, r2, a1, a2) => {
      const [x1, y1] = pt(r2, a1), [x2, y2] = pt(r2, a2), [x3, y3] = pt(r1, a2), [x4, y4] = pt(r1, a1);
      return `M${f(x1)} ${f(y1)}A${r2} ${r2} 0 0 1 ${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}A${r1} ${r1} 0 0 0 ${f(x4)} ${f(y4)}Z`;
    };
    let h = '';
    nums.forEach((num, i) => {
      const a = i * step, a1 = a - step / 2, a2 = a + step / 2;
      const col = i === 0 ? '#d9b45a' : i % 2 ? '#b3263a' : '#151a21';
      const [sx1, sy1] = pt(135, a1), [sx2, sy2] = pt(215, a1);
      h += `<path d="${wedge(165, 215, a1, a2)}" fill="${col}"/>`
        + `<path d="${wedge(135, 165, a1, a2)}" fill="${col}" opacity=".6"/>`
        + `<path d="M${f(sx1)} ${f(sy1)}L${f(sx2)} ${f(sy2)}" stroke="#d9b45a" stroke-width=".8" opacity=".8"/>`
        + `<text transform="rotate(${f(a)} 250 250)" x="250" y="64" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="${i === 0 ? 14 : 11}" fill="${i === 0 ? '#0d1014' : '#f4efe4'}">${i === 0 ? 'A' : num}</text>`;
    });
    g.innerHTML = h;

    // the "predicted" spiral the ball will follow into the ace pocket
    let d = '';
    for (let k = 0; k <= 60; k++) {
      const q = k / 60, [x, y] = pt(228 - 78 * q * q, -720 - 300 * q);
      d += (k ? 'L' : 'M') + f(x) + ' ' + f(y);
    }
    $('.pred-path').setAttribute('d', d);
  }

  function buildPoker() {
    const hand = $('.hand5'); if (!hand) return;
    const use = s => `<svg viewBox="0 0 100 120"><use href="#s-${s}"/></svg>`;
    const back = `<div class="face back"><div class="back-art">${use('spade')}</div></div>`;
    const ace = s => `<div class="pcard"><div class="pcard-inner"><div class="face front${s === 'heart' || s === 'diamond' ? ' red' : ''}">`
      + `<div class="idx"><b>A</b>${use(s)}</div><svg class="pip" viewBox="0 0 100 120"><use href="#s-${s}"/></svg><div class="idx br"><b>A</b>${use(s)}</div></div>${back}</div></div>`;
    const wild = `<div class="pcard"><div class="pcard-inner"><div class="face front wild"><div class="idx"><b>AI</b></div>`
      + `<div class="wild-core"><svg viewBox="-4 0 108 122"><path d="${SPADE}"/></svg><span>WILD</span></div><div class="idx br"><b>AI</b></div></div>${back}</div></div>`;
    hand.innerHTML = ace('spade') + ace('heart') + wild + ace('diamond') + ace('club');
  }

  function wireContact() {
    $$('[data-email]').forEach(a => { a.href = 'mailto:' + CFG.email; a.textContent = CFG.email; });
    $$('[data-link]').forEach(a => { const u = CFG[a.dataset.link]; if (u && u !== '#') { a.href = u; a.target = '_blank'; a.rel = 'noopener'; } });
    const form = $('.form'); if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(form), company = d.get('company');
      const subject = 'AI Aces enquiry' + (company ? ' — ' + company : '');
      const body = `${d.get('message')}\n\n${d.get('name')}${company ? '\n' + company : ''}`;
      location.href = `mailto:${CFG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
