-- SQL to disable Row Level Security (RLS) on the scheduler_state table

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "scheduler_state_select_policy" ON "public"."scheduler_state";
DROP POLICY IF EXISTS "scheduler_state_insert_policy" ON "public"."scheduler_state";
DROP POLICY IF EXISTS "scheduler_state_update_policy" ON "public"."scheduler_state";
DROP POLICY IF EXISTS "scheduler_state_delete_policy" ON "public"."scheduler_state";

-- Disable RLS on the scheduler_state table
ALTER TABLE "public"."scheduler_state" DISABLE ROW LEVEL SECURITY;

-- Grant privileges to anon and service_role
GRANT ALL PRIVILEGES ON TABLE "public"."scheduler_state" TO "anon";
GRANT ALL PRIVILEGES ON TABLE "public"."scheduler_state" TO "service_role"; 