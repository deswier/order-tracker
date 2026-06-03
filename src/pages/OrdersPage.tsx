import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '@/contexts/OrdersContext'
import { STATUS_LABELS } from '@/lib/statusMachine'
import OrderCard from '@/components/OrderCard'
import AddOrderSheet from '@/components/AddOrderSheet'
import { Input } from '@/components/ui/input'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { Order, OrderStatus } from '@/types'

type AccountFilter = 'all' | string

// Главные статусы — выбраны по умолчанию, идут первыми в списке
const MAIN_STATUSES: OrderStatus[] = [
  'NEW', 'AWAITING_RECEIPT', 'CANCEL_PENDING', 'RETURN_NEEDED', 'RETURN_PENDING',
]

const ALL_STATUS_OPTIONS: { key: OrderStatus; label: string }[] = [
  ...MAIN_STATUSES,
  'ORDERED', 'STALE', 'RECEIVED', 'RETURNED', 'CANCELLED',
].map(key => ({ key: key as OrderStatus, label: STATUS_LABELS[key as OrderStatus] }))

const DEFAULT_STATUS_FILTER = new Set<OrderStatus>(MAIN_STATUSES)

function isDefault(f: Set<OrderStatus> | null) {
  if (!f) return false
  if (f.size !== DEFAULT_STATUS_FILTER.size) return false
  return MAIN_STATUSES.every(s => f.has(s))
}

function applyFilters(
  orders: Order[],
  statusFilter: Set<OrderStatus> | null,
  account: AccountFilter,
  query: string,
): Order[] {
  let result = orders
  if (statusFilter !== null) result = result.filter(o => statusFilter.has(o.status))
  if (account !== 'all') result = result.filter(o => o.account === account)
  if (query) result = result.filter(o => o.title.toLowerCase().includes(query.toLowerCase()))
  return result
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const { orders, loading, refetch } = useOrders()

  // null = все статусы; по умолчанию — главные
  const [statusFilter, setStatusFilter] = useState<Set<OrderStatus> | null>(
    new Set(DEFAULT_STATUS_FILTER)
  )
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all')
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => { void refetch() }, [])

  const accounts = useMemo(() => {
    const set = new Set(orders.map(o => o.account).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [orders])

  const filtered = useMemo(
    () => applyFilters(orders, statusFilter, accountFilter, search),
    [orders, statusFilter, accountFilter, search]
  )

  const statusModified = !isDefault(statusFilter)
  const activeCount = (statusModified ? 1 : 0) + (accountFilter !== 'all' ? 1 : 0)

  function toggleStatus(status: OrderStatus) {
    setStatusFilter(prev => {
      const next = new Set(prev ?? ALL_STATUS_OPTIONS.map(o => o.key))
      if (next.has(status)) {
        next.delete(status)
        return next.size === 0 ? null : next
      } else {
        next.add(status)
        return next
      }
    })
  }

  function resetFilters() {
    setStatusFilter(new Set(DEFAULT_STATUS_FILTER))
    setAccountFilter('all')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search + Filter */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="pl-9"
          />
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          className={`relative flex items-center justify-center w-11 h-11 rounded-xl border-2 shrink-0 transition-colors ${
            activeCount > 0
              ? 'border-blue-500 bg-blue-50 text-blue-600'
              : 'border-gray-200 text-gray-500'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips — только при отклонении от дефолта */}
      {activeCount > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 flex-wrap">
          {statusModified && (
            <button
              onClick={() => setStatusFilter(new Set(DEFAULT_STATUS_FILTER))}
              className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium"
            >
              {statusFilter === null
                ? 'Все статусы'
                : `${statusFilter.size} статус${statusFilter.size === 1 ? '' : statusFilter.size < 5 ? 'а' : 'ов'}`}
              <X className="w-3 h-3" />
            </button>
          )}
          {accountFilter !== 'all' && (
            <button
              onClick={() => setAccountFilter('all')}
              className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium"
            >
              {accountFilter}
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-gray-400">Загрузка...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-5xl">🛍️</div>
            <div className="text-gray-500 text-center text-sm">
              {!statusModified && accountFilter === 'all' && !search
                ? 'Заказов пока нет.\nНажмите + чтобы добавить.'
                : 'Нет заказов с выбранными фильтрами.'}
            </div>
          </div>
        ) : (
          filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => navigate(`/orders/${order.id}`)}
            />
          ))
        )}
      </div>

      <AddOrderSheet />

      {/* Filter bottom sheet */}
      {filterOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setFilterOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div
              className="px-4 flex flex-col gap-5 overflow-y-auto"
              style={{ maxHeight: '70vh', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center justify-between pt-1">
                <h3 className="text-base font-semibold text-gray-900">Фильтры</h3>
                {activeCount > 0 && (
                  <button onClick={resetFilters} className="text-sm text-blue-600 font-medium">
                    Сбросить
                  </button>
                )}
              </div>

              {/* Статус — плоский список, главные первые */}
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Статус</p>
                <div className="flex flex-wrap gap-2">
                  {/* Все */}
                  <button
                    onClick={() => setStatusFilter(null)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Все
                  </button>
                  {ALL_STATUS_OPTIONS.map(({ key, label }) => {
                    const active = statusFilter?.has(key) ?? false
                    return (
                      <button
                        key={key}
                        onClick={() => toggleStatus(key)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Аккаунт */}
              {accounts.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Аккаунт</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setAccountFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        accountFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Все
                    </button>
                    {accounts.map(acc => (
                      <button
                        key={acc}
                        onClick={() => setAccountFilter(acc)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          accountFilter === acc ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {acc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setFilterOpen(false)}
                className="w-full py-3.5 bg-blue-600 active:bg-blue-700 text-white rounded-2xl font-semibold text-base transition-colors"
              >
                Применить
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
