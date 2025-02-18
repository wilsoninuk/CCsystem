"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Home, 
  Package, 
  Settings,
  BarChart3
} from "lucide-react"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  const items = [
    {
      title: "首页",
      href: "/",
      icon: <Home className="w-4 h-4" />,
    },
    {
      title: "商品",
      href: "/products",
      icon: <Package className="w-4 h-4" />,
    },
    {
      title: "统计",
      href: "/stats",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      title: "设置",
      href: "/settings",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      title: "客户",
      href: "/customers",
      icon: <Home className="w-4 h-4" />,
    },
    {
      title: "报价",
      href: "/quotations",
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ]

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {item.icon}
          <span className="ml-2">{item.title}</span>
        </Link>
      ))}
    </nav>
  )
} 