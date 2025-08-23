import StravaProvider from "next-auth/providers/strava";

// Use any for now to avoid type conflicts with NextAuth
export const authOptions = {
  providers: [
    StravaProvider({
      clientId: process.env.STRAVA_CLIENT_ID as string,
      clientSecret: process.env.STRAVA_CLIENT_SECRET as string,
      authorization: {
        params: { 
          scope: "read,activity:read_all,profile:read_all",
          approval_prompt: "auto"
        }
      }
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, user }: { token: any; account: any; user: any }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          user,
        };
      }
      
      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }
      
      // Access token has expired, try to refresh it
      try {
        const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.STRAVA_CLIENT_ID as string,
            client_secret: process.env.STRAVA_CLIENT_SECRET as string,
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken as string,
          }),
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
          throw refreshedTokens;
        }

        return {
          ...token,
          accessToken: refreshedTokens.access_token,
          refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Use new refresh token if provided
          expiresAt: refreshedTokens.expires_at,
        };
      } catch (error) {
        console.error('Error refreshing access token', error);
        // Return the old token if refresh fails (user will need to re-authenticate)
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    async session({ session, token }: { session: any; token: any }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string;
      session.user = token.user as {
        name?: string;
        email?: string;
        image?: string;
      };
      (session as any).error = token.error;
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
  },
};