'use client';

import React, { useRef, useEffect, useState } from 'react';

// Time constants
const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 60 * SECONDS_IN_MINUTE;
const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;
const SECONDS_IN_WEEK = 7 * SECONDS_IN_DAY;
const SECONDS_IN_YEAR = 365.25 * SECONDS_IN_DAY;

// Candidate tick spacings (in seconds) ordered from fine → coarse
const TICK_STEPS: number[] = [
  1 * SECONDS_IN_MINUTE,
  5 * SECONDS_IN_MINUTE,
  15 * SECONDS_IN_MINUTE,
  30 * SECONDS_IN_MINUTE,
  1 * SECONDS_IN_HOUR,
  3 * SECONDS_IN_HOUR,
  6 * SECONDS_IN_HOUR,
  12 * SECONDS_IN_HOUR,
  1 * SECONDS_IN_DAY,
  7 * SECONDS_IN_DAY,
  30 * SECONDS_IN_DAY,       // ~1 month
  90 * SECONDS_IN_DAY,       // ~3 months
  180 * SECONDS_IN_DAY,      // ~6 months
  365 * SECONDS_IN_DAY,      // 1 year
  5 * SECONDS_IN_YEAR,
  10 * SECONDS_IN_YEAR,
  20 * SECONDS_IN_YEAR,
  50 * SECONDS_IN_YEAR,
];

/**
 * Pick the smallest tick step whose pixel spacing is at least `minPx`.
 */
function chooseTickStep(secondsPerPx: number, minPx = 80): number {
  for (const step of TICK_STEPS) {
    if (step / secondsPerPx >= minPx) return step;
  }
  return TICK_STEPS[TICK_STEPS.length - 1];
}

/**
 * Format a label for a given UNIX timestamp (in seconds) according to the current step size.
 */
function formatLabel(epochSec: number, stepSec: number) {
  const date = new Date(epochSec * 1000);

  if (stepSec < SECONDS_IN_HOUR) {
    // up to minutes → HH:MM
    return date.toISOString().substring(11, 16);
  }
  if (stepSec < SECONDS_IN_DAY) {
    // hours → HH:00
    return `${date.toISOString().substring(11, 13)}:00`;
  }
  if (stepSec < 30 * SECONDS_IN_DAY) {
    // days → MMM d
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  if (stepSec < SECONDS_IN_YEAR) {
    // months → MMM yyyy
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }
  // years → yyyy
  return date.getUTCFullYear().toString();
}

export default function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas (CSS) pixel dimensions
  const [size, setSize] = useState({ width: 0, height: 0 });

  // State kept in refs to avoid re-render loops while panning/zooming
  const scaleSecPerPx = useRef<number>(1); // seconds represented by one CSS pixel
  const offsetEpochSec = useRef<number>(0); // UNIX time (seconds) at x = 0

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);

  // ───────────────────────── Resize handling ──────────────────────────
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      setSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ───────────────────────── Initialise scale/offset ───────────────────
  useEffect(() => {
    if (size.width === 0) return;

    const minSecPerPx = (80 * SECONDS_IN_YEAR) / size.width;   // 80 y per screen
    const maxSecPerPx = (1 * SECONDS_IN_HOUR) / size.width;    // 1 h per screen

    // Start with ~1 year per screen
    scaleSecPerPx.current = Math.max(Math.min(SECONDS_IN_YEAR / size.width, minSecPerPx), maxSecPerPx);

    // centre "now" roughly in the middle
    const now = Date.now() / 1000;
    offsetEpochSec.current = now - (scaleSecPerPx.current * size.width) / 2;

    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width]);

  // ───────────────────────── Canvas drawing ───────────────────────────
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    ctx.scale(dpr, dpr);

    // Clear + background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size.width, size.height);

    const centreY = size.height / 2;

    // Main horizontal line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centreY);
    ctx.lineTo(size.width, centreY);
    ctx.stroke();

    const secPerPx = scaleSecPerPx.current;
    const offsetSec = offsetEpochSec.current;

    const step = chooseTickStep(secPerPx);
    const firstTick = Math.floor(offsetSec / step) * step - step * 2; // prepend a couple extra
    const lastTickSec = offsetSec + secPerPx * size.width + step * 2;

    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let t = firstTick; t < lastTickSec; t += step) {
      const x = (t - offsetSec) / secPerPx;
      if (x < -50 || x > size.width + 50) continue;

      // Grey full-height bar
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size.height);
      ctx.stroke();

      // White tick on the main line
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, centreY - 8);
      ctx.lineTo(x, centreY + 8);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(formatLabel(t, step), x, centreY + 12);
    }

    // Red "today" line
    const now = Date.now() / 1000;
    const nowX = (now - offsetSec) / secPerPx;
    if (nowX >= 0 && nowX <= size.width) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(nowX, 0);
      ctx.lineTo(nowX, size.height);
      ctx.stroke();
    }
  };

  // ───────────────────────── Interaction (pan/zoom) ───────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const minSecPerPx = (80 * SECONDS_IN_YEAR) / size.width;
    const maxSecPerPx = (1 * SECONDS_IN_HOUR) / size.width;

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartOffset.current = offsetEpochSec.current;
      container.classList.add('cursor-grabbing');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - dragStartX.current;
      offsetEpochSec.current = dragStartOffset.current - deltaX * scaleSecPerPx.current;
      draw();
    };

    const endDrag = () => {
      isDragging.current = false;
      container.classList.remove('cursor-grabbing');
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const timeAtPointer = offsetEpochSec.current + pointerX * scaleSecPerPx.current;

      const zoomFactor = Math.exp(e.deltaY * 0.001); // smooth exponential zoom
      scaleSecPerPx.current = Math.min(Math.max(scaleSecPerPx.current * zoomFactor, maxSecPerPx), minSecPerPx);

      offsetEpochSec.current = timeAtPointer - pointerX * scaleSecPerPx.current;
      draw();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', endDrag);
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', endDrag);
      container.removeEventListener('wheel', onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black cursor-grab select-none">
      <canvas ref={canvasRef} />
    </div>
  );
} 