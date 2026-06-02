import { useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders, computeBalance } from '@/contexts/OrdersContext'
import StatusBadge from '@/components/StatusBadge'
import { formatPrice } from '@/lib/utils'
import type { Order } from '@/types'

type TxType = 'purchase' | 'return' | 'settled'

interface TxLine {
  key: string
  type: TxType
  amount: number
  date: string
}

interface TxGroup {
  orderId: string
  title: string
  lines: TxLine[]
  latestDate: string
}

function buildHistory(orders: Order[]): TxGroup[] {
  const groups: TxGroup[] = []
  for (const o of orders) {
    const amount = o.actual_price ?? 0
    const date = o.updated_at ?? o.created_at
    const lines: TxLine[] = []
    if (['RECEIVED', 'STALE', 'RETURN_NEEDED', 'RETURN_PENDING', 'RETURNED'].includes(o.status)) {
      lines.push({ key: o.id + '_p', type: 'purchase', amount, date })
    }
    if (o.status === 'RETURNED') {
      lines.push({ key: o.id + '_r', type: 'return', amount, date })
    }
    if (o.is_settled) {
      lines.push({ key: o.id + '_s', type: 'settled', amount, date })
    }
    if (lines.length > 0) {
      groups.push({ orderId: o.id, title: o.title, lines, latestDate: date })
    }
  }
  return groups.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const TX_CONFIG: Record<TxType, { label: string; sign: string; color: string; bg: string }> = {
  purchase: { label: 'Куплено',          sign: '+', color: 'text-blue-600',   bg: 'bg-blue-50 text-blue-700' },
  return:   { label: 'Возврат',          sign: '−', color: 'text-orange-500', bg: 'bg-orange-50 text-orange-700' },
  settled:  { label: 'Оплачено дочерью', sign: '−', color: 'text-green-600',  bg: 'bg-green-50 text-green-700' },
}

export default function BalancePage() {
  const navigate = useNavigate()
  const { orders, loading, refetch } = useOrders()
  const { purchased, returned, settled, balance } = computeBalance(orders)

  useEffect(() => { void refetch() }, [])
  const history = useMemo(() => buildHistory(orders), [orders])

  const openOrders = useMemo(
    () => orders.filter(o =>
      ['RECEIVED', 'STALE', 'RETURN_NEEDED', 'RETURN_PENDING'].includes(o.status) && !o.is_settled
    ),
    [orders]
  )

  const isPositive = balance > 0
  const isNegative = balance < 0
  const isZero = balance === 0

  const activeCount = orders.filter(o => ['NEW', 'ORDERED'].includes(o.status)).length
  const receivedCount = orders.filter(o => ['RECEIVED', 'RETURN_NEEDED', 'RETURN_PENDING'].includes(o.status)).length
  const returnedCount = orders.filter(o => o.status === 'RETURNED').length
  const cancelledCount = orders.filter(o => ['CANCEL_PENDING', 'CANCELLED'].includes(o.status)).length

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-5 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400">Загрузка...</div>
        </div>
      ) : (
        <>
          {/* Главная карточка баланса */}
          <div className={`rounded-3xl p-6 flex flex-col items-center gap-3 shadow-md ${
            isZero ? 'bg-green-500' : isPositive ? 'bg-blue-600' : 'bg-orange-500'
          }`}>
            <div className="text-white/80 text-base font-medium">Текущий долг</div>
            <div className="text-5xl font-bold text-white tracking-tight">
              {formatPrice(Math.abs(balance))}
            </div>
            <div className="text-white text-lg font-semibold text-center">
              {isZero && '✅ Всё погашено'}
              {isPositive && '📦 Дочь должна маме'}
              {isNegative && '💸 Мама должна дочери'}
            </div>
          </div>

          {/* Детализация */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <div className="font-medium text-gray-900">Куплено мамой</div>
                <div className="text-sm text-gray-500">Получено / Ожидает возврата</div>
              </div>
              <div className="text-lg font-semibold text-gray-800">{formatPrice(purchased)}</div>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <div className="font-medium text-gray-900">Возвращено</div>
                <div className="text-sm text-gray-500">Деньги вернулись на счёт Ozon</div>
              </div>
              <div className="text-lg font-semibold text-orange-500">− {formatPrice(returned)}</div>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <div className="font-medium text-gray-900">Дочь оплатила</div>
                <div className="text-sm text-gray-500">Переведено маме</div>
              </div>
              <div className="text-lg font-semibold text-green-600">− {formatPrice(settled)}</div>
            </div>
            <div className="flex items-center justify-between px-4 py-5 bg-gray-50 rounded-b-2xl">
              <div className="font-bold text-gray-900 text-base">Итого долг</div>
              <div className={`text-xl font-bold ${isZero ? 'text-green-600' : isPositive ? 'text-blue-600' : 'text-orange-500'}`}>
                {formatPrice(Math.abs(balance))}
              </div>
            </div>
          </div>

          {/* Незакрытые сделки */}
          {openOrders.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
                Долг не погашен ({openOrders.length})
              </h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                {openOrders.map(o => (
                  <div
                    key={o.id}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 cursor-pointer"
                  >
                    {o.image_url && (
                      <img
                        src={o.image_url}
                        alt={o.title}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{o.title}</p>
                      {o.account && (
                        <p className="text-xs text-gray-400 mt-0.5">{o.account}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-semibold text-blue-600">
                        {formatPrice(o.actual_price ?? 0)}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Статистика по статусам */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
              <div className="text-sm text-gray-500 mt-0.5">Новых / Заказано</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="text-2xl font-bold text-green-600">{receivedCount}</div>
              <div className="text-sm text-gray-500 mt-0.5">Получено</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="text-2xl font-bold text-purple-600">{returnedCount}</div>
              <div className="text-sm text-gray-500 mt-0.5">Возвращено</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="text-2xl font-bold text-red-400">{cancelledCount}</div>
              <div className="text-sm text-gray-500 mt-0.5">Отменено</div>
            </div>
          </div>

          {/* История движения средств */}
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
              История движения средств
            </h2>
            {history.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-8 text-center text-gray-400 text-sm">
                Нет финансовых операций
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map(group => (
                  <div
                    key={group.orderId}
                    onClick={() => navigate(`/orders/${group.orderId}`)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:bg-gray-50 cursor-pointer"
                  >
                    {/* Заголовок товара */}
                    <div className="px-4 pt-3 pb-2 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-900 truncate">{group.title}</p>
                    </div>
                    {/* Строки движения */}
                    {group.lines.map(line => {
                      const cfg = TX_CONFIG[line.type]
                      return (
                        <div key={line.key} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg}`}>
                              {cfg.label}
                            </span>
                            <p className="text-xs text-gray-400 mt-1">{formatDateTime(line.date)}</p>
                          </div>
                          <span className={`text-sm font-bold ${cfg.color}`}>
                            {cfg.sign}{formatPrice(line.amount)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
