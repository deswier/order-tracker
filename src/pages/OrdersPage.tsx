import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '@/contexts/OrdersContext'
import { STATUS_LABELS } from '@/lib/statusMachine'
import OrderCard from '@/components/OrderCard'
import AddOrderSheet from '@/components/AddOrderSheet'
import { Input } from '@/components/ui/input'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { STATUS_COLORS } from '@/lib/statusMachine'
import type { Order, OrderStatus } from '@/types'

type StatusFilter = 'all' | OrderStatus
type AccountFilter = 'all' | string

const MAIN_STATUS_OPTIONS: { key: OrderStatus; label: string }[] = [
  { key: 'NEW',              label: STATUS_LABELS.NEW },
  { key: 'ORDERED',          label: STATUS_LABELS.ORDERED },
  { key: 'AWAITING_RECEIPT', label: STATUS_LABELS.AWAITING_RECEIPT },
  { key: 'CANCEL_PENDING',   label: STATUS_LABELS.CANCEL_PENDING },
  { key: 'RETURN_NEEDED',    label: STATUS_LABELS.RETURN_NEEDED },
  { key: 'RETURN_PENDING',   label: STATUS_LABELS.RETURN_PENDING },
  { key: 'STALE',            label: STATUS_LABELS.STALE },
]

const OTHER_STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'all',        label: 'Все' },
  { key: 'RECEIVED',  label: STATUS_LABELS.RECEIVED },
  { key: 'RETURNED',  label: STATUS_LABELS.RETURNED },
  { key: 'CANCELLED', label: STATUS_LABELS.CANCELLED },
]

function applyFilters(orders: Order[], status: StatusFilter, account: AccountFilter, query: string): Order[] {
  let result = orders
  if (status !== 'all') result = result.filter(o => o.status === status)
  if (account !== 'all') result = result.filter(o => o.account === account)
  if (query) result = result.filter(o => o.title.toLowerCase().includes(query.toLowerCase()))
  return result
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const { orders, loading } = useOrders()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all')
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  const accounts = useMemo(() => {
    const set = new Set(orders.map(o => o.account).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [orders])

  const filtered = useMemo(
    () => applyFilters(orders, statusFilter, accountFilter, search),
    [orders, statusFilter, accountFilter, search]
  )

  const activeCount = (statusFilter !== 'all' ? 1 : 0) + (accountFilter !== 'all' ? 1 : 0)

  function resetFilters() {
    setStatusFilter('all')
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

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 flex-wrap">
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium"
            >
              {STATUS_LABELS[statusFilter as OrderStatus]}
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
              {statusFilter === 'all' && accountFilter === 'all' && !search
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
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setFilterOpen(false)}
          />
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

              {/* Status */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Статус</p>

                {/* Главные фильтры */}
                <div className="grid grid-cols-2 gap-2">
                  {MAIN_STATUS_OPTIONS.map(f => {
                    const active = statusFilter === f.key
                    return (
                      <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors border-2 ${
                          active
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : `border-transparent ${STATUS_COLORS[f.key]}`
                        }`}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>

                {/* Остальные — пилюли */}
                <div className="flex flex-wrap gap-2">
                  {OTHER_STATUS_OPTIONS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        statusFilter === f.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account */}
              {accounts.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Аккаунт</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setAccountFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        accountFilter === 'all'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Все
                    </button>
                    {accounts.map(acc => (
                      <button
                        key={acc}
                        onClick={() => setAccountFilter(acc)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          accountFilter === acc
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-100 text-gray-600'
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
