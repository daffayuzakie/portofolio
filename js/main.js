/**
 * main.js
 * Single entry point loaded via <script type="module">. Each feature lives
 * in its own file and exports one init function — main.js just wires them
 * up, so any module can be dropped or swapped without touching the others.
 */
import { initTilt } from './tilt.js';
import { initAmbient } from './ambient.js';
import { initOrbit } from './orbit.js';
import { initCoverflow } from './coverflow.js';
import { initFilter } from './filter.js';
import { initScrollSpy } from './scrollSpy.js';
import { initFormValidation } from './formValidation.js';

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

initTilt();
initAmbient();
initOrbit();
initCoverflow();
initFilter();
initScrollSpy();
initFormValidation();

// Mobile nav toggle — lives here rather than its own file since it's a
// handful of lines with no state anything else needs to read.
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  menuToggle.classList.toggle('is-open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.getElementById('back-to-top')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
