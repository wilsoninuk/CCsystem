"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface StatusActionsProps {
  id: string
  status: string
}

export function StatusActions({ id, status }: StatusActionsProps) {
  const router = useRouter()

  const handleStatusChange = async (newStatus: 'pi' | 'ci') => {
    if (!confirm(`确定要生成${newStatus.toUpperCase()}报价单吗？`)) {
      return
    }

    try {
      const response = await fetch(`/api/quotations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新状态失败')
      }

      toast.success(`报价单已转为${newStatus.toUpperCase()}版本`)
      router.refresh()
    } catch (error) {
      console.error('更新状态失败:', error)
      toast.error(error instanceof Error ? error.message : '更新状态失败')
    }
  }

  return (
    <div className="space-x-2">
      {/* 草稿状态 */}
      {status === 'draft' && (
        <>
          <Button variant="outline" asChild>
            <Link href={`/quotations/${id}/edit`}>
              编辑报价单
            </Link>
          </Button>
          <Button onClick={() => handleStatusChange('pi')}>
            生成PI报价单
          </Button>
          <Button onClick={() => handleStatusChange('ci')}>
            生成CI报价单
          </Button>
        </>
      )}

      {/* PI状态 */}
      {status === 'pi' && (
        <>
          <Button variant="outline" asChild>
            <Link href={`/quotations/${id}/edit`}>
              编辑报价单
            </Link>
          </Button>
          <Button onClick={() => handleStatusChange('ci')}>
            生成CI报价单
          </Button>
        </>
      )}

      {/* CI状态 */}
      {status === 'ci' && (
        <Button variant="outline" asChild>
          <Link href={`/quotations/${id}/print`}>
            打印报价单
          </Link>
        </Button>
      )}
    </div>
  )
}