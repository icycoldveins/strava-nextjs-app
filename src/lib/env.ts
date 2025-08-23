// Environment variable validation
const requiredEnvVars = {
  // NextAuth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  
  // Strava OAuth
  STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
  
  // Weather API (optional but recommended)
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
} as const;

// Validate required environment variables
export function validateEnv() {
  const missing: string[] = [];
  
  // Check required vars
  const required = ['NEXTAUTH_SECRET', 'STRAVA_CLIENT_ID', 'STRAVA_CLIENT_SECRET'];
  
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  // In production, NEXTAUTH_URL should be set
  if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL) {
    missing.push('NEXTAUTH_URL');
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file or Vercel environment variables.'
    );
  }
  
  // Warn about optional vars
  if (!process.env.OPENWEATHER_API_KEY) {
    console.warn('Warning: OPENWEATHER_API_KEY is not set. Weather features will be limited.');
  }
  
  return requiredEnvVars;
}

// Export validated env vars (called once at startup)
export const env = process.env.NODE_ENV === 'test' ? requiredEnvVars : validateEnv();