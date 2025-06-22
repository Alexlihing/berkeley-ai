import { Node, Branch } from '@/types/tree';
import { TreeService } from './treeService';

export class TreeUtils {
  // Generate sample tree data for demonstration
  static generateSampleData() {
    // Clear existing data (this would need to be implemented in TreeService)
    // For now, we'll just add sample data

    // Create sample branches
    const sampleBranches = [
      {
        parentBranchId: 'root',
        branchName: 'Personal Life',
        branchSummary: 'Personal experiences and memories'
      },
      {
        parentBranchId: 'root',
        branchName: 'Career',
        branchSummary: 'Professional experiences and achievements'
      },
      {
        parentBranchId: 'root',
        branchName: 'Education',
        branchSummary: 'Learning experiences and academic achievements'
      }
    ];

    // Add branches
    const branches = sampleBranches.map(branch => 
      TreeService.addBranch(branch.parentBranchId, branch.branchName, branch.branchSummary)
    );

    // Sample content for nodes
    const sampleContent = [
      {
        branchId: branches[0].branchId, // Personal Life
        content: `# Personal Life Entry

This is a sample personal life entry. Here I can write about my experiences, thoughts, and memories.

## Key Points:
- Important personal milestone
- Emotional experience
- Lessons learned

*Created on ${new Date().toISOString()}*`
      },
      {
        branchId: branches[1].branchId, // Career
        content: `# Career Achievement

## Project Success
Successfully completed a major project that had significant impact on the company.

### Skills Demonstrated:
- Leadership
- Problem solving
- Team collaboration

### Outcomes:
- Increased efficiency by 25%
- Received recognition from management
- Team morale improved significantly`
      },
      {
        branchId: branches[2].branchId, // Education
        content: `# Learning Experience

## New Skill Acquired
Recently learned a new programming language and framework.

### What I Learned:
- Modern JavaScript features
- React framework fundamentals
- State management patterns

### Next Steps:
- Build a personal project
- Contribute to open source
- Share knowledge with team`
      },
      {
        branchId: branches[0].branchId, // Personal Life
        content: `# Reflection Entry

## Daily Reflection
Today was a productive day. I accomplished several important tasks and made progress on my goals.

### Highlights:
- Completed morning routine
- Had meaningful conversations
- Made time for self-care

### Gratitude:
- Health and well-being
- Supportive relationships
- Opportunities for growth`
      }
    ];

    // Add nodes
    const nodes = sampleContent.map(content => 
      TreeService.addNode(content.branchId, content.content)
    );

    return {
      message: 'Sample tree data generated successfully',
      branchesCreated: branches.length,
      nodesCreated: nodes.length
    };
  }

  // Validate node data
  static validateNodeData(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push('Content is required');
    }

    if (content && content.length > 10000) {
      errors.push('Content is too long (max 10,000 characters)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate branch data
  static validateBranchData(branchName: string, branchSummary: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!branchName || branchName.trim().length === 0) {
      errors.push('Branch name is required');
    }

    if (branchName && branchName.length > 100) {
      errors.push('Branch name is too long (max 100 characters)');
    }

    if (!branchSummary || branchSummary.trim().length === 0) {
      errors.push('Branch summary is required');
    }

    if (branchSummary && branchSummary.length > 500) {
      errors.push('Branch summary is too long (max 500 characters)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Format timestamp for display
  static formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  // Get content preview (first 100 characters)
  static getContentPreview(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  // Parse markdown content for basic formatting
  static parseMarkdown(content: string): string {
    // Basic markdown parsing for display
    return content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');
  }
} 