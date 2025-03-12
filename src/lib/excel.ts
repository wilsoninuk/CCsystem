import ExcelJS from 'exceljs'
import { Product } from '@prisma/client'
import { saveAs } from 'file-saver'
import { QuotationItem } from '@/types/quotation'
import { getProductMainImageUrl, getProductAdditionalImageUrls } from "@/lib/cloudinary"

// 定义 Excel 列的映射关系
const EXCEL_HEADERS = {
  itemNo: '商品编号',
  description: '商品描述',
  cost: '成本',
  picture: '商品图片',
  barcode: '条形码',
  color: '颜色/款式',
  material: '材料',
  productSize: '产品尺寸',
  cartonSize: '装箱尺寸',
  cartonWeight: '装箱重量',
  moq: 'MOQ',
  supplier: '供应商',
  link1688: '1688链接',
}

interface ExcelSheetData {
  title: string
  date: string
  customer: {
    name: string
    piAddress: string
    piShipper: string
    paymentMethod: string
    shippingMethod: string
  }
  exchangeRate: number
  items: Array<{
    serialNo: number
    picture: string | null
    itemNo: string
    barcode: string
    description: string
    quantity: number
    priceRMB: number
    priceUSD: number
    totalRMB: number
    totalUSD: number
  }>
  totalRMB: number
  totalUSD: number
}

interface ExcelSheet {
  name: string
  data: ExcelSheetData
}

interface ExcelOptions {
  fileName: string
  sheets: ExcelSheet[]
}

interface ExportData {
  fileName: string
  sheets: {
    name: string
    data: {
      title: string
      date: string
      customer: {
        name: string
        piAddress: string
        piShipper: string
        paymentMethod: string
        shippingMethod: string
      }
      exchangeRate: number
      items: Array<{
        serialNo: number
        picture: string | null
        itemNo: string
        barcode: string
        description: string
        quantity: number
        priceRMB: number
        priceUSD: number
        totalRMB: number
        totalUSD: number
      }>
      totalRMB: number
      totalUSD: number
    }
  }[]
}

interface ExportOptions {
  includeCost: boolean
  includeProfit: boolean
  includeUSD: boolean
  includeRMB: boolean
}

// 添加图片处理的辅助函数
async function getImageBuffer(imageUrl: string): Promise<Buffer> {
  try {
    // 尝试直接获取图片
    try {
      const response = await fetch(imageUrl, { cache: 'no-store' })
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
      }
    } catch (directError) {
      console.error('直接获取图片失败，尝试使用代理:', directError)
    }

    // 如果直接获取失败，使用我们的图片代理 API
    const response = await fetch(`/api/image?url=${encodeURIComponent(imageUrl)}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch image via proxy: ${response.status} ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Failed to fetch image:', error, 'URL:', imageUrl)
    // 返回一个1x1像素的透明图片作为备用
    return Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  }
}

// 修改函数定义，添加可选的配置参数
export async function exportToExcel(items: QuotationItem[], options: ExportOptions) {
  // ... 实现导出逻辑 ...
}

// 生成模板
export async function generateTemplate() {
  // 创建工作簿
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('模板')

  // 设置列
  worksheet.columns = [
    { header: '商品编号', key: 'itemNo', width: 15 },
    { header: '商品描述', key: 'description', width: 30 },
    { header: '成本', key: 'cost', width: 10 },
    { header: '商品图片', key: 'picture', width: 50 },
    { header: '条形码', key: 'barcode', width: 15 },
    { header: '颜色/款式', key: 'color', width: 15 },
    { header: '材料', key: 'material', width: 15 },
    { header: '产品尺寸', key: 'productSize', width: 15 },
    { header: '装箱尺寸', key: 'cartonSize', width: 15 },
    { header: '装箱重量', key: 'cartonWeight', width: 10 },
    { header: 'MOQ', key: 'moq', width: 10 },
    { header: '供应商', key: 'supplier', width: 20 },
    { header: '1688链接', key: 'link1688', width: 50 },
  ]

  // 设置标题行样式
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

  // 添加示例数据
  worksheet.addRow({
    itemNo: 'ABC123',
    description: '示例商品',
    cost: 100,
    picture: 'https://example.com/image.jpg',
    barcode: '123456789',
    color: '红色',
    material: 'PP',
    productSize: '10x10x10cm',
    cartonSize: '50x50x50cm',
    cartonWeight: 5,
    moq: 1000,
    supplier: '示例供应商',
    link1688: 'https://detail.1688.com/xxx'
  })

  // 设置数据行样式
  const dataRow = worksheet.getRow(2)
  dataRow.alignment = { vertical: 'middle', horizontal: 'left' }

  // 添加数据验证和说明
  worksheet.getCell('C2').numFmt = '0.00' // 成本格式
  worksheet.getCell('D2').note = '请填入图片的完整URL地址，例如：https://example.com/image.jpg'
  worksheet.getCell('I2').numFmt = '0.00' // 装箱重量格式
  worksheet.getCell('J2').numFmt = '0' // MOQ格式

  // 导出文件
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  saveAs(blob, '商品导入模板.xlsx')
}

// 从 Excel 导入
export async function importFromExcel(file: File) {
  return new Promise<{
    success: Partial<Product>[]
    duplicates: {
      product: Partial<Product>
      existingProduct: Product
      reason: 'itemNo' | 'barcode'
    }[]
    errors: { row: number; error: string }[]
  }>(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(arrayBuffer)
      
      const worksheet = workbook.getWorksheet(1)
      if (!worksheet) {
        throw new Error('无法读取工作表')
      }

      const result = {
        success: [] as Partial<Product>[],
        duplicates: [] as {
          product: Partial<Product>
          existingProduct: Product
          reason: 'itemNo' | 'barcode'
        }[],
        errors: [] as { row: number; error: string }[]
      }

      // 从第二行开始读取数据（跳过标题行）
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // 跳过标题行

        try {
          // 验证必填字段
          const itemNo = row.getCell('A').value?.toString()
          const description = row.getCell('B').value?.toString()
          const cost = Number(row.getCell('C').value)
          const picture = row.getCell('D').value?.toString()

          if (!itemNo || !description || isNaN(cost)) {
            throw new Error('商品编号、商品描述、成本为必填项')
          }

          // 验证图片URL格式（如果有填写）
          if (picture && !isValidUrl(picture)) {
            throw new Error('图片URL格式不正确')
          }

          // 构建商品数据
          const product: Partial<Product> = {
            itemNo,
            description,
            cost,
            picture: picture || null,
            barcode: row.getCell('E').value?.toString(),
            color: row.getCell('F').value?.toString(),
            material: row.getCell('G').value?.toString(),
            productSize: row.getCell('H').value?.toString(),
            cartonSize: row.getCell('I').value?.toString(),
            cartonWeight: Number(row.getCell('J').value) || null,
            moq: Number(row.getCell('K').value) || null,
            supplier: row.getCell('L').value?.toString(),
            link1688: row.getCell('M').value?.toString(),
          }

          result.success.push(product)
        } catch (error) {
          result.errors.push({
            row: rowNumber,
            error: error instanceof Error ? error.message : '数据格式错误'
          })
        }
      })

      // 检查重复项
      try {
        const response = await fetch('/api/products/check-duplicates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result.success)
        })

        if (!response.ok) {
          throw new Error('检查重复失败')
        }

        const duplicates = await response.json()
        
        // 将重复项从 success 移到 duplicates
        result.duplicates = duplicates
        result.success = result.success.filter(product => 
          !duplicates.some((d: { product: Partial<Product> }) => d.product.itemNo === product.itemNo)
        )
      } catch (error) {
        console.error('检查重复失败:', error)
      }

      resolve(result)
    } catch (error) {
      reject(new Error('文件解析失败'))
    }
  })
}

// 辅助函数：验证URL格式
function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
// 导出报价单到Excel（包含图片）
export async function exportQuotationToExcel(items: QuotationItem[], fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('报价单', {
    properties: { defaultRowHeight: 80 }  // 设置默认行高
  });

  // 设置列宽和对齐方式
  const baseColumns = [
    { header: '主图', width: 15 },
    { header: '商品编号', width: 15 },
    { header: '条形码', width: 15 },
    { header: '类别', width: 15 },
    { header: '描述', width: 40 },
    { header: '供应商', width: 15 },
    { header: '成本价(RMB)', width: 15 },
    { header: '运费(RMB)', width: 15 },
    { header: '数量', width: 10 },
    { header: '单价(RMB)', width: 15 },
    { header: '总价(RMB)', width: 15 },
    { header: '单价(USD)', width: 15 },
    { header: '总价(USD)', width: 15 },
    { header: '利润(RMB)', width: 15 },
    { header: '备注', width: 20 }
  ];

  // 添加附图列 - 固定为4张附图
  const maxAdditionalImages = 4;
  const additionalImageColumns = Array.from({ length: maxAdditionalImages }, (_, i) => ({
    header: `附图${i + 1}`,
    key: `additionalImage${i}`,
    width: 15
  }));

  worksheet.columns = [...baseColumns, ...additionalImageColumns];

  // 设置标题行样式
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // 预先创建所有行
  items.forEach((item, index) => {
    const row = worksheet.addRow([
      '', // 图片占位
      item.product.itemNo,
      item.barcode,
      item.product.category || '',
      item.product.description,
      item.product.supplier?.name || '',
      item.product.cost,
      item.shipping || 0,
      item.quantity,
      item.exwPriceRMB || 0,
      (item.exwPriceRMB || 0) * item.quantity,
      item.exwPriceUSD || 0,
      (item.exwPriceUSD || 0) * item.quantity,
      item.profit || 0,
      item.remark || ''
    ]);

    // 为附图列添加空值
    for (let j = 0; j < maxAdditionalImages; j++) {
      row.getCell(baseColumns.length + j + 1).value = '';
    }

    // 设置行高
    row.height = 80;

    // 设置单元格对齐方式
    row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    // 设置数字列的格式
    const numberColumns = [7, 8, 9, 10, 11, 12, 13, 14]; // 成本价到利润的列索引
    numberColumns.forEach(colIndex => {
      row.getCell(colIndex).numFmt = '0.00';
    });
  });

  // 添加所有图片
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowIndex = i + 2; // 数据从第2行开始

    // 获取Cloudinary图片URL
    const cloudinaryMainImageUrl = getProductMainImageUrl(item.barcode);
    const cloudinaryAdditionalImageUrls = getProductAdditionalImageUrls(item.barcode, maxAdditionalImages);

    // 添加主图
    try {
      const imageBuffer = await getImageBuffer(cloudinaryMainImageUrl);
      const imageId = workbook.addImage({
        buffer: imageBuffer as any,
        extension: 'jpeg',
      });
      
      worksheet.addImage(imageId, {
        tl: { col: 0, row: rowIndex - 1 } as any,
        br: { col: 1, row: rowIndex } as any,
        editAs: 'oneCell'
      });
    } catch (error) {
      console.error(`Failed to add Cloudinary main image for product ${item.product.itemNo}:`, error);
      
      // 如果Cloudinary图片获取失败，尝试使用数据库中的图片
      try {
        const mainImage = item.product.images?.find(img => img.isMain)?.url || item.product.picture;
        if (mainImage) {
          const imageBuffer = await getImageBuffer(mainImage);
          const imageId = workbook.addImage({
            buffer: imageBuffer as any,
            extension: 'jpeg',
          });
          
          worksheet.addImage(imageId, {
            tl: { col: 0, row: rowIndex - 1 } as any,
            br: { col: 1, row: rowIndex } as any,
            editAs: 'oneCell'
          });
        }
      } catch (innerError) {
        console.error(`Failed to add database main image for product ${item.product.itemNo}:`, innerError);
      }
    }

    // 添加附图
    for (let j = 0; j < maxAdditionalImages; j++) {
      try {
        const additionalImageUrl = cloudinaryAdditionalImageUrls[j];
        const imageBuffer = await getImageBuffer(additionalImageUrl);
        const imageId = workbook.addImage({
          buffer: imageBuffer as any,
          extension: 'jpeg',
        });
        
        worksheet.addImage(imageId, {
          tl: { col: baseColumns.length + j, row: rowIndex - 1 } as any,
          br: { col: baseColumns.length + j + 1, row: rowIndex } as any,
          editAs: 'oneCell'
        });
      } catch (error) {
        console.error(`Failed to add Cloudinary additional image ${j + 1} for product ${item.product.itemNo}:`, error);
        
        // 如果Cloudinary附图获取失败，尝试使用数据库中的附图
        try {
          const additionalImages = item.product.images?.filter(img => !img.isMain) || [];
          if (additionalImages[j]) {
            const imageBuffer = await getImageBuffer(additionalImages[j].url);
            const imageId = workbook.addImage({
              buffer: imageBuffer as any,
              extension: 'jpeg',
            });
            
            worksheet.addImage(imageId, {
              tl: { col: baseColumns.length + j, row: rowIndex - 1 } as any,
              br: { col: baseColumns.length + j + 1, row: rowIndex } as any,
              editAs: 'oneCell'
            });
          }
        } catch (innerError) {
          console.error(`Failed to add database additional image ${j + 1} for product ${item.product.itemNo}:`, innerError);
        }
      }
    }
  }

  // 添加总计行
  const totalRow = worksheet.addRow([
    '总计',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    items.reduce((sum, item) => sum + item.quantity, 0),
    '',
    items.reduce((sum, item) => sum + (item.exwPriceRMB || 0) * item.quantity, 0),
    '',
    items.reduce((sum, item) => sum + (item.exwPriceUSD || 0) * item.quantity, 0),
    items.reduce((sum, item) => sum + (item.profit || 0), 0),
    ''
  ]);

  // 为附图列添加空值
  for (let j = 0; j < maxAdditionalImages; j++) {
    totalRow.getCell(baseColumns.length + j + 1).value = '';
  }

  // 设置总计行样式
  totalRow.font = { bold: true };
  totalRow.alignment = { vertical: 'middle', horizontal: 'right' };
  totalRow.height = 30;

  // 设置总计行数字格式
  [9, 11, 13, 14].forEach(colIndex => {
    totalRow.getCell(colIndex).numFmt = '0.00';
  });

  // 导出文件
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });

  // 触发下载
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(link.href);
}

// 专门用于报价单详情页的导出功能
export async function exportQuotationDetail(quotation: {
  number: string
  customerName: string
  piAddress: string
  piShipper: string
  paymentMethod: string
  shippingMethod: string
  exchangeRate: number
  totalAmountRMB: number
  totalAmountUSD: number
  createdAt: Date
  items: Array<{
    serialNo: number
    product: {
      itemNo: string
      description: string
      images?: Array<{ url: string; isMain: boolean }>
    }
    barcode: string
    quantity: number
    exwPriceRMB: number
    exwPriceUSD: number
  }>
}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('报价单');

  // 设置标题
  worksheet.mergeCells('A1:J1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `报价单 ${quotation.number}`;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 25;

  // 添加客户信息
  worksheet.mergeCells('A2:E2');
  worksheet.getCell('A2').value = `客户名称：${quotation.customerName}`;
  worksheet.mergeCells('F2:J2');
  worksheet.getCell('F2').value = `日期：${new Date(quotation.createdAt).toLocaleDateString()}`;
  worksheet.getRow(2).height = 20;

  worksheet.mergeCells('A3:E3');
  worksheet.getCell('A3').value = `PI地址：${quotation.piAddress}`;
  worksheet.mergeCells('F3:J3');
  worksheet.getCell('F3').value = `发货人：${quotation.piShipper}`;
  worksheet.getRow(3).height = 20;

  worksheet.mergeCells('A4:E4');
  worksheet.getCell('A4').value = `付款方式：${quotation.paymentMethod}`;
  worksheet.mergeCells('F4:J4');
  worksheet.getCell('F4').value = `船运方式：${quotation.shippingMethod}`;
  worksheet.getRow(4).height = 20;

  worksheet.mergeCells('A5:E5');
  worksheet.getCell('A5').value = `汇率：${quotation.exchangeRate}`;
  worksheet.getRow(5).height = 20;

  // 设置表头
  const headers = [
    '序号',
    '图片',
    '商品编号',
    '条形码',
    '描述',
    '数量',
    '单价(RMB)',
    '单价(USD)',
    '总价(RMB)',
    '总价(USD)'
  ];

  // 添加附图列 - 固定为4张附图
  const maxAdditionalImages = 4;
  for (let i = 0; i < maxAdditionalImages; i++) {
    headers.push(`附图${i + 1}`);
  }

  // 设置列宽
  const baseColumns = [
    { width: 6 },   // 序号
    { width: 12 },  // 图片
    { width: 15 },  // 商品编号
    { width: 15 },  // 条形码
    { width: 40 },  // 描述
    { width: 8 },   // 数量
    { width: 12 },  // 单价(RMB)
    { width: 12 },  // 单价(USD)
    { width: 12 },  // 总价(RMB)
    { width: 12 }   // 总价(USD)
  ];

  // 添加附图列宽
  for (let i = 0; i < maxAdditionalImages; i++) {
    baseColumns.push({ width: 12 }); // 附图列宽
  }

  worksheet.columns = baseColumns;

  // 添加表头行
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 20;
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // 第一步：添加所有数据行
  quotation.items.forEach((item) => {
    const rowData = [
      item.serialNo,
      '', // 图片占位
      item.product.itemNo,
      item.barcode,
      item.product.description,
      item.quantity,
      item.exwPriceRMB,
      item.exwPriceUSD,
      item.exwPriceRMB * item.quantity,
      item.exwPriceUSD * item.quantity
    ];

    // 为附图列添加空值
    for (let i = 0; i < maxAdditionalImages; i++) {
      rowData.push('');
    }

    const row = worksheet.addRow(rowData);

    // 设置行高和样式
    row.height = 60;
    row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    // 设置数字格式
    row.getCell(7).numFmt = '0.00'; // 单价(RMB)
    row.getCell(8).numFmt = '0.00'; // 单价(USD)
    row.getCell(9).numFmt = '0.00'; // 总价(RMB)
    row.getCell(10).numFmt = '0.00'; // 总价(USD)
  });

  // 第二步：单独处理所有图片
  for (let i = 0; i < quotation.items.length; i++) {
    const item = quotation.items[i];
    const rowIndex = i + 7; // 数据从第7行开始（前面有6行是标题和表头）

    // 获取Cloudinary图片URL
    const cloudinaryMainImageUrl = getProductMainImageUrl(item.barcode);
    const cloudinaryAdditionalImageUrls = getProductAdditionalImageUrls(item.barcode, maxAdditionalImages);

    // 处理主图
    try {
      const imageBuffer = await getImageBuffer(cloudinaryMainImageUrl);
      const imageId = workbook.addImage({
        buffer: imageBuffer as any,
        extension: 'jpeg',
      });
      
      worksheet.addImage(imageId, {
        tl: { col: 1, row: rowIndex - 1 } as any,
        br: { col: 2, row: rowIndex } as any,
        editAs: 'oneCell'
      });
    } catch (error) {
      console.error(`Failed to add Cloudinary main image for product ${item.product.itemNo}:`, error);
      
      // 如果Cloudinary图片获取失败，尝试使用数据库中的图片
      try {
        const mainImage = item.product.images?.find(img => img.isMain)?.url;
        if (mainImage) {
          const imageBuffer = await getImageBuffer(mainImage);
          const imageId = workbook.addImage({
            buffer: imageBuffer as any,
            extension: 'jpeg',
          });
          
          worksheet.addImage(imageId, {
            tl: { col: 1, row: rowIndex - 1 } as any,
            br: { col: 2, row: rowIndex } as any,
            editAs: 'oneCell'
          });
        }
      } catch (innerError) {
        console.error(`Failed to add database main image for product ${item.product.itemNo}:`, innerError);
      }
    }

    // 处理附图
    for (let j = 0; j < maxAdditionalImages; j++) {
      try {
        const additionalImageUrl = cloudinaryAdditionalImageUrls[j];
        const imageBuffer = await getImageBuffer(additionalImageUrl);
        const imageId = workbook.addImage({
          buffer: imageBuffer as any,
          extension: 'jpeg',
        });
        
        worksheet.addImage(imageId, {
          tl: { col: 10 + j, row: rowIndex - 1 } as any,
          br: { col: 11 + j, row: rowIndex } as any,
          editAs: 'oneCell'
        });
      } catch (error) {
        console.error(`Failed to add Cloudinary additional image ${j + 1} for product ${item.product.itemNo}:`, error);
        
        // 如果Cloudinary附图获取失败，尝试使用数据库中的附图
        try {
          const additionalImages = item.product.images?.filter(img => !img.isMain) || [];
          if (additionalImages[j]) {
            const imageBuffer = await getImageBuffer(additionalImages[j].url);
            const imageId = workbook.addImage({
              buffer: imageBuffer as any,
              extension: 'jpeg',
            });
            
            worksheet.addImage(imageId, {
              tl: { col: 10 + j, row: rowIndex - 1 } as any,
              br: { col: 11 + j, row: rowIndex } as any,
              editAs: 'oneCell'
            });
          }
        } catch (innerError) {
          console.error(`Failed to add database additional image ${j + 1} for product ${item.product.itemNo}:`, innerError);
        }
      }
    }
  }

  // 添加总计行
  const totalRowData = [
    '总计',
    '',
    '',
    '',
    '',
    quotation.items.reduce((sum, item) => sum + item.quantity, 0),
    '',
    '',
    quotation.totalAmountRMB,
    quotation.totalAmountUSD
  ];

  // 为附图列添加空值
  for (let i = 0; i < maxAdditionalImages; i++) {
    totalRowData.push('');
  }

  const totalRow = worksheet.addRow(totalRowData);

  // 设置总计行样式
  totalRow.height = 20;
  totalRow.font = { bold: true };
  totalRow.alignment = { vertical: 'middle', horizontal: 'center' };
  totalRow.getCell(9).numFmt = '0.00'; // 总价(RMB)
  totalRow.getCell(10).numFmt = '0.00'; // 总价(USD)

  // 导出文件
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `报价单_${quotation.number}.xlsx`);
}
