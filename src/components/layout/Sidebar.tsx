import Link from 'next/link'
import { Home, Package, Users, FileText, BarChart2, PieChart } from 'lucide-react'

const menuItems = [
  { name: '首页', icon: Home, href: '/' },
  { name: '商品管理', icon: Package, href: '/products' },
  { name: '客户管理', icon: Users, href: '/customers' },
  { name: '报价管理', icon: FileText, href: '/quotations' },
  { name: '订单分析', icon: BarChart2, href: '/orders' },
  { name: '利润分析', icon: PieChart, href: '/profits' },
]

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-800 text-white min-h-screen p-4">
      <div className="text-xl font-bold mb-8 p-2">商业管理系统</div>
      <nav>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded-lg mb-1"
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
} 