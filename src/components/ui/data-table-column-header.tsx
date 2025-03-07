import { Column } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDown } from "lucide-react"

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  className?: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 hover:bg-transparent",
        className
      )}
      onClick={() => column.toggleSorting()}
    >
      {title}
      {{
        asc: <ArrowUpIcon className="ml-2 h-4 w-4" />,
        desc: <ArrowDownIcon className="ml-2 h-4 w-4" />,
      }[column.getIsSorted() as string] ?? (
        <ChevronsUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  )
} 