"use client";

import React, { useState, useMemo } from 'react';
import { nodes, branches } from './timelineData'; // Example data import
import './Timeline.css'; // Assume you create a CSS file for styles

// Modular color scheme configuration
const COLOR_SCHEME = {
  primary: '#1a1a1a',      // Black
  secondary: '#4a4a4a',    // Grey
  accent1: '#1e3a8a',      // Dark blue
  accent2: '#1e40af',      // Navy blue
  background: '#f8fafc',   // Light background
  white: '#ffffff',
  text: '#2d3748',
  textLight: '#718096'
} as const;

// Types
type Node = {
  uuid: string;
  branchId: string;
  timeStamp: string;
  content: string;
  isUpdating: boolean;
};

type Branch = {
  parentBranchId: string | null;
  branchId: string;
  branchStart: string;
  branchEnd: string | null;
  branchName: string;
  branchSummary: string;
  color: string;
};

// New type for branch endpoints (start/end points)
type BranchEndpoint = {
  type: 'start' | 'end';
  branchId: string;
  branchName: string;
  timeStamp: string;
  isOngoing?: boolean;
};

// Union type for popup content
type PopupContent = Node | BranchEndpoint;

// Modular utility functions
const TimeUtils = {
  // Get branch color by id - now uses the branch's color field
  getBranchColor: (branchId: string): string => {
    const branch = branches.find(b => b.branchId === branchId);
    return branch?.color || COLOR_SCHEME.accent2; // Fallback to navy blue if not found
  },

  // Get branch hierarchy level
  getBranchLevel: (branchId: string): number => {
    let level = 0;
    let currentBranchId = branchId;
    
    while (true) {
      const branch = branches.find(b => b.branchId === currentBranchId);
      if (!branch || !branch.parentBranchId) {
        break;
      }
      level++;
      currentBranchId = branch.parentBranchId;
    }
    
    return level;
  },

  // Format date for display
  formatDate: (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  formatFullDateWithDay: (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  // Get relative time description
  getRelativeTime: (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInYears = now.getFullYear() - date.getFullYear();
    
    if (diffInYears === 0) {
      return 'This year';
    } else if (diffInYears === 1) {
      return '1 year ago';
    } else if (diffInYears < 10) {
      return `${diffInYears} years ago`;
    } else {
      return `${diffInYears} years ago`;
    }
  },

  // Get years between two dates for tick marks
  getYearRange: (startDate: string, endDate: string): number[] => {
    const start = new Date(startDate).getFullYear();
    const end = new Date(endDate).getFullYear();
    const years: number[] = [];
    
    for (let year = start; year <= end; year++) {
      years.push(year);
    }
    
    return years;
  },
  
  // Wrap text into multiple lines
  wrapText: (text: string, maxCharsPerLine: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length > maxCharsPerLine && currentLine.length > 0) {
            lines.push(currentLine.trim());
            currentLine = word;
        } else {
            currentLine = (currentLine + ' ' + word).trim();
        }
    }
    if (currentLine.length > 0) {
        lines.push(currentLine.trim());
    }
    return lines;
  }
};

// Timeline calculation utilities
const TimelineUtils = {
  // Calculate time range (linear scale)
  getTimeRange: () => {
    const allTimestamps = [
      ...branches.map(b => b.branchStart),
      ...branches.map(b => b.branchEnd).filter(end => end !== null), // Filter out null end dates
      ...nodes.map(n => n.timeStamp),
    ].map(ts => new Date(ts).getTime());
    
    // Include today's date for ongoing relationships
    const today = new Date().getTime();
    
    return {
      minTime: Math.min(...allTimestamps),
      maxTime: Math.max(...allTimestamps, today)
    };
  },

  // Get X position for a timestamp
  getX: (ts: string, minTime: number, maxTime: number): number => {
    return ((new Date(ts).getTime() - minTime) / (maxTime - minTime)) * 4000 + 100;
  },

  // Get X position for a year
  getYearX: (year: number, minTime: number, maxTime: number): number => {
    const yearStart = new Date(year, 0, 1).getTime();
    return ((yearStart - minTime) / (maxTime - minTime)) * 4000 + 100;
  },

  // Get X position for today
  getTodayX: (minTime: number, maxTime: number): number => {
    const today = new Date().getTime();
    return ((today - minTime) / (maxTime - minTime)) * 4000 + 100;
  },

  // Check if a branch is ongoing (has null end date)
  isOngoing: (branch: Branch): boolean => {
    return branch.branchEnd === null;
  },

  // Get Y position for a branch level
  getBranchDepth: (branchId: string): number => {
    let depth = 0;
    let currentBranchId: string | null = branchId;
    while(currentBranchId) {
        const branch = branches.find(b => b.branchId === currentBranchId);
        if (!branch || !branch.parentBranchId) {
            break;
        }
        depth++;
        currentBranchId = branch.parentBranchId;
    }
    return depth;
  },

  // Calculate branch levels to prevent overlapping
  calculateBranchLevels: () => {
    const branchLevels = new Map<string, number>();
    const mainBranch = branches.find(b => !b.parentBranchId);
    if (!mainBranch) return branchLevels;

    branchLevels.set(mainBranch.branchId, 0);

    const occupiedLevels = new Map<number, Branch[]>();
    occupiedLevels.set(0, [mainBranch]);

    const hasOverlap = (level: number, branch: Branch): boolean => {
      const levelBranches = occupiedLevels.get(level);
      if (!levelBranches) return false;
      
      const start2 = new Date(branch.branchStart).getTime();
      const end2 = branch.branchEnd ? new Date(branch.branchEnd).getTime() : new Date().getTime();
      
      return levelBranches.some(existingBranch => {
        const start1 = new Date(existingBranch.branchStart).getTime();
        const end1 = existingBranch.branchEnd ? new Date(existingBranch.branchEnd).getTime() : new Date().getTime();
        return start1 < end2 && start2 < end1;
      });
    };

    const processChildrenOf = (parentBranch: Branch) => {
        const parentLevel = branchLevels.get(parentBranch.branchId)!;

        const children = branches.filter(b => b.parentBranchId === parentBranch.branchId)
            .sort((a, b) => new Date(a.branchStart).getTime() - new Date(b.branchStart).getTime());
        
        for (const child of children) {
            let placed = false;
            for (let i = 1; !placed; i++) {
                // Prioritize upper levels first
                const levelUp = parentLevel + i;
                if (!hasOverlap(levelUp, child)) {
                    branchLevels.set(child.branchId, levelUp);
                    if (!occupiedLevels.has(levelUp)) occupiedLevels.set(levelUp, []);
                    occupiedLevels.get(levelUp)!.push(child);
                    placed = true;
                    continue;
                }
                
                // Then check lower levels
                const levelDown = parentLevel - i;
                if (!hasOverlap(levelDown, child)) {
                    branchLevels.set(child.branchId, levelDown);
                    if (!occupiedLevels.has(levelDown)) occupiedLevels.set(levelDown, []);
                    occupiedLevels.get(levelDown)!.push(child);
                    placed = true;
                }
            }
            processChildrenOf(child);
        }
    }

    processChildrenOf(mainBranch);
    return branchLevels;
  },

  calculateYPositions: (branchLevels: Map<string, number>, baseY: number): Map<string, number> => {
    const yPositions = new Map<string, number>();
    const mainBranch = branches.find(b => !b.parentBranchId)!;
    
    yPositions.set(mainBranch.branchId, baseY);

    const processedChildren = new Set<string>();

    const calculateYForChildrenOf = (parentBranch: Branch) => {
        const parentY = yPositions.get(parentBranch.branchId)!;
        const parentLevel = branchLevels.get(parentBranch.branchId)!;

        const children = branches.filter(b => b.parentBranchId === parentBranch.branchId);
        
        for (const child of children) {
            if (processedChildren.has(child.branchId)) continue;

            const childLevel = branchLevels.get(child.branchId)!;
            const childDepth = TimelineUtils.getBranchDepth(child.branchId);
            
            const baseSpacing = 100;
            const spacingDecay = 0.8;
            const dynamicSpacing = baseSpacing * Math.pow(spacingDecay, childDepth > 0 ? childDepth - 1 : 0);
            
            const levelDiff = childLevel - parentLevel;
            const childY = parentY - (levelDiff * dynamicSpacing);
            yPositions.set(child.branchId, childY);
            processedChildren.add(child.branchId);
        }

        for (const child of children) {
            calculateYForChildrenOf(child);
        }
    };
    
    calculateYForChildrenOf(mainBranch);
    return yPositions;
  }
};

// Enhanced popup component
const TimelinePopup: React.FC<{
  node: Node | null;
  onClose: () => void;
}> = ({ node, onClose }) => {
  if (!node) return null;

  const branch = branches.find(b => b.branchId === node.branchId);
  const branchColor = TimeUtils.getBranchColor(node.branchId);

  return (
    <div className="timeline-popup" onClick={onClose}>
      <div className="timeline-popup-inner" onClick={e => e.stopPropagation()}>
        <div className="popup-header" style={{ borderBottomColor: branchColor }}>
          <h3>{node.content}</h3>
          <div className="popup-time-info">
            <div className="popup-date">{TimeUtils.formatDate(node.timeStamp)}</div>
            <div className="popup-relative">{TimeUtils.getRelativeTime(node.timeStamp)}</div>
          </div>
        </div>
        
        <button 
          className="popup-close-btn" 
          onClick={onClose}
          style={{ backgroundColor: branchColor }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Vertical time grid component
const TimeGrid: React.FC<{
  minTime: number;
  maxTime: number;
  height: number;
}> = ({ minTime, maxTime, height }) => {
  const years = TimeUtils.getYearRange(
    new Date(minTime).toISOString().split('T')[0],
    new Date(maxTime).toISOString().split('T')[0]
  );

  return (
    <g className="time-grid">
      {years.map(year => {
        const x = TimelineUtils.getYearX(year, minTime, maxTime);
        const isMajorYear = year % 5 === 0;
        
        return (
          <g key={year}>
            {/* Vertical time slice line */}
            <line
              x1={x}
              y1={0}
              x2={x}
              y2={height}
              stroke={isMajorYear ? "#e5e7eb" : "#f3f4f6"}
              strokeWidth={isMajorYear ? 2 : 1}
              opacity={0.6}
            />
            {/* Year label at top */}
            {isMajorYear && (
              <text
                x={x}
                y={30}
                fill="#9ca3af"
                fontSize={14}
                textAnchor="middle"
                fontWeight="600"
              >
                {year}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

// Today marker component
const TodayMarker: React.FC<{
  x: number;
  color: string;
  height: number;
}> = ({ x, color, height }) => {
  return (
    <g className="today-marker">
      {/* Vertical line for today */}
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke={color}
        strokeWidth={3}
        strokeDasharray="8,8"
        opacity={0.8}
      />
      {/* Today label at top */}
      <text
        x={x}
        y={30}
        fill={color}
        fontSize={14}
        textAnchor="middle"
        fontWeight="bold"
      >
        TODAY
      </text>
    </g>
  );
};

// Arrow component for ongoing relationships
const OngoingArrow: React.FC<{
  x: number;
  y: number;
  color: string;
}> = ({ x, y, color }) => {
  const arrowSize = 12;
  
  return (
    <g className="ongoing-arrow">
      {/* Arrow line */}
      <line
        x1={x - arrowSize}
        y1={y}
        x2={x}
        y2={y}
        stroke={color}
        strokeWidth={3}
      />
      {/* Arrow head */}
      <polygon
        points={`${x},${y - arrowSize/2} ${x + arrowSize},${y} ${x},${y + arrowSize/2}`}
        fill={color}
      />
    </g>
  );
};

// Main timeline component
const Timeline: React.FC = () => {
  const [popupNode, setPopupNode] = useState<Node | null>(null);

  // Calculate time range using utility
  const { minTime, maxTime } = useMemo(() => TimelineUtils.getTimeRange(), []);
  
  // Calculate branch levels to prevent overlapping
  const branchLevels = useMemo(() => TimelineUtils.calculateBranchLevels(), []);
  const yPositions = useMemo(() => TimelineUtils.calculateYPositions(branchLevels, 500), [branchLevels]);

  // Calculate viewport dimensions
  const [viewportDimensions, setViewportDimensions] = useState({ width: 1920, height: 1080 });

  // Update viewport dimensions on mount and resize
  React.useEffect(() => {
    const updateDimensions = () => {
      setViewportDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate total height needed based on maximum branch level
  const maxLevel = Math.max(...Array.from(branchLevels.values()));
  const totalHeight = Math.min(viewportDimensions.height, 500 + (maxLevel * 120) + 200);
  const totalWidth = Math.max(viewportDimensions.width, 4200); // Ensure minimum width for content

  // Adjust Y positions to fit within viewport
  const adjustedYPositions = useMemo(() => {
    const adjusted = new Map<string, number>();
    const baseY = totalHeight / 2; // Center vertically
    
    // Scale down Y positions if they exceed viewport
    const maxY = Math.max(...Array.from(yPositions.values()));
    const minY = Math.min(...Array.from(yPositions.values()));
    const yRange = maxY - minY;
    const scale = Math.min(1, (totalHeight - 200) / yRange); // Leave 200px margin
    
    yPositions.forEach((y, branchId) => {
      const scaledY = baseY + (y - (maxY + minY) / 2) * scale;
      adjusted.set(branchId, scaledY);
    });
    
    return adjusted;
  }, [yPositions, totalHeight]);

  // Render branches recursively with proper level positioning
  const renderBranch = (branch: Branch) => {
    const color = TimeUtils.getBranchColor(branch.branchId);
    const y = adjustedYPositions.get(branch.branchId) || totalHeight / 2;
    
    const parentBranch = branches.find(b => b.branchId === branch.parentBranchId);
    const parentY = parentBranch ? (adjustedYPositions.get(parentBranch.branchId) || y) : y;
    
    const isMainBranch = !branch.parentBranchId;
    const isOngoing = TimelineUtils.isOngoing(branch);

    // Branch start/end nodes
    const startX = TimelineUtils.getX(branch.branchStart, minTime, maxTime);
    const endX = isOngoing 
      ? TimelineUtils.getTodayX(minTime, maxTime) 
      : TimelineUtils.getX(branch.branchEnd!, minTime, maxTime);

    // Nodes on this branch
    const branchNodes = nodes.filter(n => n.branchId === branch.branchId);

    // Sub-branches
    const subBranches = branches.filter(b => b.parentBranchId === branch.branchId);

    const branchLineColor = color;
    const branchLineWidth = isMainBranch ? 8 : 4;

    return (
      <g key={branch.branchId}>
        {/* Branch line - horizontal line only */}
        <line
          x1={startX}
          y1={y}
          x2={endX}
          y2={y}
          stroke={branchLineColor}
          strokeWidth={branchLineWidth}
        />

        {/* Connector to parent branch */}
        {!isMainBranch && (
          <>
            <line x1={startX} y1={parentY} x2={startX} y2={y} stroke={color} strokeWidth={2} />
            <circle cx={startX} cy={parentY} r={4} fill={color} />
            
            {!isOngoing && (
              <>
                <line x1={endX} y1={y} x2={endX} y2={parentY} stroke={color} strokeWidth={2} />
                <circle cx={endX} cy={parentY} r={4} fill={color} />
              </>
            )}
          </>
        )}

        {/* Start node */}
        <g className="branch-endpoint">
          <circle
            cx={startX}
            cy={isMainBranch ? y : parentY}
            r={isMainBranch ? 10 : 8}
            fill={branchLineColor}
            onClick={() =>
              setPopupNode({
                uuid: `start-${branch.branchId}`,
                branchId: branch.branchId,
                timeStamp: branch.branchStart,
                content: `${branch.branchName} begins`,
                isUpdating: false,
              })
            }
            style={{ cursor: 'pointer' }}
          />
          {(() => {
            const dateString = TimeUtils.formatFullDateWithDay(branch.branchStart);
            const dateWidth = dateString.length * 6;
            const hPadding = 8;
            const vPadding = 10;
            const totalWidth = dateWidth + (hPadding * 2);
            const totalHeight = 15 + (vPadding * 2);
            const endpointY = isMainBranch ? y : parentY;
            const rectY = endpointY - totalHeight - 15;

            return (
              <g className="node-tooltip">
                <rect
                  x={startX - (totalWidth / 2)}
                  y={rectY}
                  width={totalWidth}
                  height={totalHeight}
                  fill={COLOR_SCHEME.white}
                  stroke={color}
                  strokeWidth={2}
                  rx={15}
                  ry={15}
                />
                <text
                  x={startX}
                  y={rectY + vPadding + 11}
                  fill={COLOR_SCHEME.textLight}
                  fontSize={10}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {dateString}
                </text>
              </g>
            );
          })()}
        </g>
        
        {/* End node or ongoing arrow */}
        {isOngoing ? (
          <OngoingArrow x={endX} y={isMainBranch ? y : parentY} color={color} />
        ) : (
          <g className="branch-endpoint">
            <circle
              cx={endX}
              cy={isMainBranch ? y : parentY}
              r={isMainBranch ? 10 : 8}
              fill={branchLineColor}
              onClick={() =>
                setPopupNode({
                  uuid: `end-${branch.branchId}`,
                  branchId: branch.branchId,
                  timeStamp: branch.branchEnd!,
                  content: `${branch.branchName} ends`,
                  isUpdating: false,
                })
              }
              style={{ cursor: 'pointer' }}
            />
            {(() => {
              const dateString = TimeUtils.formatFullDateWithDay(branch.branchEnd!);
              const dateWidth = dateString.length * 6;
              const hPadding = 8;
              const vPadding = 10;
              const totalWidth = dateWidth + (hPadding * 2);
              const totalHeight = 15 + (vPadding * 2);
              const endpointY = isMainBranch ? y : parentY;
              const rectY = endpointY - totalHeight - 15;

              return (
                <g className="node-tooltip">
                  <rect
                    x={endX - (totalWidth / 2)}
                    y={rectY}
                    width={totalWidth}
                    height={totalHeight}
                    fill={COLOR_SCHEME.white}
                    stroke={color}
                    strokeWidth={2}
                    rx={15}
                    ry={15}
                  />
                  <text
                    x={endX}
                    y={rectY + vPadding + 11}
                    fill={COLOR_SCHEME.textLight}
                    fontSize={10}
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {dateString}
                  </text>
                </g>
              );
            })()}
          </g>
        )}
        
        {/* Branch labels - positioned above the branch line */}
        {!isMainBranch && (
          <text 
            x={startX + 12} 
            y={y - 10} 
            fill={color} 
            fontSize={16} 
            textAnchor="start"
            fontWeight="bold"
          >
            {branch.branchName}
            {isOngoing && " (ongoing)"}
          </text>
        )}
        
        {/* Nodes - white interior with colored border */}
        {!isMainBranch && branchNodes.map(n => {
          const nodeX = TimelineUtils.getX(n.timeStamp, minTime, maxTime);
          
          const maxCharsPerLine = 30;
          const lines = TimeUtils.wrapText(n.content, maxCharsPerLine);
          const lineHeight = 15;

          const dateString = TimeUtils.formatFullDateWithDay(n.timeStamp);

          // Determine width based on the longest line of text (content or date)
          const longestContentLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
          const contentWidth = longestContentLine.length * 8.2;
          const dateWidth = dateString.length * 6;
          const textWidth = Math.max(contentWidth, dateWidth);
          
          const hPadding = 8;
          const vPadding = 10;
          const dateLineHeight = 20;
          const totalWidth = textWidth + (hPadding * 2);
          const totalHeight = (lines.length * lineHeight) + dateLineHeight + (vPadding * 2);
          
          const rectY = y - totalHeight - 20;

          return (
            <g key={n.uuid} className="timeline-node">
              <circle
                cx={nodeX}
                cy={y}
                fill={COLOR_SCHEME.white}
                stroke={color}
                strokeWidth={2}
                onClick={() => setPopupNode(n)}
                style={{ cursor: 'pointer' }}
              />
              {/* Floating tooltip bubble for node name */}
              <g className="node-tooltip">
                {/* Background rectangle */}
                <rect
                  x={nodeX - (totalWidth / 2)}
                  y={rectY}
                  width={totalWidth}
                  height={totalHeight}
                  fill={COLOR_SCHEME.white}
                  stroke={color}
                  strokeWidth={2}
                  rx={15}
                  ry={15}
                />
                {/* Text */}
                <text
                  y={rectY + vPadding + 12}
                  fill={color}
                  fontSize={13}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {lines.map((line, index) => (
                    <tspan key={index} x={nodeX} dy={index > 0 ? lineHeight : 0}>
                      {line}
                    </tspan>
                  ))}
                  <tspan x={nodeX} dy={lineHeight + 4} fontSize="10" fill={COLOR_SCHEME.textLight}>
                    {dateString}
                  </tspan>
                </text>
              </g>
            </g>
          );
        })}
        
        {/* Sub-branches - render with current branch's Y position as parent */}
        {subBranches.map(sb => renderBranch(sb))}
      </g>
    );
  };

  // Main branch is the root
  const mainBranch = branches.find(b => !b.parentBranchId);
  const todayX = TimelineUtils.getTodayX(minTime, maxTime);

  return (
    <div 
      className="timeline-container"
      style={{ 
        width: '100vw', 
        height: '100vh', 
        overflowX: 'auto', 
        overflowY: 'hidden',
        position: 'relative', 
        background: COLOR_SCHEME.background,
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
      }}
    >
      <style jsx>{`
        .timeline-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
      <svg width={totalWidth} height={totalHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Background time grid */}
        <TimeGrid minTime={minTime} maxTime={maxTime} height={totalHeight} />
        
        {/* Today marker */}
        <TodayMarker x={todayX} color={COLOR_SCHEME.accent1} height={totalHeight} />
        
        {/* Main branch nodes and sub-branches */}
        {renderBranch(mainBranch!)}
      </svg>
      
      {/* Enhanced popup */}
      <TimelinePopup node={popupNode} onClose={() => setPopupNode(null)} />
    </div>
  );
};

export default Timeline;
