// Small interactions: click-to-load YouTube (also inside pop-ups), one video at a time,
// copy email, and the "See all the posts" UHC gallery.
import { $, $$, toast } from '../lib/dom.js';
import { allUhcStrips } from './render.js';

export function initExtras(lightbox) {
  // YouTube loads only when someone presses play (works for buttons added later too).
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-yt]');
    if (!btn) return;
    const frame = document.createElement('iframe');
    frame.className = 'yt-frame';
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(btn.dataset.yt)}?autoplay=1&rel=0&playsinline=1`;
    frame.title = 'DeuceTennis showcase video';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    btn.replaceWith(frame);
    frame.focus();
  });

  // Starting one AI lab video pauses the others.
  document.addEventListener(
    'play',
    (e) => {
      if (e.target.tagName !== 'VIDEO') return;
      $$('video').forEach((v) => {
        if (v !== e.target) v.pause();
      });
    },
    true,
  );

  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        toast('Email copied');
      } catch {
        window.location.href = `mailto:${text}`;
      }
    });
  });

  const all = $('[data-uhc-all]');
  if (all && lightbox) all.addEventListener('click', () => lightbox.open(allUhcStrips(), 0, all));
}
