import ExcelJS from 'exceljs'
import { Product } from '@prisma/client'
import { saveAs } from 'file-saver'
import { QuotationItem } from '@/types/quotation'

// 定义 Excel 列的映射关系
const EXCEL_HEADERS = {
  itemNo: '商品编号',
  barcode: '条形码',
  description: '商品描述',
  cost: '成本价',
  category: '类别',
  supplier: '供应商',
  color: '颜色',
  material: '材质',
  productSize: '尺寸',
  cartonSize: '装箱尺寸',
  cartonWeight: '装箱重量',
  moq: '起订量',
  link1688: '1688链接',
  mainImage: '主图URL',
  image1: '附图URL1',
  image2: '附图URL2',
  image3: '附图URL3',
  image4: '附图URL4'
} as const

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
  // 使用我们的图片代理 API
  const response = await fetch(`/api/image?url=${encodeURIComponent(imageUrl)}`)
  if (!response.ok) {
    throw new Error('Failed to fetch image')
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Failed to fetch image:', error)
    throw error
  }
}

// 修改函数定义，添加可选的配置参数
export async function exportToExcel(items: QuotationItem[], options: ExportOptions) {
  // ... 实现导出逻辑 ...
}

// 生成图片URL的函数
function generateImageUrls(barcode: string) {
  const baseUrl = "https://res.cloudinary.com/duiecmcry/image/upload/v1/products/"
  return {
    mainImage: `${baseUrl}${barcode}.jpg`,
    additionalImages: [
      `${baseUrl}${barcode}_1.jpg`,
      `${baseUrl}${barcode}_2.jpg`,
      `${baseUrl}${barcode}_3.jpg`,
      `${baseUrl}${barcode}_4.jpg`
    ]
  }
}

// 生成 Excel 导入模板
export async function generateTemplate() {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('商品导入')

  // 设置列
  const columns = Object.entries(EXCEL_HEADERS).map(([key, header]) => ({
    header,
    key,
    width: key === 'description' ? 30 : key === 'link1688' ? 50 : 15
  }))
  worksheet.columns = columns

  // 设置表头样式
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }

  // 添加示例数据
  const exampleData = [
    {
      itemNo: 'DEMO001',
      barcode: '1234567890',
      description: '示例商品1',
    cost: 100,
      category: '类别A',
      supplier: '供应商A',
    color: '红色',
      material: '塑料',
      productSize: '10x20x30',
      cartonSize: '50x50x50',
    cartonWeight: 5,
    moq: 1000,
    link1688: 'https://detail.1688.com/xxx'
    },
    {
      itemNo: 'DEMO002',
      barcode: '0987654321',
      description: '示例商品2',
      cost: 200,
      category: '类别B',
      supplier: '供应商B',
      color: '蓝色',
      material: '金属',
      productSize: '20x30x40',
      cartonSize: '60x60x60',
      cartonWeight: 8,
      moq: 500,
      link1688: 'https://detail.1688.com/yyy'
    }
  ]

  // 添加数据行
  exampleData.forEach(data => {
    worksheet.addRow(data)
  })

  // 添加必填说明
  const requiredFields = ['商品编号', '条形码', '商品描述', '成本价']
  worksheet.addRow([])
  worksheet.addRow(['必填字段说明:'])
  requiredFields.forEach(field => {
    worksheet.addRow([`${field}: 必填`])
  })

  // 添加图片说明
  worksheet.addRow([])
  worksheet.addRow(['图片命名规则:'])
  worksheet.addRow(['1. 主图: 使用商品条形码作为文件名，例如: 1234567890.jpg'])
  worksheet.addRow(['2. 附图: 使用商品条形码加下划线和序号，例如: 1234567890_1.jpg'])
  worksheet.addRow(['3. 所有图片必须上传到 Cloudinary 的 /products 文件夹'])
  worksheet.addRow(['4. 图片格式支持: jpg, jpeg, png'])

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
          const barcode = row.getCell('D').value?.toString()

          if (!itemNo || !description || isNaN(cost)) {
            throw new Error('商品编号、商品描述、成本为必填项')
          }

          if (!barcode) {
            throw new Error('条形码为必填项')
          }

          // 根据条形码生成图片URL
          const { mainImage } = generateImageUrls(barcode)

          // 构建商品数据
          const product: Partial<Product> = {
            itemNo,
            description,
            cost,
            barcode,
            picture: mainImage, // 使用生成的主图URL
            color: row.getCell('E').value?.toString(),
            material: row.getCell('F').value?.toString(),
            productSize: row.getCell('G').value?.toString(),
            cartonSize: row.getCell('H').value?.toString(),
            cartonWeight: Number(row.getCell('I').value) || null,
            moq: Number(row.getCell('J').value) || null,
            supplier: row.getCell('K').value?.toString(),
            link1688: row.getCell('L').value?.toString(),
          }

          result.success.push(product)
        } catch (error) {
          result.errors.push({
            row: rowNumber,
            error: error instanceof Error ? error.message : '未知错误'
          })
        }
      })

      resolve(result)
    } catch (error) {
      reject(error)
    }
  })
}

// 导出报价单到Excel（包含图片）
export async function exportQuotationToExcel(items: QuotationItem[], fileName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('报价单', {
    properties: { defaultRowHeight: 80 }  // 设置默认行高
  });

  // 设置列宽和对齐方式
  worksheet.columns = [
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

    // 添加主图
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
    } catch (error) {
      console.error(`Failed to add main image for product ${item.product.itemNo}:`, error);
    }

    // 添加附图（从第15列开始）
    const additionalImages = item.product.images?.filter(img => !img.isMain) || [];
    for (let j = 0; j < additionalImages.length; j++) {
      try {
        const imageBuffer = await getImageBuffer(additionalImages[j].url);
        const imageId = workbook.addImage({
          buffer: imageBuffer as any,
          extension: 'jpeg',
        });
        
        worksheet.addImage(imageId, {
          tl: { col: 15 + j, row: rowIndex - 1 } as any,
          br: { col: 16 + j, row: rowIndex } as any,
          editAs: 'oneCell'
        });
      } catch (error) {
        console.error(`Failed to add additional image ${j + 1} for product ${item.product.itemNo}:`, error);
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

  // 设置列宽
  worksheet.columns = [
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

  // 添加表头行
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 20;
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // 第一步：添加所有数据行
  quotation.items.forEach((item) => {
    const row = worksheet.addRow([
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
    ]);

    // 设置行高和样式
    row.height = 45;
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
    } catch (error) {
      console.error(`Failed to add image for product ${item.product.itemNo}:`, error);
    }
  }

  // 添加总计行
  const totalRow = worksheet.addRow([
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
  ]);

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
