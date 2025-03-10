const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// 使用远程数据库连接
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://neondb_owner:npg_G4jciUl5TCRM@ep-little-queen-a11b3l39.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
})

async function main() {
  const password = 'admin123'
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    // 首先测试连接
    await prisma.$connect()
    console.log('成功连接到远程数据库')

    // 尝试查找管理员账号
    const admin = await prisma.user.findUnique({
      where: { email: 'wilsoninuk@gmail.com' }
    })

    console.log('当前管理员账号状态:', admin)

    if (admin) {
      // 如果存在，更新密码和状态
      await prisma.user.update({
        where: { email: 'wilsoninuk@gmail.com' },
        data: {
          password: hashedPassword,
          isActive: true
        }
      })
      console.log('管理员账号已更新')
    } else {
      // 如果不存在，创建新账号
      await prisma.user.create({
        data: {
          email: 'wilsoninuk@gmail.com',
          name: '管理员',
          password: hashedPassword,
          isActive: true
        }
      })
      console.log('管理员账号已创建')
    }
  } catch (error) {
    console.error('操作失败:', error)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect()) 