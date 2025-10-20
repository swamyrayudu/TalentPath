import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

/**
 * NextAuth Configuration
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - JWT callback only fetches from DB on initial sign-in (not every request)
 * - Role and user data cached in JWT token
 * - Session provider configured with refetch interval to prevent excessive API calls
 * - Manual session updates supported via trigger='update' for role changes
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 7 * 24 * 60 * 60, // Only update session every 7 days (reduced from 24h)
  },
  // Disable unnecessary redirects and session checks
  useSecureCookies: process.env.NODE_ENV === 'production',
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in - store user data in token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        
        // Fetch role only on initial sign-in
        if (token.email) {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.email, token.email as string),
            columns: {
              role: true,
              emailVerified: true,
            },
          });
          
          if (dbUser) {
            token.role = dbUser.role;
            token.emailVerified = dbUser.emailVerified;
          }
        }
      }

      // Manual session update (e.g., role change)
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      // Only refetch from DB if token doesn't have role (backward compatibility)
      // or if explicitly requested via trigger
      if (!token.role && token.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, token.email as string),
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            emailVerified: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
          token.role = dbUser.role;
          token.emailVerified = dbUser.emailVerified;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
        (session.user as any).role = token.role || 'user';
        (session.user as any).emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
});

