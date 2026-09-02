/**
 * filter.js
 * Drives the "All / Full-stack / Frontend / Game" pills above the project
 * coverflow. Pure attribute matching — no framework, no re-render, just
 * toggling a class per slide based on its data-category. Fires
 * 'filterchange' so js/coverflow.js can re-sync its visible list.
 */
export function initFilter() {
  const tabs = document.querySelectorAll('.filter-pill');
  const cards = document.querySelectorAll('.cf-slide');
  const emptyState = document.getElementById('empty-state');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;

      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      });

      let visibleCount = 0;
      cards.forEach((card) => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !matches);
        if (matches) visibleCount += 1;
      });

      if (emptyState) emptyState.hidden = visibleCount !== 0;
      document.dispatchEvent(new CustomEvent('filterchange'));
    });
  });
}
