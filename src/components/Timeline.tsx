'use client';

import React, { useRef, useEffect, useState } from 'react';

// Time constants
const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 60 * SECONDS_IN_MINUTE;
const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;
const SECONDS_IN_WEEK = 7 * SECONDS_IN_DAY;
const SECONDS_IN_MONTH = 30 * SECONDS_IN_DAY; // Approximate for step calculation only
const SECONDS_IN_YEAR = 365.25 * SECONDS_IN_DAY; // Approximate for step calculation only

// Birth date: 1 Jan 1970 00:00 UTC
const BIRTH_DATE_EPOCH_SEC = 0; // Unix epoch

// Left padding when near birth date (in pixels)
const LEFT_PADDING = 100;

// Animation constants
const ANIMATION_DURATION = 300; // ms
const VELOCITY_DECAY = 0.94; // Higher for more natural floating feel
const MIN_VELOCITY = 0.1; // Lower threshold for longer gliding

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

// Easing function (ease out cubic)
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
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

export default function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas (CSS) pixel dimensions
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  // Current time state (updated every minute)
  const [currentTime, setCurrentTime] = useState(() => Date.now() / 1000);

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

  // Zoom animation state
  const zoomAnimation = useRef<{
    startScale: number;
    targetScale: number;
    startOffset: number;
    targetOffset: number;
    startTime: number;
    pointerX: number;
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
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easedProgress = easeOutCubic(progress);

      // Interpolate scale and offset
      scaleSecPerPx.current = zoomAnimation.current.startScale + 
        (zoomAnimation.current.targetScale - zoomAnimation.current.startScale) * easedProgress;
      
      offsetEpochSec.current = zoomAnimation.current.startOffset + 
        (zoomAnimation.current.targetOffset - zoomAnimation.current.startOffset) * easedProgress;

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

    // Initial view: 8 hours of history with red line at 60% from left
    const historySeconds = 8 * SECONDS_IN_HOUR; // 8 hours of history
    const futureSeconds = (historySeconds * 0.4) / 0.6; // Calculate future time to make red line at 60%
    const totalTimeSpan = historySeconds + futureSeconds;
    
    scaleSecPerPx.current = totalTimeSpan / size.width;
    
    // Clamp to zoom limits
    scaleSecPerPx.current = Math.max(Math.min(scaleSecPerPx.current, minSecPerPx), maxSecPerPx);

    // Position red line at 60% from left (showing 8 hours of history)
    const redLinePosition = 0.6; // 60% from left
    offsetEpochSec.current = currentTime - (scaleSecPerPx.current * size.width * redLinePosition);

    // Ensure we don't pan before birth date
    const minOffset = BIRTH_DATE_EPOCH_SEC;
    offsetEpochSec.current = Math.max(offsetEpochSec.current, minOffset);

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

    const step = chooseTickStep(secPerPx);
    const startTime = offsetSec - step * 2;
    const endTime = offsetSec + secPerPx * size.width + step * 2;
    
    // Generate actual calendar-based ticks
    const ticks = generateTicks(startTime, endTime, step);

    // Use Lora font directly
    ctx.font = '12px Lora, serif';
    ctx.textAlign = 'left'; // Changed to left align since labels are to the right of lines
    ctx.textBaseline = 'top';

    for (const t of ticks) {
      const x = (t - offsetSec) / secPerPx;
      if (x < -50 || x > size.width + 50) continue;

      // Apply left padding to x position
      const adjustedX = x + leftPadding;

      // Only draw gray lines and labels for times at or after birth date
      if (t >= BIRTH_DATE_EPOCH_SEC) {
        // Grey full-height bar (infinitely tall, always draw)
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(adjustedX, 0);
        ctx.lineTo(adjustedX, size.height);
        ctx.stroke();

        // Labels at top of screen (fixed position, ignoring vertical offset)
        ctx.fillStyle = '#FFFFFF';
        const label = formatLabel(t, step);
        
        // Check if label contains both day and time (has a space)
        if ((step < SECONDS_IN_DAY) && label.includes(' ')) {
          // Split day and time and draw on separate lines
          const parts = label.split(' ');
          const dayPart = parts[0] + ' ' + parts[1]; // "Jan 15"
          const timePart = parts[2]; // "09:00"
          
          ctx.fillText(dayPart, adjustedX + 5, 10); // Day on first line (fixed at top)
          ctx.fillText(timePart, adjustedX + 5, 25); // Time on second line (fixed at top)
        } else {
          // Single line label
          ctx.fillText(label, adjustedX + 5, 10); // Fixed at top
        }
      }

      // White tick only within timeline bounds (birth to today)
      if (t >= BIRTH_DATE_EPOCH_SEC && t <= currentTime) {
        // White tick on the main line
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(adjustedX, centreY - 8);
        ctx.lineTo(adjustedX, centreY + 8);
        ctx.stroke();
      }
    }

    // Red "today" line, with left padding
    if (adjustedTodayX >= 0 && adjustedTodayX <= size.width) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(adjustedTodayX, 0);
      ctx.lineTo(adjustedTodayX, size.height);
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
      const targetOffset = Math.max(timeAtPointer - adjustedPointerX * targetScale, BIRTH_DATE_EPOCH_SEC);

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
        pointerX: adjustedPointerX
      };

      startAnimation();
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
  }, [size.width, size.height, currentTime]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black cursor-grab select-none font-lora">
      <canvas ref={canvasRef} />
    </div>
  );
} 