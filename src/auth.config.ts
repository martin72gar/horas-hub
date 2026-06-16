import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isPublicPath = nextUrl.pathname === '/';
      
      if (isOnLogin || isPublicPath) {
        if (isLoggedIn && isOnLogin) {
            return Response.redirect(new URL('/p', nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }
      return true;
    },
  },
  providers: [], 
} satisfies NextAuthConfig;
