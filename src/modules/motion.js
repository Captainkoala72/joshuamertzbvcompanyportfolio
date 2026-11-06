// GSAP animations: hero entrance, live line movement, scroll reveals, props getting
// marked as hits, and the parlay legs settling one by one.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { $, $$ } from '../lib/dom.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

function heroIn() {
  // Un-hide first so every .from() below records opacity 1 as its end value.
  gsap.set('[data-hero-in]', { opacity: 1 });
  const chars = SplitText.create('.hero__line', { type: 'chars' }).chars;
  gsap
    .timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero__kicker', { y: 16, opacity: 0, duration: 0.7 }, 0)
    .from(chars, { yPercent: 110, opacity: 0, duration: 1, stagger: 0.045 }, 0.08)
    .from('.hero__name', { y: 16, opacity: 0, duration: 0.7 }, 0.4)
    .from('.hero__lead', { y: 20, opacity: 0, duration: 0.8 }, 0.5)
    .from('.hero__ctas', { y: 20, opacity: 0, duration: 0.8 }, 0.6)
    .from('.fmarket', { y: 60, rotate: 2.5, opacity: 0, duration: 1.2 }, 0.2)
    .from('.fmarket__boosts li', { x: -14, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.85)
    .from('.ticker', { yPercent: 100, opacity: 0, duration: 0.8 }, 0.6);
}

// The featured line keeps moving our way, like a live market taking sharp money.
function lineMovement() {
  const me = $('[data-line="me"]');
  const field = $('[data-line="field"]');
  const implied = $('[data-implied]');
  if (!me || !field || !implied) return;
  const states = [
    [-1000, 700],
    [-1100, 750],
    [-1200, 800],
    [-1100, 750],
  ];
  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % states.length;
    const [mine, theirs] = states[i];
    me.textContent = String(mine);
    field.textContent = `+${theirs}`;
    implied.textContent = `${((-mine / (-mine + 100)) * 100).toFixed(1)}%`;
    [me, field].forEach((el) => {
      el.classList.remove('flash-up');
      void el.offsetWidth;
      el.classList.add('flash-up');
    });
  }, 4200);
}

function titles() {
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'words',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.words, {
          y: 44,
          opacity: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      },
    });
  });
}

function reveals() {
  const items = $$('[data-reveal]');
  gsap.set(items, { opacity: 0, y: 32 });
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.85, ease: 'expo.out', stagger: 0.06, overwrite: true, clearProps: 'transform,opacity' }),
  });
}

function props() {
  ScrollTrigger.batch('.prop', {
    start: 'top 86%',
    once: true,
    onEnter: (batch) =>
      gsap.from(
        batch.map((p) => $('.hit', p)),
        { scale: 1.9, rotate: -10, opacity: 0, duration: 0.5, ease: 'back.out(2.4)', stagger: 0.08, delay: 0.35 },
      ),
  });
}

function parlay() {
  const slip = $('[data-parlay]');
  if (!slip) return;
  const legs = $$('[data-leg]', slip);
  const status = $('[data-parlay-status]', slip);
  const cashed = $('[data-cashed]', slip);

  gsap.from(legs, {
    x: -24,
    opacity: 0,
    duration: 0.7,
    ease: 'expo.out',
    stagger: 0.08,
    clearProps: 'transform,opacity',
    scrollTrigger: { trigger: slip, start: 'top 80%', once: true },
  });

  const settle = gsap.timeline({ paused: true });
  legs.forEach((leg, i) => {
    settle.call(
      () => {
        leg.classList.add('is-won');
        $('[data-leg-state]', leg).textContent = 'Won';
      },
      null,
      0.35 + i * 0.45,
    );
  });
  settle.call(
    () => {
      status.textContent = 'Won';
      status.classList.add('is-won');
      slip.classList.add('is-cashed');
      gsap.fromTo(cashed, { scale: 2.4, opacity: 0 }, { scale: 1, opacity: 0.92, duration: 0.5, ease: 'back.out(2)' });
    },
    null,
    0.4 + legs.length * 0.45,
  );
  ScrollTrigger.create({ trigger: slip, start: 'top 55%', once: true, onEnter: () => settle.play() });
}

function settleNow() {
  $$('[data-leg]').forEach((leg) => {
    leg.classList.add('is-won');
    $('[data-leg-state]', leg).textContent = 'Won';
  });
  const status = $('[data-parlay-status]');
  if (status) {
    status.textContent = 'Won';
    status.classList.add('is-won');
  }
  $('[data-parlay]')?.classList.add('is-cashed');
}

export function initMotion({ reduce }) {
  if (reduce) {
    settleNow();
    return;
  }
  heroIn();
  lineMovement();
  titles();
  reveals();
  props();
  parlay();

  let pending;
  document.addEventListener('layout:changed', () => {
    clearTimeout(pending);
    pending = setTimeout(() => ScrollTrigger.refresh(), 150);
  });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
