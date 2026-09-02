/**
 * orbit.js
 * Injects the Stack-section orbiting logos (21st.dev "OrbitImages" port)
 * into the ring container from a simple LOGOS config. Each logo is
 * staggered by a per-item negative animation-delay so the ring reads as
 * evenly spaced no matter how many logos are in the list, and
 * --orbit-scale keeps the 1400px design canvas fitted to the section.
 */
export function initOrbit() {
  const orbit = document.getElementById('orbit');
  const itemsEl = document.getElementById('orbit-items');
  if (!orbit || !itemsEl) return;

  const LOGOS = [
    { slug: 'javascript', label: 'JavaScript' },
    { slug: 'php', label: 'PHP' },
    { slug: 'git', label: 'Git', color: 'ffffff' },
    { slug: 'nextdotjs', label: 'Next.js', color: '000000' },
    { slug: 'laravel', label: 'Laravel' },
    { slug: 'github', label: 'GitHub', color: 'ffffff' },
  ];

  const total = LOGOS.length;
  const duration = 65; // seconds; keep in sync with .orbit-item animation

  LOGOS.forEach((logo, i) => {
    const item = document.createElement('div');
    item.className = 'orbit-item';
    item.style.animationDelay = `-${((i / total) * duration).toFixed(4)}s`;

    const holder = document.createElement('div');
    const img = document.createElement('img');
    // Optional `color` forces a single-tone icon (e.g. white for logos
    // whose brand colour is black and would vanish on the dark glass).
    img.src = `https://cdn.simpleicons.org/${logo.slug}${logo.color ? `/${logo.color}` : ''}`;
    img.alt = logo.label;
    img.width = 128;
    img.height = 128;
    img.draggable = false;
    holder.appendChild(img);

    item.appendChild(holder);
    itemsEl.appendChild(item);
  });

  // Translate the 1400px design canvas scale to the rendered size.
  const scaleOrbit = () => {
    orbit.style.setProperty('--orbit-scale', String(orbit.clientWidth / 1400));
  };
  scaleOrbit();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(scaleOrbit).observe(orbit);
  }
  window.addEventListener('resize', scaleOrbit);

  // The ring rotates forever — freeze it while the section is off screen so
  // the GPU isn't animating (and re-sampling) invisible pixels.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        itemsEl.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      },
      { threshold: 0 }
    );
    io.observe(orbit);
  }
}