import { prisma } from "@/lib/db"
import { Product, Prisma } from "@prisma/client"

export class ProductBaseService {
  // 获取商品基础信息
  static async getProduct(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        updater: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
  }

  // 只更新基础数据
  static async updateBaseInfo(id: string, data: Prisma.ProductUpdateInput, userId: string) {
    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId
      }
    })
  }

  static async createProduct(data: Prisma.ProductCreateInput, userId: string) {
    return prisma.product.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId
      }
    })
  }

  // 其他基础操作方法
} 