-- Simple Nhost-compatible fix for Reel Comments
-- Just creates the table structure without RLS policies

CREATE TABLE IF NOT EXISTS public.reels_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reels_comments_reel_id ON public.reels_comments(reel_id);
CREATE INDEX IF NOT EXISTS idx_reels_comments_user_id ON public.reels_comments(user_id);

-- Add comments_count column to reels table if it doesn't exist
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Update existing reels with correct comment counts
UPDATE public.reels 
SET comments_count = (
  SELECT COUNT(*) 
  FROM public.reels_comments 
  WHERE reel_id = reels.id
);