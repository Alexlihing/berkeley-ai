export interface TreeNode {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'commit' | 'branch' | 'merge';
  branchName?: string;
  parentIds: string[]; // For merge commits
  children: TreeNode[];
  metadata?: {
    status?: 'active' | 'completed' | 'paused';
    duration?: string;
    [key: string]: any;
  };
}

export interface TreeStats {
  totalNodes: number;
  branches: string[];
  activeBranches: number;
  completedBranches: number;
}

export interface TreeSearchFilters {
  type?: string[];
  importance?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  people?: string[];
  emotions?: string[];
}

export interface TreeAnalytics {
  timeline: {
    year: string;
    count: number;
    types: Record<string, number>;
  }[];
  relationships: {
    personId: string;
    personName: string;
    connectionCount: number;
    sharedExperiences: string[];
  }[];
  growth: {
    period: string;
    newNodes: number;
    growthRate: number;
  }[];
} 