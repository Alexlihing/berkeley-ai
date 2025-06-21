export interface LifeTreeNode {
  id: string;
  type: 'experience' | 'person' | 'place' | 'achievement' | 'milestone' | 'memory' | 'goal' | 'relationship' | 'skill' | 'event';
  title: string;
  description: string;
  date?: string; // ISO date string
  location?: string;
  people?: string[]; // IDs of related people
  emotions?: string[];
  tags?: string[];
  importance: 'low' | 'medium' | 'high' | 'critical';
  children: LifeTreeNode[];
  metadata?: {
    age?: number;
    duration?: string;
    impact?: string;
    lessons?: string[];
    photos?: string[];
    documents?: string[];
    [key: string]: string | number | string[] | undefined;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TreeStats {
  totalNodes: number;
  byType: Record<string, number>;
  byImportance: Record<string, number>;
  byYear: Record<string, number>;
  recentActivity: LifeTreeNode[];
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