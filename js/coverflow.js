/**
 * coverflow.js
 * Vanilla port of the 21st.dev "3D Coverflow Carousel". Cards fan out in
 * perspective; the active one sits square and sharp in the centre while
 * the rest angle, scale down and blur away. Drag on the viewport, use the
 * arrows/dots, or press ←/→ to bring another card to the front.
 *
 * Integration with filter.js: hiding a slide via .is-hidden updates the
 * visible list; the active index re-snaps to 0 when the filter changes.
 */
export function initCoverflow() {
  const root = document.getElementById('coverflow');
  if (!root) return;

  const viewport = root.querySelector('.cf-viewport');
  const stage = root.querySelector('.cf-stage');
  const ambient = root.querySelector('.cf-ambient');
  const prevBtn = root.querySelector('[data-cf="prev"]');
  const nextBtn = root.querySelector('[data-cf="next"]');
  const progress = root.querySelector('.cf-progress');
  const dotsWrap = root.querySelector('.cf-dots');

  let active = 0;
  let step = 0;

  // Mobile flat mode: render one sharp card at a time on plain 2D X-offsets —
  // no perspective, no rotateY, no translateZ, no per-slide blur. Cheapest
  // path for low-end phones; the desktop render() below keeps the 3D fan.
  const mobile =
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const visibleSlides = () =>
    [...stage.querySelectorAll('.cf-slide')].filter(
      (el) => !el.classList.contains('is-hidden')
    );

  function findStep() {
    const slides = visibleSlides();
    const w = slides[0] ? slides[0].getBoundingClientRect().width : 320;
    step = Math.round(w * 0.4);
  }

  function render(offset = 0) {
    const slides = visibleSlides();
    if (!slides.length) {
      if (progress) progress.textContent = '0 / 0';
      return;
    }

    slides.forEach((el, i) => {
      const d = i - active;
      const abs = Math.min(Math.abs(d), 4);

      if (mobile) {
        // Flat track: in-view cards nudge right, actively-hidden ones fly
        // off-screen instantly. Only opacity/transform animate — no heavy
        // filter, no 3D, so mobile stays at 60fps while swiping.
        const visible = Math.abs(d) <= 1;
        el.style.transform = `translateX(calc(-50% + ${d * step}px)) translateY(-50%) scale(${d === 0 ? 1 : 0.96})`;
        el.style.zIndex = String(60 - abs * 12);
        el.style.opacity = String(visible ? (d === 0 ? 1 : 0) : 0);
        el.style.filter = 'none';
        el.style.visibility = 'visible';
        el.classList.toggle('is-active', d === 0);
        el.setAttribute('aria-selected', d === 0 ? 'true' : 'false');
        return;
      }

      const px = d * step + offset;
      const scale = d === 0 ? 1 : Math.max(0.62, 0.84 - abs * 0.08);
      const opacity = d === 0 ? 1 : Math.max(0.22, 1 - abs * 0.3);
      const blur = d === 0 ? 0 : Math.min(3, abs * 1.4);

      el.style.transform =
        `translateX(calc(-50% + ${px}px)) translateY(-50%) ` +
        `translateZ(${-abs * 60}px) rotateY(${-d * 18}deg) scale(${scale})`;
      el.style.zIndex = String(60 - abs * 12);
      el.style.opacity = String(opacity);
      el.style.filter = blur ? `blur(${blur}px)` : 'none';
      el.classList.toggle('is-active', d === 0);
      el.setAttribute('aria-selected', d === 0 ? 'true' : 'false');
    });

    if (progress) progress.textContent = `${active + 1} / ${slides.length}`;

    const accent = slides[active]?.dataset.ambient;
    if (ambient) ambient.style.background = accent
      ? `radial-gradient(closest-side, ${accent}, transparent 72%)`
      : 'none';
  }

  function goTo(target) {
    const count = visibleSlides().length;
    if (!count) return;
    active = clamp(target, 0, count - 1);
    render(0);
    syncDots();
  }

  function syncDots() {
    if (!dotsWrap) return;
    const slides = visibleSlides();
    if (dotsWrap.replaceChildren) {
      dotsWrap.replaceChildren();
    } else {
      dotsWrap.innerHTML = '';
    }
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'cf-dot' + (i === active ? ' is-active' : '');
      dot.setAttribute('aria-label', `Go to project ${i + 1}`);
      dot.setAttribute('aria-current', i === active ? 'true' : 'false');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  /* -- Drag / swipe ---------------------------------------------------- */
  let pointerId = null;
  let startX = 0;
  let dragOffset = 0;
  let dragging = false;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    dragOffset = 0;
    dragging = false;
    viewport.classList.add('is-grabbing');
  });

  window.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    if (!dragging && Math.abs(dx) > 6) dragging = true;
    if (dragging) {
      dragOffset = dx;
      stage.classList.add('is-dragging');
      render(dx);
    }
  });

  const endDrag = (e) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    viewport.classList.remove('is-grabbing');
    stage.classList.remove('is-dragging');
    if (dragging) {
      goTo(active + Math.round(dragOffset / step));
      dragging = false;
      dragOffset = 0;
    }
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  /* Clicking a non-active card brings it to the front; clicks inside the
     active card (its links) behave normally. */
  stage.addEventListener('click', (e) => {
    if (dragging) return;
    const slide = e.target.closest('.cf-slide');
    if (!slide) return;
    const idx = visibleSlides().indexOf(slide);
    if (idx === active) return;
    goTo(idx);
  });

  /* -- Controls --------------------------------------------------------- */
  prevBtn?.addEventListener('click', () => goTo(active - 1));
  nextBtn?.addEventListener('click', () => goTo(active + 1));

  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(visibleSlides().length - 1); }
  });

  /* -- External sync ------------------------------------------------------
     filter.js toggles .is-hidden and fires 'filterchange'; re-measure the
     step and snap back to the first visible card. */
  document.addEventListener('filterchange', () => {
    findStep();
    goTo(0);
    syncDots();
  });

  window.addEventListener('resize', () => {
    findStep();
    render(0);
  });

  findStep();
  goTo(0);
}