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
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Customer } from "@prisma/client"

interface CustomerSelectProps {
  customers: Pick<Customer, "id" | "code" | "name" | "exchangeRate">[]
  value: string
  onChange: (value: string) => void
}

export function CustomerSelect({ customers, value, onChange }: CustomerSelectProps) {
  const [open, setOpen] = useState(false)
  const selectedCustomer = customers.find((customer) => customer.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {value ? `${selectedCustomer?.code} - ${selectedCustomer?.name}` : "选择客户..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="搜索客户..." />
          <CommandEmpty>未找到客户</CommandEmpty>
          <CommandGroup>
            {customers.map((customer) => (
              <div
                key={customer.id}
                role="option"
                onClick={() => {
                  onChange(customer.id)
                  setOpen(false)
                }}
                className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-accent"
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    value === customer.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div>
                  <div className="font-medium">{customer.code}</div>
                  <div className="text-sm text-muted-foreground">{customer.name}</div>
                </div>
              </div>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 