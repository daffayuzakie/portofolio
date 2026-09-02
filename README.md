# Liquid Glass Portfolio

Pure HTML5 / CSS3 / vanilla JavaScript. No build step, no framework.

## Running it

The JavaScript is loaded as ES modules (`<script type="module">`), and
browsers block modules from loading over the `file://` protocol for CORS
reasons — opening `index.html` directly will leave the page static (no
tilt, no filtering). Serve it over a local server instead:

```bash
# Option 1 — Python (built in on most systems)
python -m http.server 8000

# Option 2 — Node, no install needed
npx serve .
```

Then open `http://localhost:8000` (or whatever port it prints).
If you use VS Code, the "Live Server" extension does the same thing with
one click.

## File structure

```
index.html
css/
  variables.css     -- all design tokens: colors, blur, shadow, spacing
  base.css           -- reset + base element styles
  glass-engine.css    -- the reusable glass surface/border/glare classes
  components.css       -- dynamic island nav, hero, bento about, skill bars, projects, form, footer
  animations.css        -- keyframes for the ambient blobs + small motion
  coverflow.css         -- vanilla port of the 21st.dev 3D Coverflow Carousel (projects section)
  orbit.css             -- big elliptical ring + orbiting logo icons (21st.dev OrbitImages geometry)
  responsive.css         -- breakpoints
js/
  main.js            -- entry point, wires up every module below
  ambient.js          -- interactive canvas city-grid background (ported from ShapeGrid)
  tilt.js              -- 3D tilt + cursor-tracked glare
  orbit.js             -- orbiting logo ring for the stack section (21st.dev port)
  coverflow.js         -- 3D coverflow carousel: drag/swipe, snap, dots, keyboard, filter sync
  filter.js             -- project category filtering
  scrollSpy.js           -- smooth scroll + active nav link
  formValidation.js       -- contact form validation + submit state
```

## Things to customize before shipping

- **Nav email**: the `.island-cta` / `.island-dropdown-cta` links in
  `index.html` currently point at `mailto:hello@daffa.dev` — swap for your
  real address.
- **Hero mark**: `.hero-mark` shows a gradient-text "D" instead of a photo.
  Replace the `<span>D</span>` with your own initial/logo, or drop in an
  `<img>` if you'd rather use a photo.
- **Project screenshots**: each `.cf-media` div in the coverflow carousel
  shows a `data-initials` placeholder drawn in CSS. Replace with `<img>`
  tags once you have real screenshots, and drop the `::before` rule in
  `css/coverflow.css` that reads `data-initials`.
- **Contact form endpoint**: `js/formValidation.js` currently simulates a
  network request with a delay. Replace the `TODO` block with a real
  `fetch()` call to your backend or a form service (Formspree, etc).
- **Colors/fonts**: everything is a CSS custom property in
  `css/variables.css` — change the palette or type pairing there and it
  propagates everywhere.
- **Tech stack**: each `.skill-item` in `index.html` pairs a logo (via
  `cdn.simpleicons.org/<slug>`), a proficiency label, and a `.skill-bar`
  fill percentage — edit these to match your actual toolkit and level.
- **Background grid**: the animated city-grid lives in `js/ambient.js`
  (grid size, drift direction/speed, hover trail), with fixed colors
  (`#39606c` border, `#21d7e8` hover) on a dark-only theme.

## Browser support notes

- `backdrop-filter` needs the `-webkit-` prefix on Safari (included).
- `mask-composite: exclude` (used for the gradient border) is the modern
  spelling; the `-webkit-mask-composite: xor` line above it is the
  equivalent for WebKit/Safari, which uses the older syntax.