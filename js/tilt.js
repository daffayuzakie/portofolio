/**
 * tilt.js
 * Two effects driven by the same pointer position, on every .liquid-glass-card:
 *   1. Glare: writes --mx/--my as percentages, which glass-engine.css reads
 *      to position the radial-gradient "hot spot" (::after) under the cursor.
 *   2. Tilt: on elements also marked [data-tilt], rotates the card in 3D
 *      toward the cursor, simulating a curved refractive surface.
 *
 * Both are throttled to one update per animation frame. Pointer events can
 * fire far more often than the screen refreshes, so writing styles on every
 * single event forces extra layout work the user will never actually see —
 * requestAnimationFrame collapses a burst of events into one paint.
 */
export function initTilt() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards = document.querySelectorAll('.liquid-glass-card');

  cards.forEach((card) => {
    const hasTilt = card.hasAttribute('data-tilt') && !reduceMotion;
    const maxTilt = Number(card.dataset.tiltMax) || 8;

    let queued = false;
    let lastEvent = null;

    function apply() {
      queued = false;
      if (!lastEvent) return;

      const rect = card.getBoundingClientRect();
      const px = (lastEvent.clientX - rect.left) / rect.width;  // 0..1 across the card
      const py = (lastEvent.clientY - rect.top) / rect.height;  // 0..1 down the card

      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);

      if (hasTilt) {
        const rotateY = (px - 0.5) * maxTilt * 2; // left half -> negative, right half -> positive
        const rotateX = (0.5 - py) * maxTilt * 2; // top half -> positive (tilts back), bottom -> negative
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    }

    card.addEventListener('pointermove', (e) => {
      lastEvent = e;
      if (!queued) {
        queued = true;
        requestAnimationFrame(apply);
      }
    });

    card.addEventListener('pointerleave', () => {
      lastEvent = null;
      if (hasTilt) card.style.transform = '';
    });
  });
}
