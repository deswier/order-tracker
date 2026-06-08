-- ============================================================
-- Migration v6: email в profiles (для отображения, кто создал заказ)
-- Запустить в Supabase SQL Editor
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text NULL;

-- Заполняем email для уже существующих профилей
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Обновляем триггер, чтобы новые профили тоже получали email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, email)
  VALUES (
    new.id,
    'BUYER',
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
