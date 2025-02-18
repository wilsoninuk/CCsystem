"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CustomerForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      code: formData.get('code'),
      name: formData.get('name'),
      piAddress: formData.get('piAddress'),
      piShipper: formData.get('piShipper'),
      paymentMethod: formData.get('paymentMethod'),
      shippingMethod: formData.get('shippingMethod'),
      currency: formData.get('currency'),
      exchangeRate: Number(formData.get('exchangeRate')),
      remark: formData.get('remark'),
    }

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('创建客户失败')

      const customer = await response.json()
      router.push(`/customers/${customer.id}`)
      router.refresh()
    } catch (error) {
      console.error('创建客户失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">新建客户</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">客户编号</Label>
            <Input id="code" name="code" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">客户名称</Label>
            <Input id="name" name="name" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="piAddress">PI地址</Label>
          <Input id="piAddress" name="piAddress" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="piShipper">PI发货人</Label>
          <Input id="piShipper" name="piShipper" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">付款方式</Label>
            <Select name="paymentMethod" required>
              <SelectTrigger>
                <SelectValue placeholder="选择付款方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="T/T">T/T</SelectItem>
                <SelectItem value="L/C">L/C</SelectItem>
                <SelectItem value="D/P">D/P</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingMethod">船运方式</Label>
            <Select name="shippingMethod" required>
              <SelectTrigger>
                <SelectValue placeholder="选择船运方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FOB">FOB</SelectItem>
                <SelectItem value="CIF">CIF</SelectItem>
                <SelectItem value="EXW">EXW</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">默认货币</Label>
            <Select name="currency" defaultValue="USD">
              <SelectTrigger>
                <SelectValue placeholder="选择货币" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="RMB">RMB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exchangeRate">汇率</Label>
            <Input 
              id="exchangeRate" 
              name="exchangeRate" 
              type="number" 
              step="0.0001"
              defaultValue="7.2000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="remark">备注</Label>
          <Input id="remark" name="remark" />
        </div>

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
          >
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </div>
  )
} 