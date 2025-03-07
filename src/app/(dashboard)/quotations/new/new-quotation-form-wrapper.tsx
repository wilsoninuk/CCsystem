"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NewQuotationForm } from "./new-quotation-form"
import type { Customer } from "@prisma/client"

const queryClient = new QueryClient()

interface NewQuotationFormWrapperProps {
  customers: Pick<Customer, "id" | "code" | "name" | "piAddress" | "piShipper" | "paymentMethod" | "shippingMethod" | "currency" | "exchangeRate">[]
}

export function NewQuotationFormWrapper({ customers }: NewQuotationFormWrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <NewQuotationForm customers={customers} />
    </QueryClientProvider>
  )
} 