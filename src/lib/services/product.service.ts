import { Product } from "@prisma/client"

export interface ProductWithRelations extends Product {
  creator?: {
    name: string | null
    email: string | null
  } | null
  updater?: {
    name: string | null
    email: string | null
  } | null
}

export interface DuplicateProduct {
  barcode: string
  existingProduct: {
    itemNo: string
    description: string
    supplier: string | null
  }
  newProduct: {
    itemNo: string
    description: string
  }
}

export interface ImportResult {
  created: number
  updated: number
  duplicates?: DuplicateProduct[]
}

export class ProductService {
  // 获取所有商品
  static async getProducts(): Promise<ProductWithRelations[]> {
    const response = await fetch('/api/products')
    if (!response.ok) {
      throw new Error('获取商品列表失败')
    }
    return response.json()
  }

  // 获取单个商品
  static async getProduct(id: string): Promise<ProductWithRelations> {
    const response = await fetch(`/api/products/${id}`)
    if (!response.ok) {
      throw new Error('获取商品详情失败')
    }
    return response.json()
  }

  // 创建商品
  static async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('创建商品失败')
    }
    return response.json()
  }

  // 更新商品
  static async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('更新商品失败')
    }
    return response.json()
  }

  // 更新商品状态
  static async updateProductStatus(id: string, isActive: boolean): Promise<Product> {
    const response = await fetch(`/api/products/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive }),
    })
    if (!response.ok) {
      throw new Error('更新商品状态失败')
    }
    return response.json()
  }

  // 更新商品图片
  static async updateProductImages(
    id: string,
    picture: string | null,
    additionalPictures: string[]
  ): Promise<Product> {
    const response = await fetch(`/api/products/${id}/images`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ picture, additionalPictures }),
    })
    if (!response.ok) {
      throw new Error('更新商品图片失败')
    }
    return response.json()
  }

  // 导入商品
  static async importProducts(file: File, updateDuplicates: boolean = false): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('updateDuplicates', String(updateDuplicates))

    const response = await fetch('/api/products/import', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (response.status === 409) {
      return {
        created: 0,
        updated: 0,
        duplicates: data.duplicates,
      }
    }

    if (!response.ok) {
      throw new Error(data.error || '导入商品失败')
    }

    return {
      created: data.created,
      updated: data.updated,
    }
  }

  // 导出商品
  static async exportProducts(ids?: string[]): Promise<Blob> {
    const response = await fetch('/api/products/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    })
    if (!response.ok) {
      throw new Error('导出商品失败')
    }
    return response.blob()
  }

  // 下载导入模板
  static async downloadTemplate(): Promise<Blob> {
    const response = await fetch('/api/products/template')
    if (!response.ok) {
      throw new Error('下载模板失败')
    }
    return response.blob()
  }

  // 上传图片
  static async uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('上传图片失败')
    }

    const data = await response.json()
    return data.url
  }
} 