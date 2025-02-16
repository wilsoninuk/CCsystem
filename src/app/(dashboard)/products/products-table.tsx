"use client"

import { DataTable } from "@/components/ui/data-table/DataTable"
import { useContext } from "react"
import { ColumnVisibilityContext } from "./column-visibility"
import { getVisibleColumns, renderSubComponent } from "./columns"
import { Product } from "@prisma/client"
import Image from 'next/image'

export function ProductsTable({ products }: { products: Product[] }) {
  const { selectedColumns } = useContext(ColumnVisibilityContext)

  return (
    <DataTable 
      columns={getVisibleColumns(selectedColumns)} 
      data={products}
      searchKey="barcode"
      renderSubComponent={renderSubComponent}
      getRowCanExpand={() => true}
      enableRowSelection={true}
    />
  )
} 