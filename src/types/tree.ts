export class Node {
  uuid: string;
  branchId: string; // every node sits on a branch
  timeStamp: string; // ISO
  content: string; // markdown
  isUpdating: boolean;

  constructor(
    uuid: string,
    branchId: string,
    timeStamp: string,
    content: string,
    isUpdating: boolean = false
  ) {
    this.uuid = uuid;
    this.branchId = branchId;
    this.timeStamp = timeStamp;
    this.content = content;
    this.isUpdating = isUpdating;
  }
}

export class Branch {
  parentBranchId: string;
  branchId: string;
  branchStart: string; // timestamp
  branchEnd: string; // timestamp
  branchName: string;
  branchSummary: string;

  constructor(
    parentBranchId: string,
    branchId: string,
    branchStart: string,
    branchEnd: string,
    branchName: string,
    branchSummary: string
  ) {
    this.parentBranchId = parentBranchId;
    this.branchId = branchId;
    this.branchStart = branchStart;
    this.branchEnd = branchEnd;
    this.branchName = branchName;
    this.branchSummary = branchSummary;
  }
} 