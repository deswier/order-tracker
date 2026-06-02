-- ============================================================
-- Migration v2: новые статусы, аккаунт, дата доставки, номер возврата
-- Запустить в Supabase SQL Editor
-- ============================================================

-- 1. Добавляем новые колонки
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW','ORDERED','CANCEL_PENDING','CANCELLED','RECEIVED','RETURN_NEEDED','RETURN_PENDING','RETURNED')),
  ADD COLUMN IF NOT EXISTS return_number text NULL,
  ADD COLUMN IF NOT EXISTS account text NULL,
  ADD COLUMN IF NOT EXISTS delivery_date date NULL;

-- 2. Мигрируем старые булевы поля в status
UPDATE public.orders SET status = 'RETURNED'  WHERE return_flag = true  AND status = 'NEW';
UPDATE public.orders SET status = 'RECEIVED'  WHERE purchased = true    AND return_flag = false AND status = 'NEW';

-- 3. Удаляем старые поля
ALTER TABLE public.orders
  DROP COLUMN IF EXISTS purchased,
  DROP COLUMN IF EXISTS return_flag;

-- ============================================================
-- Supabase Storage — выполни вручную в Dashboard:
-- Storage → New bucket → "order-images" → Public bucket → Save
-- Storage → order-images → Policies → Add policy:
--   Name: "Authenticated upload"
--   Allowed operation: INSERT, SELECT, UPDATE, DELETE
--   Target roles: authenticated
-- ============================================================
