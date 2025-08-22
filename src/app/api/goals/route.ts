import { NextRequest, NextResponse } from 'next/server';
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/lib/goals';

export async function GET() {
  try {
    const goals = getGoals();
    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create': {
        const { name, type, target, period, activityTypes, customStartDate, customEndDate } = data;
        
        if (!name || !type || !target || !period) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const goal = createGoal({
          name,
          type,
          target,
          period,
          activityTypes,
          customStartDate,
          customEndDate
        });

        return NextResponse.json({ goal });
      }

      case 'update': {
        const { id, ...updates } = data;
        
        if (!id) {
          return NextResponse.json(
            { error: 'Goal ID is required' },
            { status: 400 }
          );
        }

        const goal = updateGoal(id, updates);
        
        if (!goal) {
          return NextResponse.json(
            { error: 'Goal not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ goal });
      }

      case 'delete': {
        const { id } = data;
        
        if (!id) {
          return NextResponse.json(
            { error: 'Goal ID is required' },
            { status: 400 }
          );
        }

        const success = deleteGoal(id);
        
        if (!success) {
          return NextResponse.json(
            { error: 'Goal not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing goals request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    const goal = updateGoal(id, updates);
    
    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    const success = deleteGoal(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}