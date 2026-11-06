// Data-driven parts of the page: the hero ticker, the builds boards and the UHC links.
import { projects } from '../data/projects.js';
import { eras } from '../data/uhc.js';
import { uhcLinks } from '../data/uhc-links.js';
import { $, esc, imgTag, imgSrc } from '../lib/dom.js';

/* ---------- Ticker ---------- */
const TICKER_BASE = [
  '<em>Bettor</em> Since <b>21</b>, betting in units',
  '<em>Apps</em> DraftKings · Polymarket · Novig · Fliff',
  '<em>Best win</em> Alcaraz over Sinner at Roland Garros',
  '<em>Builds</em> <b>25+</b> shipped with AI',
  '<em>Promo</em> <b>50+</b> events promoted on Reddit',
  '<em>Status</em> <b>100%</b> available, weekends included',
  '<em>Team</em> Die-hard Bills fan',
];

/** `extra` items (already escaped HTML) slot in after the first two base items. */
export function renderTicker(extra = []) {
  const track = $('[data-ticker]');
  if (!track) return;
  const items = [...TICKER_BASE.slice(0, 2), ...extra, ...TICKER_BASE.slice(2)];
  const group = (hidden) =>
    `<div class="ticker__group"${hidden ? ' aria-hidden="true"' : ''}>${items
      .map((html) => `<span class="ticker__item">${html}</span>`)
      .join('')}</div>`;
  track.innerHTML = group(false) + group(true);
  requestAnimationFrame(() => {
    const width = track.firstElementChild?.scrollWidth || 2000;
    track.style.setProperty('--ticker-speed', `${Math.max(30, width / 70)}s`);
  });
}

/* ---------- Builds ---------- */
function eventCard(p) {
  const [statusKey, statusText] = p.status;
  const [thumbKey, thumbAlt] = p.images[0];
  const sizes =
    p.group === 'creative'
      ? '(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 300px'
      : '(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 400px';
  return `<article class="ev" data-reveal>
    <div class="ev__media">${imgTag(thumbKey, thumbAlt, { sizes })}<span class="ev__label">${esc(p.label)}</span></div>
    <div class="ev__body">
      <span class="ev__status ev__status--${esc(statusKey)}">${esc(statusText)}</span>
      <h4 class="ev__title"><button class="ev__open" type="button" data-open="${esc(p.id)}" aria-haspopup="dialog">${esc(p.title)}</button></h4>
      <p class="ev__tag">${esc(p.tagline)}</p>
      <p class="ev__desc">${esc(p.summary)}</p>
      <div class="ev__foot">
        <ul class="ev__tech">${p.tech.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <span class="ev__more" aria-hidden="true">Details →</span>
      </div>
    </div>
  </article>`;
}

function miniCard(p) {
  const [key] = p.images[0];
  return `<button class="mini__item" type="button" data-open="${esc(p.id)}" aria-haspopup="dialog" data-reveal>
    <img src="${imgSrc(key)}" alt="" width="64" height="48" loading="lazy" decoding="async">
    <span class="mini__text"><strong>${esc(p.title)}</strong><span>${esc(p.tagline)}</span></span>
  </button>`;
}

export function renderBoards() {
  const fill = (group, make) => {
    const el = $(`[data-board="${group}"]`);
    if (el) el.innerHTML = projects.filter((p) => p.group === group).map(make).join('');
  };
  fill('betting', eventCard);
  fill('creative', eventCard);
  fill('other', miniCard);
}

/** Every UHC Reddit screenshot, for the "See all the posts" lightbox. */
export const allUhcStrips = () =>
  eras.flatMap((era) => era.strips.map(([key, alt]) => ({ src: `/img/uhc/${key}.webp`, caption: alt, alt })));

/* ---------- Reddit match-thread links (src/data/uhc-links.js) ---------- */
const WORDS = {
  utc: 'UTC', na: 'NA', us: 'US', eu: 'EU', ca: 'CA', ffa: 'FFA', uhc: 'UHC', pvp: 'PvP', pve: 'PvE',
  ipvp: 'iPvP', xvex: 'xVex', xvexs: "xVex's", to2: 'To2', to3: 'To3', to4: 'To4', to5: 'To5', to6: 'To6', vs: 'vs',
};

function labelFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const sub = parts[0] === 'r' && parts[1] ? `r/${parts[1]}` : u.hostname.replace(/^www\./, '');
    const slug = parts[0] === 'r' && parts[2] === 'comments' ? parts[4] || '' : '';
    const title = slug
      .split('_')
      .filter(Boolean)
      .map((w) => WORDS[w.toLowerCase()] || w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { sub, title: title || 'Match thread' };
  } catch {
    return { sub: 'reddit', title: 'Match thread' };
  }
}

export function renderLinks() {
  const wrap = $('[data-uhc-links]');
  const list = $('[data-uhc-list]');
  if (!wrap || !list || !Array.isArray(uhcLinks) || !uhcLinks.length) return;
  const items = uhcLinks
    .map((item) => {
      const url = typeof item === 'string' ? item : item?.url;
      if (!url || !/^https?:\/\//i.test(url)) return '';
      const auto = labelFromUrl(url);
      const title = typeof item === 'object' && item.title ? item.title : auto.title;
      return `<li><a href="${esc(url)}" target="_blank" rel="noopener"><span class="vlinks__sub">${esc(auto.sub)} ↗</span><span class="vlinks__title">${esc(title)}</span></a></li>`;
    })
    .join('');
  if (!items) return;
  list.innerHTML = items;
  wrap.hidden = false;
}
