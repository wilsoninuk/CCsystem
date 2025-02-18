import { prisma } from "../src/lib/db"

async function main() {
  // 创建默认系统用户
  const defaultUser = await prisma.user.upsert({
    where: { email: 'system@example.com' },
    update: {},
    create: {
      email: 'system@example.com',
      name: 'System',
      password: 'system',
    },
  })

  console.log({ defaultUser })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  }) 