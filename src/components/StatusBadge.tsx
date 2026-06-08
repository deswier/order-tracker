import { STATUS_LABELS, STATUS_COLORS } from '@/lib/statusMachine'
import { getPickupDeadline, daysUntil, formatPickupCountdown } from '@/lib/utils'
import type { OrderStatus } from '@/types'

interface StatusBadgeProps {
  status: OrderStatus
  deliveryDate?: string | null
}

export default function StatusBadge({ status, deliveryDate }: StatusBadgeProps) {
  const showDeadline = status === 'AWAITING_RECEIPT' && !!deliveryDate
  const deadline = showDeadline ? getPickupDeadline(deliveryDate!) : null
  const daysLeft = deadline ? daysUntil(deadline) : null
  const urgent = daysLeft !== null && daysLeft < 3

  return (
    <div className="inline-flex flex-col items-end gap-0.5">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]} ${urgent ? 'ring-2 ring-red-500' : ''}`}
      >
        {STATUS_LABELS[status]}
      </span>
      {daysLeft !== null && (
        <span className={`text-[11px] ${urgent ? 'font-semibold text-red-600' : 'text-gray-400'}`}>
          {formatPickupCountdown(daysLeft)}
        </span>
      )}
    </div>
  )
}
