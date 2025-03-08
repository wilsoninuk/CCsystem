import NextAuth, { AuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

const ADMIN_EMAIL = "wilsoninuk@gmail.com"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('请输入邮箱和密码')
        }

        console.log('Login attempt:', credentials.email)

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        console.log('Found user:', user)

        if (!user) {
          throw new Error('用户不存在')
        }

        // 检查用户状态
        if (!user.isActive && user.email !== ADMIN_EMAIL) {
          throw new Error('账号已被禁用')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        console.log('Password valid:', isValid)

        if (!isValid) {
          throw new Error('密码错误')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub
      }
    })
  },
  pages: {
    signIn: '/login',
  },
  debug: true
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 