"use client"

import { useState } from "react"
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

interface ProductSelectorProps {
  onSelect: (product: Product) => void
}

export function ProductSelector({ onSelect }: ProductSelectorProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  // 搜索商品
  const handleSearch = async (search: string) => {
    if (search.length < 2) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(search)}`)
      if (!response.ok) throw new Error('搜索商品失败')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('搜索商品失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          选择商品...
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput 
            placeholder="搜索商品..." 
            onValueChange={handleSearch}
          />
          <CommandEmpty>
            {loading ? '搜索中...' : '未找到商品'}
          </CommandEmpty>
          <CommandGroup>
            {products.map((product) => (
              <CommandItem
                key={product.id}
                value={product.itemNo}
                onSelect={() => {
                  onSelect(product)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    "opacity-0"
                  )}
                />
                {product.itemNo} - {product.description}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 