/* Fullscreen loader that keeps the page hidden until every heavy asset is
   decoded — all <img> slides and the Space Grotesk webfont are loaded and
   decoded upfront (nothing is lazy anymore), so scrolling never has to
   render or pop anything later. The overlay fades away once everything is
   ready plus a short minimum so the reveal feels intentional. */
export function initLoader() {
  const loader = document.querySelector('.loader');
  if (!loader) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN_DISPLAY = 650; // ms the loader is shown at the very least
  const MAX_WAIT = 8000;   // reveal anyway if anything is slow/failed, so the
                           // page is never soft-locked in a loading screen.

  document.documentElement.classList.add('is-loading');

  const hide = () => {
    document.documentElement.classList.remove('is-loading');
    loader.classList.add('is-done');
    // Clean up after the fade; fallback in case transitionend never fires.
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    window.setTimeout(() => loader.remove(), 1200);
  };

  if (reduceMotion) {
    window.setTimeout(hide, 150);
    return;
  }

  const waitFor = (el) => {
    // decode() resolves only once the image is fully decoded (down to raw
    // pixels), so the loader hides *after* every slide is actually ready —
    // never just when the bytes finished downloading. Fall back to load.
    if (typeof el.decode !== 'function') {
      return el.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            el.addEventListener('load', resolve, { once: true });
            el.addEventListener('error', resolve, { once: true });
          });
    }
    return el.decode().catch(() => undefined);
  };

  const whenReady = () => {
    // The backdrop is now a pure-CSS grid (no image behind it), and the
    // orbit icons are tiny CDN SVGs fetched on their own — nothing extra to
    // preload here besides the <img> slides and the headline webfont.

    // The Space Grotesk webfont is the one family that could still reflow
    // headlines after the loader fades — wait for it to be applied too.
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();

    const waitAll = () =>
      Promise.allSettled([...Array.from(document.images, waitFor), fonts]);

    // Hard cap: reveal once everything is done OR after MAX_WAIT, whichever
    // comes first — a failed/slow asset must never trap the page here.
    Promise.race([
      waitAll().then(() => true),
      new Promise((resolve) => window.setTimeout(() => resolve(false), MAX_WAIT)),
    ]).then(() => {
      // Ensure the loader stays up for at least MIN_DISPLAY before fading.
      const elapsed = performance.now() - (window.__loaderStartedAt || 0);
      window.setTimeout(hide, Math.max(0, MIN_DISPLAY - elapsed));
    });
  };

  window.__loaderStartedAt = performance.now();
  if (document.readyState === 'complete') whenReady();
  else window.addEventListener('load', whenReady, { once: true });
}