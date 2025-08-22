declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    user?: {
      name?: string;
      email?: string;
      image?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}
