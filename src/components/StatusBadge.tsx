import { STATUS_LABELS, STATUS_COLORS } from '@/lib/statusMachine'
import type { OrderStatus } from '@/types'

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
