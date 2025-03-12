import { prisma } from "@/lib/db"
import { ProductImage } from "@prisma/client"

export function generateImageUrls(barcode: string, imageCount: number = 1) {
  const baseUrl = "https://res.cloudinary.com/duiecmcry/image/upload/v1/products/"
  const mainImage = `${baseUrl}${barcode}.jpg`
  
  // 只有当确实需要附图时才生成
  const additionalImages = imageCount > 1 
    ? Array.from({ length: imageCount - 1 }, (_, i) => 
        `${baseUrl}${barcode}_${i + 1}.jpg`)
    : []
    
  return { mainImage, additionalImages }
}

export async function updateProductImages(
  productId: string, 
  mainImageUrl: string, 
  additionalImageUrls: string[] = []
) {
  try {
    // 1. 获取现有图片
    const existingImages = await prisma.productImage.findMany({
      where: { productId }
    })

    // 2. 准备新的图片URL列表
    const newUrls = [mainImageUrl, ...additionalImageUrls]

    // 3. 找出需要删除的图片
    const imagesToDelete = existingImages.filter(img => 
      !newUrls.includes(img.url)
    )

    // 4. 找出需要新增的图片URL
    const existingUrls = existingImages.map(img => img.url)
    const urlsToCreate = newUrls.filter(url => 
      !existingUrls.includes(url)
    )

    // 5. 在一个事务中处理所有图片更新
    await prisma.$transaction(async (tx) => {
      // 删除不需要的图片
      if (imagesToDelete.length > 0) {
        await tx.productImage.deleteMany({
          where: {
            id: { in: imagesToDelete.map(img => img.id) }
          }
        })
      }

      // 创建新图片
      if (urlsToCreate.length > 0) {
        await tx.productImage.createMany({
          data: urlsToCreate.map((url, index) => ({
            url,
            productId,
            isMain: url === mainImageUrl,
            order: url === mainImageUrl ? 0 : index + 1
          }))
        })
      }
    })

    return true
  } catch (error) {
    console.error('更新商品图片失败:', error)
    return false
  }
}

export async function batchUpdateImages(
  products: Array<{
    id: string, 
    mainImage: string, 
    additionalImages: string[]
  }>
) {
  try {
    // 使用事务批量处理所有产品的图片
    await prisma.$transaction(async (tx) => {
      for (const product of products) {
        const existingImages = await tx.productImage.findMany({
          where: { productId: product.id }
        })

        const newUrls = [product.mainImage, ...product.additionalImages]
        const imagesToDelete = existingImages.filter(img => 
          !newUrls.includes(img.url)
        )

        // 删除旧图片
        if (imagesToDelete.length > 0) {
          await tx.productImage.deleteMany({
            where: {
              id: { in: imagesToDelete.map(img => img.id) }
            }
          })
        }

        // 创建新图片
        const existingUrls = existingImages.map(img => img.url)
        const urlsToCreate = newUrls.filter(url => 
          !existingUrls.includes(url)
        )

        if (urlsToCreate.length > 0) {
          await tx.productImage.createMany({
            data: urlsToCreate.map((url, index) => ({
              url,
              productId: product.id,
              isMain: url === product.mainImage,
              order: url === product.mainImage ? 0 : index + 1
            }))
          })
        }
      }
    })

    return true
  } catch (error) {
    console.error('批量更新商品图片失败:', error)
    return false
  }
}

export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.warn(`Invalid image URL: ${url}`)
    return false
  }
} 