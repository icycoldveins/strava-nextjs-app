# Lint Errors Scratch Pad

## Summary
Total warnings: 31
- @typescript-eslint/no-explicit-any: 20 instances
- @next/next/no-img-element: 8 instances  
- react-hooks/exhaustive-deps: 3 instances

## Detailed List of Errors

### @typescript-eslint/no-explicit-any Errors (20)

#### API Routes (14)
- [ ] `/src/app/api/strava/activities/heatmap/route.ts:105:59` - Unexpected any
- [ ] `/src/app/api/strava/activities/route.ts:11:59` - Unexpected any
- [ ] `/src/app/api/strava/athlete/route.ts:10:59` - Unexpected any
- [ ] `/src/app/api/strava/friends/activities/route.ts:11:59` - Unexpected any
- [ ] `/src/app/api/strava/friends/route.ts:11:59` - Unexpected any
- [ ] `/src/app/api/strava/gear/route.ts:9:59` - Unexpected any
- [ ] `/src/app/api/strava/gear/route.ts:107:59` - Unexpected any
- [ ] `/src/app/api/strava/kudos/route.ts:11:59` - Unexpected any
- [ ] `/src/app/api/strava/personal-records/route.ts:14:59` - Unexpected any
- [ ] `/src/app/api/strava/personal-records/route.ts:157:59` - Unexpected any
- [ ] `/src/app/api/strava/stats/route.ts:10:59` - Unexpected any
- [ ] `/src/app/api/weather/route.ts:15:59` - Unexpected any
- [ ] `/src/app/api/weather/route.ts:71:59` - Unexpected any
- [ ] `/src/app/api/weather/route.ts:147:59` - Unexpected any

#### Auth Library (6)
- [ ] `/src/lib/auth.ts:22:50` - Unexpected any
- [ ] `/src/lib/auth.ts:22:64` - Unexpected any
- [ ] `/src/lib/auth.ts:22:75` - Unexpected any
- [ ] `/src/lib/auth.ts:72:50` - Unexpected any
- [ ] `/src/lib/auth.ts:72:62` - Unexpected any
- [ ] `/src/lib/auth.ts:80:19` - Unexpected any

### @next/next/no-img-element Errors (8)
- [ ] `/src/app/page.tsx:204:21` - Use <Image /> instead
- [ ] `/src/app/page.tsx:548:39` - Use <Image /> instead
- [ ] `/src/app/personal-records/page.tsx:73:17` - Use <Image /> instead
- [ ] `/src/components/social/FriendActivityFeed.tsx:154:17` - Use <Image /> instead
- [ ] `/src/components/social/HeadToHeadCard.tsx:53:15` - Use <Image /> instead
- [ ] `/src/components/social/HeadToHeadCard.tsx:84:15` - Use <Image /> instead
- [ ] `/src/components/social/LeaderboardTable.tsx:133:25` - Use <Image /> instead
- [ ] `/src/components/social/LeaderboardTable.tsx:174:19` - Use <Image /> instead

### react-hooks/exhaustive-deps Errors (3)
- [ ] `/src/components/gear/GearTracker.tsx:69:6` - Missing dependency: 'loadGearData'
- [ ] `/src/components/gear/GearTracker.tsx:76:6` - Missing dependency: 'updateAllGearDistances'
- [ ] `/src/components/social/FriendComparison.tsx:52:6` - Missing dependency: 'calculateComparison'

## Fix Strategy
1. Fix TypeScript any types in API routes by defining proper types
2. Fix TypeScript any types in auth.ts
3. Replace <img> elements with Next.js <Image /> components
4. Fix React hooks dependency warnings