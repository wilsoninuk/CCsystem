"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface SyncHistoryButtonProps {
  customerId: string
}

export function SyncHistoryButton({ customerId }: SyncHistoryButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch(`/api/customers/${customerId}/sync-history`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '同步失败')
      }

      const result = await response.json()
      toast.success(`同步成功，已更新 ${result.createdCount} 条记录`)
      
      // 刷新页面数据
      router.refresh()
    } catch (error) {
      console.error('同步失败:', error)
      toast.error(error instanceof Error ? error.message : '同步失败')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleSync}
      disabled={syncing}
    >
      {syncing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          同步中...
        </>
      ) : (
        '同步出货历史'
      )}
    </Button>
  )
} 