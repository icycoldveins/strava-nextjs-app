export function formatDistance(meters: number, preference: 'metric' | 'imperial' = 'metric'): string {
  if (preference === 'imperial') {
    const miles = meters * 0.000621371;
    if (miles < 0.1) {
      return `${Math.round(meters * 3.28084)} ft`;
    }
    return `${miles.toFixed(1)} mi`;
  } else {
    const km = meters / 1000;
    if (km < 1) {
      return `${Math.round(meters)} m`;
    }
    return `${km.toFixed(1)} km`;
  }
}

export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  
  return `${secs}s`;
}

export function formatElevation(meters: number, preference: 'metric' | 'imperial' = 'metric'): string {
  if (preference === 'imperial') {
    const feet = meters * 3.28084;
    return `${Math.round(feet).toLocaleString()} ft`;
  }
  return `${Math.round(meters).toLocaleString()} m`;
}

export function formatSpeed(metersPerSecond: number, preference: 'metric' | 'imperial' = 'metric'): string {
  if (preference === 'imperial') {
    const mph = metersPerSecond * 2.23694;
    return `${mph.toFixed(1)} mph`;
  }
  const kmh = metersPerSecond * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

export function formatPace(metersPerSecond: number, preference: 'metric' | 'imperial' = 'metric'): string {
  if (metersPerSecond === 0) return '--';
  
  if (preference === 'imperial') {
    // Minutes per mile
    const minutesPerMile = 26.8224 / metersPerSecond;
    const minutes = Math.floor(minutesPerMile);
    const seconds = Math.round((minutesPerMile - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
  } else {
    // Minutes per kilometer
    const minutesPerKm = 16.6667 / metersPerSecond;
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes === 0) {
        return 'Just now';
      }
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }
}

export function getActivityIcon(type: string): string {
  switch (type?.toLowerCase()) {
    case 'run':
    case 'running':
      return '🏃';
    case 'ride':
    case 'cycling':
    case 'virtualride':
      return '🚴';
    case 'swim':
    case 'swimming':
      return '🏊';
    case 'walk':
    case 'walking':
      return '🚶';
    case 'hike':
    case 'hiking':
      return '🥾';
    case 'workout':
    case 'weighttraining':
      return '💪';
    case 'yoga':
      return '🧘';
    case 'ski':
    case 'alpineski':
    case 'nordicski':
      return '⛷️';
    default:
      return '🏃';
  }
}