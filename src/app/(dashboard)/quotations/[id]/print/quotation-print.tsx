"use client"

import { useEffect } from "react"
import Image from "next/image"
import type { Quotation, QuotationItem, Product } from "@prisma/client"
import { formatDate } from "@/lib/utils"

interface QuotationPrintProps {
  quotation: Quotation & {
    items: (QuotationItem & {
      product: Pick<Product, 
        "itemNo" | "description" | "material" | "color" | "productSize"
      >
    })[]
  }
}

export function QuotationPrint({ quotation }: QuotationPrintProps) {
  useEffect(() => {
    // 自动打印
    window.print()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* 页眉 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Image 
            src="/logo.png" 
            alt="Company Logo" 
            width={200} 
            height={60} 
            className="print:grayscale"
          />
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold">报价单</h1>
          <p className="text-sm text-gray-500">编号: {quotation.number}</p>
          <p className="text-sm text-gray-500">日期: {formatDate(quotation.createdAt)}</p>
        </div>
      </div>

      {/* 客户信息 */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">客户信息</h2>
          <div className="space-y-1">
            <p>客户名称: {quotation.customerName}</p>
            <p>PI地址: {quotation.piAddress}</p>
            <p>发货人: {quotation.piShipper}</p>
            <p>付款方式: {quotation.paymentMethod}</p>
            <p>船运方式: {quotation.shippingMethod}</p>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">报价信息</h2>
          <div className="space-y-1">
            <p>汇率: {quotation.exchangeRate}</p>
            <p>总金额(RMB): ¥{quotation.totalAmountRMB.toFixed(2)}</p>
            <p>总金额(USD): ${quotation.totalAmountUSD.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left">序号</th>
            <th className="py-2 text-left">商品编号</th>
            <th className="py-2 text-left">描述</th>
            <th className="py-2 text-right">数量</th>
            <th className="py-2 text-right">单价(USD)</th>
            <th className="py-2 text-right">总价(USD)</th>
          </tr>
        </thead>
        <tbody>
          {quotation.items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">{item.serialNo}</td>
              <td className="py-2">{item.product.itemNo}</td>
              <td className="py-2">
                <div>{item.product.description}</div>
                <div className="text-sm text-gray-500">
                  {item.product.material} | {item.product.color} | {item.product.productSize}
                </div>
              </td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">${item.exwPriceUSD.toFixed(2)}</td>
              <td className="py-2 text-right">${(item.exwPriceUSD * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className="py-2 text-right font-bold">总计:</td>
            <td className="py-2 text-right font-bold">${quotation.totalAmountUSD.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {/* 页脚 */}
      <div className="text-sm text-gray-500">
        <p>备注:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>有效期: 7天</li>
          <li>付款方式: {quotation.paymentMethod}</li>
          <li>船运方式: {quotation.shippingMethod}</li>
          <li>交货期: 确认订单后30天</li>
        </ol>
      </div>
    </div>
  )
} 