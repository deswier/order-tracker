-- ============================================================
-- Migration v4: поле size (размер товара)
-- Запустить в Supabase SQL Editor
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS size text NULL;
