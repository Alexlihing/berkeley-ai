import { v4 as uuidv4 } from 'uuid';
import { TreeNode, TreeStats } from '@/types/tree';

// In-memory storage (in production, use a database)
const treeData: TreeNode = {
  id: 'root',
  title: 'Life Journey',
  description: 'The beginning of my life story',
  timestamp: new Date().toISOString(),
  type: 'commit',
  parentIds: [],
  children: [],
  metadata: { status: 'active' }
};

export class TreeService {
  // Add a new commit to the current branch
  static addCommit(branchName: string, nodeData: Partial<TreeNode>): TreeNode {
    const newNode: TreeNode = {
      id: uuidv4(),
      title: nodeData.title || 'Untitled',
      description: nodeData.description || '',
      timestamp: nodeData.timestamp || new Date().toISOString(),
      type: 'commit',
      branchName: branchName,
      parentIds: [],
      children: [],
      metadata: nodeData.metadata || { status: 'active' }
    };

    // Find the latest commit in the branch and add as child
    const latestCommit = this.getLatestCommitInBranch(branchName);
    if (latestCommit) {
      latestCommit.children.push(newNode);
      newNode.parentIds = [latestCommit.id];
    } else {
      // If no commits in branch, add to root
      treeData.children.push(newNode);
      newNode.parentIds = [treeData.id];
    }

    return newNode;
  }

  // Create a new branch from an existing commit
  static createBranch(branchName: string, fromCommitId: string, nodeData: Partial<TreeNode>): TreeNode {
    const newNode: TreeNode = {
      id: uuidv4(),
      title: nodeData.title || `Started ${branchName}`,
      description: nodeData.description || `Created new branch: ${branchName}`,
      timestamp: nodeData.timestamp || new Date().toISOString(),
      type: 'branch',
      branchName: branchName,
      parentIds: [fromCommitId],
      children: [],
      metadata: nodeData.metadata || { status: 'active' }
    };

    // Find the parent commit and add as child
    const parentCommit = this.findNodeById(treeData, fromCommitId);
    if (parentCommit) {
      parentCommit.children.push(newNode);
    } else {
      // If parent not found, add to root
      treeData.children.push(newNode);
      newNode.parentIds = [treeData.id];
    }

    return newNode;
  }

  // Merge a branch back to main or another branch
  static mergeBranch(branchName: string, targetBranch: string, nodeData: Partial<TreeNode>): TreeNode {
    const newNode: TreeNode = {
      id: uuidv4(),
      title: nodeData.title || `Merged ${branchName} into ${targetBranch}`,
      description: nodeData.description || `Merged branch ${branchName} into ${targetBranch}`,
      timestamp: nodeData.timestamp || new Date().toISOString(),
      type: 'merge',
      branchName: targetBranch,
      parentIds: [],
      children: [],
      metadata: nodeData.metadata || { status: 'completed' }
    };

    // Find the latest commits in both branches
    const branchLatest = this.getLatestCommitInBranch(branchName);
    const targetLatest = this.getLatestCommitInBranch(targetBranch);

    if (branchLatest && targetLatest) {
      newNode.parentIds = [branchLatest.id, targetLatest.id];
      branchLatest.children.push(newNode);
      targetLatest.children.push(newNode);
    } else {
      // If branches not found, add to root
      treeData.children.push(newNode);
      newNode.parentIds = [treeData.id];
    }

    return newNode;
  }

  // Get the latest commit in a specific branch
  static getLatestCommitInBranch(branchName: string): TreeNode | null {
    const allNodes: TreeNode[] = [];
    this.getAllNodesRecursive(treeData, allNodes);
    
    const branchNodes = allNodes.filter(node => 
      node.branchName === branchName && node.type === 'commit'
    );
    
    if (branchNodes.length === 0) return null;
    
    return branchNodes.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }

  // Find a node by ID
  static findNodeById(node: TreeNode, id: string): TreeNode | null {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = this.findNodeById(child, id);
      if (found) return found;
    }
    return null;
  }

  // Get the entire tree
  static getTree(): TreeNode {
    return treeData;
  }

  // Get tree statistics
  static getStats(): TreeStats {
    const stats: TreeStats = {
      totalNodes: 0,
      branches: [],
      activeBranches: 0,
      completedBranches: 0
    };

    this.calculateStatsRecursive(treeData, stats);
    return stats;
  }

  private static calculateStatsRecursive(node: TreeNode, stats: TreeStats): void {
    stats.totalNodes++;
    
    if (node.branchName && !stats.branches.includes(node.branchName)) {
      stats.branches.push(node.branchName);
    }

    if (node.metadata?.status === 'active') {
      stats.activeBranches++;
    } else if (node.metadata?.status === 'completed') {
      stats.completedBranches++;
    }

    // Recursively process children
    for (const child of node.children) {
      this.calculateStatsRecursive(child, stats);
    }
  }

  private static getAllNodesRecursive(node: TreeNode, allNodes: TreeNode[]): void {
    allNodes.push(node);
    for (const child of node.children) {
      this.getAllNodesRecursive(child, allNodes);
    }
  }

  // Get all branches
  static getBranches(): { [branchName: string]: TreeNode[] } {
    const branches: { [branchName: string]: TreeNode[] } = {};
    this.getBranchesRecursive(treeData, branches);
    return branches;
  }

  private static getBranchesRecursive(node: TreeNode, branches: { [branchName: string]: TreeNode[] }): void {
    if (node.branchName) {
      if (!branches[node.branchName]) {
        branches[node.branchName] = [];
      }
      branches[node.branchName].push(node);
    }
    for (const child of node.children) {
      this.getBranchesRecursive(child, branches);
    }
  }

  // Get timeline of all events
  static getTimeline(): TreeNode[] {
    const allNodes: TreeNode[] = [];
    this.getAllNodesRecursive(treeData, allNodes);
    
    return allNodes
      .filter(node => node.id !== 'root')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
} 