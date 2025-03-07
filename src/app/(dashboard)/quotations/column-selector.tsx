"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings } from "lucide-react"
import { QUOTATION_COLUMNS } from "./columns-config"

interface ColumnSelectorProps {
  selectedColumns: string[]
  onChange: (columns: string[]) => void
}

export function ColumnSelector({ selectedColumns, onChange }: ColumnSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          自定义列
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {QUOTATION_COLUMNS.map((column) => (
          <DropdownMenuItem
            key={column.key}
            className="flex items-center space-x-2"
            disabled={column.required}
            onSelect={(e) => e.preventDefault()}
          >
            <Checkbox
              id={column.key}
              checked={column.required || selectedColumns.includes(column.key)}
              disabled={column.required}
              onCheckedChange={(checked) => {
                if (checked) {
                  onChange([...selectedColumns, column.key])
                } else {
                  onChange(selectedColumns.filter((col) => col !== column.key))
                }
              }}
            />
            <label
              htmlFor={column.key}
              className="flex-1 cursor-pointer"
            >
              {column.label}
            </label>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 