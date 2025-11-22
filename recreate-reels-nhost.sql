-- Run this in Nhost Database → SQL Editor
-- This will completely recreate the reels table

-- Drop existing table
DROP TABLE IF EXISTS public.reels CASCADE;

-- Create new table
CREATE TABLE public.reels (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_url text NOT NULL,
    caption text,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Grant permissions
GRANT ALL ON public.reels TO postgres;
GRANT ALL ON public.reels TO PUBLIC;