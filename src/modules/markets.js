// "Live markets": the busiest Polymarket sports markets via /api/markets, shown as
// American odds. My teams and players get a star, and the hero ticker picks up a few.
import { gsap } from 'gsap';
import { $, $$, esc, fetchJSON, layoutChanged, reduceMotion } from '../lib/dom.js';
import { renderTicker } from './render.js';

const FAV = /\b(Bills|Buffalo|Knicks|Sabres|Yankees|Volunteers|Vols|Fonseca|Berrettini|Shelton|Tiafoe|Alcaraz)\b|\bTennessee\b(?! Titans)/i;

export const probToAmerican = (p) => {
  if (!(p > 0 && p < 1)) return 'n/a';
  return p >= 0.5 ? `-${Math.round((p / (1 - p)) * 100)}` : `+${Math.round(((1 - p) / p) * 100)}`;
};
const pct = (p) => `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`;
const money = (n) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${n}`);
const when = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `Starts ${d.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`;
};

function card(m) {
  const fav = FAV.test(m.title) || m.outcomes.some((o) => FAV.test(o.name));
  const outcomes = m.outcomes
    .map(
      (o) =>
        `<div class="price${FAV.test(o.name) ? ' is-fav' : ''}"><span class="price__name">${esc(o.name)}</span><span class="price__nums"><b>${probToAmerican(o.price)}</b><span>${pct(o.price)}</span></span></div>`,
    )
    .join('');
  const sub = m.kind === 'futures' ? 'Futures · top contenders' : when(m.start);
  return `<article class="mkt${fav ? ' is-fav' : ''}">
    <header class="mkt__head"><span class="mkt__sport">${esc(m.sport)}</span><span class="mkt__vol">${money(m.volume24h)} traded · 24h</span></header>
    <h3 class="mkt__title">${esc(m.title)}${fav ? ' <span class="star" title="One of my teams or players">★</span>' : ''}</h3>
    ${sub ? `<p class="mkt__when">${esc(sub)}</p>` : ''}
    <div class="mkt__outcomes${m.outcomes.length === 2 ? ' mkt__outcomes--2' : ''}">${outcomes}</div>
  </article>`;
}

function tickerItem(m) {
  const sport = `<em>${esc(m.sport)}</em>`;
  if (m.kind === 'futures') {
    const [top] = m.outcomes;
    return `${sport} ${esc(m.title)}: ${esc(top.name)} <b>${probToAmerican(top.price)}</b>`;
  }
  const [a, b] = m.outcomes;
  return `${sport} ${esc(a.name)} <b>${probToAmerican(a.price)}</b> · ${esc(b.name)} <b>${probToAmerican(b.price)}</b>`;
}

export function initMarkets() {
  const wrap = $('[data-markets]');
  if (!wrap) return;

  const start = async () => {
    try {
      const data = await fetchJSON('/api/markets', 12000);
      if (!data?.markets?.length) throw new Error('No markets');
      // Favorites first, then by volume (sort is stable, so volume order is kept within each group).
      const isFav = (m) => (FAV.test(m.title) || m.outcomes.some((o) => FAV.test(o.name)) ? 1 : 0);
      const markets = [...data.markets].sort((a, b) => isFav(b) - isFav(a)).slice(0, 9);
      wrap.innerHTML = markets.map(card).join('');
      if (!reduceMotion()) {
        gsap.from($$('.mkt', wrap), { y: 24, opacity: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05, clearProps: 'transform,opacity' });
      }
      renderTicker(markets.slice(0, 5).map(tickerItem));
    } catch {
      wrap.innerHTML = '<p class="mkts__error">The live board is resting right now. Check back in a bit.</p>';
    }
    layoutChanged();
  };

  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2500 });
  else setTimeout(start, 1200);
}
