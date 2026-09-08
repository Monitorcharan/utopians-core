-- ==============================================================================
-- Migration: Deduplicate profiles and enforce unique constraint on user ID
-- Description: Removes any duplicate rows in public.profiles keeping only the
--              most recently updated record per auth user, and ensures a unique
--              constraint / primary key on id.
-- ==============================================================================

BEGIN;

-- 1. Deduplicate public.profiles table:
-- If there are multiple profile rows with the same id, delete the older ones,
-- keeping only the latest record based on updated_at and created_at.
WITH ranked_profiles AS (
  SELECT ctid,
         ROW_NUMBER() OVER (
           PARTITION BY id
           ORDER BY updated_at DESC, created_at DESC
         ) as rn
  FROM public.profiles
)
DELETE FROM public.profiles
WHERE ctid IN (
  SELECT ctid FROM ranked_profiles WHERE rn > 1
);

-- 2. Ensure the profiles table has a primary key or unique constraint on id
DO $$
BEGIN
  -- Check if primary key or unique constraint on id exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND (contype = 'p' OR contype = 'u')
      AND conkey = ARRAY[(
        SELECT attnum
        FROM pg_attribute
        WHERE attrelid = 'public.profiles'::regclass
          AND attname = 'id'
      )]
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_unique UNIQUE (id);
  END IF;
END $$;

-- 3. Ensure updated_at has an index for fast lookups and deduplication checks
CREATE INDEX IF NOT EXISTS idx_profiles_id_updated_at ON public.profiles(id, updated_at DESC);

-- 4. Update handle_new_user() trigger to use ON CONFLICT (id) DO UPDATE
-- This prevents any race condition or duplicate insert from failing or creating anomalies.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_username TEXT;
BEGIN
  extracted_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::text FROM 1 FOR 6)
  );

  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    role,
    is_online,
    skills,
    updated_at
  )
  VALUES (
    NEW.id,
    extracted_username,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    false,
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'skills')),
      '{}'::TEXT[]
    ),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
