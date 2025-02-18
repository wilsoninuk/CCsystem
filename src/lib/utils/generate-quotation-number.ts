import { prisma } from "@/lib/db"

export async function generateQuotationNumber(customerCode: string) {
  // 获取当前日期
  const today = new Date()
  const dateStr = today.toISOString().slice(2,10).replace(/-/g, '')  // 格式: 231225

  // 查找今天该客户的最后一个报价单号
  const lastQuotation = await prisma.quotation.findFirst({
    where: {
      number: {
        startsWith: `${customerCode}-${dateStr}`
      }
    },
    orderBy: {
      number: 'desc'
    }
  })

  // 生成序号
  let sequence = 1
  if (lastQuotation) {
    const lastSequence = parseInt(lastQuotation.number.split('-')[2])
    sequence = lastSequence + 1
  }

  // 格式化序号为3位数字
  const sequenceStr = sequence.toString().padStart(3, '0')

  // 返回完整的报价单号
  return `${customerCode}-${dateStr}-${sequenceStr}`
} 