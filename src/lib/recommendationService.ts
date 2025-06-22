import { v4 as uuidv4 } from 'uuid';
import { TreeService } from './treeService';
import { Node, Branch, Recommendation, RecommendationType, RecommendationPriority } from '@/types/tree';

export class RecommendationService {
  // Generate recommendations based on current tree state
  static generateRecommendations(): Recommendation[] {
    const branches = TreeService.getAllBranches();
    const nodes = TreeService.getAllNodes();
    const recommendations: Recommendation[] = [];

    // Analyze active branches (those without end dates)
    const activeBranches = branches.filter(branch => !branch.branchEnd);
    const completedBranches = branches.filter(branch => branch.branchEnd);

    // Check for branches that might be ready to close
    recommendations.push(...this.analyzeBranchesForClosure(activeBranches, nodes));

    // Check for opportunities to start new paths
    recommendations.push(...this.analyzeForNewPaths(activeBranches, completedBranches, nodes));

    // Check for paths that need continuation
    recommendations.push(...this.analyzeForContinuation(activeBranches, nodes));

    // Check for reflection opportunities
    recommendations.push(...this.analyzeForReflection(completedBranches, nodes));

    // Check for potential path merges
    recommendations.push(...this.analyzeForMerges(activeBranches, nodes));

    return recommendations.sort((a, b) => {
      const priorityOrder = { [RecommendationPriority.HIGH]: 3, [RecommendationPriority.MEDIUM]: 2, [RecommendationPriority.LOW]: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private static analyzeBranchesForClosure(activeBranches: Branch[], nodes: Node[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    for (const branch of activeBranches) {
      const branchNodes = nodes.filter(node => node.branchId === branch.branchId);
      
      if (branchNodes.length === 0) continue;

      const lastNode = branchNodes.sort((a, b) => 
        new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime()
      )[0];

      const lastActivity = new Date(lastNode.timeStamp);
      const daysSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000);

      // If no activity for 3+ months, suggest closing
      if (lastActivity < threeMonthsAgo) {
        recommendations.push(new Recommendation(
          uuidv4(),
          RecommendationType.CLOSE_PATH,
          RecommendationPriority.MEDIUM,
          `Consider closing "${branch.branchName}"`,
          `This branch hasn't had any activity for ${Math.floor(daysSinceLastActivity)} days. It might be time to reflect on this path and decide if it's complete.`,
          `Based on the last activity date (${lastActivity.toLocaleDateString()}), this path appears to be inactive. Consider whether this represents a completed phase or if you'd like to continue it.`,
          [
            `Add a final reflection node to "${branch.branchName}"`,
            `Close the branch with a summary of what was accomplished`,
            `Consider merging this path with another active branch if relevant`
          ],
          [branch.branchId],
          [lastNode.uuid]
        ));
      }

      // If branch has many nodes and recent activity suggests completion
      if (branchNodes.length >= 5) {
        const recentNodes = branchNodes.filter(node => 
          new Date(node.timeStamp) > threeMonthsAgo
        );
        
        if (recentNodes.length === 0 && branchNodes.length >= 10) {
          recommendations.push(new Recommendation(
            uuidv4(),
            RecommendationType.CLOSE_PATH,
            RecommendationPriority.HIGH,
            `Time to close "${branch.branchName}"?`,
            `This branch has ${branchNodes.length} entries and appears to have reached a natural conclusion.`,
            `With ${branchNodes.length} entries and no recent activity, this path seems to have run its course. Consider documenting the journey and closing this chapter.`,
            [
              `Write a comprehensive summary of the "${branch.branchName}" journey`,
              `Close the branch and mark it as complete`,
              `Extract key lessons learned from this path`
            ],
            [branch.branchId],
            branchNodes.map(n => n.uuid)
          ));
        }
      }
    }

    return recommendations;
  }

  private static analyzeForNewPaths(activeBranches: Branch[], completedBranches: Branch[], nodes: Node[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const recentNodes = TreeService.getRecentNodes(10);
    
    // Look for patterns in recent activity that might suggest new paths
    const recentContent = recentNodes.map(node => node.content.toLowerCase()).join(' ');
    
    // Check for mentions of new interests, goals, or opportunities
    const newPathIndicators = [
      'want to', 'interested in', 'thinking about', 'considering', 'planning to',
      'goal', 'dream', 'aspiration', 'new', 'start', 'begin', 'learn'
    ];

    const hasNewPathIndicators = newPathIndicators.some(indicator => 
      recentContent.includes(indicator)
    );

    if (hasNewPathIndicators) {
      recommendations.push(new Recommendation(
        uuidv4(),
        RecommendationType.START_NEW_PATH,
        RecommendationPriority.HIGH,
        'New path opportunity detected',
        'Your recent entries suggest you might be ready to start a new life path.',
        'Based on your recent reflections and mentions of new interests, you appear to be at a point where starting a new branch could be beneficial.',
        [
          'Create a new branch for this emerging interest or goal',
          'Document your initial thoughts and plans',
          'Set milestones for this new path'
        ],
        [],
        recentNodes.map(n => n.uuid)
      ));
    }

    // Suggest new paths based on completed branches
    if (completedBranches.length > 0) {
      const recentCompleted = completedBranches
        .filter(branch => new Date(branch.branchEnd) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .sort((a, b) => new Date(b.branchEnd).getTime() - new Date(a.branchEnd).getTime());

      if (recentCompleted.length > 0) {
        const latestCompleted = recentCompleted[0];
        recommendations.push(new Recommendation(
          uuidv4(),
          RecommendationType.START_NEW_PATH,
          RecommendationPriority.MEDIUM,
          'What\'s next after completing a path?',
          `You recently completed "${latestCompleted.branchName}". This is a great time to consider what new direction you'd like to explore.`,
          `Completing a life path often creates space and energy for new beginnings. Consider what naturally follows from your recent accomplishment.`,
          [
            'Reflect on what you learned from the completed path',
            'Identify skills or interests that emerged during this journey',
            'Create a new branch for the next phase of your life'
          ],
          [latestCompleted.branchId],
          []
        ));
      }
    }

    return recommendations;
  }

  private static analyzeForContinuation(activeBranches: Branch[], nodes: Node[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const branch of activeBranches) {
      const branchNodes = nodes.filter(node => node.branchId === branch.branchId);
      if (branchNodes.length === 0) continue;

      const lastNode = branchNodes.sort((a, b) => 
        new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime()
      )[0];

      const lastActivity = new Date(lastNode.timeStamp);
      const daysSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000);

      // If recent activity (within a month) and branch has momentum
      if (lastActivity > oneMonthAgo && branchNodes.length >= 3) {
        recommendations.push(new Recommendation(
          uuidv4(),
          RecommendationType.CONTINUE_PATH,
          RecommendationPriority.MEDIUM,
          `Continue building on "${branch.branchName}"`,
          `This path has good momentum with ${branchNodes.length} entries and recent activity. Consider adding to this journey.`,
          `Your recent activity in this branch shows ongoing engagement. Building on this momentum could lead to significant progress.`,
          [
            `Add a new node to "${branch.branchName}" with your latest progress`,
            `Set specific goals for the next phase of this path`,
            `Reflect on how this path is evolving`
          ],
          [branch.branchId],
          [lastNode.uuid]
        ));
      }
    }

    return recommendations;
  }

  private static analyzeForReflection(completedBranches: Branch[], nodes: Node[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Look for recently completed branches that might benefit from reflection
    const recentCompleted = completedBranches.filter(branch => 
      new Date(branch.branchEnd) > sixMonthsAgo
    );

    for (const branch of recentCompleted) {
      const branchNodes = nodes.filter(node => node.branchId === branch.branchId);
      
      if (branchNodes.length >= 3) {
        recommendations.push(new Recommendation(
          uuidv4(),
          RecommendationType.REFLECT_ON_PATH,
          RecommendationPriority.LOW,
          `Reflect on your "${branch.branchName}" journey`,
          `Take time to reflect on this completed path and extract valuable insights for your future.`,
          `Completed paths often contain valuable lessons and patterns that can inform future decisions.`,
          [
            `Write a reflection on what you learned from "${branch.branchName}"`,
            `Identify skills or insights gained from this journey`,
            `Consider how this experience might influence future paths`
          ],
          [branch.branchId],
          branchNodes.map(n => n.uuid)
        ));
      }
    }

    return recommendations;
  }

  private static analyzeForMerges(activeBranches: Branch[], nodes: Node[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Look for branches that might have overlapping themes or could benefit from merging
    if (activeBranches.length >= 2) {
      const branchPairs = [];
      for (let i = 0; i < activeBranches.length; i++) {
        for (let j = i + 1; j < activeBranches.length; j++) {
          branchPairs.push([activeBranches[i], activeBranches[j]]);
        }
      }

      for (const [branch1, branch2] of branchPairs) {
        const nodes1 = nodes.filter(node => node.branchId === branch1.branchId);
        const nodes2 = nodes.filter(node => node.branchId === branch2.branchId);

        // Check if branches have similar themes or recent activity
        const content1 = nodes1.map(n => n.content.toLowerCase()).join(' ');
        const content2 = nodes2.map(n => n.content.toLowerCase()).join(' ');

        const commonThemes = ['work', 'career', 'learning', 'health', 'relationships', 'hobbies', 'travel'];
        const sharedThemes = commonThemes.filter(theme => 
          content1.includes(theme) && content2.includes(theme)
        );

        if (sharedThemes.length > 0) {
          recommendations.push(new Recommendation(
            uuidv4(),
            RecommendationType.MERGE_PATHS,
            RecommendationPriority.LOW,
            `Consider merging "${branch1.branchName}" and "${branch2.branchName}"`,
            `These branches share themes like ${sharedThemes.join(', ')} and might work better as a unified path.`,
            `Having related activities in separate branches can fragment your focus. Merging could create a more cohesive narrative.`,
            [
              `Review both branches to identify common themes`,
              `Create a new unified branch that combines both paths`,
              `Move relevant nodes to the new merged branch`
            ],
            [branch1.branchId, branch2.branchId],
            [...nodes1.map(n => n.uuid), ...nodes2.map(n => n.uuid)]
          ));
        }
      }
    }

    return recommendations;
  }

  // Get recommendations filtered by type
  static getRecommendationsByType(type: RecommendationType): Recommendation[] {
    return this.generateRecommendations().filter(rec => rec.type === type);
  }

  // Get high priority recommendations
  static getHighPriorityRecommendations(): Recommendation[] {
    return this.generateRecommendations().filter(rec => rec.priority === RecommendationPriority.HIGH);
  }

  // Get recommendations for a specific branch
  static getRecommendationsForBranch(branchId: string): Recommendation[] {
    return this.generateRecommendations().filter(rec => 
      rec.relatedBranchIds.includes(branchId)
    );
  }
} 