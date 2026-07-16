-- Add counsellor role to app_role enum (must commit before use)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'counsellor';