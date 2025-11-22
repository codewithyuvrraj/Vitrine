-- Create reels table for Instagram clone
CREATE TABLE IF NOT EXISTS public.reels (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_url text NOT NULL,
    caption text,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_public_reels_updated_at
    BEFORE UPDATE ON public.reels
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_current_timestamp_updated_at();