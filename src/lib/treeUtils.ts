import { LifeTreeNode } from '@/types/tree';
import { TreeService } from './treeService';

export class TreeUtils {
  // Generate sample life tree data for demonstration
  static generateSampleData() {
    // Clear existing data
    TreeService.getTree().children = [];

    // Add sample life experiences
    const experiences = [
      {
        type: 'milestone' as const,
        title: 'Graduated from University',
        description: 'Completed my degree in Computer Science with honors. This was a defining moment that opened up many career opportunities.',
        date: '2020-05-15',
        location: 'Berkeley, CA',
        emotions: ['proud', 'accomplished', 'excited'],
        tags: ['education', 'achievement', 'career'],
        importance: 'high' as const,
        metadata: {
          degree: 'Computer Science',
          gpa: '3.8',
          lessons: ['Hard work pays off', 'Networking is crucial']
        }
      },
      {
        type: 'person' as const,
        title: 'Sarah Johnson',
        description: 'My best friend from college. We met in our freshman year and have been inseparable ever since. She\'s been there through all my ups and downs.',
        date: '2016-09-01',
        location: 'Berkeley, CA',
        emotions: ['grateful', 'loved', 'supported'],
        tags: ['friendship', 'college', 'support'],
        importance: 'critical' as const,
        metadata: {
          relationship: 'best friend',
          howWeMet: 'Freshman orientation',
          sharedExperiences: ['Graduation', 'First job', 'Moving to SF']
        }
      },
      {
        type: 'achievement' as const,
        title: 'First Software Engineering Job',
        description: 'Landed my dream job at a tech startup. This was the beginning of my professional career and taught me so much about the industry.',
        date: '2020-08-01',
        location: 'San Francisco, CA',
        emotions: ['excited', 'nervous', 'determined'],
        tags: ['career', 'first job', 'tech'],
        importance: 'high' as const,
        metadata: {
          company: 'TechStartup Inc',
          role: 'Software Engineer',
          salary: '$120,000',
          lessons: ['Always keep learning', 'Company culture matters']
        }
      },
      {
        type: 'place' as const,
        title: 'San Francisco',
        description: 'The city where I started my career and built my adult life. Full of opportunities, innovation, and amazing people.',
        date: '2020-07-01',
        location: 'San Francisco, CA',
        emotions: ['inspired', 'excited', 'overwhelmed'],
        tags: ['home', 'career', 'opportunity'],
        importance: 'high' as const,
        metadata: {
          neighborhood: 'Mission District',
          whyHere: 'Career opportunities and tech scene',
          favoriteSpots: ['Golden Gate Park', 'Fisherman\'s Wharf', 'Mission Bay']
        }
      },
      {
        type: 'memory' as const,
        title: 'Hiking in Yosemite',
        description: 'An unforgettable weekend trip with friends. The beauty of nature and the sense of accomplishment from reaching the summit.',
        date: '2021-06-15',
        location: 'Yosemite National Park, CA',
        emotions: ['awe', 'accomplished', 'peaceful'],
        tags: ['nature', 'friends', 'adventure'],
        importance: 'medium' as const,
        metadata: {
          trail: 'Half Dome',
          duration: '2 days',
          companions: ['Sarah', 'Mike', 'Alex'],
          lessons: ['Nature is healing', 'Challenging yourself builds confidence']
        }
      },
      {
        type: 'goal' as const,
        title: 'Learn Machine Learning',
        description: 'I want to expand my skills into AI and machine learning to stay relevant in the tech industry and work on cutting-edge projects.',
        date: '2023-01-01',
        emotions: ['motivated', 'curious', 'ambitious'],
        tags: ['learning', 'career', 'technology'],
        importance: 'high' as const,
        metadata: {
          targetDate: '2024-06-01',
          progress: '25%',
          resources: ['Coursera', 'Books', 'Online courses'],
          milestones: ['Complete basic course', 'Build first project', 'Contribute to open source']
        }
      }
    ];

    // Add all sample experiences
    experiences.forEach(exp => {
      TreeService.addNode('root', exp);
    });

    return {
      message: 'Sample life tree data generated successfully',
      count: experiences.length
    };
  }

  // Export tree data as JSON
  static exportTreeData(): string {
    const tree = TreeService.getTree();
    return JSON.stringify(tree, null, 2);
  }

  // Import tree data from JSON
  static importTreeData(jsonData: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonData);
      // In a real app, you'd validate the data structure
      // For now, we'll just replace the root tree
      Object.assign(TreeService.getTree(), data);
      return {
        success: true,
        message: 'Tree data imported successfully'
      };
    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        message: 'Failed to import tree data: Invalid JSON'
      };
    }
  }

  // Get tree summary for voice responses
  static getTreeSummary(): string {
    const stats = TreeService.getStats();
    const timeline = TreeService.getTimeline();
    
    const summary = `
      Your life tree contains ${stats.totalNodes} total entries.
      You have ${timeline.length} events with dates.
      The most common types are: ${Object.entries(stats.byType)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type, count]) => `${type} (${count})`)
        .join(', ')}.
      Your most important entries are: ${Object.entries(stats.byImportance)
        .filter(([importance]) => importance === 'critical' || importance === 'high')
        .reduce((sum, [, count]) => sum + count, 0)} high/critical importance items.
    `.trim();

    return summary;
  }

  // Get recent activity for voice responses
  static getRecentActivity(): string {
    const stats = TreeService.getStats();
    const recent = stats.recentActivity.slice(0, 5);
    
    if (recent.length === 0) {
      return "You haven't added any entries to your life tree yet.";
    }

    const activityList = recent.map(node => 
      `${node.title} (${node.type})`
    ).join(', ');

    return `Your recent activity includes: ${activityList}.`;
  }

  // Get suggestions for voice agent
  static getVoiceSuggestions(): string[] {
    return [
      "Tell me about a recent experience you'd like to add to your life tree",
      "Who is someone important in your life that you'd like to document?",
      "What's a place that holds special meaning for you?",
      "What's a goal or achievement you're working towards?",
      "How are you feeling today? Let's capture your current emotions",
      "What's a lesson you've learned recently that you'd like to remember?",
      "Tell me about a milestone or event that shaped who you are"
    ];
  }

  // Validate node data
  static validateNodeData(data: Partial<LifeTreeNode>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (data.date) {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format');
      }
    }

    if (data.type && !['experience', 'person', 'place', 'achievement', 'milestone', 'memory', 'goal', 'relationship', 'skill', 'event'].includes(data.type)) {
      errors.push('Invalid node type');
    }

    if (data.importance && !['low', 'medium', 'high', 'critical'].includes(data.importance)) {
      errors.push('Invalid importance level');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
} 