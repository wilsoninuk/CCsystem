/**
 * Cloudinary图片URL生成工具
 * 基于商品条形码生成Cloudinary图片URL
 */

// Cloudinary配置
const CLOUDINARY_CLOUD_NAME = 'duiecmcry';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * 获取商品主图URL
 * @param barcode 商品条形码
 * @returns 主图URL
 */
export function getProductMainImageUrl(barcode: string): string {
  // 使用正确的products文件夹路径
  return `${CLOUDINARY_BASE_URL}/products/${barcode}.jpg`;
}

/**
 * 获取商品附图URL列表
 * @param barcode 商品条形码
 * @param count 附图数量，默认为4
 * @returns 附图URL列表
 */
export function getProductAdditionalImageUrls(barcode: string, count: number = 4): string[] {
  const urls: string[] = [];
  for (let i = 1; i <= count; i++) {
    // 使用正确的products文件夹路径
    urls.push(`${CLOUDINARY_BASE_URL}/products/${barcode}_${i}.jpg`);
  }
  return urls;
}

/**
 * 获取商品所有图片URL（包括主图和附图）
 * @param barcode 商品条形码
 * @param additionalCount 附图数量，默认为4
 * @returns 所有图片URL列表，第一个为主图
 */
export function getProductAllImageUrls(barcode: string, additionalCount: number = 4): string[] {
  return [getProductMainImageUrl(barcode), ...getProductAdditionalImageUrls(barcode, additionalCount)];
}

/**
 * 添加Cloudinary转换参数
 * @param url 原始Cloudinary URL
 * @param transformations 转换参数，如 'w_500,h_500,c_fill'
 * @returns 添加了转换参数的URL
 */
export function addCloudinaryTransformations(url: string, transformations: string): string {
  // 检查URL是否为Cloudinary URL
  if (!url.includes('cloudinary.com')) {
    return url;
  }
  
  // 在upload后添加转换参数，注意保留products路径
  return url.replace('/upload/products/', `/upload/${transformations}/products/`);
} 