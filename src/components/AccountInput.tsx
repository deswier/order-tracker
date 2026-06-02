import { useState, useMemo } from 'react'
import { useOrders } from '@/contexts/OrdersContext'
import { Input } from '@/components/ui/input'

interface Props {
  id?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export default function AccountInput({ id, value, onChange, placeholder = 'Имя аккаунта', className }: Props) {
  const { orders } = useOrders()
  const [open, setOpen] = useState(false)

  const allAccounts = useMemo(() => {
    const set = new Set(orders.map(o => o.account).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [orders])

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase()
    return q ? allAccounts.filter(a => a.toLowerCase().includes(q)) : allAccounts
  }, [allAccounts, value])

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map(acc => (
            <button
              key={acc}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(acc); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm text-gray-900 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50 last:border-0"
            >
              {acc}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
