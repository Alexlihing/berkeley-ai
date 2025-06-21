import { v4 as uuidv4 } from 'uuid';
import { Node, Branch } from '@/types/tree';

// In-memory storage (in production, use a database)
const nodes: Node[] = [];
const branches: Branch[] = [];

// Create root branch
const rootBranch: Branch = new Branch(
  '', // no parent
  'root',
  new Date().toISOString(),
  '', // no end date for root
  'Root Branch',
  'The main branch of the tree'
);

// Initialize with root branch
branches.push(rootBranch);

export class TreeService {
  // Add a new node to a branch
  static addNode(branchId: string, content: string): Node {
    const newNode = new Node(
      uuidv4(),
      branchId,
      new Date().toISOString(),
      content,
      false
    );

    nodes.push(newNode);
    return newNode;
  }

  // Find a node by UUID
  static findNodeById(uuid: string): Node | null {
    return nodes.find(node => node.uuid === uuid) || null;
  }

  // Update a node
  static updateNode(uuid: string, updates: Partial<Node>): Node | null {
    const node = this.findNodeById(uuid);
    if (node) {
      Object.assign(node, updates, { timeStamp: new Date().toISOString() });
      return node;
    }
    return null;
  }

  // Delete a node
  static deleteNode(uuid: string): boolean {
    const index = nodes.findIndex(node => node.uuid === uuid);
    if (index !== -1) {
      nodes.splice(index, 1);
      return true;
    }
    return false;
  }

  // Get all nodes
  static getAllNodes(): Node[] {
    return nodes;
  }

  // Get nodes by branch
  static getNodesByBranch(branchId: string): Node[] {
    return nodes.filter(node => node.branchId === branchId);
  }

  // Add a new branch
  static addBranch(parentBranchId: string, branchName: string, branchSummary: string): Branch {
    const newBranch = new Branch(
      parentBranchId,
      uuidv4(),
      new Date().toISOString(),
      '', // no end date initially
      branchName,
      branchSummary
    );

    branches.push(newBranch);
    return newBranch;
  }

  // Find a branch by UUID
  static findBranchById(branchId: string): Branch | null {
    return branches.find(branch => branch.branchId === branchId) || null;
  }

  // Update a branch
  static updateBranch(branchId: string, updates: Partial<Branch>): Branch | null {
    const branch = this.findBranchById(branchId);
    if (branch) {
      Object.assign(branch, updates);
      return branch;
    }
    return null;
  }

  // Delete a branch and all its nodes
  static deleteBranch(branchId: string): boolean {
    const branchIndex = branches.findIndex(branch => branch.branchId === branchId);
    if (branchIndex !== -1) {
      // Delete all nodes in this branch
      const nodesToDelete = nodes.filter(node => node.branchId === branchId);
      nodesToDelete.forEach(node => {
        const nodeIndex = nodes.findIndex(n => n.uuid === node.uuid);
        if (nodeIndex !== -1) {
          nodes.splice(nodeIndex, 1);
        }
      });

      // Delete the branch
      branches.splice(branchIndex, 1);
      return true;
    }
    return false;
  }

  // Get all branches
  static getAllBranches(): Branch[] {
    return branches;
  }

  // Get child branches of a parent branch
  static getChildBranches(parentBranchId: string): Branch[] {
    return branches.filter(branch => branch.parentBranchId === parentBranchId);
  }

  // Get branch hierarchy (tree structure)
  static getBranchHierarchy(): Branch[] {
    return branches;
  }

  // Search nodes by content
  static searchNodesByContent(searchTerm: string): Node[] {
    return nodes.filter(node => 
      node.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Get recent nodes
  static getRecentNodes(limit: number = 10): Node[] {
    return nodes
      .sort((a, b) => new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime())
      .slice(0, limit);
  }

  // Get nodes by date range
  static getNodesByDateRange(startDate: string, endDate: string): Node[] {
    return nodes.filter(node => {
      const nodeDate = new Date(node.timeStamp);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return nodeDate >= start && nodeDate <= end;
    });
  }

  // Get tree statistics
  static getStats() {
    return {
      totalNodes: nodes.length,
      totalBranches: branches.length,
      nodesByBranch: branches.map(branch => ({
        branchId: branch.branchId,
        branchName: branch.branchName,
        nodeCount: this.getNodesByBranch(branch.branchId).length
      })),
      recentActivity: this.getRecentNodes(5)
    };
  }
} 