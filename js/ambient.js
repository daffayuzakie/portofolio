/**
 * ambient.js
 * Interactive city-grid backdrop drawn on a fixed full-viewport canvas
 * (a vanilla port of the React ShapeGrid component). The whole grid drifts
 * gently, and the cell under the cursor lights up white with an easing fill
 * plus a fading trail.
 *
 * Runs on a requestAnimationFrame loop capped to ~30fps, and only while the
 * canvas is on screen and the page is visible. On mobile the canvas stays
 * display:none (glass-engine.css) so the cheap static CSS grid is used
 * there instead.
 */
export function initAmbient() {
  const bg = document.querySelector('.ambient-bg');
  if (!bg) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'ambient-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  bg.appendChild(canvas);

  // If the canvas is hidden (mobile flat mode), bail out before attaching any
  // listeners or starting a draw loop so a hidden canvas costs nothing.
  if (getComputedStyle(canvas).display === 'none') {
    canvas.remove();
    return;
  }

  const ctx = canvas.getContext('2d');

  const squareSize = 40;
  const direction = 'right';
  // Gentle drift (px per frame at ~30fps). Set to 0 for a fully static grid.
  const speed = 0.5;
  const hoverTrailAmount = 6;

  const BORDER_COLOR = 'rgba(120, 150, 170, 0.45)';
  const HOVER_FILL = 'rgba(255, 255, 255, 0.6)';
  const BASE_FILL = '#070a14'; // matches --grid-bg so no double-grid shows

  const gridOffset = { x: 0, y: 0 };
  const hoveredCell = { x: null, y: null };
  const trailCells = [];
  const cellOpacities = new Map();

  let requestRef = null;
  let isVisible = false;
  let isPageVisible = !document.hidden;
  let lastFrame = 0;

  const resizeCanvas = () => {
    canvas.width = Math.max(1, Math.floor(bg.clientWidth));
    canvas.height = Math.max(1, Math.floor(bg.clientHeight));
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const drawGrid = () => {
    // Paint an opaque near-black base first so the CSS grid gradient behind
    // the canvas is fully covered (no double-grid moiré).
    ctx.fillStyle = BASE_FILL;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
    const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;

    const cols = Math.ceil(canvas.width / squareSize) + 3;
    const rows = Math.ceil(canvas.height / squareSize) + 3;

    for (let col = -2; col < cols; col++) {
      for (let row = -2; row < rows; row++) {
        const sx = col * squareSize + offsetX;
        const sy = row * squareSize + offsetY;
        const cellKey = `${col},${row}`;

        const alpha = cellOpacities.get(cellKey);
        if (alpha) {
          ctx.globalAlpha = Math.min(1, alpha);
          ctx.fillStyle = HOVER_FILL;
          ctx.fillRect(sx, sy, squareSize, squareSize);
          ctx.globalAlpha = 1;
        }

        ctx.strokeStyle = BORDER_COLOR;
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, squareSize, squareSize);
      }
    }

    // Vignette: a transparent-centred radial gradient fades the grid edges
    // into the base colour, so cells near the corners/canvas edge don't pop
    // as hard as cells under the cursor. (Mirrors the ShapeGrid gradient.)
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const updateCellOpacities = () => {
    const targets = new Map();

    if (hoveredCell.x !== null && hoveredCell.y !== null) {
      targets.set(`${hoveredCell.x},${hoveredCell.y}`, 1);
    }

    if (hoverTrailAmount > 0) {
      for (let i = 0; i < trailCells.length; i++) {
        const t = trailCells[i];
        const key = `${t.x},${t.y}`;
        if (!targets.has(key)) {
          targets.set(key, (trailCells.length - i) / (trailCells.length + 1));
        }
      }
    }

    for (const [key] of targets) {
      if (!cellOpacities.has(key)) {
        cellOpacities.set(key, 0);
      }
    }

    for (const [key, opacity] of cellOpacities) {
      const target = targets.get(key) || 0;
      const next = opacity + (target - opacity) * 0.15;
      if (next < 0.005) {
        cellOpacities.delete(key);
      } else {
        cellOpacities.set(key, next);
      }
    }
  };

  const updateAnimation = (now = 0) => {
    // Cap the draw loop to ~30fps (rAF fires at display refresh, typically
    // 60/120Hz): a slowly-drifting grid doesn't need to repaint every frame,
    // and halving the fill-rate keeps low-end desktops quiet.
    if (now - lastFrame < 33) {
      requestRef = requestAnimationFrame(updateAnimation);
      return;
    }
    lastFrame = now;

    const wrapX = squareSize;
    switch (direction) {
      case 'right':
        gridOffset.x = (gridOffset.x - speed + wrapX) % wrapX;
        break;
      case 'left':
        gridOffset.x = (gridOffset.x + speed + wrapX) % wrapX;
        break;
      default:
        break;
    }

    updateCellOpacities();
    drawGrid();
    requestRef = requestAnimationFrame(updateAnimation);
  };

  const handlePointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
    const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
    const adjustedX = mouseX - offsetX;
    const adjustedY = mouseY - offsetY;

    const col = Math.floor(adjustedX / squareSize);
    const row = Math.floor(adjustedY / squareSize);

    if (hoveredCell.x !== col || hoveredCell.y !== row) {
      if (hoveredCell.x !== null && hoverTrailAmount > 0) {
        trailCells.unshift({ x: hoveredCell.x, y: hoveredCell.y });
        if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
      }
      hoveredCell.x = col;
      hoveredCell.y = row;
    }
  };

  const handlePointerLeave = () => {
    if (hoveredCell.x !== null && hoverTrailAmount > 0) {
      trailCells.unshift({ x: hoveredCell.x, y: hoveredCell.y });
      if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
    }
    hoveredCell.x = null;
    hoveredCell.y = null;
  };

  const tryStart = () => {
    if (isVisible && isPageVisible && !requestRef) {
      requestRef = requestAnimationFrame(updateAnimation);
    }
  };
  const tryStop = () => {
    if (requestRef) {
      cancelAnimationFrame(requestRef);
      requestRef = null;
    }
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
      isVisible ? tryStart() : tryStop();
    },
    { threshold: 0 }
  );
  io.observe(canvas);

  const onVisibility = () => {
    isPageVisible = !document.hidden;
    isPageVisible ? tryStart() : tryStop();
  };
  document.addEventListener('visibilitychange', onVisibility);

  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerleave', handlePointerLeave);

  tryStart();

  return () => {
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerleave', handlePointerLeave);
    tryStop();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.remove();
  };
}