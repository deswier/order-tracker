import type { Order } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import { formatPrice } from '@/lib/utils'
import { ExternalLink, CalendarDays, User } from 'lucide-react'

interface OrderCardProps {
  order: Order
  onClick: () => void
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
            <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2 flex-1">
              {order.title}
            </h3>
            <div className="flex-shrink-0">
              <StatusBadge status={order.status} />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 flex-wrap">
            {order.actual_price != null ? (
              <span className="text-sm font-semibold text-blue-600">{formatPrice(order.actual_price)}</span>
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
        </div>
      </div>
    </div>
  )
}
