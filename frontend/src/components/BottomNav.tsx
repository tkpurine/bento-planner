import { BookOpen, ShoppingCart } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
      <div className="max-w-lg mx-auto flex">
        {[
          { to: '/', icon: BookOpen, label: 'レシピ' },
          { to: '/planner', icon: ShoppingCart, label: '献立・買い物' },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs transition-colors ${
                isActive ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
