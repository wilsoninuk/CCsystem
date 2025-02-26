"use client"

import { useState, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  RowSelectionState,
  Table as TanstackTable,
  Row as TanstackRow,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { ColumnDef, ColumnFiltersState, SortingState } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  searchKey: string
  onSelectedRowsChange?: (rows: TData[]) => void
  pageSize?: number
  onPageSizeChange?: (newPageSize: number) => void
}

export function DataTable<TData>({
  columns,
  data,
  searchKey,
  onSelectedRowsChange,
  pageSize = 50,
  onPageSizeChange
}: DataTableProps<TData>) {
  console.log('DataTable 初始化:', { pageSize, totalData: data.length })

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  })

  useEffect(() => {
    console.log('pageSize prop changed:', pageSize)
    setPagination(prev => ({
      ...prev,
      pageSize: pageSize
    }))
  }, [pageSize])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination,
    },
    onPaginationChange: setPagination,
    pageCount: Math.ceil(data.length / pagination.pageSize),
    manualPagination: false,
  })

  console.log('Table 状态:', {
    pagination: table.getState().pagination,
    totalRows: data.length,
    pageCount: table.getPageCount(),
    currentPageRows: table.getRowModel().rows.length,
    allRows: table.getCoreRowModel().rows.length
  })

  useEffect(() => {
    if (onPageSizeChange) {
      onPageSizeChange(pagination.pageSize)
    }
  }, [pagination.pageSize, onPageSizeChange])

  console.log('Pagination state:', {
    pageSize: pagination.pageSize,
    pageIndex: pagination.pageIndex,
    totalRows: data.length,
    currentPageRows: table.getRowModel().rows.length
  })

  const rows = table.getRowModel().rows

  return (
    <div>
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
            {rows.length ? (
              rows.map((row) => (
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

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          共 {table.getFilteredRowModel().rows.length} 条记录
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">每页显示 {pagination.pageSize} 条</p>
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
              第 {pagination.pageIndex + 1} 页，
              共 {table.getPageCount()} 页
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 