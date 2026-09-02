/* Fullscreen loader that keeps the page hidden until every heavy asset is
   decoded — all <img> slides and the Space Grotesk webfont are loaded and
   decoded upfront (nothing is lazy anymore), so scrolling never has to
   render or pop anything later. While it is up, js drives a smooth progress
   bar towards 100% so the wait feels intentional, then the overlay fades
   away. */
export function initLoader() {
  const loader = document.querySelector('.loader');
  if (!loader) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN_DISPLAY = 650; // ms the loader is shown at the very least
  const MAX_WAIT = 8000;   // reveal anyway if anything is slow/failed, so the
                           // page is never soft-locked in a loading screen.

  const barEl = loader.querySelector('.loader-progress-bar');
  let progress = 0;

  const setProgress = (next) => {
    progress = Math.max(progress, Math.min(100, next));
    if (barEl) barEl.style.width = `${progress}%`;
  };

  document.documentElement.classList.add('is-loading');

  const hide = () => {
    setProgress(100);
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
    const images = Array.from(document.images);
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    const total = images.length + 1; // +1 for the webfont

    let settled = 0;
    const bump = () => {
      settled += 1;
      setProgress(Math.round((settled / total) * 100));
    };

    // Report each asset as it lands so the bar crawls realistically forwards.
    images.forEach((img) => {
      if (img.complete) bump();
      else {
        img.addEventListener('load', bump, { once: true });
        img.addEventListener('error', bump, { once: true });
      }
    });
    fonts.then(bump);

    const waitAll = () =>
      Promise.allSettled([...images.map(waitFor), fonts]).then(bump);

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
