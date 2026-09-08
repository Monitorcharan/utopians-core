-- ==============================================================================
-- Database Reset Script
-- Description: Completely wipes all existing profiles, sessions, and reviews.
--              Can be run in Supabase SQL Editor to start completely fresh.
-- ==============================================================================

BEGIN;

-- 1. Truncate application tables
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.sessions CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 2. Optional: Remove all auth users (if running with superuser / postgres privileges)
-- DELETE FROM auth.users;

COMMIT;
