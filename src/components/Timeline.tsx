'use client';

import React, { useRef, useEffect, useState } from 'react';
import { nodes, branches, Node, Branch, MAIN_BRANCH } from './timelineData'; // Example data import
// Time constants
const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 60 * SECONDS_IN_MINUTE;
const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;
const SECONDS_IN_MONTH = 30 * SECONDS_IN_DAY; // Approximate for step calculation only
const SECONDS_IN_YEAR = 365.25 * SECONDS_IN_DAY; // Approximate for step calculation only

// Birth date: 1 Jan 1970 00:00 UTC
const BIRTH_DATE_EPOCH_SEC = 0; // Unix epoch

// Left padding when near birth date (in pixels)
const LEFT_PADDING = 100;

// Animation constants
// Mouse-wheel zoom uses this fixed duration (in ms)
const SCROLL_ANIMATION_DURATION = 300;
const VELOCITY_DECAY = 0.94; // Higher for more natural floating feel
const MIN_VELOCITY = 0.1; // Lower threshold for longer gliding

// Branch visualization constants
const BRANCH_SPACING = 60; // pixels between branches
const BRANCH_HEIGHT = 4; // height of branch line
const NODE_RADIUS = 6; // radius of node circles
const TOOLTIP_OFFSET = 10; // pixels offset for tooltip
const CONNECTOR_ARC_RADIUS = 10; // radius of the 90-degree arc in connectors

// Branch colors - more diverse palette with better variance
const BRANCH_COLORS = [
  '#DC2626', // Red
  '#B91C1C', // Dark Red
  '#7F1D1D', // Very Dark Red
  '#8B5CF6', // Purple
  '#7C3AED', // Violet
  '#6D28D9', // Purple
  '#4C1D95', // Dark Purple
  '#3730A3', // Indigo
  '#1E40AF', // Blue
  '#1D4ED8', // Blue
  '#2563EB', // Blue
  '#3B82F6', // Light Blue
  '#0EA5E9', // Sky Blue
  '#0891B2', // Cyan
  '#0D9488', // Teal
  '#059669', // Emerald
  '#16A34A', // Green
  '#65A30D', // Lime
  '#84CC16', // Light Green
  '#EAB308', // Yellow
  '#F59E0B', // Amber
  '#F97316', // Orange
  '#EA580C', // Dark Orange
  '#DC2626', // Red (cycle back)
  '#EF4444', // Light Red
  '#F87171', // Lighter Red
  '#FCA5A5', // Very Light Red
  '#FECACA', // Pink
  '#F9A8D4', // Pink
  '#EC4899', // Rose
  '#BE185D', // Dark Rose
  '#831843', // Very Dark Rose
];

// Rainbow confetti colors for birthday nodes
const RAINBOW_COLORS = [
  '#FF0000', // Red
  '#FF7F00', // Orange
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#0000FF', // Blue
  '#4B0082', // Indigo
  '#9400D3', // Violet
  '#FF69B4', // Hot Pink
  '#00FFFF', // Cyan
  '#FFD700', // Gold
];

// Function to get consistent color for a branch with better variance
function getBranchColor(branchId: string): string {
  // More complex hash function for better distribution
  let hash = 0;
  for (let i = 0; i < branchId.length; i++) {
    const char = branchId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use modulo to get index, but add some additional variance
  const baseIndex = Math.abs(hash) % BRANCH_COLORS.length;
  
  // Add additional variance based on string length and character sum
  const charSum = branchId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const varianceOffset = (charSum % 7) - 3; // -3 to +3 offset
  
  const finalIndex = (baseIndex + varianceOffset + BRANCH_COLORS.length) % BRANCH_COLORS.length;
  
  return BRANCH_COLORS[finalIndex];
}

// Candidate tick spacings (in seconds) ordered from fine → coarse
const TICK_STEPS: number[] = [
  1 * SECONDS_IN_MINUTE,    // 1 min
  5 * SECONDS_IN_MINUTE,    // 5 min
  15 * SECONDS_IN_MINUTE,   // 15 min
  30 * SECONDS_IN_MINUTE,   // 30 min
  1 * SECONDS_IN_HOUR,      // 1 hour
  3 * SECONDS_IN_HOUR,      // 3 hour
  6 * SECONDS_IN_HOUR,      // 6 hour
  12 * SECONDS_IN_HOUR,     // 12 hour
  1 * SECONDS_IN_DAY,       // 1 day
  7 * SECONDS_IN_DAY,       // 7 days
  1 * SECONDS_IN_MONTH,     // 1 mth
  3 * SECONDS_IN_MONTH,     // 3 mth
  6 * SECONDS_IN_MONTH,     // 6 mth
  1 * SECONDS_IN_YEAR,      // year
  5 * SECONDS_IN_YEAR,      // 5 year
  10 * SECONDS_IN_YEAR,     // 10 year
];

// Utility function to convert ISO date string to epoch seconds
function isoToEpochSeconds(isoString: string): number {
  return new Date(isoString).getTime() / 1000;
}

// Utility function to format date for tooltip
function formatDateForTooltip(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Easing function (ease out cubic)
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Ease-in-out cubic (symmetric)
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

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
 * Generate actual tick positions based on calendar dates
 */
function generateTicks(startEpochSec: number, endEpochSec: number, stepSec: number): number[] {
  const ticks: number[] = [];
  
  if (stepSec < SECONDS_IN_HOUR) {
    // Minutes: find a global reference point and generate from there
    const stepMinutes = stepSec / SECONDS_IN_MINUTE;
    // Use a fixed reference point (start of day) to ensure consistent positioning
    const referenceDate = new Date(startEpochSec * 1000);
    referenceDate.setHours(0, 0, 0, 0); // Start of the day in local timezone
    
    // Find the first tick at or before our start time
    let current = new Date(referenceDate);
    while (current.getTime() / 1000 > startEpochSec) {
      current.setMinutes(current.getMinutes() - stepMinutes);
    }
    while (current.getTime() / 1000 < startEpochSec) {
      current.setMinutes(current.getMinutes() + stepMinutes);
    }
    // Go back one step to ensure we start before the viewport
    current.setMinutes(current.getMinutes() - stepMinutes);
    
    while (current.getTime() / 1000 <= endEpochSec) {
      ticks.push(current.getTime() / 1000);
      current.setMinutes(current.getMinutes() + stepMinutes);
    }
  } else if (stepSec < SECONDS_IN_DAY) {
    // Hours: use start of day as reference
    const stepHours = stepSec / SECONDS_IN_HOUR;
    const referenceDate = new Date(startEpochSec * 1000);
    referenceDate.setHours(0, 0, 0, 0); // Start of the day in local timezone
    
    let current = new Date(referenceDate);
    while (current.getTime() / 1000 > startEpochSec) {
      current.setHours(current.getHours() - stepHours);
    }
    while (current.getTime() / 1000 < startEpochSec) {
      current.setHours(current.getHours() + stepHours);
    }
    current.setHours(current.getHours() - stepHours);
    
    while (current.getTime() / 1000 <= endEpochSec) {
      ticks.push(current.getTime() / 1000);
      current.setHours(current.getHours() + stepHours);
    }
  } else if (stepSec === 7 * SECONDS_IN_DAY) {
    // Special case for 7 days (weeks): use Unix epoch as reference since it was a Thursday
    // This ensures consistent weekly boundaries regardless of viewport
    const epochThursday = new Date(1970, 0, 1); // Jan 1, 1970 was a Thursday
    
    // Find the most recent Monday before or at our start time
    let current = new Date(startEpochSec * 1000);
    current.setHours(0, 0, 0, 0);
    
    // Go back to the most recent Monday (day 1, where Sunday = 0)
    const dayOfWeek = current.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days back, others = dayOfWeek - 1
    current.setDate(current.getDate() - daysToMonday);
    
    // Go back further to ensure we start before viewport
    while (current.getTime() / 1000 > startEpochSec) {
      current.setDate(current.getDate() - 7);
    }
    
    while (current.getTime() / 1000 <= endEpochSec) {
      ticks.push(current.getTime() / 1000);
      current.setDate(current.getDate() + 7);
    }
  } else if (stepSec < SECONDS_IN_MONTH) {
    // Days (other than 7): use start of month as reference
    const stepDays = Math.round(stepSec / SECONDS_IN_DAY);
    const referenceDate = new Date(startEpochSec * 1000);
    referenceDate.setDate(1);
    referenceDate.setHours(0, 0, 0, 0); // Start of the month in local timezone
    
    let current = new Date(referenceDate);
    while (current.getTime() / 1000 > startEpochSec) {
      current.setDate(current.getDate() - stepDays);
    }
    while (current.getTime() / 1000 < startEpochSec) {
      current.setDate(current.getDate() + stepDays);
    }
    current.setDate(current.getDate() - stepDays);
    
    while (current.getTime() / 1000 <= endEpochSec) {
      ticks.push(current.getTime() / 1000);
      current.setDate(current.getDate() + stepDays);
    }
  } else if (stepSec < SECONDS_IN_YEAR) {
    // Months: start from beginning of year
    const stepMonths = Math.round(stepSec / SECONDS_IN_MONTH);
    const startDate = new Date(startEpochSec * 1000);
    const startYear = startDate.getFullYear(); // Use local timezone
    
    let current = new Date(startYear, 0, 1, 0, 0, 0, 0); // Local timezone
    while (current.getTime() / 1000 > startEpochSec) {
      current.setMonth(current.getMonth() - stepMonths);
    }
    while (current.getTime() / 1000 < startEpochSec) {
      current.setMonth(current.getMonth() + stepMonths);
    }
    current.setMonth(current.getMonth() - stepMonths);
    
    while (current.getTime() / 1000 <= endEpochSec) {
      ticks.push(current.getTime() / 1000);
      current.setMonth(current.getMonth() + stepMonths);
    }
  } else {
    // Years: start from beginning of year, align to proper year boundaries
    const stepYears = Math.round(stepSec / SECONDS_IN_YEAR);
    const startDate = new Date(startEpochSec * 1000);
    const startYear = Math.floor(startDate.getFullYear() / stepYears) * stepYears; // Use local timezone
    
    let current = new Date(startYear, 0, 1, 0, 0, 0, 0); // Local timezone
    while (current.getTime() / 1000 <= endEpochSec) {
      ticks.push(current.getTime() / 1000);
      current.setFullYear(current.getFullYear() + stepYears);
    }
  }
  
  return ticks;
}

/**
 * Format a label for a given UNIX timestamp (in seconds) according to the current step size.
 */
function formatLabel(epochSec: number, stepSec: number) {
  const date = new Date(epochSec * 1000);

  if (stepSec < SECONDS_IN_DAY) {
    const dayPart = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const hourPart = `${date.toTimeString().substring(0, 2)}:${date.toTimeString().substring(3, 5)}`;
    return `${dayPart} ${hourPart}`;
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
  return date.getFullYear().toString(); // Use local timezone
}

/**
 * Draws a curved connector from a parent branch to a child branch at the start of the child branch.
 * The path is a vertical line from the parent, which then arcs 90 degrees into the child's horizontal line.
 * @returns The new starting X coordinate for the horizontal branch line.
 */
function drawCurvedConnector(
  ctx: CanvasRenderingContext2D,
  x: number, // The timestamp x-position for the connection
  parentY: number,
  childY: number,
  color: string,
  lineWidth: number
): number {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  const isGoingUp = childY < parentY;
  const arcRadius = CONNECTOR_ARC_RADIUS;

  // If distance is too small for an arc, draw a straight line.
  if (Math.abs(childY - parentY) < arcRadius) {
    ctx.beginPath();
    ctx.moveTo(x, parentY);
    ctx.lineTo(x, childY);
    ctx.stroke();
    return x; // No change in x
  }

  ctx.beginPath();
  if (isGoingUp) {
    // 1. Vertical line from parent up towards child
    ctx.moveTo(x, parentY);
    ctx.lineTo(x, childY + arcRadius);
    // 2. 90-degree arc turning right
    ctx.arc(x + arcRadius, childY + arcRadius, arcRadius, Math.PI, 1.5 * Math.PI, false);
  } else { // Going down
    // 1. Vertical line from parent down towards child
    ctx.moveTo(x, parentY);
    ctx.lineTo(x, childY - arcRadius);
    // 2. 90-degree arc turning right
    ctx.arc(x + arcRadius, childY - arcRadius, arcRadius, Math.PI, 0.5 * Math.PI, true);
  }
  ctx.stroke();

  // The horizontal line of the branch will now start after the arc.
  return x + arcRadius;
}


/**
 * Draws a curved connector from a child branch back to its parent at the end of the child branch.
 * The path is a horizontal line that arcs 90 degrees into a vertical line to the parent.
 * @returns The new ending X coordinate for the horizontal branch line.
 */
function drawCurvedEndConnector(
  ctx: CanvasRenderingContext2D,
  x: number, // The timestamp x-position for the connection
  parentY: number,
  childY: number,
  color: string,
  lineWidth: number
): number {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  const arcRadius = CONNECTOR_ARC_RADIUS;
  // The horizontal line of the branch should end before the curve starts.
  const branchLineEndX = x - arcRadius;

  if (Math.abs(childY - parentY) < arcRadius) {
    // Fallback to a straight line if there isn't enough vertical space for an arc.
    ctx.beginPath();
    ctx.moveTo(x, childY);
    ctx.lineTo(x, parentY);
    ctx.stroke();
    return x;
  }
  
  ctx.beginPath();
  // We start drawing from the end of the horizontal branch line.
  ctx.moveTo(branchLineEndX, childY);
  // arcTo will create a rounded corner at (x, childY) that curves towards the vertical line.
  ctx.arcTo(x, childY, x, parentY, arcRadius);
  // After the arc, continue the line to the parent's y-position.
  ctx.lineTo(x, parentY);
  ctx.stroke();

  // Return the calculated end point for the horizontal branch line.
  return branchLineEndX;
}

/**
 * Draws a rounded corner text box with outline at the specified position
 */
function drawRoundedTextBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  side: 'above' | 'below',
  size: { width: number; height: number }
) {
  // Text styling
  ctx.font = '12px Lora, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  
  // Measure text dimensions
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = 16; // Approximate line height
  
  // Box dimensions with padding
  const padding = 8;
  const boxWidth = textWidth + padding * 2;
  const boxHeight = textHeight + padding * 2;
  const cornerRadius = 6;
  
  // Position the box vertically centered with the branch line end
  const boxX = x + 10; // Offset from the branch end
  const boxY = y - boxHeight / 2; // Center vertically with the branch line
  
  // Only draw if box is visible
  if (boxX + boxWidth < 0 || boxX > size.width) return;
  
  // Draw rounded rectangle outline only (no background fill)
  ctx.strokeStyle = color; // Use accent color for outline
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + cornerRadius, boxY);
  ctx.lineTo(boxX + boxWidth - cornerRadius, boxY);
  ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + cornerRadius);
  ctx.lineTo(boxX + boxWidth, boxY + boxHeight - cornerRadius);
  ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - cornerRadius, boxY + boxHeight);
  ctx.lineTo(boxX + cornerRadius, boxY + boxHeight);
  ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - cornerRadius);
  ctx.lineTo(boxX, boxY + cornerRadius);
  ctx.quadraticCurveTo(boxX, boxY, boxX + cornerRadius, boxY);
  ctx.closePath();
  ctx.stroke();
  
  // Draw text in accent color
  ctx.fillStyle = color;
  ctx.fillText(text, boxX + padding, boxY + boxHeight / 2);
}

// Function to check if a node is a birthday node
function isBirthdayNode(node: any): boolean {
  return node.content.toLowerCase().includes('birthday') || 
         node.uuid === 'birthday-node';
}

// Function to draw a rainbow confetti birthday node
function drawBirthdayNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number = 20 // Extra large size for birthday nodes
) {
  // Draw background outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Create rainbow confetti pattern inside the circle
  const numConfetti = 12;
  const confettiSize = 3;
  
  for (let i = 0; i < numConfetti; i++) {
    // Random position within the circle
    const angle = (i / numConfetti) * 2 * Math.PI;
    const radius = Math.random() * (size - confettiSize - 2);
    const confettiX = x + radius * Math.cos(angle);
    const confettiY = y + radius * Math.sin(angle);
    
    // Random rainbow color
    const colorIndex = Math.floor(Math.random() * RAINBOW_COLORS.length);
    ctx.fillStyle = RAINBOW_COLORS[colorIndex];
    
    // Draw confetti piece (small square)
    ctx.fillRect(
      confettiX - confettiSize/2, 
      confettiY - confettiSize/2, 
      confettiSize, 
      confettiSize
    );
  }
  
  // Add some sparkle effects
  const sparkleCount = 6;
  for (let i = 0; i < sparkleCount; i++) {
    const sparkleAngle = (i / sparkleCount) * 2 * Math.PI;
    const sparkleRadius = size + 8;
    const sparkleX = x + sparkleRadius * Math.cos(sparkleAngle);
    const sparkleY = y + sparkleRadius * Math.sin(sparkleAngle);
    
    ctx.fillStyle = RAINBOW_COLORS[i % RAINBOW_COLORS.length];
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, 2, 0, 2 * Math.PI);
    ctx.fill();
  }
}

export default function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas (CSS) pixel dimensions
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  // Current time state (updated every minute)
  const [currentTime, setCurrentTime] = useState(() => Date.now() / 1000);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
    type: 'branch' | 'node';
  } | null>(null);

  // State kept in refs to avoid re-render loops while panning/zooming
  const scaleSecPerPx = useRef<number>(1); // seconds represented by one CSS pixel
  const offsetEpochSec = useRef<number>(0); // UNIX time (seconds) at x = 0
  const offsetY = useRef<number>(0); // vertical offset in pixels
  const offsetX = useRef<number>(0); // horizontal offset in pixels (for momentum)

  // Animation state
  const animationId = useRef<number>(0);
  const velocityX = useRef<number>(0);
  const velocityY = useRef<number>(0);
  const isAnimating = useRef<boolean>(false);

  // Generic animation state for any smooth zoom/pan operation (mouse-wheel or programmatic)
  const zoomAnimation = useRef<{
    startScale: number;
    targetScale: number;
    startOffset: number;
    targetOffset: number;
    startOffsetY?: number;
    targetOffsetY?: number;
    startTime: number;
    pointerX: number;
    easing?: (t: number) => number;
    duration?: number; // custom duration per animation
  } | null>(null);

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartOffset = useRef(0);
  const dragStartOffsetY = useRef(0);
  const lastDragTime = useRef<number>(0);
  const lastDragX = useRef<number>(0);
  const lastDragY = useRef<number>(0);

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => setCurrentTime(Date.now() / 1000);
    updateTime();
    
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Animation loop
  const animate = () => {
    let needsRedraw = false;

    // Handle zoom animation
    if (zoomAnimation.current) {
      const now = Date.now();
      const elapsed = now - zoomAnimation.current.startTime;
      const totalDuration = zoomAnimation.current.duration ?? SCROLL_ANIMATION_DURATION;
      const progress = Math.min(elapsed / totalDuration, 1);
      const easingFn = zoomAnimation.current.easing || easeOutCubic;
      const easedProgress = easingFn(progress);

      // Interpolate scale and offset
      scaleSecPerPx.current = zoomAnimation.current.startScale + 
        (zoomAnimation.current.targetScale - zoomAnimation.current.startScale) * easedProgress;
      
      offsetEpochSec.current = zoomAnimation.current.startOffset + 
        (zoomAnimation.current.targetOffset - zoomAnimation.current.startOffset) * easedProgress;

      // Optional vertical interpolation (only when provided)
      if (typeof zoomAnimation.current.startOffsetY === 'number' && typeof zoomAnimation.current.targetOffsetY === 'number') {
        offsetY.current = zoomAnimation.current.startOffsetY +
          (zoomAnimation.current.targetOffsetY - zoomAnimation.current.startOffsetY) * easedProgress;
      }

      needsRedraw = true;

      if (progress >= 1) {
        zoomAnimation.current = null;
      }
    }

    // Handle momentum animation
    if (isAnimating.current && !isDragging.current) {
      const absVelX = Math.abs(velocityX.current);
      const absVelY = Math.abs(velocityY.current);

      if (absVelX > MIN_VELOCITY || absVelY > MIN_VELOCITY) {
        /**
         * Horizontal momentum ------------------------------------------------
         * Convert the stored pixel velocity to seconds and apply it directly to
         * the timeline offset. Stop when birth date reaches the desired position.
         */
        const proposedOffset = offsetEpochSec.current - velocityX.current * scaleSecPerPx.current;
        
        // Calculate minimum offset so birth date appears at LEFT_PADDING pixels from left edge
        // birthX = (BIRTH_DATE_EPOCH_SEC - offsetSec) / secPerPx = LEFT_PADDING
        // So: offsetSec = BIRTH_DATE_EPOCH_SEC - LEFT_PADDING * secPerPx
        const minOffset = BIRTH_DATE_EPOCH_SEC - LEFT_PADDING * scaleSecPerPx.current;
        
        if (proposedOffset < minOffset) {
          offsetEpochSec.current = minOffset;
          velocityX.current = 0;
        } else {
          offsetEpochSec.current = proposedOffset;
          velocityX.current *= VELOCITY_DECAY;
        }

        /**
         * Vertical momentum --------------------------------------------------
         * Still expressed in pixel units because the vertical axis is screen
         * based, not time based.
         */
        offsetY.current += velocityY.current;
        velocityY.current *= VELOCITY_DECAY;

        needsRedraw = true;
      } else {
        isAnimating.current = false;
        velocityX.current = 0;
        velocityY.current = 0;
      }
    }

    if (needsRedraw) {
      draw();
    }

    if (zoomAnimation.current || isAnimating.current) {
      animationId.current = requestAnimationFrame(animate);
    }
  };

  // Start animation loop when needed
  const startAnimation = () => {
    if (animationId.current) {
      cancelAnimationFrame(animationId.current);
    }
    animationId.current = requestAnimationFrame(animate);
  };

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

    // Initial view: 70 years span with birth date at left edge
    const totalTimeSpan = 70 * SECONDS_IN_YEAR; // 70 years total span
    
    scaleSecPerPx.current = totalTimeSpan / size.width;
    
    // Clamp to zoom limits
    scaleSecPerPx.current = Math.max(Math.min(scaleSecPerPx.current, minSecPerPx), maxSecPerPx);

    // Position birth date at LEFT_PADDING pixels from left edge (same logic as momentum animation)
    // birthX = (BIRTH_DATE_EPOCH_SEC - offsetSec) / secPerPx = LEFT_PADDING
    // So: offsetSec = BIRTH_DATE_EPOCH_SEC - LEFT_PADDING * secPerPx
    offsetEpochSec.current = BIRTH_DATE_EPOCH_SEC - LEFT_PADDING * scaleSecPerPx.current;

    // Initialize vertical offset to center
    offsetY.current = 0;

    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, currentTime]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, []);

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

    const centreY = size.height / 2 + offsetY.current; // Apply vertical offset
    const secPerPx = scaleSecPerPx.current;
    const offsetSec = offsetEpochSec.current;

    // Calculate timeline boundaries
    const birthX = (BIRTH_DATE_EPOCH_SEC - offsetSec) / secPerPx;
    const todayX = (currentTime - offsetSec) / secPerPx;

    // No dynamic padding - keep everything simple
    const leftPadding = 0;

    // Calculate positions (no adjustment needed)
    const adjustedBirthX = birthX;
    const adjustedTodayX = todayX;

    // Main horizontal timeline (from birth to today only), with left padding
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Ensure we draw from the visible start to the visible end
    const timelineStartX = Math.max(0, adjustedBirthX);
    const timelineEndX = Math.min(size.width, adjustedTodayX);
    
    if (timelineEndX > timelineStartX) {
      ctx.moveTo(timelineStartX, centreY);
      ctx.lineTo(timelineEndX, centreY);
      ctx.stroke();
    }

    // Determine two tick steps (current coarse and next finer) for cross-fading
    const MIN_TICK_PX = 150;
    const coarseStep = chooseTickStep(secPerPx, MIN_TICK_PX);
    const stepIndex = TICK_STEPS.indexOf(coarseStep);
    const fineStep = stepIndex > 0 ? TICK_STEPS[stepIndex - 1] : null;

    // Cross-fade based on how far the pixel spacing of the COARSE step has travelled
    const coarsePxSpacing = coarseStep / secPerPx;
    const fadeProgress = Math.min(1, Math.max(0, (coarsePxSpacing - MIN_TICK_PX) / MIN_TICK_PX));

    // When coarse spacing is exactly MIN_TICK_PX we show only coarse (alpha = 1)
    // As it approaches 2×MIN_TICK_PX we fade to fine.
    const coarseAlpha = 1 - fadeProgress;
    const fineAlpha = fineStep !== null ? fadeProgress : 0;

    // Helper to draw a tick step with specified alpha
    const drawStep = (step: number, alpha: number) => {
      if (alpha <= 0) return;
      const ticks = generateTicks(offsetSec - step * 2, offsetSec + secPerPx * size.width + step * 2, step);
      ctx.globalAlpha = alpha;

      for (const t of ticks) {
        const x = (t - offsetSec) / secPerPx;
        if (x < -50 || x > size.width + 50) continue;

        // Grey full-height bar (for all times ≥ birth date)
        if (t >= BIRTH_DATE_EPOCH_SEC) {
          ctx.strokeStyle = '#444444';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, size.height);
          ctx.stroke();

          // Labels at top (skip for 1-minute granularity)
          if (step !== SECONDS_IN_MINUTE) {
            ctx.font = '12px Lora, serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#FFFFFF';
            const label = formatLabel(t, step);

            if ((step < SECONDS_IN_DAY) && label.includes(' ')) {
              const parts = label.split(' ');
              ctx.fillText(parts[0] + ' ' + parts[1], x + 5, 10);
              ctx.fillText(parts[2], x + 5, 25);
            } else {
              ctx.fillText(label, x + 5, 10);
            }
          }
        }

        // White tick on main timeline within birth-to-today
        if (t >= BIRTH_DATE_EPOCH_SEC && t <= currentTime) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, centreY - 8);
          ctx.lineTo(x, centreY + 8);
          ctx.stroke();
        }
      }
    };

    // Draw coarse then fine so fine (more detailed) appears on top if both visible
    drawStep(coarseStep, coarseAlpha);
    if (fineStep !== null) drawStep(fineStep, fineAlpha);

    // Reset alpha
    ctx.globalAlpha = 1;

    // ───────────────────────── Branch and Node Visualization ─────────────────────────
    
    // Calculate branch positions (vertical spacing) with improved distribution
    const branchPositions = new Map<string, number>();
    const branchSide = new Map<string, 'above' | 'below'>(); // Track which side each branch is on

    // Place the main "Life" branch at center
    branchPositions.set(MAIN_BRANCH, centreY);
    branchSide.set(MAIN_BRANCH, 'above'); // Main branch doesn't need special text positioning

    // Get all non-main branches
    const otherBranches = branches.filter(b => b.branchId !== MAIN_BRANCH);
    
    // Sort branches by start date for more logical distribution
    otherBranches.sort((a, b) => {
      const aStart = isoToEpochSeconds(a.branchStart);
      const bStart = isoToEpochSeconds(b.branchStart);
      return aStart - bStart;
    });

    // Distribute branches above and below the main branch
    // Use alternating pattern but also consider branch relationships
    otherBranches.forEach((branch, idx) => {
      // Determine if branch should go above or below
      // Use a pattern that alternates but also considers branch relationships
      let side: 'above' | 'below';
      
      if (branch.parentBranchId === MAIN_BRANCH) {
        // Direct children of main branch alternate above/below
        side = idx % 2 === 0 ? 'above' : 'below';
      } else {
        // Sub-branches (like fraternity under MIT) go on the same side as their parent
        const parentSide = branchSide.get(branch.parentBranchId!);
        side = parentSide || 'above'; // Default to above for sub-branches
      }
      
      branchSide.set(branch.branchId, side);
      
      // Calculate vertical position
      // Count how many branches are already on this side
      const branchesOnSameSide = otherBranches
        .slice(0, idx)
        .filter(b => branchSide.get(b.branchId) === side).length;
      
      const branchIndex = branchesOnSameSide + 1; // +1 because we start counting from 1
      const branchY = side === 'above' 
        ? centreY - branchIndex * BRANCH_SPACING
        : centreY + branchIndex * BRANCH_SPACING;
      
      branchPositions.set(branch.branchId, branchY);
    });

    // Draw branches (skip the main "Life" branch so its line is invisible)
    branches.forEach(branch => {
      if (branch.branchId === MAIN_BRANCH) {
        return; // Don't draw the "Life" branch line; its nodes will still render
      }

      const branchY = branchPositions.get(branch.branchId);
      const side = branchSide.get(branch.branchId);
      if (branchY === undefined || side === undefined) return;

      const startEpoch = isoToEpochSeconds(branch.branchStart);
      const endEpoch = branch.branchEnd ? isoToEpochSeconds(branch.branchEnd) : currentTime;
      
      let startX = (startEpoch - offsetSec) / secPerPx;
      let endX = (endEpoch - offsetSec) / secPerPx;

      // Only draw if branch is visible
      if (endX < 0 || startX > size.width) return;
      
      let finalStartX = startX;
      let finalEndX = endX;

      // Draw perpendicular connector to parent branch at start
      const parentBranchId = branch.parentBranchId;
      if (parentBranchId) {
        const parentBranchY = branchPositions.get(parentBranchId);
        if (parentBranchY !== undefined && parentBranchY !== null) {
          
          // Draw connector at start point and get new start for the horizontal line
          if (startX >= 0 && startX <= size.width) {
             finalStartX = drawCurvedConnector(ctx, startX, parentBranchY, branchY, getBranchColor(branch.branchId), BRANCH_HEIGHT);
          }
          
          // Draw connector at end point (if branch has an end)
          if (branch.branchEnd && endX >= 0 && endX <= size.width) {
            finalEndX = drawCurvedEndConnector(ctx, endX, parentBranchY, branchY, getBranchColor(branch.branchId), BRANCH_HEIGHT);
          }
        }
      }

      // Draw branch line, adjusted for the connectors
      ctx.strokeStyle = getBranchColor(branch.branchId);
      ctx.lineWidth = BRANCH_HEIGHT;
      ctx.beginPath();
      ctx.moveTo(Math.max(0, finalStartX), branchY);
      ctx.lineTo(Math.min(size.width, finalEndX), branchY);
      ctx.stroke();

      // Draw branch start marker
      if (startX >= -10 && startX <= size.width + 10) {
        // Draw marker on parent branch position
        const parentBranchId = branch.parentBranchId;
        const parentBranchY = parentBranchId ? branchPositions.get(parentBranchId) : branchY;
        const markerY = parentBranchY !== undefined ? parentBranchY : branchY;
        
        const branchColor = getBranchColor(branch.branchId);
        
        // Draw background outline first
        ctx.strokeStyle = '#000000'; // Black background outline
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(startX, markerY, 8, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw accent color fill
        ctx.fillStyle = branchColor;
        ctx.beginPath();
        ctx.arc(startX, markerY, 7, 0, 2 * Math.PI);
        ctx.fill();
        
        // Branch name label - position based on side
        ctx.font = '14px Lora, serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = getBranchColor(branch.branchId);
        
        const labelY = side === 'above' ? branchY - 15 : branchY + 15;
        ctx.fillText(branch.branchName, startX, labelY);
      } else if (startX < -10 && endX > 0) {
        // Start node is off-screen to the left, but branch line is still visible
        // Position label at left edge of window
        ctx.font = '14px Lora, serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = getBranchColor(branch.branchId);
        
        const labelY = side === 'above' ? branchY - 15 : branchY + 15;
        ctx.fillText(branch.branchName, 0, labelY);
      }

      // Draw branch end marker (if not ongoing)
      if (branch.branchEnd && endX >= -10 && endX <= size.width + 10) {
        // Draw marker on parent branch position
        const parentBranchId = branch.parentBranchId;
        const parentBranchY = parentBranchId ? branchPositions.get(parentBranchId) : branchY;
        const markerY = parentBranchY !== undefined ? parentBranchY : branchY;
        
        const branchColor = getBranchColor(branch.branchId);
        
        // Draw background outline first
        ctx.strokeStyle = '#000000'; // Black background outline
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(endX, markerY, 8, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw accent color fill
        ctx.fillStyle = branchColor;
        ctx.beginPath();
        ctx.arc(endX, markerY, 7, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Draw text box for open-ended branches at "today" terminal
      if (!branch.branchEnd && endX >= -50 && endX <= size.width + 50) {
        // This is an open-ended branch that extends to today
        // Draw a text box with the branch summary at the "today" terminal
        drawRoundedTextBox(
          ctx,
          endX,
          branchY,
          branch.branchSummary,
          getBranchColor(branch.branchId),
          side,
          size
        );
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const branchY = branchPositions.get(node.branchId);
      const side = branchSide.get(node.branchId);
      if (branchY === undefined || side === undefined) return;

      const nodeEpoch = isoToEpochSeconds(node.timeStamp);
      const nodeX = (nodeEpoch - offsetSec) / secPerPx;

      // Only draw if node is visible
      if (nodeX < -20 || nodeX > size.width + 20) return;

      // Check if this is a birthday node and render specially
      if (isBirthdayNode(node)) {
        drawBirthdayNode(ctx, nodeX, branchY, 20); // Extra large size for birthday
        
        // Draw birthday label with special styling
        const shortContent = node.content.length > 30 ? node.content.substring(0, 30) + '...' : node.content;
        ctx.font = 'bold 14px Lora, serif'; // Bold and larger font for birthday
        ctx.textAlign = 'center';
        ctx.textBaseline = side === 'above' ? 'top' : 'bottom';
        ctx.fillStyle = '#FFD700'; // Gold color for birthday text
        
        const labelY = side === 'above' ? branchY + 35 : branchY - 35; // More offset due to larger node
        ctx.fillText(shortContent, nodeX, labelY);
      } else {
        // Regular node rendering
        const branchColor = getBranchColor(node.branchId);
        
        // Draw background outline first
        ctx.strokeStyle = '#000000'; // Black background outline
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(nodeX, branchY, NODE_RADIUS, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw accent color fill
        ctx.fillStyle = branchColor;
        ctx.beginPath();
        ctx.arc(nodeX, branchY, NODE_RADIUS - 1, 0, 2 * Math.PI);
        ctx.fill();

        // Draw node label - position based on side
        const shortContent = node.content.length > 30 ? node.content.substring(0, 30) + '...' : node.content;
        ctx.font = '12px Lora, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = side === 'above' ? 'top' : 'bottom';
        ctx.fillStyle = '#FFFFFF';
        
        const labelY = side === 'above' ? branchY + 15 : branchY - 15;
        ctx.fillText(shortContent, nodeX, labelY);
      }
    });

    // Red "today" line (unchanged)
    if (todayX >= 0 && todayX <= size.width) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(todayX, 0);
      ctx.lineTo(todayX, size.height);
      ctx.stroke();
    }
  };

  // Redraw when currentTime changes
  useEffect(() => {
    draw();
  }, [currentTime, size.width, size.height]);

  // ───────────────────────── Interaction (pan/zoom) ───────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const minSecPerPx = (80 * SECONDS_IN_YEAR) / size.width;
    const maxSecPerPx = (1 * SECONDS_IN_HOUR) / size.width;

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartY.current = e.clientY;
      dragStartOffset.current = offsetEpochSec.current;
      dragStartOffsetY.current = offsetY.current;
      lastDragTime.current = Date.now();
      lastDragX.current = e.clientX;
      lastDragY.current = e.clientY;
      
      // Reset pixel offset for new drag
      offsetX.current = 0;
      
      // Stop any ongoing animation
      isAnimating.current = false;
      velocityX.current = 0;
      velocityY.current = 0;
      
      container.classList.add('cursor-grabbing');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const now = Date.now();
      const deltaTime = now - lastDragTime.current;
      const deltaX = e.clientX - dragStartX.current;
      const deltaY = e.clientY - dragStartY.current;
      
      // Calculate velocity for momentum - make it more responsive to drag speed
      if (deltaTime > 0 && deltaTime < 50) { // Only calculate velocity for recent movements
        const currentVelX = (e.clientX - lastDragX.current) / Math.max(deltaTime, 1) * 16;
        const currentVelY = (e.clientY - lastDragY.current) / Math.max(deltaTime, 1) * 16;
        
        // Less aggressive capping for more natural feel
        const maxVel = 20;
        const cappedVelX = Math.max(-maxVel, Math.min(maxVel, currentVelX));
        const cappedVelY = Math.max(-maxVel, Math.min(maxVel, currentVelY));
        
        // More responsive velocity tracking (less smoothing)
        velocityX.current = velocityX.current * 0.5 + cappedVelX * 0.5;
        velocityY.current = velocityY.current * 0.5 + cappedVelY * 0.5;
      }
      
      // Update pixel-based offsets
      offsetX.current = -deltaX; // Negative because dragging right should move timeline left
      offsetY.current = dragStartOffsetY.current + deltaY;
      
      // Convert pixel offset to timeline offset for drawing
      const proposedTimelineOffset = dragStartOffset.current + offsetX.current * scaleSecPerPx.current;
      const minOffset = BIRTH_DATE_EPOCH_SEC - LEFT_PADDING * scaleSecPerPx.current;
      offsetEpochSec.current = Math.max(proposedTimelineOffset, minOffset);
      
      lastDragTime.current = now;
      lastDragX.current = e.clientX;
      lastDragY.current = e.clientY;
      
      draw();
    };

    // Tooltip detection
    const onMouseMoveForTooltip = (e: MouseEvent) => {
      if (isDragging.current) return;
      
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const centreY = size.height / 2 + offsetY.current;
      const secPerPx = scaleSecPerPx.current;
      const offsetSec = offsetEpochSec.current;
      
      // Calculate branch positions using the same algorithm as the drawing function
      const branchPositions = new Map<string, number>();
      const branchSide = new Map<string, 'above' | 'below'>();

      // Place the main "Life" branch at center
      branchPositions.set(MAIN_BRANCH, centreY);
      branchSide.set(MAIN_BRANCH, 'above');

      // Get all non-main branches
      const otherBranches = branches.filter(b => b.branchId !== MAIN_BRANCH);
      
      // Sort branches by start date for more logical distribution
      otherBranches.sort((a, b) => {
        const aStart = isoToEpochSeconds(a.branchStart);
        const bStart = isoToEpochSeconds(b.branchStart);
        return aStart - bStart;
      });

      // Distribute branches above and below the main branch
      otherBranches.forEach((branch, idx) => {
        // Determine if branch should go above or below
        let side: 'above' | 'below';
        
        if (branch.parentBranchId === MAIN_BRANCH) {
          // Direct children of main branch alternate above/below
          side = idx % 2 === 0 ? 'above' : 'below';
        } else {
          // Sub-branches (like fraternity under MIT) go on the same side as their parent
          const parentSide = branchSide.get(branch.parentBranchId!);
          side = parentSide || 'above'; // Default to above for sub-branches
        }
        
        branchSide.set(branch.branchId, side);
        
        // Calculate vertical position
        // Count how many branches are already on this side
        const branchesOnSameSide = otherBranches
          .slice(0, idx)
          .filter(b => branchSide.get(b.branchId) === side).length;
        
        const branchIndex = branchesOnSameSide + 1;
        const branchY = side === 'above' 
          ? centreY - branchIndex * BRANCH_SPACING
          : centreY + branchIndex * BRANCH_SPACING;
        
        branchPositions.set(branch.branchId, branchY);
      });

      let foundTooltip = false;

      // Check for branch hover
      branches.forEach(branch => {
        const branchY = branchPositions.get(branch.branchId);
        if (branchY === undefined) return;

        const startEpoch = isoToEpochSeconds(branch.branchStart);
        const endEpoch = branch.branchEnd ? isoToEpochSeconds(branch.branchEnd) : currentTime;
        
        const startX = (startEpoch - offsetSec) / secPerPx;
        const endX = (endEpoch - offsetSec) / secPerPx;

        // Check if mouse is over branch line
        if (mouseX >= startX - 5 && mouseX <= endX + 5 && 
            mouseY >= branchY - BRANCH_HEIGHT/2 && mouseY <= branchY + BRANCH_HEIGHT/2) {
          
          const tooltipContent = `
            <strong>${branch.branchName}</strong><br/>
            Start: ${formatDateForTooltip(branch.branchStart)}<br/>
            ${branch.branchEnd ? `End: ${formatDateForTooltip(branch.branchEnd)}` : 'Ongoing'}<br/>
            <em>${branch.branchSummary}</em>
          `;
          
          setTooltip({
            x: e.clientX + TOOLTIP_OFFSET,
            y: e.clientY + TOOLTIP_OFFSET,
            content: tooltipContent,
            type: 'branch'
          });
          foundTooltip = true;
        }
      });

      // Check for branch start/end markers (child branches on parent positions)
      branches.forEach(branch => {
        if (branch.branchId === MAIN_BRANCH) return; // Skip main branch
        
        const startEpoch = isoToEpochSeconds(branch.branchStart);
        const endEpoch = branch.branchEnd ? isoToEpochSeconds(branch.branchEnd) : null;
        
        const startX = (startEpoch - offsetSec) / secPerPx;
        const endX = endEpoch ? (endEpoch - offsetSec) / secPerPx : null;

        // Get parent branch position for marker placement
        const parentBranchId = branch.parentBranchId;
        const parentBranchY = parentBranchId ? branchPositions.get(parentBranchId) : null;
        if (parentBranchY === undefined || parentBranchY === null) return;

        // Check start marker
        if (startX >= -10 && startX <= size.width + 10) {
          const distance = Math.sqrt((mouseX - startX) ** 2 + (mouseY - parentBranchY) ** 2);
          if (distance <= 8) { // Same radius as marker
            const tooltipContent = `
              <strong>${branch.branchName} begins</strong><br/>
              Date: ${formatDateForTooltip(branch.branchStart)}<br/>
              <em>${branch.branchSummary}</em>
            `;
            
            setTooltip({
              x: e.clientX + TOOLTIP_OFFSET,
              y: e.clientY + TOOLTIP_OFFSET,
              content: tooltipContent,
              type: 'branch'
            });
            foundTooltip = true;
          }
        }

        // Check end marker (if branch has an end)
        if (endEpoch && endX !== null && endX >= -10 && endX <= size.width + 10) {
          const distance = Math.sqrt((mouseX - endX) ** 2 + (mouseY - parentBranchY) ** 2);
          if (distance <= 8) { // Same radius as marker
            const tooltipContent = `
              <strong>${branch.branchName} ends</strong><br/>
              Date: ${formatDateForTooltip(branch.branchEnd!)}<br/>
              <em>${branch.branchSummary}</em>
            `;
            
            setTooltip({
              x: e.clientX + TOOLTIP_OFFSET,
              y: e.clientY + TOOLTIP_OFFSET,
              content: tooltipContent,
              type: 'branch'
            });
            foundTooltip = true;
          }
        }
      });

      // Check for node hover
      nodes.forEach(node => {
        const branchY = branchPositions.get(node.branchId);
        if (branchY === undefined) return;

        const nodeEpoch = isoToEpochSeconds(node.timeStamp);
        const nodeX = (nodeEpoch - offsetSec) / secPerPx;

        // Check if mouse is over node circle
        const distance = Math.sqrt((mouseX - nodeX) ** 2 + (mouseY - branchY) ** 2);
        if (distance <= NODE_RADIUS + 5) {
          const tooltipContent = `
            <strong>Event</strong><br/>
            Date: ${formatDateForTooltip(node.timeStamp)}<br/>
            <em>${node.content}</em>
          `;
          
          setTooltip({
            x: e.clientX + TOOLTIP_OFFSET,
            y: e.clientY + TOOLTIP_OFFSET,
            content: tooltipContent,
            type: 'node'
          });
          foundTooltip = true;
        }
      });

      if (!foundTooltip) {
        setTooltip(null);
      }
    };

    const endDrag = () => {
      if (isDragging.current) {
        isDragging.current = false;
        container.classList.remove('cursor-grabbing');
        
        // Keep both horizontal and vertical in pixel units for consistency
        velocityX.current = velocityX.current * 0.8; // Same as vertical now
        velocityY.current = velocityY.current * 0.8;
        
        // Start momentum animation if velocity is significant
        const absVelX = Math.abs(velocityX.current);
        const absVelY = Math.abs(velocityY.current);
        
        if (absVelX > MIN_VELOCITY || absVelY > MIN_VELOCITY) {
          isAnimating.current = true;
          startAnimation();
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      
      // Account for left padding in zoom calculations
      const secPerPx = scaleSecPerPx.current;
      const offsetSec = offsetEpochSec.current;
      const birthX = (BIRTH_DATE_EPOCH_SEC - offsetSec) / secPerPx;
      const leftPadding = birthX >= 0 && birthX <= LEFT_PADDING ? LEFT_PADDING - birthX : 0;
      
      const adjustedPointerX = pointerX - leftPadding;
      const timeAtPointer = offsetEpochSec.current + adjustedPointerX * scaleSecPerPx.current;

      const zoomFactor = Math.exp(e.deltaY * 0.007);
      const targetScale = Math.min(Math.max(scaleSecPerPx.current * zoomFactor, maxSecPerPx), minSecPerPx);
      const targetOffset = Math.max(timeAtPointer - adjustedPointerX * targetScale, BIRTH_DATE_EPOCH_SEC - LEFT_PADDING * targetScale);

      // For now, let's use immediate zoom to test if the issue is with animation
      if (Math.abs(targetScale - scaleSecPerPx.current) < 0.001) {
        // No significant change, skip animation
        return;
      }

      // Start zoom animation
      zoomAnimation.current = {
        startScale: scaleSecPerPx.current,
        targetScale: targetScale,
        startOffset: offsetEpochSec.current,
        targetOffset: targetOffset,
        startTime: Date.now(),
        pointerX: adjustedPointerX,
        easing: easeOutCubic,
        duration: SCROLL_ANIMATION_DURATION,
      };

      startAnimation();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', endDrag);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('mousemove', onMouseMoveForTooltip);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', endDrag);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('mousemove', onMouseMoveForTooltip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, currentTime]);

  /**
   * Programmatically move/zoom the viewport so that a given (timestamp, y) pair
   * appears at the exact centre of the screen, using a smooth ease-in-out
   * transition. `granularity` is interpreted as the desired seconds-per-pixel
   * after the animation completes.
   */
  const focusViewportToLoc = (timestamp: number, y: number, granularity: number) => {
    if (size.width === 0 || size.height === 0) return;

    const minSecPerPx = (80 * SECONDS_IN_YEAR) / size.width;   // Same limits as elsewhere
    const maxSecPerPx = (1 * SECONDS_IN_HOUR) / size.width;

    // Clamp desired zoom level to limits
    const targetScale = Math.max(Math.min(granularity, minSecPerPx), maxSecPerPx);

    // Horizontal offset so that `timestamp` sits at the horizontal midpoint
    const halfW = size.width / 2;
    let targetOffset = timestamp - halfW * targetScale;

    // Respect birth-date left boundary (with padding)
    const minOffset = BIRTH_DATE_EPOCH_SEC - LEFT_PADDING * targetScale;
    if (targetOffset < minOffset) targetOffset = minOffset;

    // Vertical offset so that supplied y aligns with vertical midpoint
    const targetOffsetY = (size.height / 2) - y;

    // Compute dynamic duration based on travel distance & zoom ratio
    const horizontalDistPx = Math.abs((targetOffset - offsetEpochSec.current) / scaleSecPerPx.current);
    const verticalDistPx = Math.abs(targetOffsetY - offsetY.current);
    const zoomRatio = Math.abs(Math.log(targetScale / scaleSecPerPx.current));

    const distanceScore = Math.sqrt(horizontalDistPx ** 2 + verticalDistPx ** 2);
    let dynamicDuration = 250 + distanceScore * 0.3 + zoomRatio * 350; // ms
    dynamicDuration = Math.max(300, Math.min(1500, dynamicDuration));

    // Kick off animation
    zoomAnimation.current = {
      startScale: scaleSecPerPx.current,
      targetScale,
      startOffset: offsetEpochSec.current,
      targetOffset,
      startOffsetY: offsetY.current,
      targetOffsetY,
      startTime: Date.now(),
      pointerX: 0,
      easing: easeInOutCubic,
      duration: dynamicDuration,
    };

    startAnimation();
  };

  /** Convenience helpers --------------------------------------------------*/
  const focusTodayView = () => {
    if (size.width === 0 || size.height === 0) return;

    const timestamp = Date.now() / 1000;

    // Match the "initial" 8-hour history view set in the initial effect.
    const historySeconds = 8 * SECONDS_IN_HOUR;
    const futureSeconds = (historySeconds * 0.4) / 0.6;
    const totalTimeSpan = historySeconds + futureSeconds;
    const granularity = totalTimeSpan / size.width;

    focusViewportToLoc(timestamp, size.height / 2, granularity);
  };

  const focusBirthdayView = () => {
    if (size.width === 0 || size.height === 0) return;

    const granularity = SECONDS_IN_DAY / size.width; // One day across the screen

    focusViewportToLoc(BIRTH_DATE_EPOCH_SEC, size.height / 2, granularity);
  };

  // Expose helpers globally for debugging / external triggers
  useEffect(() => {
    const w = window as any;
    w.focusViewportToLoc = focusViewportToLoc;
    w.focusTodayView = focusTodayView;
    w.focusBirthdayView = focusBirthdayView;
    return () => {
      delete w.focusViewportToLoc;
      delete w.focusTodayView;
      delete w.focusBirthdayView;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black cursor-grab select-none font-lora relative">
      <canvas ref={canvasRef} />
      
      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm max-w-xs pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
} 