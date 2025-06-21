import { TreeService } from './treeService';

// import dotenv from 'dotenv';
// dotenv.config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
if (!VAPI_API_KEY) {
  throw new Error('VAPI_API_KEY is not set in the environment variables.');
}

export async function callVapiEndpoint(payload: any) {
  const response = await fetch('https://api.vapi.com/endpoint', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`VAPI API error: ${response.statusText}`);
  }

  return response.json();
}

export class VapiService {
  // Handle function calls from Vapi
  static handleFunctionCall(functionCall: any) {
    switch (functionCall.name) {
      case 'add_commit':
        return this.handleAddCommit(functionCall.parameters);

      case 'create_branch':
        return this.handleCreateBranch(functionCall.parameters);

      case 'merge_branch':
        return this.handleMergeBranch(functionCall.parameters);

      case 'get_tree':
        return this.handleGetTree();

      case 'get_branches':
        return this.handleGetBranches();

      case 'get_timeline':
        return this.handleGetTimeline();

      default:
        throw new Error(`Unknown function: ${functionCall.name}`);
    }
  }

  private static handleAddCommit(parameters: any) {
    const nodeData = {
      title: parameters.title,
      description: parameters.description,
      timestamp: parameters.timestamp || new Date().toISOString(),
      metadata: parameters.metadata || {}
    };

    const newNode = TreeService.addCommit(parameters.branchName, nodeData);
    return {
      success: true,
      message: `Added commit to ${parameters.branchName}: ${parameters.title}`,
      node: newNode
    };
  }

  private static handleCreateBranch(parameters: any) {
    const nodeData = {
      title: parameters.title,
      description: parameters.description,
      timestamp: parameters.timestamp || new Date().toISOString(),
      metadata: parameters.metadata || {}
    };

    const newNode = TreeService.createBranch(parameters.branchName, parameters.fromCommitId, nodeData);
    return {
      success: true,
      message: `Created branch ${parameters.branchName} from commit ${parameters.fromCommitId}`,
      node: newNode
    };
  }

  private static handleMergeBranch(parameters: any) {
    const nodeData = {
      title: parameters.title,
      description: parameters.description,
      timestamp: parameters.timestamp || new Date().toISOString(),
      metadata: parameters.metadata || {}
    };

    const newNode = TreeService.mergeBranch(parameters.branchName, parameters.targetBranch, nodeData);
    return {
      success: true,
      message: `Merged ${parameters.branchName} into ${parameters.targetBranch}`,
      node: newNode
    };
  }

  private static handleGetTree() {
    const tree = TreeService.getTree();
    return {
      success: true,
      message: 'Retrieved tree data',
      tree: tree
    };
  }

  private static handleGetBranches() {
    const branches = TreeService.getBranches();
    return {
      success: true,
      message: 'Retrieved branches',
      branches: branches
    };
  }

  private static handleGetTimeline() {
    const timeline = TreeService.getTimeline();
    return {
      success: true,
      message: 'Retrieved timeline',
      timeline: timeline
    };
  }

  // Get Vapi tools configuration
  static getVapiTools() {
    return [
      {
        name: "add_commit",
        description: "Add a new commit to a branch in the life tree",
        parameters: {
          type: "object",
          properties: {
            branchName: {
              type: "string",
              description: "Name of the branch to add commit to"
            },
            title: {
              type: "string",
              description: "Title of the commit"
            },
            description: {
              type: "string",
              description: "Description of what happened"
            },
            timestamp: {
              type: "string",
              description: "When this happened (ISO format)"
            },
            metadata: {
              type: "object",
              description: "Additional metadata"
            }
          },
          required: ["branchName", "title", "description"]
        }
      },
      {
        name: "create_branch",
        description: "Create a new branch from an existing commit",
        parameters: {
          type: "object",
          properties: {
            branchName: {
              type: "string",
              description: "Name of the new branch"
            },
            fromCommitId: {
              type: "string",
              description: "ID of the commit to branch from"
            },
            title: {
              type: "string",
              description: "Title for the branch creation"
            },
            description: {
              type: "string",
              description: "Description of why this branch was created"
            },
            timestamp: {
              type: "string",
              description: "When this branch was created (ISO format)"
            },
            metadata: {
              type: "object",
              description: "Additional metadata"
            }
          },
          required: ["branchName", "fromCommitId", "title", "description"]
        }
      },
      {
        name: "merge_branch",
        description: "Merge a branch back to main or another branch",
        parameters: {
          type: "object",
          properties: {
            branchName: {
              type: "string",
              description: "Name of the branch to merge"
            },
            targetBranch: {
              type: "string",
              description: "Name of the target branch to merge into"
            },
            title: {
              type: "string",
              description: "Title for the merge commit"
            },
            description: {
              type: "string",
              description: "Description of what was merged"
            },
            timestamp: {
              type: "string",
              description: "When this merge happened (ISO format)"
            },
            metadata: {
              type: "object",
              description: "Additional metadata"
            }
          },
          required: ["branchName", "targetBranch", "title", "description"]
        }
      },
      {
        name: "get_tree",
        description: "Get the entire life tree structure",
        parameters: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_branches",
        description: "Get all branches in the life tree",
        parameters: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_timeline",
        description: "Get a chronological timeline of all life events",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    ];
  }
} 