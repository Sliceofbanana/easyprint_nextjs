import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// ✅ Extend NextAuth types
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt?: Date;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      createdAt?: Date;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string | null;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
      }

      if (trigger === 'update') {
        const freshUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

        if (freshUser) {
          token.id = freshUser.id;
          token.name = freshUser.name;
          token.email = freshUser.email;
          token.role = freshUser.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name ?? null;
        session.user.email = token.email as string;
      }
      return session;
    },

        async redirect({ url, baseUrl }) {
      // Use environment variable for subdomain
      const productionUrl = process.env.NEXTAUTH_URL || baseUrl;
      
      if (url.startsWith("/")) return `${productionUrl}${url}`;
      else if (new URL(url).origin === productionUrl) return url;
      return productionUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};