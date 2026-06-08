-- ============================================================
-- Migration v7: история изменений заказа (order_history)
-- Запустить в Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  field_name  text not null,
  old_value   text null,
  new_value   text null,
  changed_by  uuid not null references auth.users(id),
  changed_at  timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS order_history_order_id_idx ON public.order_history (order_id, changed_at desc);

ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read order history" ON public.order_history;
CREATE POLICY "Authenticated users can read order history"
  ON public.order_history FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- Триггер: пишем по одной строке в order_history на каждое
-- изменившееся отслеживаемое поле заказа
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_order_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  fields text[] := ARRAY[
    'title', 'article', 'size', 'expected_price', 'actual_price',
    'status', 'account', 'delivery_date', 'return_number',
    'is_settled', 'image_url', 'ozon_url'
  ];
  f text;
  old_v text;
  new_v text;
BEGIN
  FOREACH f IN ARRAY fields LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', f, f) INTO old_v, new_v USING old, new;
    IF old_v IS DISTINCT FROM new_v THEN
      INSERT INTO public.order_history (order_id, field_name, old_value, new_value, changed_by)
      VALUES (new.id, f, old_v, new_v, auth.uid());
    END IF;
  END LOOP;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_order_updated ON public.orders;
CREATE TRIGGER on_order_updated
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.log_order_changes();
