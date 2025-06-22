'use client';

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';

const GridMarkers = ({
  viewBox,
  dateToX,
  timelineStartDate,
  pixelsPerDay,
  paddingLeft,
  timelineHeight,
}: {
  viewBox: { x: number; y: number; w: number; h: number };
  dateToX: (date: Date) => number;
  timelineStartDate: Date;
  pixelsPerDay: number;
  paddingLeft: number;
  timelineHeight: number;
}) => {
  const markers: React.ReactNode[] = [];

  const visibleStartMs =
    timelineStartDate.getTime() +
    ((viewBox.x - paddingLeft) / pixelsPerDay) * (1000 * 60 * 60 * 24);
  const visibleDays = viewBox.w / pixelsPerDay;
  const visibleEndMs = visibleStartMs + visibleDays * (1000 * 60 * 60 * 24);
  const visibleYears = visibleDays / 365;

  if (visibleYears > 200) {
    return null; // Hide everything if zoomed out too far
  }

  const startDate = new Date(visibleStartMs);
  const endDate = new Date(visibleEndMs);

  const addMarker = (date: Date, label: string, strokeWidth: number, key: string, brightness: number) => {
    // Don't show any markers before the birthday
    if (date.getTime() < timelineStartDate.getTime()) {
      return;
    }
    
    const showWhiteTick = date.getTime() <= new Date().getTime(); // Only show white ticks up to present
    
    // Calculate gray color with very steep curve for stark contrast
    // Use much steeper exponential curve to make transitions extremely dramatic
    const adjustedBrightness = Math.pow(brightness, 0.15); // Much steeper curve
    const grayValue = Math.round(30 + adjustedBrightness * (140 - 30)); // From #1E1E1E to #8C8C8C
    const grayColor = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
    
    const OPACITY_THRESHOLD = 0.05;
    const opacity = adjustedBrightness;

    if (opacity < OPACITY_THRESHOLD) {
      // Skip rendering extremely faint lines to avoid overdraw and flicker
      return;
    }
    
    // Clamped scaling for grid lines - use constant pixel width to avoid aliasing flicker
    const gridStrokeWidth = 2; // constant 2px for stable appearance
    
    // Constant tick mark stroke width as well
    const tickStrokeWidth = 2;
    
    const x = dateToX(date);
    
    // Skip markers that are far outside of the current viewport to reduce overdraw and DOM nodes
    if (!isXInRenderRange(x)) {
      return;
    }

    // NOTE: We intentionally do NOT snap every line to the pixel grid here. While rounding gives
    // razor-sharp lines when the camera is perfectly still, it causes the entire grid to "jump"
    // by a whole pixel whenever the viewBox crosses the 0.5-pixel threshold. At very high zoom
    // levels (hour / minute), these jumps become extremely noticeable – they look like tearing.
    // Leaving the coordinate unrounded eliminates that discontinuity. We still keep
    // `shapeRendering="crispEdges"` so browsers render the strokes sharply.
    const xAligned = x;
    
    markers.push(
      <g key={key}>
        <line
          x1={xAligned}
          y1={viewBox.y - viewBox.h}
          x2={xAligned}
          y2={viewBox.y + viewBox.h * 2}
          stroke={grayColor}
          strokeWidth={gridStrokeWidth}
          strokeOpacity={opacity}
          vectorEffect="non-scaling-stroke"
        />
        {showWhiteTick && (
          <line
            x1={xAligned}
            y1={timelineHeight / 2 - 15 * (viewBox.w / 1920)}
            x2={xAligned}
            y2={timelineHeight / 2 + 15 * (viewBox.w / 1920)}
            stroke="white"
            strokeWidth={tickStrokeWidth}
            strokeOpacity={opacity}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </g>
    );
  };

  const minSpacing = 30; // Minimum pixels between markers
  const maxSpacing = 120; // Maximum spacing for full brightness
  const scale = viewBox.w / (typeof window !== 'undefined' ? window.innerWidth : 1920);

  // Calculate spacing in SVG coordinates
  const minSvgSpacing = minSpacing * scale;

  // virtualization helper
  const EXTRA_RENDER_MARGIN = viewBox.w * 2; // render 2x viewport out of view
  const isXInRenderRange = (xCoord: number) => xCoord >= viewBox.x - EXTRA_RENDER_MARGIN && xCoord <= viewBox.x + viewBox.w + EXTRA_RENDER_MARGIN;

  // Helper function to compute brightness based on spacing (no hard visibility toggle)
  const calcBrightness = (interval: number, unit: 'year' | 'month' | 'day' | 'hour' | 'minute') => {
    let testDate1: Date = new Date();
    let testDate2: Date = new Date();
    if (unit === 'year') {
      testDate1 = new Date(2000, 0, 1);
      testDate2 = new Date(2000 + interval, 0, 1);
    } else if (unit === 'month') {
      testDate1 = new Date(2000, 0, 1);
      testDate2 = new Date(2000, interval, 1);
    } else if (unit === 'day') {
      testDate1 = new Date(2000, 0, 1);
      testDate2 = new Date(2000, 0, 1 + interval);
    } else if (unit === 'hour') {
      testDate1 = new Date(2000, 0, 1, 0, 0, 0);
      testDate2 = new Date(2000, 0, 1, interval, 0, 0);
    } else if (unit === 'minute') {
      testDate1 = new Date(2000, 0, 1, 0, 0, 0);
      testDate2 = new Date(2000, 0, 1, 0, interval, 0);
    }
    
    const x1 = dateToX(testDate1);
    const x2 = dateToX(testDate2);
    const pixelSpacing = Math.abs(x2 - x1) / scale; // Convert back to screen pixels

    const brightness = Math.min(1, Math.max(0, (pixelSpacing - minSpacing) / (maxSpacing - minSpacing)));
    return brightness;
  };

  // Show decade markers
  const decadeBrightness = calcBrightness(10, 'year');
  if (decadeBrightness > 0) {
    let year = Math.floor(startDate.getFullYear() / 10) * 10;
    for (let d = new Date(year, 0, 1); d.getFullYear() <= endDate.getFullYear(); d.setFullYear(d.getFullYear() + 10)) {
      addMarker(d, `${d.getFullYear()}`, 1, `10y-${d.getFullYear()}`, decadeBrightness);
    }
  }

  // Show 5-year markers
  const fiveYearBrightness = calcBrightness(5, 'year');
  if (fiveYearBrightness > 0) {
    let year = Math.floor(startDate.getFullYear() / 5) * 5;
    for (let d = new Date(year, 0, 1); d.getFullYear() <= endDate.getFullYear(); d.setFullYear(d.getFullYear() + 5)) {
      addMarker(d, `${d.getFullYear()}`, 0.9, `5y-${d.getFullYear()}`, fiveYearBrightness);
    }
  }

  // Yearly markers
  const yearBrightness = calcBrightness(1, 'year');
  if (yearBrightness > 0) {
    for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
      addMarker(new Date(year, 0, 1), `${year}`, 0.75, `1y-${year}`, yearBrightness);
    }
  }

  // Month markers
  const monthBrightness = calcBrightness(1, 'month');
  if (monthBrightness > 0) {
    let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    for (; d.getTime() <= visibleEndMs; d.setMonth(d.getMonth() + 1)) {
      const label = `${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
      addMarker(d, label, 0.5, `month-${d.toISOString()}`, monthBrightness);
    }
  }

  // Day markers
  const dayBrightness = calcBrightness(1, 'day');
  if (dayBrightness > 0) {
    let d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    for (; d.getTime() <= visibleEndMs; d.setDate(d.getDate() + 1)) {
      const label = `${d.getDate()}-${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
      addMarker(d, label, 0.25, `day-${d.toISOString()}`, dayBrightness);
    }
  }

  // Hour markers
  const hourBrightness = calcBrightness(1, 'hour');
  if (hourBrightness > 0) {
    let d = new Date(startDate.getTime());
    d.setMinutes(0,0,0);
    for (; d.getTime() <= visibleEndMs; d.setHours(d.getHours() + 1)) {
      const xTmp = dateToX(d);
      if (!isXInRenderRange(xTmp)) continue;
      const label = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
      addMarker(d, label, 0.25, `hour-${d.toISOString()}`, hourBrightness);
    }
  }

  // Minute markers
  const minuteBrightness = calcBrightness(1, 'minute');
  if (minuteBrightness > 0) {
    let d = new Date(startDate.getTime());
    d.setSeconds(0,0);
    for (; d.getTime() <= visibleEndMs; d.setMinutes(d.getMinutes() + 1)) {
      const xTmp = dateToX(d);
      if (!isXInRenderRange(xTmp)) continue;
      const label = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
      addMarker(d, label, 0.25, `min-${d.toISOString()}`, minuteBrightness);
    }
  }

  return <>{markers}</>;
};

const TimeLabels = ({
  viewBox,
  dateToX,
  timelineStartDate,
  pixelsPerDay,
  paddingLeft,
  svgRef,
}: {
  viewBox: { x: number; y: number; w: number; h: number };
  dateToX: (date: Date) => number;
  timelineStartDate: Date;
  pixelsPerDay: number;
  paddingLeft: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) => {
  const labels: { x: number; text: string; key: string }[] = [];

  const visibleStartMs =
    timelineStartDate.getTime() +
    ((viewBox.x - paddingLeft) / pixelsPerDay) * (1000 * 60 * 60 * 24);
  const visibleDays = viewBox.w / pixelsPerDay;
  const visibleEndMs = visibleStartMs + visibleDays * (1000 * 60 * 60 * 24);
  const visibleYears = visibleDays / 365;

  if (visibleYears > 200) {
    return null;
  }

  const startDate = new Date(visibleStartMs);
  const endDate = new Date(visibleEndMs);

  const addLabel = (date: Date, text: string, key: string) => {
    // Don't show any labels before the birthday
    if (date.getTime() < timelineStartDate.getTime()) {
      return;
    }
    
    const svgX = dateToX(date);
    labels.push({ x: svgX, text, key });
  };

  const minSpacing = 80; // Minimum pixels between labels (larger than grid markers)
  const scale = viewBox.w / (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const minSvgSpacing = minSpacing * scale;

  // Helper function to check if labels would be too close
  const wouldLabelsBeSpaced = (interval: number, unit: 'year' | 'month' | 'day' | 'hour' | 'minute') => {
    let testDate1: Date = new Date();
    let testDate2: Date = new Date();
    if (unit === 'year') {
      testDate1 = new Date(2000, 0, 1);
      testDate2 = new Date(2000 + interval, 0, 1);
    } else if (unit === 'month') {
      testDate1 = new Date(2000, 0, 1);
      testDate2 = new Date(2000, interval, 1);
    } else if (unit === 'day') {
      testDate1 = new Date(2000, 0, 1);
      testDate2 = new Date(2000, 0, 1 + interval);
    } else if (unit === 'hour') {
      testDate1 = new Date(2000, 0, 1, 0, 0, 0);
      testDate2 = new Date(2000, 0, 1, interval, 0, 0);
    } else if (unit === 'minute') {
      testDate1 = new Date(2000, 0, 1, 0, 0, 0);
      testDate2 = new Date(2000, 0, 1, 0, interval, 0);
    }
    
    const x1 = dateToX(testDate1);
    const x2 = dateToX(testDate2);
    return Math.abs(x2 - x1) >= minSvgSpacing;
  };

  // Show decade labels if they have enough spacing
  if (wouldLabelsBeSpaced(10, 'year')) {
    let year = Math.floor(startDate.getFullYear() / 10) * 10;
    for (let d = new Date(year, 0, 1); d.getFullYear() <= endDate.getFullYear(); d.setFullYear(d.getFullYear() + 10)) {
      addLabel(d, `${d.getFullYear()}`, `10y-${d.getFullYear()}`);
    }
  }

  // Show 5-year labels if they have enough spacing
  if (wouldLabelsBeSpaced(5, 'year')) {
    let year = Math.floor(startDate.getFullYear() / 5) * 5;
    for (let d = new Date(year, 0, 1); d.getFullYear() <= endDate.getFullYear(); d.setFullYear(d.getFullYear() + 5)) {
      addLabel(d, `${d.getFullYear()}`, `5y-${d.getFullYear()}`);
    }
  }

  // Show yearly labels if they have enough spacing
  if (wouldLabelsBeSpaced(1, 'year')) {
    for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
      addLabel(new Date(year, 0, 1), `${year}`, `1y-${year}`);
    }
  }

  // Show monthly labels if they have enough spacing
  if (wouldLabelsBeSpaced(1, 'month')) {
    let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    for (; d.getTime() <= visibleEndMs; d.setMonth(d.getMonth() + 1)) {
      addLabel(d, `${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`, `m-${d.toISOString()}`);
    }
  }

  // Show daily labels if they have enough spacing
  if (wouldLabelsBeSpaced(1, 'day')) {
    let d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    for (; d.getTime() <= visibleEndMs; d.setDate(d.getDate() + 1)) {
      addLabel(d, `${d.getDate()}-${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`, `d-${d.toISOString()}`);
    }
  }

  // Show hourly labels if they have enough spacing
  if (wouldLabelsBeSpaced(1, 'hour')) {
    let d = new Date(startDate.getTime());
    d.setMinutes(0,0,0);
    for (; d.getTime() <= visibleEndMs; d.setHours(d.getHours() + 1)) {
      addLabel(d, `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`, `h-${d.toISOString()}`);
    }
  }

  // Show minute labels if they have enough spacing
  if (wouldLabelsBeSpaced(1, 'minute')) {
    let d = new Date(startDate.getTime());
    d.setSeconds(0,0);
    for (; d.getTime() <= visibleEndMs; d.setMinutes(d.getMinutes() + 1)) {
      addLabel(d, `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`, `min-${d.toISOString()}`);
    }
  }

  const convertSvgToScreenX = (svgX: number) => {
    if (!svgRef.current) return 0;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    // Calculate the screen X position based on the viewBox and SVG dimensions
    const svgWidth = rect.width;
    const viewBoxWidth = viewBox.w;
    const viewBoxX = viewBox.x;
    
    // Convert SVG coordinate to screen coordinate
    const normalizedX = (svgX - viewBoxX) / viewBoxWidth;
    const screenX = normalizedX * svgWidth;
    
    return screenX;
  };

  // Filter labels to prevent overlap
  const filteredLabels = labels.filter((label, index) => {
    if (index === 0) return true;
    
    const currentScreenX = convertSvgToScreenX(label.x);
    const prevScreenX = convertSvgToScreenX(labels[index - 1].x);
    
    // Estimate text width (rough approximation)
    const estimatedTextWidth = label.text.length * 8; // 8px per character
    const minSpacing = estimatedTextWidth + 20; // Add 20px buffer
    
    return Math.abs(currentScreenX - prevScreenX) > minSpacing;
  });

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {filteredLabels.map(({ x, text, key }) => {
        const screenX = convertSvgToScreenX(x);
    return (
          <div
            key={key}
            className="absolute text-white text-sm"
            style={{
              left: `${screenX + 5}px`,
              top: '8px',
              color: 'white',
              fontFamily: 'var(--font-lora), serif',
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </div>
        );
      })}
      </div>
    );
  };

const TimelineVisualization = () => {
  const [mounted, setMounted] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1920, h: 1080 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const PADDING_LEFT = 500;
  const RIGHT_EXTENT_YEARS = 200;

  const timelineStartDate = useMemo(() => new Date(1970, 0, 1, 0, 0, 0), []);
  
  // The grid extends into the future
  const gridEndDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + RIGHT_EXTENT_YEARS);
    return d;
  }, []);

  // The main timeline ends today
  const mainTimelineEndDate = useMemo(() => new Date(), []);
  
  const pixelsPerDay = 200;

  // The minimum view-box width we allow (one hour of timeline fills the viewport)
  const MIN_VIEWBOX_W = pixelsPerDay / 24; // ≈8.333 units – 1 hour

  const totalGridDays = useMemo(
    () => (gridEndDate.getTime() - timelineStartDate.getTime()) / (1000 * 60 * 60 * 24),
    [timelineStartDate, gridEndDate]
  );
  const gridWidth = totalGridDays * pixelsPerDay;
  const timelineHeight = 1080;

  useEffect(() => {
    setMounted(true);
  }, []);

  const dateToX = useCallback((date: Date) => {
    const dateMs = date.getTime();
    const startMs = timelineStartDate.getTime();
    const days = (dateMs - startMs) / (1000 * 60 * 60 * 24);
    return days * pixelsPerDay + PADDING_LEFT;
  }, [timelineStartDate, pixelsPerDay, PADDING_LEFT]);
  
  const mainTimelineEndX = dateToX(mainTimelineEndDate);

  useEffect(() => {
    if (mounted) {
      const todayX = dateToX(new Date());
      const daysToShow = 14;
      const initialViewWidth = daysToShow * pixelsPerDay;

      let startX = todayX - initialViewWidth / 2;
      
      setViewBox({
        x: Math.max(0, startX),
        y: 0,
        w: initialViewWidth,
        h: timelineHeight,
      });
    }
  }, [mounted, pixelsPerDay, dateToX, timelineHeight]);

  const getSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      return pt.matrixTransform(ctm.inverse());
    }
    return { x: 0, y: 0 };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !svgRef.current) return;
    e.preventDefault();
    const scale = viewBox.w / svgRef.current.clientWidth;
    const dx = (e.clientX - dragStart.x) * scale;
    const dy = (e.clientY - dragStart.y) * scale;
    
    let newX = viewBox.x - dx;
    
    // Add padding when approaching the birthday (left boundary)
    const birthdayX = PADDING_LEFT; // The X coordinate of the birthday
    const viewportWidth = viewBox.w;
    const paddingZone = viewportWidth * 0.2; // 20% of viewport width as padding zone
    
    if (newX < birthdayX + paddingZone) {
      // When we're close to the birthday, enforce minimum padding
      const minPadding = viewportWidth * 0.1; // 10% of viewport as minimum padding
      newX = Math.max(birthdayX - minPadding, newX);
    }
    
    // Always enforce absolute minimum - never go past the timeline start
    newX = Math.max(birthdayX - viewportWidth * 0.1, newX);
    
    setViewBox(prev => ({
      x: newX,
      y: prev.y - dy,
      w: prev.w,
      h: prev.h
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, viewBox, PADDING_LEFT]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const zoomFactor = e.deltaY < 0 ? 1 - zoomIntensity : 1 + zoomIntensity;
    const { x: mouseX, y: mouseY } = getSvgPoint(e.clientX, e.clientY);
    
    const newW = viewBox.w * zoomFactor;
    const newH = viewBox.h * zoomFactor;

    // Clamp maximum zoom-in so that one hour fills the screen
    if (newW < MIN_VIEWBOX_W) {
      return; // abort – already at max zoom
    }

    // Calculate visible years for the new zoom level
    const newVisibleDays = newW / pixelsPerDay;
    const newVisibleYears = newVisibleDays / 365;
    
    // Prevent zooming out beyond decade level (around 80 years visible)
    if (e.deltaY > 0 && newVisibleYears > 80) {
      return; // Don't allow further zoom out
    }

    const newX = viewBox.x + (mouseX - viewBox.x) * (1 - newW / viewBox.w);

    // Apply the same padding logic for zoom as we do for panning
    const birthdayX = PADDING_LEFT;
    const paddingZone = newW * 0.2;
    let finalX = newX;
    
    if (finalX < birthdayX + paddingZone) {
      const minPadding = newW * 0.1;
      finalX = Math.max(birthdayX - minPadding, finalX);
    }
    
    // Always enforce absolute minimum - never go past the timeline start
    finalX = Math.max(birthdayX - newW * 0.1, finalX);

    setViewBox({
      x: finalX,
      y: viewBox.y + (mouseY - viewBox.y) * (1 - newH / viewBox.h),
      w: newW,
      h: newH,
    });
  }, [getSvgPoint, viewBox, pixelsPerDay]);


  if (!mounted) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black cursor-grab active:cursor-grabbing">
      <TimeLabels
        viewBox={viewBox}
        dateToX={dateToX}
        timelineStartDate={timelineStartDate}
        pixelsPerDay={pixelsPerDay}
        paddingLeft={PADDING_LEFT}
        svgRef={svgRef}
      />
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <GridMarkers 
          viewBox={viewBox}
          dateToX={dateToX}
          timelineStartDate={timelineStartDate}
          pixelsPerDay={pixelsPerDay}
          paddingLeft={PADDING_LEFT}
          timelineHeight={timelineHeight}
        />
        <path
          d={`M ${PADDING_LEFT} ${timelineHeight / 2} L ${mainTimelineEndX} ${timelineHeight / 2}`}
          stroke="white"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
        {/* Current time marker */}
        <line
          x1={mainTimelineEndX}
          y1={viewBox.y - viewBox.h}
          x2={mainTimelineEndX}
          y2={viewBox.y + viewBox.h * 2}
          stroke="#FFB3B3"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      
    </div>
  );
};

export default function Home() {
  return (
    <main>
      <TimelineVisualization />
    </main>
  );
}

export { GridMarkers as _GridMarkersHelper };
