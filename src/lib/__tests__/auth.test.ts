import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables
const mockEnv = {
  STRAVA_CLIENT_ID: 'test-client-id',
  STRAVA_CLIENT_SECRET: 'test-client-secret',
  NODE_ENV: 'test'
};

describe('Auth Configuration', () => {
  beforeEach(() => {
    // Reset environment variables
    vi.stubEnv('STRAVA_CLIENT_ID', mockEnv.STRAVA_CLIENT_ID);
    vi.stubEnv('STRAVA_CLIENT_SECRET', mockEnv.STRAVA_CLIENT_SECRET);
    vi.stubEnv('NODE_ENV', mockEnv.NODE_ENV);
  });

  it('should export authOptions configuration object', async () => {
    const { authOptions } = await import('../auth');
    
    expect(authOptions).toBeDefined();
    expect(typeof authOptions).toBe('object');
  });

  it('should have proper providers configuration', async () => {
    const { authOptions } = await import('../auth');
    
    expect(authOptions.providers).toBeDefined();
    expect(Array.isArray(authOptions.providers)).toBe(true);
    expect(authOptions.providers.length).toBeGreaterThan(0);
  });

  it('should have session configuration with JWT strategy', async () => {
    const { authOptions } = await import('../auth');
    
    expect(authOptions.session).toBeDefined();
    expect(authOptions.session?.strategy).toBe('jwt');
    expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
  });

  it('should have required callbacks', async () => {
    const { authOptions } = await import('../auth');
    
    expect(authOptions.callbacks).toBeDefined();
    expect(typeof authOptions.callbacks?.jwt).toBe('function');
    expect(typeof authOptions.callbacks?.session).toBe('function');
    expect(typeof authOptions.callbacks?.redirect).toBe('function');
  });

  it('should have custom pages configuration', async () => {
    const { authOptions } = await import('../auth');
    
    expect(authOptions.pages).toBeDefined();
    expect(authOptions.pages?.signIn).toBe('/auth/signin');
    expect(authOptions.pages?.error).toBe('/auth/error');
  });

  it('should handle JWT callback with initial sign in', async () => {
    const { authOptions } = await import('../auth');
    
    const mockAccount = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: Date.now() / 1000 + 3600 // 1 hour from now
    };
    
    const mockUser = {
      name: 'Test User',
      email: 'test@example.com'
    };
    
    const mockToken = {};
    
    const result = await authOptions.callbacks?.jwt?.({
      token: mockToken,
      account: mockAccount,
      user: mockUser
    });
    
    expect(result).toEqual({
      ...mockToken,
      accessToken: mockAccount.access_token,
      refreshToken: mockAccount.refresh_token,
      expiresAt: mockAccount.expires_at,
      user: mockUser
    });
  });

  it('should handle JWT callback with valid existing token', async () => {
    const { authOptions } = await import('../auth');
    
    const futureTime = (Date.now() / 1000) + 3600; // 1 hour from now
    const mockToken = {
      accessToken: 'existing-token',
      refreshToken: 'existing-refresh',
      expiresAt: futureTime,
      user: { name: 'Test User' }
    };
    
    const result = await authOptions.callbacks?.jwt?.({
      token: mockToken,
      account: null,
      user: null
    });
    
    expect(result).toEqual(mockToken);
  });

  it('should handle session callback correctly', async () => {
    const { authOptions } = await import('../auth');
    
    const mockSession = {
      user: undefined,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    const mockToken = {
      accessToken: 'test-token',
      user: {
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg'
      }
    };
    
    const result = await authOptions.callbacks?.session?.({
      session: mockSession,
      token: mockToken
    });
    
    expect(result.accessToken).toBe('test-token');
    expect(result.user).toEqual(mockToken.user);
  });

  it('should handle redirect callback correctly', async () => {
    const { authOptions } = await import('../auth');
    
    const baseUrl = 'https://example.com';
    
    // Test relative URL
    let result = await authOptions.callbacks?.redirect?.({
      url: '/dashboard',
      baseUrl
    });
    expect(result).toBe('https://example.com/dashboard');
    
    // Test same origin URL
    result = await authOptions.callbacks?.redirect?.({
      url: 'https://example.com/profile',
      baseUrl
    });
    expect(result).toBe('https://example.com/profile');
    
    // Test different origin URL (should return baseUrl)
    result = await authOptions.callbacks?.redirect?.({
      url: 'https://malicious.com/hack',
      baseUrl
    });
    expect(result).toBe(baseUrl);
  });
});