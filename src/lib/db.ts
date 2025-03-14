import { PrismaClient } from "@prisma/client"

const prismaClientSingleton = () => {
  // 检查是否在Vercel环境中运行
  const isVercel = process.env.VERCEL === '1'
  
  // 为Neon数据库添加连接池优化
  let url = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
  
  // 如果是Neon数据库URL且不包含pgbouncer参数，添加该参数
  if (url && url.includes('neon.tech') && !url.includes('pgbouncer=true')) {
    url = `${url}${url.includes('?') ? '&' : '?'}pgbouncer=true&connect_timeout=10`
  }
  
  return new PrismaClient({
    datasources: {
      db: {
        url
      }
    },
    // 增加日志记录，帮助调试连接问题
    log: isVercel ? ['error', 'warn'] : ['query', 'error', 'warn'],
    
    // 优化事务设置
    transactionOptions: {
      maxWait: 5000, // 最大等待时间5秒
      timeout: 10000  // 事务超时10秒
    }
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma 