import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const user = await prisma.user.create({
    data: {
      email: 'wilsoninuk@gmail.com',
      name: 'Admin',
      password: hashedPassword
    }
  })

  console.log('管理员用户已创建:', {
    id: user.id,
    email: user.email,
    name: user.name
  })
}

main()
  .catch((e) => {
    console.error('创建用户失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 