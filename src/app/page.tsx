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

  const baseFontSize = 16;
  const referenceWidth = 1920; // A standard reference viewport width
  const responsiveFontSize = baseFontSize * (viewBox.w / referenceWidth);

  const textStyle: React.SVGProps<SVGTextElement> = {
    fill: 'white',
    fontFamily: 'serif',
    dominantBaseline: 'text-before-edge',
    fontSize: responsiveFontSize,
  };

  const addMarker = (date: Date, label: string, strokeWidth: number, key: string) => {
    const x = dateToX(date);
    
    // Don't show any markers before the birthday
    if (date.getTime() < timelineStartDate.getTime()) {
      return;
    }
    
    const showWhiteTick = date.getTime() <= new Date().getTime(); // Only show white ticks up to present
    
    markers.push(
      <g key={key}>
        <line
          x1={x}
          y1={viewBox.y - viewBox.h}
          x2={x}
          y2={viewBox.y + viewBox.h * 2}
          stroke="#444"
          strokeWidth={strokeWidth * 2}
          vectorEffect="non-scaling-stroke"
        />
        {showWhiteTick && (
          <line
            x1={x}
            y1={timelineHeight / 2 - 15 * (viewBox.w / 1920)}
            x2={x}
            y2={timelineHeight / 2 + 15 * (viewBox.w / 1920)}
            stroke="white"
            strokeWidth={(strokeWidth + 0.5) * 2}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </g>
    );
  };
  
  if (visibleYears > 50) {
    let year = Math.floor(startDate.getFullYear() / 10) * 10;
    for (let d = new Date(year, 0, 1); d.getFullYear() <= endDate.getFullYear(); d.setFullYear(d.getFullYear() + 10)) {
      addMarker(d, `${d.getFullYear()}`, 1, `10y-${d.getFullYear()}`);
    }
  } else if (visibleYears > 20) {
    let year = Math.floor(startDate.getFullYear() / 5) * 5;
    for (let d = new Date(year, 0, 1); d.getFullYear() <= endDate.getFullYear(); d.setFullYear(d.getFullYear() + 5)) {
      addMarker(d, `${d.getFullYear()}`, 1, `5y-${d.getFullYear()}`);
    }
  } else if (visibleYears > 1) {
     for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
        addMarker(new Date(year, 0, 1), `${year}`, 0.75, `1y-${year}`);
     }
  } else if (visibleDays > 30) {
    let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    for (; d.getTime() <= visibleEndMs; d.setMonth(d.getMonth() + 1)) {
      const label = `${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
      addMarker(d, label, 0.5, `month-${d.toISOString()}`);
    }
  } else if (visibleDays > 1) {
    let d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    for (; d.getTime() <= visibleEndMs; d.setDate(d.getDate() + 1)) {
      const label = `${d.getDate()}-${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
      addMarker(d, label, 0.25, `day-${d.toISOString()}`);
    }
      } else {
    let d = new Date(startDate.getTime());
    d.setMinutes(0,0,0);
    for (; d.getTime() <= visibleEndMs; d.setHours(d.getHours() + 1)) {
      const label = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      addMarker(d, label, 0.25, `hour-${d.toISOString()}`);
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

  if (visibleYears > 50) {
    let year = Math.floor(startDate.getFullYear() / 10) * 10;
    for (let d = new Date(year, 0, 1); d.getFullYear() <= endDate.getFullYear(); d.setFullYear(d.getFullYear() + 10)) {
      addLabel(d, `${d.getFullYear()}`, `10y-${d.getFullYear()}`);
    }
  } else if (visibleYears > 20) {
    let year = Math.floor(startDate.getFullYear() / 5) * 5;
    for (let d = new Date(year, 0, 1); d.getFullYear() <= endDate.getFullYear(); d.setFullYear(d.getFullYear() + 5)) {
      addLabel(d, `${d.getFullYear()}`, `5y-${d.getFullYear()}`);
    }
  } else if (visibleYears > 1) {
    for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
      addLabel(new Date(year, 0, 1), `${year}`, `1y-${year}`);
    }
  } else if (visibleDays > 30) {
    let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    for (; d.getTime() <= visibleEndMs; d.setMonth(d.getMonth() + 1)) {
      addLabel(d, `${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`, `m-${d.toISOString()}`);
    }
  } else if (visibleDays > 1) {
    let d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    for (; d.getTime() <= visibleEndMs; d.setDate(d.getDate() + 1)) {
      addLabel(d, `${d.getDate()}-${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`, `d-${d.toISOString()}`);
    }
      } else {
    let d = new Date(startDate.getTime());
    d.setMinutes(0,0,0);
    for (; d.getTime() <= visibleEndMs; d.setHours(d.getHours() + 1)) {
      addLabel(d, `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`, `h-${d.toISOString()}`);
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

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {labels.map(({ x, text, key }) => {
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
