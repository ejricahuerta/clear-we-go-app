-- Clear We Go — Auth: link auth.users to public.users (docs/03-security-and-auth.md)
-- Invite flow: app creates public.users (status=pending), then crew signs up → we set auth_user_id.
-- Direct signup (owner/admin): no row exists → trigger creates public.users with auth_user_id = auth.uid().

-- Link Supabase Auth to our users table (nullable until user signs in)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Helper: current user's public.users id for RLS (uses auth.uid() to find row)
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid()
$$;

-- On new auth signup: link existing pending user by email, or create new user (owner/admin).
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  linked integer;
BEGIN
  -- If we have a pending user (invite flow), link them
  UPDATE public.users
  SET auth_user_id = new.id, status = 'active'
  WHERE email = new.email AND auth_user_id IS NULL;

  GET DIAGNOSTICS linked = ROW_COUNT;

  -- Otherwise create new row (direct signup: owner or admin)
  IF linked = 0 THEN
    INSERT INTO public.users (id, name, email, role, status, auth_user_id)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.email,
      COALESCE(new.raw_user_meta_data->>'role', 'admin'),
      'active',
      new.id
    );
  END IF;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_auth_user();

-- First owner: after first Google sign-in, run in SQL (as that user or service role):
-- UPDATE public.users SET role = 'owner' WHERE auth_user_id = '<their_auth_uid>';
