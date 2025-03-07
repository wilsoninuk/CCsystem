export const QUOTATION_COLUMNS = [
  { key: "picture", label: "图片", required: true },
  { key: "itemNo", label: "商品编号", required: true },
  { key: "barcode", label: "条形码", required: false },
  { key: "description", label: "描述", required: true },
  { key: "supplier", label: "供应商", required: false },
  { key: "cost", label: "成本价(RMB)", required: true },
  { key: "shipping", label: "运费(RMB)", required: false },
  { key: "quantity", label: "数量", required: true },
  { key: "priceRMB", label: "单价(RMB)", required: true },
  { key: "historyPriceRMB", label: "历史报价(RMB)", required: true },
  { key: "priceUSD", label: "单价(USD)", required: true },
  { key: "totalRMB", label: "总价(RMB)", required: false },
  { key: "totalUSD", label: "总价(USD)", required: false },
  { key: "profit", label: "利润(RMB)", required: false },
  { key: "remark", label: "备注", required: false }
] as const 

export type QuotationColumnKey = typeof QUOTATION_COLUMNS[number]["key"] 