import type { OrderStatus } from '@/types'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Новый',
  ORDERED: 'Заказано',
  AWAITING_RECEIPT: 'Ожидает получения',
  CANCEL_PENDING: 'Ожидает отмены',
  CANCELLED: 'Отменено',
  RECEIVED: 'Получено',
  STALE: 'Устарел',
  RETURN_NEEDED: 'Нужен возврат',
  RETURN_PENDING: 'Ожидает возврата',
  RETURNED: 'Возвращено',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: 'bg-gray-100 text-gray-600',
  ORDERED: 'bg-blue-100 text-blue-700',
  AWAITING_RECEIPT: 'bg-teal-100 text-teal-700',
  CANCEL_PENDING: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-600',
  RECEIVED: 'bg-green-100 text-green-700',
  STALE: 'bg-rose-100 text-rose-600',
  RETURN_NEEDED: 'bg-yellow-100 text-yellow-700',
  RETURN_PENDING: 'bg-amber-100 text-amber-700',
  RETURNED: 'bg-purple-100 text-purple-700',
}

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['ORDERED', 'CANCEL_PENDING'],
  ORDERED: [],
  AWAITING_RECEIPT: ['RECEIVED', 'CANCEL_PENDING'],
  CANCEL_PENDING: ['CANCELLED'],
  CANCELLED: [],
  RECEIVED: ['RETURN_NEEDED'],
  STALE: ['RETURN_NEEDED'],
  RETURN_NEEDED: ['RETURN_PENDING'],
  RETURN_PENDING: ['RETURNED'],
  RETURNED: [],
}

type TransitionKey = `${OrderStatus}_${OrderStatus}`

export const TRANSITION_LABELS: Partial<Record<TransitionKey, string>> = {
  NEW_ORDERED: 'Заказано',
  NEW_CANCEL_PENDING: 'Отменить',
  ORDERED_RECEIVED: 'Получено',
  ORDERED_RETURNED: 'Вернуть',
  ORDERED_CANCEL_PENDING: 'Отменить',
  AWAITING_RECEIPT_RECEIVED: 'Получено',
  AWAITING_RECEIPT_CANCEL_PENDING: 'Отменить',
  CANCEL_PENDING_CANCELLED: 'Отменено',
  RECEIVED_RETURN_NEEDED: 'Нужен возврат',
  STALE_RETURN_NEEDED: 'Нужен возврат',
  RETURN_NEEDED_RETURN_PENDING: 'Возврат оформлен',
  RETURN_PENDING_RETURNED: 'Возврат получен',
}

export const TRANSITION_VARIANTS: Partial<Record<TransitionKey, 'default' | 'destructive' | 'outline' | 'secondary'>> = {
  NEW_ORDERED: 'default',
  NEW_CANCEL_PENDING: 'outline',
  ORDERED_RECEIVED: 'default',
  ORDERED_RETURNED: 'outline',
  ORDERED_CANCEL_PENDING: 'outline',
  AWAITING_RECEIPT_RECEIVED: 'default',
  AWAITING_RECEIPT_CANCEL_PENDING: 'outline',
  CANCEL_PENDING_CANCELLED: 'destructive',
  RECEIVED_RETURN_NEEDED: 'outline',
  STALE_RETURN_NEEDED: 'outline',
  RETURN_NEEDED_RETURN_PENDING: 'default',
  RETURN_PENDING_RETURNED: 'default',
}

/** Статусы, при которых мама уже потратила деньги */
export const SPENT_STATUSES: OrderStatus[] = ['RECEIVED', 'RETURN_NEEDED', 'RETURN_PENDING']

/** Статусы, при которых деньги вернулись маме */
export const RETURNED_STATUSES: OrderStatus[] = ['RETURNED']
