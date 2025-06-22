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
  branchEnd: string | null;   // ISO or null for ongoing relationships
  branchName: string;
  branchSummary: string;
};

// Branch UUIDs
export const MAIN_BRANCH = 'root';
export const MIT_BRANCH = 'mit-branch-uuid';
export const FRAT_BRANCH = 'frat-branch-uuid';
export const PHD_BRANCH = 'phd-branch-uuid';
export const RELATIONSHIP_BRANCH = 'relationship-branch-uuid';
export const RELATIONSHIP_BRANCH2 = 'relationship-branch-uuid2';
export const RELATIONSHIP_BRANCH3 = 'relationship-branch-uuid3';
export const FRAT_BRANCH2 = 'frat-branch-uuid2';
export const TEST_BRANCH = 'test-branch-uuid';
// Branches
export const branches: Branch[] = [
  {
    parentBranchId: null,
    branchId: MAIN_BRANCH,
    branchStart: '1970-01-01',
    branchEnd: null,
    branchName: 'Main',
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
    parentBranchId: FRAT_BRANCH,
    branchId: FRAT_BRANCH2,
    branchStart: '2003-12-01',
    branchEnd: '2004-02-01',
    branchName: 'Fraternity 2',
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
  {
    parentBranchId: MAIN_BRANCH,
    branchId: RELATIONSHIP_BRANCH,
    branchStart: '2004-03-15',
    branchEnd: null, // Ongoing relationship
    branchName: 'Long-term Relationship',
    branchSummary: 'A committed relationship that has lasted over 20 years.',
  },
  {
    parentBranchId: MAIN_BRANCH,
    branchId: RELATIONSHIP_BRANCH2,
    branchStart: '1990-05-20',
    branchEnd: '1995-08-12',
    branchName: 'First Love',
    branchSummary: 'An intense and formative relationship in the early twenties.',
  },
  {
    parentBranchId: MAIN_BRANCH,
    branchId: RELATIONSHIP_BRANCH3,
    branchStart: '1998-02-14',
    branchEnd: '2001-11-01',
    branchName: 'Relationship in Late 20s',
    branchSummary: 'A serious relationship before deciding to go back to school.',
  },
  {
    parentBranchId: MAIN_BRANCH,
    branchId: TEST_BRANCH,
    branchStart: '2005-03-15',
    branchEnd: '2007-05-15',
    branchName: 'Test Branch',
    branchSummary: 'A test branch.',
  }
];

// Nodes
// These represent events/milestones that occur within branches.
// They are fundamentally different from branch start/end points.
// Start and end nodes are NOT included here - they are handled by the branch lines.
export const nodes: Node[] = [

  // Main branch: Research award node
  {
    uuid: 'research-award-node',
    branchId: MIT_BRANCH,
    timeStamp: '2005-05-15',
    content: 'Received research award',
    isUpdating: false,
  },
  {
    uuid: 'relationship-milestone-1',
    branchId: RELATIONSHIP_BRANCH,
    timeStamp: '2008-06-20',
    content: 'We had our first date and it was really nice. We drank boba and went to the library. What a fun day we had!',
    isUpdating: false,
  },
  {
    uuid: 'relationship-milestone-2',
    branchId: RELATIONSHIP_BRANCH,
    timeStamp: '2015-09-10',
    content: 'Another significant moment',
    isUpdating: false,
  },
  // Birthday node on Life branch
  {
    uuid: 'birthday-node',
    branchId: MAIN_BRANCH,
    timeStamp: '1970-01-01',
    content: 'Birthday',
    isUpdating: false,
  },
];
