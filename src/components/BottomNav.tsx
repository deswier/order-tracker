import { NavLink } from 'react-router-dom'
import { ShoppingBag, Wallet } from 'lucide-react'

const TABS = [
  { to: '/', label: 'Заказы', Icon: ShoppingBag },
  { to: '/balance', label: 'Баланс', Icon: Wallet },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              isActive ? 'text-blue-600' : 'text-gray-400 active:text-gray-600'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
