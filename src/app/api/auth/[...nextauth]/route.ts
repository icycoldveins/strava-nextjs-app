import NextAuth from "next-auth";
import StravaProvider from "next-auth/providers/strava";

const handler = NextAuth({
  providers: [
    StravaProvider({
      clientId: process.env.STRAVA_CLIENT_ID as string,
      clientSecret: process.env.STRAVA_CLIENT_SECRET as string,
      authorization: {
        params: { scope: "read,activity:read" } // Adjust scopes as needed
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Save the Strava tokens to the token object
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      // Add Strava access token to the session
      session.accessToken = token.accessToken;
      return session;
    },
  }
});

export { handler as GET, handler as POST };
