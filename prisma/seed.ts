import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 重置管理员密码为 admin123
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const updatedUser = await prisma.user.update({
    where: { 
      email: 'wilsoninuk@gmail.com' 
    },
    data: {
      password: hashedPassword
    }
  })

  console.log('管理员密码已重置为: admin123')
  console.log('更新的用户信息:', {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name
  })
}

main()
  .catch((e) => {
    console.error('重置密码失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 