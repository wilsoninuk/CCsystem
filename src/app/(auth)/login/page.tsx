import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">登录</h1>
          <p className="mt-2 text-gray-600">
            登录您的账号
          </p>
        </div>

        <LoginForm />

        <div className="text-center text-sm">
          <Link 
            href="/reset-password" 
            className="text-blue-600 hover:text-blue-700"
          >
            忘记密码？
          </Link>
        </div>
      </div>
    </div>
  )
} 