import { prisma } from './db'

async function seedProducts() {
  try {
    // 清除现有数据
    await prisma.product.deleteMany()

    // 创建测试数据
    const products = await prisma.product.createMany({
      data: [
        {
          itemNo: "SP001",
          barcode: "6901234567890",
          description: "简约风格陶瓷咖啡杯",
          picture: "https://picsum.photos/200",  // 示例图片
          color: "白色/现代简约",
          material: "优质陶瓷",
          productSize: "9.5x7.8x10.2cm",
          cartonSize: "50x40x45cm",
          cartonWeight: 12.5,
          moq: 1000,
          cost: 8.50,
          supplier: "景德镇陶瓷厂",
          link1688: "https://detail.1688.com/sample1",
          isActive: true,
        },
        {
          itemNo: "SP002",
          barcode: "6901234567891",
          description: "北欧风格木质餐盘",
          picture: "https://picsum.photos/201",  // 示例图片
          color: "原木色/北欧简约",
          material: "进口榉木",
          productSize: "25x25x2cm",
          cartonSize: "55x55x30cm",
          cartonWeight: 15.8,
          moq: 500,
          cost: 22.00,
          supplier: "木艺家居",
          link1688: "https://detail.1688.com/sample2",
          isActive: true,
        },
        {
          itemNo: "SP003",
          barcode: "6901234567892",
          description: "日式和风茶具套装",
          picture: "https://picsum.photos/202",  // 示例图片
          color: "青瓷色/传统和风",
          material: "陶瓷+竹制",
          productSize: "整套包装28x20x15cm",
          cartonSize: "60x45x50cm",
          cartonWeight: 18.2,
          moq: 200,
          cost: 68.00,
          supplier: "匠心茶具",
          link1688: "https://detail.1688.com/sample3",
          isActive: true,
        }
      ]
    })

    console.log("成功创建测试数据：", products)

  } catch (error) {
    console.error("创建测试数据失败：", error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行测试数据创建
seedProducts() 