import { v4 as uuidv4 } from 'uuid';
import { Node, Branch } from '@/types/tree';

// In-memory storage with hardcoded sample data
const rootBranchId = 'root';
const workBranchId = uuidv4();
const personalBranchId = uuidv4();

// SSE subscribers
type UpdateType = 'node_added' | 'node_updated' | 'node_deleted' | 'branch_added' | 'branch_updated' | 'branch_deleted';

type UpdateCallback = (update: {
  type: UpdateType;
  data: any;
  allNodes: Node[];
  allBranches: Branch[];
  stats: any;
}) => void;

// Use global storage to prevent reset on module reload
const getSubscribers = (): UpdateCallback[] => {
  if (!(globalThis as any).__treeServiceSubscribers) {
    (globalThis as any).__treeServiceSubscribers = [];
    console.log('TreeService: Initialized global subscribers array');
  }
  return (globalThis as any).__treeServiceSubscribers;
};

const notifySubscribers = (updateType: UpdateType, data: any) => {
  const subscribers = getSubscribers();
  console.log(`TreeService: Notifying ${subscribers.length} subscribers of ${updateType} update`);
  console.log(`TreeService: Subscribers array:`, subscribers.map((_, index) => `subscriber_${index}`));
  
  const update = {
    type: updateType,
    data,
    allNodes: nodes,
    allBranches: branches,
    stats: TreeService.getStats()
  };
  
  subscribers.forEach((callback, index) => {
    console.log(`TreeService: Calling subscriber ${index}`);
    try {
      callback(update);
      console.log(`TreeService: Successfully called subscriber ${index}`);
    } catch (error) {
      console.error(`TreeService: Error calling subscriber ${index}:`, error);
    }
  });
};

const branches: Branch[] = [  {
    parentBranchId: null,
    branchId: "root",
    branchStart: '1970-01-01',
    branchEnd: null,
    branchName: 'Main',
    branchSummary: 'The main timeline of your life.',
  }]
const nodes: Node[] = []
// const branches: Branch[] = [
//   new Branch(
//     '', // no parent
//     rootBranchId,
//     new Date('2023-01-01').toISOString(),
//     '', // no end date for root
//     'Main',
//     'The main timeline of my life'
//   ),
//   new Branch(
//     rootBranchId,
//     workBranchId,
//     new Date('2023-03-01').toISOString(),
//     '', // Active branch
//     'Work Projects',
//     'Tracking all my work-related projects and tasks.'
//   ),
//   new Branch(
//     rootBranchId,
//     personalBranchId,
//     new Date('2023-04-01').toISOString(),
//     new Date('2023-06-30').toISOString(), // A completed branch
//     'Learn Guitar',
//     'My journey to learning how to play the guitar.'
//   ),
// ];

// const nodes: Node[] = [
//   // Nodes for root branch
//   new Node(
//     uuidv4(),
//     rootBranchId,
//     new Date('2023-01-10').toISOString(),
//     'Started journaling my life like a git tree.',
//     false
//   ),
//   new Node(
//     uuidv4(),
//     rootBranchId,
//     new Date('2023-02-15').toISOString(),
//     'Had a great idea for a new project.',
//     false
//   ),
//   // Nodes for 'Work' branch
//   new Node(
//     uuidv4(),
//     workBranchId,
//     new Date('2023-03-05').toISOString(),
//     'Launched the alpha version of Project Phoenix.',
//     false
//   ),
//   new Node(
//     uuidv4(),
//     workBranchId,
//     new Date('2023-03-20').toISOString(),
//     'Finished user testing and gathered feedback.',
//     false
//   ),
//   // Nodes for 'Personal' branch
//   new Node(
//     uuidv4(),
//     personalBranchId,
//     new Date('2023-04-02').toISOString(),
//     'Bought my first acoustic guitar.',
//     false
//   ),
//   new Node(
//     uuidv4(),
//     personalBranchId,
//     new Date('2023-05-15').toISOString(),
//     'Can now play "Wonderwall".',
//     true // isUpdating
//   ),
//   new Node(
//     uuidv4(),
//     personalBranchId,
//     new Date('2023-06-30').toISOString(),
//     'Performed at an open mic night! Branch complete.',
//     false
//   ),
// ];

export class TreeService {
  // Find a branch by UUID
  static findBranchById(branchId: string): Branch | null {
    return branches.find(branch => branch.branchId === branchId) || null;
  }

  // Find a branch by name
  static findBranchByName(branchName: string): Branch | null {
    return branches.find(branch => branch.branchName === branchName) || null;
  }

  // Get a branch by UUID (alias for findBranchById)
  static getBranch(branchId: string): Branch | null {
    return this.findBranchById(branchId);
  }

  // Add a new node to a branch with validation and fallback
  static addNode(branchIdOrName: string, content: string, timestamp?: string): Node {
    let actualBranchId = branchIdOrName;
    
    // First, try to find the branch by ID
    let branch = this.findBranchById(branchIdOrName);
    
    // If not found by ID, try to find by name
    if (!branch) {
      branch = this.findBranchByName(branchIdOrName);
      if (branch) {
        actualBranchId = branch.branchId;
        console.log(`TreeService: Branch not found by ID "${branchIdOrName}", but found by name. Using branch ID: ${actualBranchId}`);
      } else {
        console.warn(`TreeService: Branch not found by ID or name: "${branchIdOrName}". Adding node anyway.`);
      }
    }

    const newNode = new Node(
      uuidv4(),
      actualBranchId,
      timestamp || new Date().toISOString(),
      content,
      false
    );

    nodes.push(newNode);
    notifySubscribers('node_added', newNode);
    return newNode;
  }

  // Find a node by UUID
  static findNodeById(uuid: string): Node | null {
    return nodes.find(node => node.uuid === uuid) || null;
  }

  // Update a node
  static updateNode(uuid: string, updates: Partial<Node>, timestamp?: string): Node | null {
    const node = this.findNodeById(uuid);
    if (node) {
      Object.assign(node, updates, { timeStamp: timestamp || new Date().toISOString() });
      notifySubscribers('node_updated', node);
      return node;
    }
    return null;
  }

  // Delete a node
  static deleteNode(uuid: string): boolean {
    const index = nodes.findIndex(node => node.uuid === uuid);
    if (index !== -1) {
      const deletedNode = nodes.splice(index, 1)[0];
      notifySubscribers('node_deleted', deletedNode);
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
  static addBranch(parentBranchId: string, branchName: string, branchSummary: string, branchStart?: string, branchEnd?: string): Branch {
    const newBranch = new Branch(
      parentBranchId,
      uuidv4(),
      branchStart || new Date().toISOString(),
      branchEnd || '', // no end date initially
      branchName,
      branchSummary
    );

    branches.push(newBranch);
    notifySubscribers('branch_added', newBranch);
    return newBranch;
  }

  // Update a branch
  static updateBranch(branchId: string, updates: Partial<Branch>): Branch | null {
    const branch = this.findBranchById(branchId);
    if (branch) {
      Object.assign(branch, updates);
      notifySubscribers('branch_updated', branch);
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
      const deletedBranch = branches.splice(branchIndex, 1)[0];
      notifySubscribers('branch_deleted', deletedBranch);
      return true;
    }
    return false;
  }

  // Get all branches
  static getAllBranches(): Branch[] {
    return branches;
  }

  // Get all branch names
  static getAllBranchNames(): string[] {
    return branches.map(branch => branch.branchName);
  }

  // Get branch names with their IDs
  static getBranchNamesWithIds(): { name: string; id: string }[] {
    return branches.map(branch => ({
      name: branch.branchName,
      id: branch.branchId
    }));
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

  // Subscribe to tree updates
  static subscribeToUpdates(callback: UpdateCallback): () => void {
    console.log(`TreeService: Adding new subscriber, total subscribers: ${getSubscribers().length + 1}`);
    console.log(`TreeService: Current subscribers before adding:`, getSubscribers().length);
    getSubscribers().push(callback);
    console.log(`TreeService: Current subscribers after adding:`, getSubscribers().length);
    
    // Return unsubscribe function
    return () => {
      const index = getSubscribers().indexOf(callback);
      console.log(`TreeService: Unsubscribe called for subscriber at index ${index}`);
      console.log(`TreeService: Current subscribers before removing:`, getSubscribers().length);
      if (index > -1) {
        console.log(`TreeService: Removing subscriber at index ${index}`);
        getSubscribers().splice(index, 1);
        console.log(`TreeService: Current subscribers after removing:`, getSubscribers().length);
      } else {
        console.log(`TreeService: Subscriber not found in array`);
      }
    };
  }
} 