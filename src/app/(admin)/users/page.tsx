"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  name: string
  email: string
  createdAt: string
  isActive: boolean
}

export default function AdminUsersPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const router = useRouter()

  // 获取用户列表
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) {
        throw new Error("获取用户列表失败")
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast.error("获取用户列表失败")
    }
  }

  // 创建新用户
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
      fetchUsers() // 刷新用户列表
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建失败")
    } finally {
      setIsLoading(false)
    }
  }

  // 重置用户密码
  const handleResetPassword = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "重置密码失败")
      }

      toast.success(data.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "重置密码失败")
    }
  }

  // 切换用户状态
  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/users/toggle-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, isActive }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "修改状态失败")
      }

      toast.success(data.message)
      fetchUsers() // 刷新用户列表
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "修改状态失败")
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* 创建用户表单 */}
        <Card>
          <CardHeader>
            <CardTitle>创建用户</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>用户名</Label>
                <Input
                  name="name"
                  type="text"
                  required
                />
              </div>
              <div>
                <Label>邮箱</Label>
                <Input
                  name="email"
                  type="email"
                  required
                />
              </div>
              <div>
                <Label>密码</Label>
                <Input
                  name="password"
                  type="password"
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "创建中..." : "创建用户"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 用户列表 */}
        <Card>
          <CardHeader>
            <CardTitle>用户列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "destructive"}>
                        {user.isActive ? "启用" : "禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(user.id)}
                      >
                        重置密码
                      </Button>
                      {user.email !== "wilsoninuk@gmail.com" && (
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) => handleToggleStatus(user.id, checked)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 