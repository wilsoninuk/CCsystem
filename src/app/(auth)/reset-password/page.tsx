"use client"

import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const email = formData.get("email")
      const newPassword = "admin123" // 固定重置为 admin123

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '重置密码失败')
      }

      toast.success("密码已重置为: admin123")
      event.currentTarget.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "重置密码失败")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">重置密码</h1>
          <p className="mt-2 text-gray-600">输入邮箱重置密码</p>
        </div>
        
        <form onSubmit={onSubmit} className="mt-8 space-y-6">
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
              placeholder="请输入邮箱"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "重置中..." : "重置密码"}
          </button>

          <div className="text-center text-sm">
            <Link href="/login" className="text-blue-600 hover:text-blue-700">
              返回登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 