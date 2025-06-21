import { v4 as uuidv4 } from 'uuid';
import { LifeTreeNode, TreeStats, TreeSearchFilters, TreeAnalytics } from '@/types/tree';

// In-memory storage (in production, use a database)
const lifeTree: LifeTreeNode = {
  id: 'root',
  type: 'experience',
  title: 'My Life Journey',
  description: 'The story of my life',
  importance: 'critical',
  children: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export class TreeService {
  // Add a new node to the tree
  static addNode(parentId: string, nodeData: Partial<LifeTreeNode>): LifeTreeNode {
    const newNode: LifeTreeNode = {
      id: uuidv4(),
      type: nodeData.type || 'experience',
      title: nodeData.title || 'Untitled',
      description: nodeData.description || '',
      date: nodeData.date,
      location: nodeData.location,
      people: nodeData.people || [],
      emotions: nodeData.emotions || [],
      tags: nodeData.tags || [],
      importance: nodeData.importance || 'medium',
      children: [],
      metadata: nodeData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (parentId === 'root') {
      lifeTree.children.push(newNode);
    } else {
      const parent = this.findNodeById(lifeTree, parentId);
      if (parent) {
        parent.children.push(newNode);
      }
    }

    return newNode;
  }

  // Find a node by ID
  static findNodeById(node: LifeTreeNode, id: string): LifeTreeNode | null {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = this.findNodeById(child, id);
      if (found) return found;
    }
    return null;
  }

  // Update a node
  static updateNode(nodeId: string, updates: Partial<LifeTreeNode>): LifeTreeNode | null {
    const node = this.findNodeById(lifeTree, nodeId);
    if (node) {
      Object.assign(node, updates, { updatedAt: new Date().toISOString() });
      return node;
    }
    return null;
  }

  // Delete a node
  static deleteNode(nodeId: string): boolean {
    return this.deleteNodeById(lifeTree, nodeId);
  }

  private static deleteNodeById(node: LifeTreeNode, id: string): boolean {
    for (let i = 0; i < node.children.length; i++) {
      if (node.children[i].id === id) {
        node.children.splice(i, 1);
        return true;
      }
      const deleted = this.deleteNodeById(node.children[i], id);
      if (deleted) return deleted;
    }
    return false;
  }

  // Get the entire tree
  static getTree(): LifeTreeNode {
    return lifeTree;
  }

  // Search nodes with filters
  static searchNodes(filters: TreeSearchFilters): LifeTreeNode[] {
    const results: LifeTreeNode[] = [];
    this.searchNodesRecursive(lifeTree, filters, results);
    return results;
  }

  private static searchNodesRecursive(node: LifeTreeNode, filters: TreeSearchFilters, results: LifeTreeNode[]): void {
    // Apply filters
    if (this.matchesFilters(node, filters)) {
      results.push(node);
    }

    // Recursively search children
    for (const child of node.children) {
      this.searchNodesRecursive(child, filters, results);
    }
  }

  private static matchesFilters(node: LifeTreeNode, filters: TreeSearchFilters): boolean {
    if (filters.type && filters.type.length > 0 && !filters.type.includes(node.type)) {
      return false;
    }

    if (filters.importance && filters.importance.length > 0 && !filters.importance.includes(node.importance)) {
      return false;
    }

    if (filters.dateRange && node.date) {
      const nodeDate = new Date(node.date);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (nodeDate < startDate || nodeDate > endDate) {
        return false;
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => node.tags?.includes(tag));
      if (!hasMatchingTag) return false;
    }

    if (filters.people && filters.people.length > 0) {
      const hasMatchingPerson = filters.people.some(person => node.people?.includes(person));
      if (!hasMatchingPerson) return false;
    }

    if (filters.emotions && filters.emotions.length > 0) {
      const hasMatchingEmotion = filters.emotions.some(emotion => node.emotions?.includes(emotion));
      if (!hasMatchingEmotion) return false;
    }

    return true;
  }

  // Get tree statistics
  static getStats(): TreeStats {
    const stats: TreeStats = {
      totalNodes: 0,
      byType: {},
      byImportance: {},
      byYear: {},
      recentActivity: []
    };

    this.calculateStatsRecursive(lifeTree, stats);
    
    // Get recent activity (last 10 nodes)
    const allNodes: LifeTreeNode[] = [];
    this.getAllNodesRecursive(lifeTree, allNodes);
    stats.recentActivity = allNodes
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);

    return stats;
  }

  private static calculateStatsRecursive(node: LifeTreeNode, stats: TreeStats): void {
    stats.totalNodes++;
    
    // Count by type
    stats.byType[node.type] = (stats.byType[node.type] || 0) + 1;
    
    // Count by importance
    stats.byImportance[node.importance] = (stats.byImportance[node.importance] || 0) + 1;
    
    // Count by year
    if (node.date) {
      const year = new Date(node.date).getFullYear().toString();
      stats.byYear[year] = (stats.byYear[year] || 0) + 1;
    }

    // Recursively process children
    for (const child of node.children) {
      this.calculateStatsRecursive(child, stats);
    }
  }

  private static getAllNodesRecursive(node: LifeTreeNode, allNodes: LifeTreeNode[]): void {
    allNodes.push(node);
    for (const child of node.children) {
      this.getAllNodesRecursive(child, allNodes);
    }
  }

  // Get analytics data
  static getAnalytics(): TreeAnalytics {
    const allNodes: LifeTreeNode[] = [];
    this.getAllNodesRecursive(lifeTree, allNodes);

    // Timeline analytics
    const timelineMap = new Map<string, { count: number; types: Record<string, number> }>();
    allNodes.forEach(node => {
      if (node.date) {
        const year = new Date(node.date).getFullYear().toString();
        const existing = timelineMap.get(year) || { count: 0, types: {} };
        existing.count++;
        existing.types[node.type] = (existing.types[node.type] || 0) + 1;
        timelineMap.set(year, existing);
      }
    });

    const timeline = Array.from(timelineMap.entries()).map(([year, data]) => ({
      year,
      count: data.count,
      types: data.types
    })).sort((a, b) => parseInt(a.year) - parseInt(b.year));

    // Relationship analytics
    const peopleMap = new Map<string, { name: string; experiences: string[] }>();
    allNodes.forEach(node => {
      node.people?.forEach(personId => {
        const existing = peopleMap.get(personId) || { name: personId, experiences: [] };
        existing.experiences.push(node.id);
        peopleMap.set(personId, existing);
      });
    });

    const relationships = Array.from(peopleMap.entries()).map(([personId, data]) => ({
      personId,
      personName: data.name,
      connectionCount: data.experiences.length,
      sharedExperiences: data.experiences
    })).sort((a, b) => b.connectionCount - a.connectionCount);

    // Growth analytics (last 12 months)
    const now = new Date();
    const growth = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = date.toISOString();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
      
      const monthNodes = allNodes.filter(node => 
        node.createdAt >= monthStart && node.createdAt <= monthEnd
      );

      growth.push({
        period: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        newNodes: monthNodes.length,
        growthRate: i === 11 ? 0 : monthNodes.length // Simplified growth rate
      });
    }

    return { timeline, relationships, growth };
  }

  // Get nodes by type
  static getNodesByType(type: string): LifeTreeNode[] {
    const results: LifeTreeNode[] = [];
    this.getNodesByTypeRecursive(lifeTree, type, results);
    return results;
  }

  private static getNodesByTypeRecursive(node: LifeTreeNode, type: string, results: LifeTreeNode[]): void {
    if (node.type === type) {
      results.push(node);
    }
    for (const child of node.children) {
      this.getNodesByTypeRecursive(child, type, results);
    }
  }

  // Get timeline of events
  static getTimeline(): LifeTreeNode[] {
    const allNodes: LifeTreeNode[] = [];
    this.getAllNodesRecursive(lifeTree, allNodes);
    
    return allNodes
      .filter(node => node.date)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
  }
} 