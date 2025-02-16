"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { OPTIONAL_COLUMNS } from "./columns"

// 创建 Context 并导出
export const ColumnVisibilityContext = createContext<{
  selectedColumns: string[]
  setSelectedColumns: (columns: string[]) => void
}>({
  selectedColumns: [],
  setSelectedColumns: () => {}
})

// Provider 组件
export function ColumnVisibilityProvider({ children }: { children: ReactNode }) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "barcode",
    "material",
    "supplier"
  ])

  return (
    <ColumnVisibilityContext.Provider value={{ selectedColumns, setSelectedColumns }}>
      {children}
    </ColumnVisibilityContext.Provider>
  )
}

// 列选择器组件
export function ColumnVisibility() {
  const { selectedColumns, setSelectedColumns } = useContext(ColumnVisibilityContext)
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <Settings className="h-4 w-4 mr-2" />
        自定义列
      </Button>

      {open && (
        <div className="absolute right-0 top-10 z-10 w-56 bg-white rounded-md shadow-lg border p-2">
          <div className="space-y-2">
            {OPTIONAL_COLUMNS.map((column) => (
              <label
                key={column.key}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
              >
                <Checkbox
                  checked={selectedColumns.includes(column.key)}
                  onCheckedChange={(checked: boolean | 'indeterminate') => {
                    if (typeof checked === 'boolean') {
                      setSelectedColumns(
                        checked
                          ? [...selectedColumns, column.key]
                          : selectedColumns.filter((key) => key !== column.key)
                      )
                    }
                  }}
                />
                <span className="text-sm">{column.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 