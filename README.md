# Joshua Mertz · Bet on Me

My portfolio for BV's **Sports Betting Marketing Associate** role, built like a sportsbook: a featured market, player props that all hit, the job as a 5-leg parlay, my betting and AI builds, an AI video lab, live Polymarket prices and a bet slip that turns into an email.

**Stack:** Vite + vanilla JS, GSAP (ScrollTrigger + SplitText), Lenis smooth scrolling, self-hosted fonts (Archivo, Inter, JetBrains Mono) and one small Vercel function for live prices.

## Run it locally

```bash
npm install
npm run dev
```

Open the address Vite prints. The dev server also serves `/api/markets`, so the live markets work locally too.

`npm run build` creates the production site in `dist/`, and `npm run preview` serves that build.

## Deploy on Vercel

1. Import this GitHub repo in Vercel.
2. Vercel detects **Vite** automatically (build `npm run build`, output `dist`). No environment variables are needed.
3. `api/markets.js` deploys as a serverless function on its own.

Social previews use `public/og.jpg`; Vercel's production domain is filled into the meta tags at build time.

## Where to edit things

| What | File |
| --- | --- |
| Page text (hero, why I bet, props, parlay, AI lab, AI stack, form guide, contact) | `index.html` |
| Builds (text, labels, screenshots, order) | `src/data/projects.js` |
| **Reddit links for the UHC posts** | `src/data/uhc-links.js` |
| Colors, fonts, layout | `src/styles/main.css` |
| Bet slip behavior and the email it writes | `src/modules/slip.js` |
| Animations | `src/modules/motion.js` |

Any button with `data-pick-id`, `data-pick` and `data-odds` adds a pick to the bet slip. The parlay's total odds are calculated from its legs.

### Adding the UHC Reddit links

Paste each link into `src/data/uhc-links.js` as a string, one per line, with a comma after it. The site writes a readable label from the link, and "The original threads" appears once there's at least one. It's the same format as the Sleeper portfolio, so the same list works in both.

## Live markets

`/api/markets` pulls the busiest open sports markets from Polymarket's public Gamma API (no key), keeps game moneylines and the top contenders in futures markets, and caches the result on Vercel's CDN for 2 minutes. The site converts prices to American odds and stars my teams and players. If Polymarket is down, the section shows a short "resting" message and the rest of the site works normally.

## Videos

The three AI test videos in `public/video` are compressed copies (540p, H.264) of my originals, with poster images. They only load when someone presses play.

21+. Not affiliated with BV.
