"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      console.log('Login attempt:', {
        email: formData.get("email")
      })

      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false
      })

      console.log('Login result:', result)

      if (result?.error) {
        setError(result.error)
      } else {
        router.push("/products")
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="text-red-500 text-center">{error}</div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-md border p-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 block w-full rounded-md border p-2"
        />
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/reset-password"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          忘记密码？
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "登录中..." : "登录"}
      </button>
    </form>
  )
} 