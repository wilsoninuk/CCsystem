import { prisma } from "@/lib/db"
import { CustomerList } from "./customer-list"

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: {
      code: 'asc'
    }
  })

  return <CustomerList customers={customers} />
} 