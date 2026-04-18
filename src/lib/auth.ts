import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import type { UserRole } from '@/types'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'البريد الإلكتروني', type: 'email' },
        password: { label: 'كلمة المرور', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { baker: true }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          bakerId: user.baker[0]?.id,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.bakerId = user.bakerId
      }
      return token
    },
    async session({ session, token }) {
      if (!token.sub) throw new Error('Missing token subject')
      session.user.id = token.sub
      session.user.role = token.role as UserRole | undefined
      session.user.bakerId = token.bakerId as string | undefined
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
