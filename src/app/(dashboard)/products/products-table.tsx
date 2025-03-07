"use client"

import { DataTable } from "@/components/ui/data-table/DataTable"
import { useContext, useState } from "react"
import { ColumnVisibilityContext } from "./column-visibility"
import { columns, getVisibleColumns, renderSubComponent } from "./columns"
import { Product } from "@prisma/client"
import { 
  useReactTable, 
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table"

interface ProductsTableProps {
  products: Product[]
  selectedRows: string[]
  onSelectedRowsChange: (rows: string[]) => void
  onProductUpdate?: (product: Product) => void
}

// 添加 meta 类型定义
type TableMeta<T> = {
  updateData: (rowIndex: number, updatedProduct: T) => void
}

export function ProductsTable({ 
  products, 
  selectedRows, 
  onSelectedRowsChange,
  onProductUpdate 
}: ProductsTableProps) {
  const { selectedColumns } = useContext(ColumnVisibilityContext)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data: products,
    columns: getVisibleColumns(selectedColumns),
    state: {
      columnFilters,
      rowSelection: selectedRows.reduce((acc, itemNo) => {
        // 找到对应的行索引
        const rowIndex = products.findIndex(p => p.itemNo === itemNo)
        if (rowIndex !== -1) {
          acc[rowIndex] = true
        }
        return acc
      }, {} as Record<string, boolean>),
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: () => true,
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      if (typeof updater === 'function') {
        const currentSelection = selectedRows.reduce((acc, itemNo) => {
          const rowIndex = products.findIndex(p => p.itemNo === itemNo)
          if (rowIndex !== -1) {
            acc[rowIndex] = true
          }
          return acc
        }, {} as Record<string, boolean>)

        const newSelection = updater(currentSelection)
        
        // 将选中的行索引转换回 itemNo
        const selectedItemNos = Object.keys(newSelection)
          .filter(key => newSelection[key])
          .map(key => products[parseInt(key)]?.itemNo)
          .filter(Boolean)

        onSelectedRowsChange(selectedItemNos)
      } else {
        // 直接更新的情况
        const selectedItemNos = Object.keys(updater)
          .filter(key => updater[key])
          .map(key => products[parseInt(key)]?.itemNo)
          .filter(Boolean)

        onSelectedRowsChange(selectedItemNos)
      }
    },
    meta: {
      updateData: (rowIndex: number, updatedProduct: Product) => {
        if (onProductUpdate) {
          onProductUpdate(updatedProduct)
        }
      }
    } as TableMeta<Product>
  })

  return (
    <DataTable 
      table={table}
      searchKey="itemNo"
      renderSubComponent={renderSubComponent}
    />
  )
} 