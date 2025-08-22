import { PRAnalysis, PersonalRecord, STANDARD_DISTANCES } from './types/personalRecords';

// Mock data for testing the PR Dashboard
export const mockPRAnalysis: PRAnalysis = {
  personalRecords: [
    {
      distance: STANDARD_DISTANCES.find(d => d.name === '5K' && d.category === 'running')!,
      bestTime: 1320, // 22:00
      bestPace: 264, // 4:24/km
      activityId: 12345,
      activityName: 'Morning Run - PR!',
      achievedDate: '2024-01-15T08:30:00Z',
      improvementFromPrevious: 3.2,
      recentAttempts: [
        {
          activityId: 12345,
          activityName: 'Morning Run - PR!',
          time: 1320,
          pace: 264,
          date: '2024-01-15T08:30:00Z',
          isPersonalRecord: true,
          improvementPercentage: 3.2
        },
        {
          activityId: 12340,
          activityName: 'Interval Training',
          time: 1365,
          pace: 273,
          date: '2024-01-10T07:00:00Z',
          isPersonalRecord: false
        },
        {
          activityId: 12335,
          activityName: 'Easy 5K',
          time: 1410,
          pace: 282,
          date: '2024-01-05T09:15:00Z',
          isPersonalRecord: false
        }
      ],
      trendData: [
        { date: '2024-01-05T09:15:00Z', time: 1410, pace: 282, activityId: 12335 },
        { date: '2024-01-10T07:00:00Z', time: 1365, pace: 273, activityId: 12340 },
        { date: '2024-01-15T08:30:00Z', time: 1320, pace: 264, activityId: 12345 }
      ]
    },
    {
      distance: STANDARD_DISTANCES.find(d => d.name === '10K' && d.category === 'running')!,
      bestTime: 2760, // 46:00
      bestPace: 276, // 4:36/km
      activityId: 12350,
      activityName: 'Saturday Long Run',
      achievedDate: '2024-01-20T10:00:00Z',
      improvementFromPrevious: 1.8,
      recentAttempts: [
        {
          activityId: 12350,
          activityName: 'Saturday Long Run',
          time: 2760,
          pace: 276,
          date: '2024-01-20T10:00:00Z',
          isPersonalRecord: true,
          improvementPercentage: 1.8
        },
        {
          activityId: 12345,
          activityName: 'Previous 10K',
          time: 2810,
          pace: 281,
          date: '2024-01-13T09:30:00Z',
          isPersonalRecord: false
        }
      ],
      trendData: [
        { date: '2024-01-13T09:30:00Z', time: 2810, pace: 281, activityId: 12345 },
        { date: '2024-01-20T10:00:00Z', time: 2760, pace: 276, activityId: 12350 }
      ]
    },
    {
      distance: STANDARD_DISTANCES.find(d => d.name === '40K' && d.category === 'cycling')!,
      bestTime: 3600, // 1:00:00
      bestPace: 40, // 40 km/h
      activityId: 12355,
      activityName: 'Fast Cycling Session',
      achievedDate: '2024-01-25T14:00:00Z',
      improvementFromPrevious: 5.1,
      recentAttempts: [
        {
          activityId: 12355,
          activityName: 'Fast Cycling Session',
          time: 3600,
          pace: 40,
          date: '2024-01-25T14:00:00Z',
          isPersonalRecord: true,
          improvementPercentage: 5.1
        },
        {
          activityId: 12350,
          activityName: 'Weekend Ride',
          time: 3790,
          pace: 37.9,
          date: '2024-01-18T13:30:00Z',
          isPersonalRecord: false
        }
      ],
      trendData: [
        { date: '2024-01-18T13:30:00Z', time: 3790, pace: 37.9, activityId: 12350 },
        { date: '2024-01-25T14:00:00Z', time: 3600, pace: 40, activityId: 12355 }
      ]
    }
  ],
  recentImprovements: [
    // First PR from above (most recent)
  ],
  potentialPRs: [
    {
      distance: STANDARD_DISTANCES.find(d => d.name === 'Half Marathon' && d.category === 'running')!,
      estimatedTime: 5520, // 1:32:00 based on 10K time
      confidenceLevel: 'high',
      basedOnDistance: 10000
    },
    {
      distance: STANDARD_DISTANCES.find(d => d.name === '100K Century' && d.category === 'cycling')!,
      estimatedTime: 10800, // 3:00:00 based on 40K time
      confidenceLevel: 'medium',
      basedOnDistance: 40000
    }
  ],
  summary: {
    totalPRs: 3,
    recentPRs: 1,
    improvingDistances: [
      STANDARD_DISTANCES.find(d => d.name === '5K' && d.category === 'running')!,
      STANDARD_DISTANCES.find(d => d.name === '40K' && d.category === 'cycling')!
    ],
    stagnantDistances: [
      STANDARD_DISTANCES.find(d => d.name === '10K' && d.category === 'running')!
    ],
    averageImprovement: 3.37 // Average of 3.2, 1.8, 5.1
  }
};

// Set recent improvements to the first PR for demo
mockPRAnalysis.recentImprovements = [mockPRAnalysis.personalRecords[0]];