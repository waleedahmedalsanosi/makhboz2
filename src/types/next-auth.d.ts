import { UserRole } from '@/types'

declare module 'next-auth' {
  interface User {
    role?: UserRole
    bakerId?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role?: UserRole
      bakerId?: string
    }
  }

  interface JWT {
    role?: UserRole
    bakerId?: string
  }
}
