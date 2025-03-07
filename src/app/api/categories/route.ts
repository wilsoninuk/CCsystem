import { prisma } from "@/lib/db"; // 确保引入 prisma
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await prisma.product.findMany({
      select: {
        category: true,
      },
      distinct: ['category'], // 确保类别不重复
    });

    const uniqueCategories = categories.map(cat => cat.category).filter(Boolean); // 过滤掉 null
    uniqueCategories.unshift('无类别'); // 添加"无类别"选项
    return NextResponse.json(uniqueCategories);
  } catch (error) {
    console.error('获取类别失败:', error);
    return NextResponse.json({ error: '获取类别失败' }, { status: 500 });
  }
} 