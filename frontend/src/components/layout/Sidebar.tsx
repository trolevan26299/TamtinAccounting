import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { FileText, LogOut, ChevronRight, PanelLeftClose, PanelLeft, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

export default function Sidebar() {
  const { sysUser, logout } = useAuth()

  const navItems = [
    { label: 'Tra cứu hóa đơn', href: '/dashboard', icon: FileText, end: true, adminOnly: false },
    ...(sysUser?.role === 'admin'
      ? [{ label: 'Quản lý người dùng', href: '/dashboard/users', icon: Users, end: true, adminOnly: true }]
      : []
    ),
  ]
  
  // Initialize from localStorage if available
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed.toString())
  }, [collapsed])

  return (
    <aside className={cn("relative shrink-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border sticky top-0 transition-all duration-300", collapsed ? "w-[72px]" : "w-64")}>
      
      {/* Toggle Button */}
      <button 
        onClick={() => setCollapsed(!collapsed)} 
        className="absolute -right-3 top-6 w-6 h-6 bg-sidebar hover:bg-accent border border-sidebar-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm z-50 transition-colors"
      >
        {collapsed ? <PanelLeft className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
      </button>

      {/* Logo */}
      <div className={cn("px-4 py-5 flex items-center justify-between", collapsed && "justify-center px-2")}>
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="/logo.png"
            alt="TT Kế Toán"
            className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-md"
          />
          {!collapsed && (
            <div className="animate-fade-in whitespace-nowrap">
              <div className="font-bold text-sm text-foreground">TT Kế Toán</div>
              <div className="text-[10px] text-muted-foreground">Hóa đơn điện tử</div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap animate-fade-in">
            Menu
          </p>
        )}
        {navItems.map(({ label, href, icon: Icon, end }) => (
          <NavLink
            key={href}
            to={href}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'group flex items-center rounded-lg py-2.5 text-sm font-medium transition-all',
                collapsed ? 'justify-center px-0' : 'px-3 gap-3',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 whitespace-nowrap animate-fade-in">{label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* User footer */}
      <div className={cn("py-4 flex items-center gap-3 transition-all", collapsed ? "px-2 justify-center flex-col gap-3" : "px-3")}>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0" title={collapsed ? (sysUser?.fullName || 'Admin') : undefined}>
          {sysUser?.fullName?.[0]?.toUpperCase() || 'T'}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 animate-fade-in">
            <div className="text-sm font-medium text-foreground truncate">{sysUser?.fullName || 'Admin'}</div>
            <div className="text-xs text-muted-foreground truncate">{sysUser?.username}</div>
          </div>
        )}
        <button
          onClick={logout}
          title="Đăng xuất"
          className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
