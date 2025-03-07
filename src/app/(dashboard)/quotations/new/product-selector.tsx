"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Product } from "@prisma/client"
import Image from "next/image"

interface ProductSelectorProps {
  onSelect: (product: {
    id: string
    itemNo: string
    barcode: string
    description: string
    picture: string | null
    cost: number
    supplier: { name: string }
  }) => void
}

export function ProductSelector({ onSelect }: ProductSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<Array<{
    id: string
    itemNo: string
    barcode: string
    description: string
    picture: string | null
    cost: number
    supplier: { name: string }
  }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchTerm.length < 2) {
      setProducts([])
      return
    }

    const searchProducts = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchTerm)}`)
        if (!response.ok) throw new Error('搜索失败')
        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error('搜索商品失败:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(searchProducts, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span>添加商品...</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="输入商品编号或描述搜索..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <div className="max-h-[300px] overflow-y-auto">
              {products.length > 0 ? (
                <div className="p-2 space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      role="option"
                      onClick={() => {
                        onSelect(product)
                        setOpen(false)
                        setSearchTerm("")
                      }}
                      className="flex items-start gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        {product.picture ? (
                          <Image
                            src={product.picture}
                            alt={product.description}
                            fill
                            className="object-cover rounded-sm"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center rounded-sm">
                            <span className="text-xs text-muted-foreground">无图片</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">
                          {product.itemNo}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {product.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ¥{product.cost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {loading ? '搜索中...' : searchTerm.length < 2 ? '请输入至少2个字符' : '未找到商品'}
                </div>
              )}
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-sm text-muted-foreground">
        输入商品编号或描述搜索（至少2个字符）
      </p>
    </div>
  )
} 