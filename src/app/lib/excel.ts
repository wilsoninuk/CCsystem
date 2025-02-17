const imageArrayBuffer = await imageResponse.arrayBuffer()
const imageId = workbook.addImage({
  buffer: imageArrayBuffer as unknown as Buffer,
  extension: 'jpeg',
})

worksheet.addImage(imageId, {
  tl: { col: 3, row: rowNumber - 1 } as any, // ExcelJS 类型定义不完整，暂时使用 any
  br: { col: 4, row: rowNumber } as any,
  editAs: 'oneCell'
})

interface Duplicate {
  product: Partial<Product>
  existingProduct: Product
  reason: 'itemNo' | 'barcode'
}

result.success = result.success.filter(product => 
  !duplicates.some((d: Duplicate) => d.product.itemNo === product.itemNo)
) 