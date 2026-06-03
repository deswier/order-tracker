-- ============================================================
-- Migration v5: поле article (артикул товара)
-- Запустить в Supabase SQL Editor
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS article text NULL;
