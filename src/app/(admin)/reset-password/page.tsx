"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const handleReset = async () => {
    try {
      const response = await fetch('/api/admin/reset-admin', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '重置失败')
      }

      toast.success('密码重置成功，新密码为: admin123')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '重置失败')
    }
  }

  return (
    <div className="container max-w-2xl py-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">重置管理员密码</h1>
        <p className="text-muted-foreground">
          点击下面的按钮将管理员密码重置为默认密码（admin123）
        </p>
        <Button onClick={handleReset}>
          重置密码
        </Button>
      </div>
    </div>
  )
} 