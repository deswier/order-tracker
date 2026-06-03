import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/types'

interface OrdersContextValue {
  orders: Order[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createOrder: (data: {
    title: string
    article?: string
    expected_price: number
    ozon_url?: string
    image_url?: string
    account?: string
    delivery_date?: string
    size?: string
    created_by: string
  }) => Promise<string>
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
}

const OrdersContext = createContext<OrdersContextValue | null>(null)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { setError(error.message); setLoading(false); return }

    const orders = data ?? []
    setOrders(orders)
    setLoading(false)

    const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000
    const ONE_DAY = 24 * 60 * 60 * 1000
    const now = Date.now()

    // Авто-переход RECEIVED → STALE после 15 суток
    const staleIds = orders
      .filter(o => o.status === 'RECEIVED' && now - new Date(o.updated_at ?? o.created_at).getTime() > FIFTEEN_DAYS)
      .map(o => o.id)
    if (staleIds.length > 0) {
      await supabase
        .from('orders')
        .update({ status: 'STALE', updated_at: new Date().toISOString() })
        .in('id', staleIds)
    }

    // Авто-переход ORDERED → AWAITING_RECEIPT когда delivery_date + 1 день прошёл
    const awaitingIds = orders
      .filter(o =>
        o.status === 'ORDERED' &&
        o.delivery_date &&
        new Date(o.delivery_date).getTime() + ONE_DAY < now
      )
      .map(o => o.id)
    if (awaitingIds.length > 0) {
      await supabase
        .from('orders')
        .update({ status: 'AWAITING_RECEIPT', updated_at: new Date().toISOString() })
        .in('id', awaitingIds)
    }
  }, [])

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [fetchOrders])

  async function createOrder(data: {
    title: string
    article?: string
    expected_price: number
    ozon_url?: string
    image_url?: string
    account?: string
    delivery_date?: string
    size?: string
    created_by: string
  }): Promise<string> {
    const { data: created, error } = await supabase.from('orders').insert([data]).select('id').single()
    if (error) throw error
    return created.id
  }

  async function updateOrder(id: string, updates: Partial<Order>) {
    const { error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  async function deleteOrder(id: string) {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) throw error
  }

  return (
    <OrdersContext.Provider value={{ orders, loading, error, refetch: fetchOrders, createOrder, updateOrder, deleteOrder }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider')
  return ctx
}

export function computeBalance(orders: Order[]) {
  const SPENT = ['RECEIVED', 'STALE', 'RETURN_NEEDED', 'RETURN_PENDING', 'RETURNED']
  const RETURNED = ['RETURNED']

  const purchased = orders
    .filter(o => SPENT.includes(o.status))
    .reduce((sum, o) => sum + (o.actual_price ?? 0), 0)

  const returned = orders
    .filter(o => RETURNED.includes(o.status))
    .reduce((sum, o) => sum + (o.actual_price ?? 0), 0)

  const settled = orders
    .filter(o => o.is_settled)
    .reduce((sum, o) => sum + (o.actual_price ?? 0), 0)

  return { purchased, returned, settled, balance: purchased - returned - settled }
}
