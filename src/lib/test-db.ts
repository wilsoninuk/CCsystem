import { prisma } from './db'

async function testProductCreation() {
  try {
    // 测试创建商品
    const product = await prisma.product.create({
      data: {
        barcode: "TEST001",
        itemNo: "ITEM001",
        description: "Test Product",
        cost: 100.00,
      }
    })
    console.log("Created product:", product)

    // 测试创建重复 barcode（应该失败）
    try {
      await prisma.product.create({
        data: {
          barcode: "TEST001", // 重复的 barcode
          itemNo: "ITEM002",
          description: "Test Product 2",
          cost: 200.00,
        }
      })
    } catch (error) {
      console.log("Successfully prevented duplicate barcode")
    }

  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testProductCreation() 