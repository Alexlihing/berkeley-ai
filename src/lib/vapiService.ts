import { VapiClient } from '@vapi-ai/server-sdk';
import { TreeService } from './treeService';
import { LifeTreeNode } from '@/types/tree';

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
            - Add new life experiences, memories, and milestones
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
            name: "add_life_experience",
            description: "Add a new life experience, memory, or milestone to the tree",
            parameters: {
              type: "object",
              properties: {
                parentId: {
                  type: "string",
                  description: "ID of the parent node (use 'root' for top level)"
                },
                type: {
                  type: "string",
                  description: "Type of the life experience",
                  enum: ["experience", "memory", "milestone", "achievement", "event"]
                },
                title: {
                  type: "string",
                  description: "Title of the experience"
                },
                description: {
                  type: "string",
                  description: "Detailed description of the experience"
                },
                date: {
                  type: "string",
                  description: "Date of the experience (ISO format)"
                },
                location: {
                  type: "string",
                  description: "Location where this happened"
                },
                people: {
                  type: "array",
                  items: { type: "string" },
                  description: "IDs of people involved in this experience"
                },
                emotions: {
                  type: "array",
                  items: { type: "string" },
                  description: "Emotions felt during this experience"
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tags to categorize this experience"
                },
                importance: {
                  type: "string",
                  description: "Importance level of this experience",
                  enum: ["low", "medium", "high", "critical"]
                },
                metadata: {
                  type: "object",
                  description: "Additional metadata like lessons learned, impact, etc."
                }
              },
              required: ["parentId", "type", "title", "description"]
            }
          },
          {
            name: "add_person",
            description: "Add a new person to the life tree",
            parameters: {
              type: "object",
              properties: {
                parentId: {
                  type: "string",
                  description: "ID of the parent node (use 'root' for top level)"
                },
                title: {
                  type: "string",
                  description: "Name of the person"
                },
                description: {
                  type: "string",
                  description: "Description of the person and their relationship"
                },
                date: {
                  type: "string",
                  description: "When you first met or when this relationship started"
                },
                location: {
                  type: "string",
                  description: "Where you met or where they live"
                },
                emotions: {
                  type: "array",
                  items: { type: "string" },
                  description: "Emotions associated with this person"
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tags like 'family', 'friend', 'colleague', etc."
                },
                importance: {
                  type: "string",
                  description: "Importance of this person in your life",
                  enum: ["low", "medium", "high", "critical"]
                },
                metadata: {
                  type: "object",
                  description: "Additional details about the relationship"
                }
              },
              required: ["parentId", "title", "description"]
            }
          },
          {
            name: "add_place",
            description: "Add a new place to the life tree",
            parameters: {
              type: "object",
              properties: {
                parentId: {
                  type: "string",
                  description: "ID of the parent node (use 'root' for top level)"
                },
                title: {
                  type: "string",
                  description: "Name of the place"
                },
                description: {
                  type: "string",
                  description: "Description of the place and its significance"
                },
                date: {
                  type: "string",
                  description: "When you first visited or when this place became significant"
                },
                location: {
                  type: "string",
                  description: "Geographic location"
                },
                people: {
                  type: "array",
                  items: { type: "string" },
                  description: "IDs of people associated with this place"
                },
                emotions: {
                  type: "array",
                  items: { type: "string" },
                  description: "Emotions associated with this place"
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tags like 'home', 'work', 'vacation', etc."
                },
                importance: {
                  type: "string",
                  description: "Importance of this place in your life",
                  enum: ["low", "medium", "high", "critical"]
                },
                metadata: {
                  type: "object",
                  description: "Additional details about the place"
                }
              },
              required: ["parentId", "title", "description"]
            }
          },
          {
            name: "add_goal",
            description: "Add a new goal or aspiration to the life tree",
            parameters: {
              type: "object",
              properties: {
                parentId: {
                  type: "string",
                  description: "ID of the parent node (use 'root' for top level)"
                },
                title: {
                  type: "string",
                  description: "Title of the goal"
                },
                description: {
                  type: "string",
                  description: "Detailed description of the goal"
                },
                date: {
                  type: "string",
                  description: "When you set this goal or target date"
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tags like 'career', 'personal', 'health', etc."
                },
                importance: {
                  type: "string",
                  description: "Importance of this goal",
                  enum: ["low", "medium", "high", "critical"]
                },
                metadata: {
                  type: "object",
                  description: "Additional details like progress, milestones, etc."
                }
              },
              required: ["parentId", "title", "description"]
            }
          },
          {
            name: "search_life_tree",
            description: "Search the life tree for specific content",
            parameters: {
              type: "object",
              properties: {
                type: {
                  type: "array",
                  items: { type: "string" },
                  description: "Types of nodes to search for"
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tags to search for"
                },
                people: {
                  type: "array",
                  items: { type: "string" },
                  description: "People to search for"
                },
                emotions: {
                  type: "array",
                  items: { type: "string" },
                  description: "Emotions to search for"
                },
                dateRange: {
                  type: "object",
                  properties: {
                    start: { type: "string" },
                    end: { type: "string" }
                  },
                  description: "Date range to search within"
                }
              }
            }
          },
          {
            name: "get_life_stats",
            description: "Get statistics about the life tree",
            parameters: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "get_timeline",
            description: "Get a chronological timeline of life events",
            parameters: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "update_node",
            description: "Update an existing node in the life tree",
            parameters: {
              type: "object",
              properties: {
                nodeId: {
                  type: "string",
                  description: "ID of the node to update"
                },
                updates: {
                  type: "object",
                  description: "Properties to update"
                }
              },
              required: ["nodeId", "updates"]
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

  // Handle function calls from Vapi
  static handleFunctionCall(functionCall: any) {
    switch (functionCall.name) {
      case 'add_life_experience':
        return this.handleAddLifeExperience(functionCall.parameters);

      case 'add_person':
        return this.handleAddPerson(functionCall.parameters);

      case 'add_place':
        return this.handleAddPlace(functionCall.parameters);

      case 'add_goal':
        return this.handleAddGoal(functionCall.parameters);

      case 'search_life_tree':
        return this.handleSearchLifeTree(functionCall.parameters);

      case 'get_life_stats':
        return this.handleGetLifeStats();

      case 'get_timeline':
        return this.handleGetTimeline();

      case 'update_node':
        return this.handleUpdateNode(functionCall.parameters);

      default:
        throw new Error(`Unknown function: ${functionCall.name}`);
    }
  }

  private static handleAddLifeExperience(parameters: any) {
    const nodeData = {
      type: parameters.type,
      title: parameters.title,
      description: parameters.description,
      date: parameters.date,
      location: parameters.location,
      people: parameters.people || [],
      emotions: parameters.emotions || [],
      tags: parameters.tags || [],
      importance: parameters.importance || 'medium',
      metadata: parameters.metadata || {}
    };

    const newNode = TreeService.addNode(parameters.parentId, nodeData);
    return {
      success: true,
      message: `Added ${parameters.type}: ${parameters.title}`,
      node: newNode
    };
  }

  private static handleAddPerson(parameters: any) {
    const nodeData = {
      type: 'person' as const,
      title: parameters.title,
      description: parameters.description,
      date: parameters.date,
      location: parameters.location,
      emotions: parameters.emotions || [],
      tags: parameters.tags || [],
      importance: parameters.importance || 'medium',
      metadata: parameters.metadata || {}
    };

    const newNode = TreeService.addNode(parameters.parentId, nodeData);
    return {
      success: true,
      message: `Added person: ${parameters.title}`,
      node: newNode
    };
  }

  private static handleAddPlace(parameters: any) {
    const nodeData = {
      type: 'place' as const,
      title: parameters.title,
      description: parameters.description,
      date: parameters.date,
      location: parameters.location,
      people: parameters.people || [],
      emotions: parameters.emotions || [],
      tags: parameters.tags || [],
      importance: parameters.importance || 'medium',
      metadata: parameters.metadata || {}
    };

    const newNode = TreeService.addNode(parameters.parentId, nodeData);
    return {
      success: true,
      message: `Added place: ${parameters.title}`,
      node: newNode
    };
  }

  private static handleAddGoal(parameters: any) {
    const nodeData = {
      type: 'goal' as const,
      title: parameters.title,
      description: parameters.description,
      date: parameters.date,
      tags: parameters.tags || [],
      importance: parameters.importance || 'medium',
      metadata: parameters.metadata || {}
    };

    const newNode = TreeService.addNode(parameters.parentId, nodeData);
    return {
      success: true,
      message: `Added goal: ${parameters.title}`,
      node: newNode
    };
  }

  private static handleSearchLifeTree(parameters: any) {
    const filters = {
      type: parameters.type,
      tags: parameters.tags,
      people: parameters.people,
      emotions: parameters.emotions,
      dateRange: parameters.dateRange
    };

    const results = TreeService.searchNodes(filters);
    return {
      success: true,
      message: `Found ${results.length} matching items`,
      results: results
    };
  }

  private static handleGetLifeStats() {
    const stats = TreeService.getStats();
    return {
      success: true,
      message: `Your life tree has ${stats.totalNodes} total entries`,
      stats: stats
    };
  }

  private static handleGetTimeline() {
    const timeline = TreeService.getTimeline();
    return {
      success: true,
      message: `Here's your life timeline with ${timeline.length} events`,
      timeline: timeline
    };
  }

  private static handleUpdateNode(parameters: any) {
    const updatedNode = TreeService.updateNode(parameters.nodeId, parameters.updates);
    if (updatedNode) {
      return {
        success: true,
        message: `Updated: ${updatedNode.title}`,
        node: updatedNode
      };
    } else {
      return {
        success: false,
        message: 'Node not found'
      };
    }
  }
} 