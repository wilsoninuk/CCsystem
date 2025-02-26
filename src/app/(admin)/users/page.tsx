"use client"

import { useState } from "react"
import { toast } from "sonner"

export default function AdminUsersPage() {
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      })

      if (!response.ok) {
        throw new Error("创建失败")
      }

      toast.success("用户创建成功")
      event.currentTarget.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建失败")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">创建用户</h1>
      <div className="max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">用户名</label>
            <input
              name="name"
              type="text"
              required
              className="w-full rounded-md border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">密码</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-md border p-2"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "创建中..." : "创建用户"}
          </button>
        </form>
      </div>
    </div>
  )
} 