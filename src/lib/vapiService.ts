import { TreeService } from './treeService';
import { Node, Branch } from '@/types/tree';

export class VapiService {
  // Get Vapi tools configuration
  static getVapiTools() {
    return [
      {
        name: "add_node",
        description: "Add a new node with content to a branch",
        parameters: {
          type: "object",
          properties: {
            branchId: {
              type: "string",
              description: "ID of the branch to add the node to"
            },
            content: {
              type: "string",
              description: "Markdown content for the node"
            }
          },
          required: ["branchId", "content"]
        }
      },
      {
        name: "add_branch",
        description: "Add a new branch to organize content",
        parameters: {
          type: "object",
          properties: {
            parentBranchId: {
              type: "string",
              description: "ID of the parent branch (use 'root' for top level)"
            },
            branchName: {
              type: "string",
              description: "Name of the new branch"
            },
            branchSummary: {
              type: "string",
              description: "Summary description of what this branch contains"
            }
          },
          required: ["parentBranchId", "branchName", "branchSummary"]
        }
      },
      {
        name: "fetch_tree",
        description: "Get the entire tree structure with all branches and nodes",
        parameters: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "search_nodes",
        description: "Search for nodes by content",
        parameters: {
          type: "object",
          properties: {
            searchTerm: {
              type: "string",
              description: "Search term to find in node content"
            }
          },
          required: ["searchTerm"]
        }
      },
      {
        name: "get_stats",
        description: "Get statistics about the life tree",
        parameters: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_recent_nodes",
        description: "Get recent nodes from the life tree",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of recent nodes to return (default: 5)"
            }
          }
        }
      },
      {
        name: "update_node",
        description: "Update an existing node in the life tree",
        parameters: {
          type: "object",
          properties: {
            uuid: {
              type: "string",
              description: "UUID of the node to update"
            },
            content: {
              type: "string",
              description: "New content for the node"
            }
          },
          required: ["uuid", "content"]
        }
      }
    ];
  }

  // Handle function calls from the assistant
  static handleFunctionCall(functionCall: any) {
    const toolCallList = functionCall.toolCallList;
    const results = [];

    for (const toolCall of toolCallList) {
      const { name, arguments: args } = toolCall.function;
      const parameters = args;
      console.log('Processing tool:', name);
      
      let result;
      switch (name) {
        case 'add_node':
          result = this.handleAddNode(parameters);
          break;
        case 'add_branch':
          result = this.handleAddBranch(parameters);
          break;
        case 'fetch_tree':
          result = this.handleFetchTree();
          break;
        case 'search_nodes':
          result = this.handleSearchNodes(parameters);
          break;
        case 'get_stats':
          result = this.handleGetStats();
          break;
        case 'get_recent_nodes':
          result = this.handleGetRecentNodes(parameters);
          break;
        case 'update_node':
          result = this.handleUpdateNode(parameters);
          break;
        default:
          result = {
            success: false,
            message: `Unknown function: ${name}`
          };
      }
      
      results.push({
        toolCallId: toolCall.id,
        result: result
      });
    }

    return {
      results: results
    };
  }

  private static handleAddNode(parameters: any) {
    const { branchId, content } = parameters;
    console.log('branchId', branchId);
    console.log('content', content);
    const newNode = TreeService.addNode(branchId, content);
    console.log('newNode', newNode);
    return {
      success: true,
      message: `Added new node to branch`,
      node: newNode
    };
  }

  private static handleAddBranch(parameters: any) {
    const { parentBranchId, branchName, branchSummary } = parameters;
    
    const newBranch = TreeService.addBranch(parentBranchId, branchName, branchSummary);
    return {
      success: true,
      message: `Created new branch: ${branchName}`,
      branch: newBranch
    };
  }

  private static handleFetchTree() {
    const allBranches = TreeService.getAllBranches();
    const allNodes = TreeService.getAllNodes();
    const stats = TreeService.getStats();

    return {
      success: true,
      message: `Retrieved your complete life tree with ${stats.totalNodes} nodes across ${stats.totalBranches} branches`,
      branches: allBranches,
      nodes: allNodes,
      stats: stats,
    };
  }

  private static handleSearchNodes(parameters: any) {
    const { searchTerm } = parameters;
    
    const results = TreeService.searchNodesByContent(searchTerm);
    return {
      success: true,
      message: `Found ${results.length} nodes matching "${searchTerm}"`,
      results: results
    };
  }

  private static handleGetStats() {
    const stats = TreeService.getStats();
    return {
      success: true,
      message: `Your life tree has ${stats.totalNodes} total nodes across ${stats.totalBranches} branches`,
      stats: stats
    };
  }

  private static handleGetRecentNodes(parameters: any) {
    const limit = parameters.limit || 5;
    
    const recentNodes = TreeService.getRecentNodes(limit);
    return {
      success: true,
      message: `Here are your ${recentNodes.length} most recent entries`,
      nodes: recentNodes
    };
  }

  private static handleUpdateNode(parameters: any) {
    const { uuid, content } = parameters;
    
    const updatedNode = TreeService.updateNode(uuid, { content });
    if (updatedNode) {
      return {
        success: true,
        message: `Updated node successfully`,
        node: updatedNode
      };
    } else {
      return {
        success: false,
        message: `Node not found`
      };
    }
  }
} 