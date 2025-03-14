"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  onRowSelectionChange?: (selectedRowIds: string[]) => void
  meta?: Record<string, any>
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  onRowSelectionChange,
  meta,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  })

  // 添加调试日志
  console.log('Table state:', {
    pagination,
    totalRows: data.length,
    currentPageRows: Math.min(pagination.pageSize, data.length)
  })

  // 添加调试日志
  console.log('Selection state:', {
    rowSelection,
    selectedCount: Object.keys(rowSelection).length
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: (updater) => {
      // 1. 计算新的选择状态
      const newSelection = typeof updater === 'function' 
        ? updater(rowSelection)
        : updater
      
      // 2. 更新本地状态
      setRowSelection(newSelection)
      
      // 3. 如果有回调，立即触发
      if (onRowSelectionChange) {
        const selectedRows = table
          .getFilteredRowModel()
          .rows.filter((row) => newSelection[row.id])
          .map((row) => row.original)
        
        console.log('Triggering selection change:', {
          newSelection,
          selectedRows: selectedRows.length
        })
        
        // 使用类型断言来避免TypeScript错误
        const selectedIds = selectedRows.map((row) => (row as any).id);
        onRowSelectionChange(selectedIds)
      }
      
      // 4. 如果有 meta.onRowSelectionChange 回调，也触发它
      if (meta?.onRowSelectionChange) {
        const selectedRows = table
          .getFilteredRowModel()
          .rows.filter((row) => newSelection[row.id])
          .map((row) => row.original)
        
        meta.onRowSelectionChange(selectedRows)
      }
    },
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      pagination,
    },
    manualPagination: false,
    pageCount: Math.ceil(data.length / pagination.pageSize),
    meta: meta,
  })

  // 监听分页变化
  useEffect(() => {
    console.log('分页状态变化:', {
      pageSize: pagination.pageSize,
      pageIndex: pagination.pageIndex,
      visibleRows: table.getRowModel().rows.length
    })
  }, [pagination.pageSize, pagination.pageIndex, table])

  return (
    <div>
      <div className="flex items-center justify-between py-4">
        {searchKey && (
          <Input
            placeholder="搜索..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        )}
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">每页显示:</span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => {
              const newSize = parseInt(value)
              table.setPageSize(newSize)
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder={`${pagination.pageSize}条/页`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10条/页</SelectItem>
              <SelectItem value="50">50条/页</SelectItem>
              <SelectItem value="100">100条/页</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 表格主体部分 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控制 */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          共 {table.getFilteredRowModel().rows.length} 条记录
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {table.getState().pagination.pageIndex + 1} 页，
            共 {table.getPageCount()} 页
          </span>
        </div>
      </div>
    </div>
  )
} 