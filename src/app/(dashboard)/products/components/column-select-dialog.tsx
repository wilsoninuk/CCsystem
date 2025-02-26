import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ColumnDef } from "@tanstack/react-table"
import { useState, useEffect } from "react"

interface ColumnSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnDef<any, any>[]
  visibleColumns: ColumnDef<any, any>[]
  onColumnsChange: (columns: ColumnDef<any, any>[]) => void
}

// 定义不允许隐藏的列
const REQUIRED_COLUMNS = ['select', 'actions']
// 默认隐藏的列
const DEFAULT_HIDDEN_COLUMNS = ['createdBy', 'createdAt']

export function ColumnSelectDialog({
  open,
  onOpenChange,
  columns,
  visibleColumns,
  onColumnsChange,
}: ColumnSelectDialogProps) {
  // 使用 Map 来跟踪每列的选中状态
  const [selectedColumns, setSelectedColumns] = useState<Map<string, boolean>>(new Map())

  // 初始化选中状态
  useEffect(() => {
    const newSelectedColumns = new Map()
    columns.forEach(column => {
      const key = (column as any).accessorKey || (column as any).id
      if (key) {
        // 如果是必需列或当前可见列中包含该列，则设置为选中
        const isVisible = REQUIRED_COLUMNS.includes(key) || 
                         visibleColumns.some(vc => (vc as any).accessorKey === key || (vc as any).id === key)
        newSelectedColumns.set(key, isVisible)
      }
    })
    setSelectedColumns(newSelectedColumns)
  }, [columns, visibleColumns])

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    setSelectedColumns(new Map(selectedColumns.set(columnKey, checked)))
  }

  const handleSave = () => {
    // 过滤出选中的列
    const newVisibleColumns = columns.filter(column => {
      const key = (column as any).accessorKey || (column as any).id
      return key && (REQUIRED_COLUMNS.includes(key) || selectedColumns.get(key))
    })
    onColumnsChange(newVisibleColumns)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>自定义显示列</DialogTitle>
          <DialogDescription>
            选择要在表格中显示的列。带 * 的列为必选项。
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {columns.map(column => {
              const key = (column as any).accessorKey || (column as any).id
              // 跳过特殊列（选择框和操作列）
              if (!key || REQUIRED_COLUMNS.includes(key)) return null

              const isRequired = REQUIRED_COLUMNS.includes(key)
              const isChecked = selectedColumns.get(key)

              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={isChecked}
                    disabled={isRequired}
                    onCheckedChange={(checked) => handleColumnToggle(key, checked as boolean)}
                  />
                  <Label htmlFor={key} className="text-sm">
                    {(column as any).header || key}
                    {isRequired && " *"}
                  </Label>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 