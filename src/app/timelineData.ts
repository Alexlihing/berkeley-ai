// timelineData.ts

export type Node = {
  uuid: string;
  branchId: string;
  timeStamp: string; // ISO
  content: string;
  isUpdating: boolean;
};

export type Branch = {
  parentBranchId: string | null;
  branchId: string;
  branchStart: string; // ISO
  branchEnd: string;   // ISO
  branchName: string;
  branchSummary: string;
};

// Branch UUIDs
export const MAIN_BRANCH = 'main-branch-uuid';
export const MIT_BRANCH = 'mit-branch-uuid';
export const FRAT_BRANCH = 'frat-branch-uuid';
export const PHD_BRANCH = 'phd-branch-uuid';

// Branches
export const branches: Branch[] = [
  {
    parentBranchId: null,
    branchId: MAIN_BRANCH,
    branchStart: '2000-01-01',
    branchEnd: '2025-01-01',
    branchName: 'Life',
    branchSummary: 'The main timeline of your life.',
  },
  {
    parentBranchId: MAIN_BRANCH,
    branchId: MIT_BRANCH,
    branchStart: '2002-09-01',
    branchEnd: '2006-06-01',
    branchName: 'MIT Undergrad',
    branchSummary: 'Studied physics at MIT.',
  },
  {
    parentBranchId: MIT_BRANCH,
    branchId: FRAT_BRANCH,
    branchStart: '2003-09-01',
    branchEnd: '2004-06-01',
    branchName: 'Fraternity',
    branchSummary: 'Joined a fraternity during MIT.',
  },
  {
    parentBranchId: MAIN_BRANCH,
    branchId: PHD_BRANCH,
    branchStart: '2010-09-01',
    branchEnd: '2018-06-01',
    branchName: 'Caltech PhD',
    branchSummary: 'Physics PhD at Caltech.',
  },
];

// Nodes
export const nodes: Node[] = [
  // MIT Branch nodes (start/end handled by branch line)
  {
    uuid: 'mit-start-node',
    branchId: MIT_BRANCH,
    timeStamp: '2002-09-01',
    content: 'MIT Undergrad begins',
    isUpdating: false,
  },
  {
    uuid: 'mit-end-node',
    branchId: MIT_BRANCH,
    timeStamp: '2006-06-01',
    content: 'MIT Undergrad ends',
    isUpdating: false,
  },

  // Frat Branch nodes
  {
    uuid: 'frat-start-node',
    branchId: FRAT_BRANCH,
    timeStamp: '2003-09-01',
    content: 'Joined fraternity',
    isUpdating: false,
  },
  {
    uuid: 'frat-end-node',
    branchId: FRAT_BRANCH,
    timeStamp: '2004-06-01',
    content: 'Left fraternity',
    isUpdating: false,
  },

  // Main branch: Research award node
  {
    uuid: 'research-award-node',
    branchId: MAIN_BRANCH,
    timeStamp: '2005-05-15',
    content: 'Received research award',
    isUpdating: false,
  },

  // PhD Branch nodes
  {
    uuid: 'phd-start-node',
    branchId: PHD_BRANCH,
    timeStamp: '2010-09-01',
    content: 'Caltech PhD begins',
    isUpdating: false,
  },
  {
    uuid: 'phd-end-node',
    branchId: PHD_BRANCH,
    timeStamp: '2018-06-01',
    content: 'Caltech PhD ends',
    isUpdating: false,
  },
];
