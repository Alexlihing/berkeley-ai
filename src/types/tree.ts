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

export enum RecommendationType {
  CLOSE_PATH = 'close_path',
  START_NEW_PATH = 'start_new_path',
  CONTINUE_PATH = 'continue_path',
  REFLECT_ON_PATH = 'reflect_on_path',
  MERGE_PATHS = 'merge_paths'
}

export enum RecommendationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export class Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  reasoning: string;
  suggestedActions: string[];
  relatedBranchIds: string[];
  relatedNodeIds: string[];
  createdAt: string;

  constructor(
    id: string,
    type: RecommendationType,
    priority: RecommendationPriority,
    title: string,
    description: string,
    reasoning: string,
    suggestedActions: string[],
    relatedBranchIds: string[] = [],
    relatedNodeIds: string[] = [],
    createdAt: string = new Date().toISOString()
  ) {
    this.id = id;
    this.type = type;
    this.priority = priority;
    this.title = title;
    this.description = description;
    this.reasoning = reasoning;
    this.suggestedActions = suggestedActions;
    this.relatedBranchIds = relatedBranchIds;
    this.relatedNodeIds = relatedNodeIds;
    this.createdAt = createdAt;
  }
} 