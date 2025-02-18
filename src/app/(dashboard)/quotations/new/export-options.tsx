"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ExportOptionsProps {
  onExport: (options: ExportOptions) => void
}

interface ExportOptions {
  includeCost: boolean
  includeProfit: boolean
  includeUSD: boolean
  includeRMB: boolean
}

export function ExportOptions({ onExport }: ExportOptionsProps) {
  const [options, setOptions] = useState<ExportOptions>({
    includeCost: false,
    includeProfit: false,
    includeUSD: true,
    includeRMB: true,
  })

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">导出 Excel</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导出选项</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rmb"
              checked={options.includeRMB}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeRMB: checked as boolean }))
              }
            />
            <Label htmlFor="rmb">包含人民币价格</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="usd"
              checked={options.includeUSD}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeUSD: checked as boolean }))
              }
            />
            <Label htmlFor="usd">包含美元价格</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cost"
              checked={options.includeCost}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeCost: checked as boolean }))
              }
            />
            <Label htmlFor="cost">包含成本价</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="profit"
              checked={options.includeProfit}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeProfit: checked as boolean }))
              }
            />
            <Label htmlFor="profit">包含利润</Label>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => onExport(options)}>确认导出</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 