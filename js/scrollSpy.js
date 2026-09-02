/**
 * scrollSpy.js
 *  - Intercepts nav link clicks to smooth-scroll with an offset, so the
 *    sticky glass nav never covers the top of the section it jumped to.
 *  - Uses IntersectionObserver (not a scroll listener) to highlight the
 *    current section's nav link — it only recomputes when a section
 *    actually crosses the watched line, instead of on every scroll frame.
 *  - Drives the visionOS-style indicator capsule: js sets its size + a
 *    transform, and the CSS transition makes it glide to the active link.
 */
export function initScrollSpy() {
  const nav = document.getElementById('site-nav');
  const links = Array.from(document.querySelectorAll('[data-nav-link]'));
  const navLinksEl = document.querySelector('.nav-links');
  const indicator = document.querySelector('.nav-indicator');
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  let activeLink = null;

  function moveIndicator(link) {
    if (!indicator || !navLinksEl) return;

    if (!link) {
      indicator.style.opacity = '0';
      return;
    }

    const linkRect = link.getBoundingClientRect();
    const navRect = navLinksEl.getBoundingClientRect();
    indicator.style.width = `${linkRect.width}px`;
    indicator.style.height = `${linkRect.height}px`;
    indicator.style.transform = `translate(${linkRect.left - navRect.left}px, ${linkRect.top - navRect.top}px)`;
    indicator.style.opacity = '1';
  }

  // Initialise the capsule to wherever the page opens (usually Home), and
  // re-measure whenever the window resizes while the capsule is visible.
  activeLink = links.find((link) => link.classList.contains('is-active')) || links[0];
  moveIndicator(activeLink);
  window.addEventListener('resize', () => moveIndicator(activeLink));

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();

      const navHeight = nav ? nav.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });

      // Collapse the mobile menu after a link is chosen.
      document.getElementById('menu-toggle')?.classList.remove('is-open');
      document.querySelector('.nav-links')?.classList.remove('is-open');
    });
  });

  if (!('IntersectionObserver' in window) || sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
        });
        activeLink = links.find((link) => link.getAttribute('href') === `#${id}`) || activeLink;
        moveIndicator(activeLink);
      });
    },
    { rootMargin: '-40% 0px -50% 0px' } // section counts as "active" once it crosses the viewport's middle band
  );

  sections.forEach((section) => observer.observe(section));
}