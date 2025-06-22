import { NextRequest, NextResponse } from 'next/server';
import { RecommendationService } from '@/lib/recommendationService';
import { RecommendationType } from '@/types/tree';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as RecommendationType;
    const limit = parseInt(searchParams.get('limit') || '5');
    const priority = searchParams.get('priority');

    let recommendations;

    if (priority === 'high') {
      recommendations = RecommendationService.getHighPriorityRecommendations().slice(0, limit);
    } else if (type && Object.values(RecommendationType).includes(type)) {
      recommendations = RecommendationService.getRecommendationsByType(type).slice(0, limit);
    } else {
      recommendations = RecommendationService.generateRecommendations().slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length,
      filters: {
        type: type || 'all',
        limit,
        priority: priority || 'all'
      }
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const recommendations = RecommendationService.generateRecommendations();
    
    return NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 