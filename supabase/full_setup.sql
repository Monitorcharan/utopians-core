-- Deprecated: this alternate setup previously diverged from the migrations.
-- Apply supabase/migrations/*.sql in filename order for a new project.
-- For an existing project, apply only migrations that have not been applied yet.
DO $$ BEGIN
  RAISE EXCEPTION 'Use the versioned files in supabase/migrations; full_setup.sql is retired.';
END $$;
