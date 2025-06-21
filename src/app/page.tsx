"use client";

import React, { useState } from 'react';
import { nodes, branches } from './timelineData'; // Example data import
import './Timeline.css'; // Assume you create a CSS file for styles

// Helper: Assign unique colors to branches
const branchColors = [
  '#1976d2', // main
  '#388e3c', // sub
  '#fbc02d', // sub-sub
  '#d32f2f', // etc
];

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
  branchEnd: string;
  branchName: string;
  branchSummary: string;
};

// Utility: get branch color by id
const getBranchColor = (branchId: string) => {
  const idx = branches.findIndex(b => b.branchId === branchId);
  return branchColors[idx % branchColors.length];
};

// Utility: get branch hierarchy level
const getBranchLevel = (branchId: string): number => {
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
};

// Main timeline component
const Timeline: React.FC = () => {
  const [popupNode, setPopupNode] = useState<Node | null>(null);

  // Calculate time range (linear scale)
  const allTimestamps = [
    ...branches.map(b => b.branchStart),
    ...branches.map(b => b.branchEnd),
    ...nodes.map(n => n.timeStamp),
  ].map(ts => new Date(ts).getTime());
  const minTime = Math.min(...allTimestamps);
  const maxTime = Math.max(...allTimestamps);

  // Helper: get X position for a timestamp
  const getX = (ts: string) =>
    ((new Date(ts).getTime() - minTime) / (maxTime - minTime)) * 2000 + 50; // 2000px width for scroll

  // Render branches recursively
  const renderBranch = (branch: Branch, parentY: number) => {
    const level = getBranchLevel(branch.branchId);
    const color = getBranchColor(branch.branchId);
    const y = parentY - 80; // Each branch 80px above parent

    // Branch start/end nodes
    const startX = getX(branch.branchStart);
    const endX = getX(branch.branchEnd);

    // Nodes on this branch
    const branchNodes = nodes.filter(n => n.branchId === branch.branchId);

    // Sub-branches
    const subBranches = branches.filter(b => b.parentBranchId === branch.branchId);

    return (
      <g key={branch.branchId}>
        {/* Branch line */}
        <line
          x1={startX}
          y1={parentY}
          x2={startX}
          y2={y}
          stroke={color}
          strokeWidth={3}
        />
        <line
          x1={startX}
          y1={y}
          x2={endX}
          y2={y}
          stroke={color}
          strokeWidth={3}
        />
        <line
          x1={endX}
          y1={y}
          x2={endX}
          y2={parentY}
          stroke={color}
          strokeWidth={3}
        />

        {/* Start node */}
        <circle
          cx={startX}
          cy={parentY}
          r={14}
          fill="#fff"
          stroke={color}
          strokeWidth={4}
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
        {/* End node */}
        <circle
          cx={endX}
          cy={parentY}
          r={14}
          fill="#fff"
          stroke={color}
          strokeWidth={4}
          onClick={() =>
            setPopupNode({
              uuid: `end-${branch.branchId}`,
              branchId: branch.branchId,
              timeStamp: branch.branchEnd,
              content: `${branch.branchName} ends`,
              isUpdating: false,
            })
          }
          style={{ cursor: 'pointer' }}
        />
        {/* Labels */}
        <text x={startX} y={parentY - 20} fill={color} fontSize={14} textAnchor="middle">
          {branch.branchName}
        </text>
        <text x={endX} y={parentY - 20} fill={color} fontSize={14} textAnchor="middle">
          {/* Only label at end if not main */}
          {branch.parentBranchId && `${branch.branchName} ends`}
        </text>
        {/* Nodes */}
        {branchNodes.map(n => (
          <circle
            key={n.uuid}
            cx={getX(n.timeStamp)}
            cy={y}
            r={10}
            fill={color}
            stroke="#fff"
            strokeWidth={2}
            onClick={() => setPopupNode(n)}
            style={{ cursor: 'pointer' }}
          />
        ))}
        {/* Sub-branches */}
        {subBranches.map(sb => renderBranch(sb, y))}
      </g>
    );
  };

  // Main branch is the root
  const mainBranch = branches.find(b => !b.parentBranchId);

  return (
    <div style={{ width: '100vw', height: '80vh', overflowX: 'auto', position: 'relative', background: '#f9fafe' }}>
      <svg width={2200} height={600} style={{ position: 'absolute', bottom: 0 }}>
        {/* Main timeline line */}
        <line
          x1={getX(mainBranch!.branchStart)}
          y1={500}
          x2={getX(mainBranch!.branchEnd)}
          y2={500}
          stroke={getBranchColor(mainBranch!.branchId)}
          strokeWidth={4}
        />
        {/* Main branch nodes and sub-branches */}
        {renderBranch(mainBranch!, 500)}
      </svg>
      {/* Node popup */}
      {popupNode && (
        <div className="timeline-popup" onClick={() => setPopupNode(null)}>
          <div className="timeline-popup-inner" onClick={e => e.stopPropagation()}>
            <h3>{popupNode.content}</h3>
            <div style={{ color: '#888', fontSize: 13 }}>{new Date(popupNode.timeStamp).toLocaleDateString()}</div>
            {/* Markdown rendering can be added here */}
            <button onClick={() => setPopupNode(null)} style={{ marginTop: 15 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
