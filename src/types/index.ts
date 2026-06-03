export type Role = 'ADMIN' | 'BUYER'

export type OrderStatus =
  | 'NEW'
  | 'ORDERED'
  | 'AWAITING_RECEIPT'
  | 'CANCEL_PENDING'
  | 'CANCELLED'
  | 'RECEIVED'
  | 'STALE'
  | 'RETURN_NEEDED'
  | 'RETURN_PENDING'
  | 'RETURNED'

export interface Profile {
  id: string
  role: Role
  display_name: string | null
  created_at: string
}

export interface Order {
  id: string
  title: string
  ozon_url: string | null
  image_url: string | null
  expected_price: number
  actual_price: number | null
  status: OrderStatus
  return_number: string | null
  account: string | null
  delivery_date: string | null
  size: string | null
  article: string | null
  is_settled: boolean
  created_by: string
  created_at: string
  updated_at: string | null
}
