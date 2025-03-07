import { prisma } from "@/lib/db"; // 确保引入 prisma
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const suppliers = await prisma.product.findMany({
      select: {
        supplier: true,
      },
      distinct: ['supplier'], // 确保供应商不重复
    });

    const uniqueSuppliers = suppliers.map(sup => sup.supplier).filter(Boolean); // 过滤掉 null
    uniqueSuppliers.unshift('无供应商'); // 添加"无供应商"选项
    return NextResponse.json(uniqueSuppliers);
  } catch (error) {
    console.error('获取供应商失败:', error);
    return NextResponse.json({ error: '获取供应商失败' }, { status: 500 });
  }
} 