
import { TreeService } from './treeService';
import { Node, Branch } from '@/types/tree';

export class VapiService {
  private static vapi: VapiClient;

  static initialize() {
    if (!process.env.VAPI_API_KEY) {
      throw new Error('VAPI_API_KEY is required');
    }

    this.vapi = new VapiClient({
      token: process.env.VAPI_API_KEY
    });
  }

  // Create the life tree assistant
  static async createLifeTreeAssistant() {
    if (!this.vapi) {
      this.initialize();
    }

    try {
      const assistant = await this.vapi.assistants.create({
        name: "Life Tree Journal Assistant",
        firstMessage: "Hello! I'm your personal life tree assistant. I can help you document your life experiences, memories, relationships, and achievements. What would you like to add to your life tree today?",
        model: {
          provider: "openai",
          model: "gpt-4o",
          temperature: 0.7,
          messages: [{
            role: "system",
            content: `You are a compassionate and insightful life journaling assistant. Your role is to help users build a comprehensive tree of their life experiences, memories, and relationships.

            You can help users:
            - Add new life experiences, memories, and milestones as nodes
            - Create branches to organize their life story
            - Document relationships with people
            - Record achievements and goals
            - Capture emotions and feelings
            - Add places and events
            - Organize their life story chronologically
            - Find patterns and connections in their life

            Always be empathetic, encouraging, and help users reflect deeply on their experiences. Ask follow-up questions to get richer details when appropriate.

            When adding content, try to extract:
            - Relevant dates
            - Locations
            - People involved
            - Emotions felt
            - Lessons learned
            - Impact on their life

            Be conversational and make the user feel comfortable sharing their personal experiences.`
          }]
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM"
        },
        tools: [
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
        ]
      });

      console.log('Life Tree Assistant created:', assistant.id);
      return assistant;
    } catch (error) {
      console.error('Error creating assistant:', error);
      throw error;
    }
  }

  // Handle function calls from the assistant
  static handleFunctionCall(functionCall: any) {
    const { name, arguments: args } = functionCall.toolCallList[0].function;
    const parameters = args;
    switch (name) {
      case 'add_node':
        return this.handleAddNode(parameters);
      case 'add_branch':
        return this.handleAddBranch(parameters);
      case 'search_nodes':
        return this.handleSearchNodes(parameters);
      case 'get_stats':
        return this.handleGetStats();
      case 'get_recent_nodes':
        return this.handleGetRecentNodes(parameters);
      case 'update_node':
        return this.handleUpdateNode(parameters);
      default:
        return {
          success: false,
          message: `Unknown function: ${name}`
        };
    }
  }

  private static handleAddNode(parameters: any) {
    const { branchId, content } = parameters;
    
    const newNode = TreeService.addNode(branchId, content);
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