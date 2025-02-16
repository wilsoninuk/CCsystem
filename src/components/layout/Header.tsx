import { Bell, Settings, User } from 'lucide-react'

export default function Header() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="text-lg font-semibold">
        欢迎使用商业管理系统
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100 rounded-full">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-full">
          <Settings className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-full">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
} 