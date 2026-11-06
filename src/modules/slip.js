// The bet slip: any element with data-pick-id / data-pick / data-odds toggles a pick.
// The slip shows real parlay math, and "Place bet" opens an email listing the picks.
import { gsap } from 'gsap';
import { $, $$, esc, reduceMotion } from '../lib/dom.js';

const KEY = 'jm-bv-slip';
const EMAIL = 'joshuamertz716@gmail.com';
let picks = [];

export const toDecimal = (american) => (american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american));
export const toAmerican = (decimal) =>
  decimal >= 2 ? `+${Math.round((decimal - 1) * 100)}` : `-${Math.round(100 / (decimal - 1))}`;
export const fmtOdds = (n) => (n > 0 ? `+${n}` : String(n));

function load() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || '[]');
    picks = Array.isArray(saved) ? saved.filter((p) => p && p.id && p.label && Number.isFinite(p.odds)) : [];
  } catch {
    picks = [];
  }
}

function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(picks));
  } catch {
    /* private mode: the slip just won't survive a reload */
  }
}

function sync() {
  const ids = new Set(picks.map((p) => p.id));
  $$('[data-pick-id]').forEach((b) => {
    const on = ids.has(b.dataset.pickId);
    b.classList.toggle('is-picked', on);
    if (!b.disabled) b.setAttribute('aria-pressed', String(on));
  });
  // Buttons with data-on-text swap their label while their pick is on the slip.
  $$('[data-pick-id][data-on-text]').forEach((b) => {
    if (!b.dataset.offHtml) b.dataset.offHtml = b.innerHTML;
    b.innerHTML = ids.has(b.dataset.pickId) ? esc(b.dataset.onText) : b.dataset.offHtml;
  });
  $$('[data-slip-count]').forEach((el) => (el.textContent = String(picks.length)));
  $$('.slip-btn').forEach((b) => b.classList.toggle('has-picks', picks.length > 0));

  $('[data-slip-list]').innerHTML = picks
    .map(
      (p) =>
        `<li class="slip__pick"><p>${esc(p.label)}</p><b>${esc(fmtOdds(p.odds))}</b><button class="slip__remove" type="button" data-slip-remove="${esc(p.id)}" aria-label="Remove ${esc(p.label)}">×</button></li>`,
    )
    .join('');
  $('[data-slip-empty]').hidden = picks.length > 0;

  const odds = $('[data-slip-odds]');
  if (!picks.length) odds.textContent = 'None yet';
  else if (picks.length === 1) odds.textContent = fmtOdds(picks[0].odds);
  else odds.textContent = `${toAmerican(picks.reduce((d, p) => d * toDecimal(p.odds), 1))} · ${picks.length}-leg parlay`;
}

function visibleSlipButton() {
  return $$('.slip-btn').find((b) => b.offsetParent !== null);
}

function bump() {
  const btn = visibleSlipButton();
  if (!btn) return;
  btn.classList.remove('bump');
  void btn.offsetWidth;
  btn.classList.add('bump');
}

// A little odds chip flies from the button to the slip.
function fly(from, text) {
  const to = visibleSlipButton();
  if (!to || reduceMotion()) return;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const chip = document.createElement('span');
  chip.className = 'fly-chip';
  chip.textContent = text;
  document.body.append(chip);
  const startX = a.left + a.width / 2 - chip.offsetWidth / 2;
  const startY = a.top + a.height / 2 - chip.offsetHeight / 2;
  gsap.set(chip, { x: startX, y: startY, left: 0, top: 0 });
  gsap.to(chip, {
    x: b.left + b.width / 2 - chip.offsetWidth / 2,
    y: b.top + b.height / 2 - chip.offsetHeight / 2,
    scale: 0.6,
    duration: 0.7,
    ease: 'power3.inOut',
    onComplete: () => chip.remove(),
  });
  gsap.to(chip, { opacity: 0, duration: 0.2, delay: 0.55 });
}

function placeBet() {
  const lines = (picks.length ? picks : [{ label: 'Joshua Mertz to join BV', odds: -1000 }]).map(
    (p) => `- ${p.label} (${fmtOdds(p.odds)})`,
  );
  const subject = 'Placing my bet on Joshua Mertz';
  const body = `Hi Joshua,\n\nI'm placing a bet on you. My slip:\n${lines.join('\n')}\n\nLet's talk.\n`;
  window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** The parlay section's odds come from its legs, so they always add up. */
function initParlayOdds() {
  const legs = $$('[data-leg]');
  if (!legs.length) return;
  const total = toAmerican(legs.reduce((d, leg) => d * toDecimal(Number(leg.dataset.odds)), 1));
  const label = $('[data-parlay-odds]');
  if (label) label.textContent = total;
  const add = $('[data-pick-id="parlay"]');
  if (add) add.dataset.odds = String(parseInt(total, 10));
}

export function initSlip(lenis) {
  const dlg = $('[data-slip]');
  if (!dlg) return;
  initParlayOdds();
  load();
  sync();

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pick-id]');
    if (btn && !btn.disabled) {
      const id = btn.dataset.pickId;
      const i = picks.findIndex((p) => p.id === id);
      if (i > -1) picks.splice(i, 1);
      else {
        picks.push({ id, label: btn.dataset.pick, odds: Number(btn.dataset.odds) });
        fly(btn, fmtOdds(Number(btn.dataset.odds)));
      }
      save();
      sync();
      bump();
      return;
    }
    if (e.target.closest('[data-slip-open]')) {
      dlg.showModal();
      lenis?.stop();
      return;
    }
    const remove = e.target.closest('[data-slip-remove]');
    if (remove) {
      picks = picks.filter((p) => p.id !== remove.dataset.slipRemove);
      save();
      sync();
    }
  });

  $('[data-slip-clear]').addEventListener('click', () => {
    picks = [];
    save();
    sync();
  });
  $('[data-slip-place]').addEventListener('click', placeBet);
  $('[data-close]', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });
  dlg.addEventListener('close', () => lenis?.start());
}
