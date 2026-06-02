-- ============================================================
-- Migration v3: новые статусы STALE и AWAITING_RECEIPT
-- Запустить в Supabase SQL Editor
-- ============================================================

-- Снимаем старый check constraint и добавляем новый с расширенным списком
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
    CHECK (status IN (
      'NEW',
      'ORDERED',
      'AWAITING_RECEIPT',
      'CANCEL_PENDING',
      'CANCELLED',
      'RECEIVED',
      'STALE',
      'RETURN_NEEDED',
      'RETURN_PENDING',
      'RETURNED'
    ));
