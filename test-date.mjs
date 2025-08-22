import { getGoalDateRange } from './src/lib/goals.js';

console.log('Weekly:', getGoalDateRange('weekly'));
console.log('Monthly:', getGoalDateRange('monthly'));
console.log('Yearly:', getGoalDateRange('yearly'));

const monthly = getGoalDateRange('monthly');
console.log('Monthly start date object:', new Date(monthly.startDate));
console.log('Monthly end date object:', new Date(monthly.endDate));