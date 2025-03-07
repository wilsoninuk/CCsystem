import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 将日期转换为东八区（北京时间）的午夜时间
 * @param date 要转换的日期
 * @returns 转换后的日期对象
 */
export function convertToBeijingMidnight(date: Date): Date {
  // 创建一个新的日期对象，避免修改原始日期
  const beijingDate = new Date(date)
  
  // 设置为北京时间的午夜（00:00:00）
  beijingDate.setHours(0, 0, 0, 0)
  
  // 转换为UTC时间（减去8小时）
  beijingDate.setHours(beijingDate.getHours() + 8)
  
  return beijingDate
}

/**
 * 将UTC时间转换为北京时间
 * @param date UTC时间
 * @returns 北京时间
 */
export function utcToBeijing(date: Date): Date {
  const beijingDate = new Date(date)
  beijingDate.setHours(beijingDate.getHours() + 8)
  return beijingDate
}

/**
 * 将北京时间转换为UTC时间
 * @param date 北京时间
 * @returns UTC时间
 */
export function beijingToUTC(date: Date): Date {
  const utcDate = new Date(date)
  utcDate.setHours(utcDate.getHours() - 8)
  return utcDate
}
