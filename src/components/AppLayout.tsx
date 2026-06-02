import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { ShoppingBag, LogOut } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Заказы',
  '/balance': 'Баланс',
}

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Family Orders'

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      {/* Top header */}
      <header
        className="bg-white border-b border-gray-100 px-4 flex items-center justify-between h-14 flex-shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3.5rem + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-900 text-lg">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <span className="text-sm text-gray-500">
              {profile.display_name ?? (profile.role === 'ADMIN' ? 'Дочь' : 'Мама')}
            </span>
          )}
          <button
            onClick={signOut}
            className="p-2 rounded-full active:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Выйти"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
