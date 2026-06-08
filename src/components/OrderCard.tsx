import type { Order } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import ArticleChip from '@/components/ArticleChip'
import { formatPrice } from '@/lib/utils'
import { ExternalLink, CalendarDays, User, ArrowUp, ArrowDown, Ruler, Minus } from 'lucide-react'

interface OrderCardProps {
  order: Order
  onClick: () => void
}

function PriceDiff({ expected, actual }: { expected: number; actual: number }) {
  const diff = expected / 2 - actual
  if (diff === 0) return <Minus className="w-3 h-3 text-gray-400" />
  const cheaper = diff > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${cheaper ? 'text-green-600' : 'text-yellow-500'}`}>
      {cheaper ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
      {formatPrice(Math.abs(diff))}
    </span>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex gap-3">
        {order.image_url && (
          <img
            src={order.image_url}
            alt={order.title}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">
                {order.title}
              </h3>
              {order.size && (
                <span className="inline-flex items-center gap-1 mt-1 bg-violet-100 text-violet-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  <Ruler className="w-3 h-3" />
                  {order.size}
                </span>
              )}
            </div>
            <div className="flex-shrink-0">
              <StatusBadge status={order.status} deliveryDate={order.delivery_date} />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 flex-wrap">
            {order.actual_price != null ? (
              <>
                <span className="text-sm font-semibold text-blue-600">{formatPrice(order.actual_price)}</span>
                <PriceDiff expected={order.expected_price} actual={order.actual_price} />
              </>
            ) : (
              <div>
                <span className="text-sm text-gray-500">~</span>
                <span className="text-sm font-medium text-gray-500">{formatPrice(order.expected_price)}</span>
              </div>
            )}
            {order.account && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                <User className="w-3 h-3" />
                {order.account}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-3 flex-wrap">
            {order.delivery_date && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <CalendarDays className="w-3 h-3" />
                {formatDate(order.delivery_date)}
              </span>
            )}
          </div>

          {(order.article || order.ozon_url) && (
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              {order.article && <ArticleChip article={order.article} />}
              {order.ozon_url && (
                <a
                  href={order.ozon_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-600"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  Ozon
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
