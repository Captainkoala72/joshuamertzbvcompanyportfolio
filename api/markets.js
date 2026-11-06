// GET /api/markets
// The busiest open sports markets on Polymarket right now, trimmed from the public Gamma API
// (no key needed) to a few KB: game moneylines (both sides) and futures (top contenders).
// Cached on Vercel's CDN for two minutes.

const SOURCE =
  'https://gamma-api.polymarket.com/events?closed=false&tag_slug=sports&order=volume24hr&ascending=false&limit=40';

const SPORTS = [
  ['nfl', 'NFL'], ['nba', 'NBA'], ['mlb', 'MLB'], ['nhl', 'NHL'], ['tennis', 'Tennis'],
  ['ncaaf', 'College football'], ['cfb', 'College football'], ['ncaab', 'College hoops'], ['cbb', 'College hoops'],
  ['ufc', 'UFC'], ['mma', 'MMA'], ['boxing', 'Boxing'], ['golf', 'Golf'], ['f1', 'F1'],
  ['counter-strike-2', 'CS2'], ['league-of-legends', 'LoL'], ['valorant', 'Valorant'], ['esports', 'Esports'],
  ['ucl', 'Soccer'], ['epl', 'Soccer'], ['soccer', 'Soccer'], ['cricket', 'Cricket'],
];

const parse = (s) => {
  try {
    return Array.isArray(s) ? s : JSON.parse(s);
  } catch {
    return [];
  }
};

function sportOf(tags) {
  const slugs = (tags || []).map((t) => t.slug);
  for (const [slug, label] of SPORTS) if (slugs.includes(slug)) return label;
  return 'Sports';
}

function toIso(gameStartTime) {
  if (!gameStartTime) return null;
  const d = new Date(String(gameStartTime).replace(' ', 'T').replace(/\+00$/, 'Z'));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// A head-to-head game: the market whose question is the event title, or the moneyline.
function gameMarket(event) {
  const markets = event.markets || [];
  const m =
    markets.find((x) => x.question === event.title && !x.closed) ||
    markets.find((x) => x.sportsMarketType === 'moneyline' && !x.closed);
  if (!m) return null;
  const names = parse(m.outcomes);
  const prices = parse(m.outcomePrices).map(Number);
  if (names.length !== 2 || prices.length !== 2) return null;
  if (names.some((n) => /^(yes|no)$/i.test(n))) return null;
  if (prices.some((p) => !(p > 0.03 && p < 0.97))) return null; // already decided
  return {
    kind: 'game',
    start: toIso(m.gameStartTime),
    outcomes: names.map((name, i) => ({ name, price: prices[i] })),
  };
}

// Futures ("2027 Champion"): one Yes/No market per team, labeled by groupItemTitle.
function futuresMarket(event) {
  const rows = (event.markets || [])
    .filter((m) => !m.closed && m.groupItemTitle)
    .map((m) => ({ name: m.groupItemTitle, price: Number(parse(m.outcomePrices)[0]) }))
    .filter((r) => r.price > 0.005 && r.price < 0.99)
    .sort((a, b) => b.price - a.price)
    .slice(0, 3);
  return rows.length >= 2 ? { kind: 'futures', start: null, outcomes: rows } : null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const r = await fetch(SOURCE, { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error(`Polymarket responded ${r.status}`);
    const events = await r.json();
    const markets = [];
    for (const e of Array.isArray(events) ? events : []) {
      const m = gameMarket(e) || futuresMarket(e);
      if (!m) continue;
      markets.push({
        id: String(e.id),
        title: e.title,
        sport: sportOf(e.tags),
        volume24h: Math.round(Number(e.volume24hr) || 0),
        ...m,
      });
      if (markets.length >= 9) break;
    }
    if (!markets.length) throw new Error('No open markets');
    res.statusCode = 200;
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    res.end(JSON.stringify({ updated: new Date().toISOString(), markets }));
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Prediction-market prices are unavailable right now.' }));
  }
}
