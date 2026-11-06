import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import 'lenis/dist/lenis.css';
import './styles/main.css';

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { reduceMotion } from './lib/dom.js';
import { renderTicker, renderBoards, renderLinks } from './modules/render.js';
import { initDialogs } from './modules/dialogs.js';
import { initSlip } from './modules/slip.js';
import { initNav } from './modules/nav.js';
import { initExtras } from './modules/extras.js';
import { initMotion } from './modules/motion.js';
import { initMarkets } from './modules/markets.js';

gsap.registerPlugin(ScrollTrigger);

const reduce = reduceMotion();

// Data-driven sections first, so the animations below can find them.
renderTicker();
renderBoards();
renderLinks();

// Smooth scrolling (skipped for reduced motion), driven by GSAP's ticker so ScrollTrigger stays in sync.
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

initNav(lenis);
const lightbox = initDialogs(lenis);
initSlip(lenis);
initExtras(lightbox);
initMotion({ reduce });
initMarkets();
