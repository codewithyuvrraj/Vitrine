-- Fix for Reel Comments System
-- This creates a unified comment system that works for both posts and reels

-- First, let's create a proper reels_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reels_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: RLS policies removed for Nhost compatibility
-- Handle permissions through your application layer instead

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reels_comments_reel_id ON public.reels_comments(reel_id);
CREATE INDEX IF NOT EXISTS idx_reels_comments_user_id ON public.reels_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_comments_created_at ON public.reels_comments(created_at DESC);

-- Create notification function for reel comments
CREATE OR REPLACE FUNCTION create_reel_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't create notification if user comments on their own reel
  IF NEW.user_id != (SELECT user_id FROM reels WHERE id = NEW.reel_id) THEN
    INSERT INTO notifications (to_user_id, from_user_id, type, post_id, message)
    VALUES (
      (SELECT user_id FROM reels WHERE id = NEW.reel_id),
      NEW.user_id,
      'reel_comment',
      NEW.reel_id,
      'commented on your reel'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reel comment notifications
DROP TRIGGER IF EXISTS reel_comment_notification_trigger ON public.reels_comments;
CREATE TRIGGER reel_comment_notification_trigger
  AFTER INSERT ON public.reels_comments
  FOR EACH ROW EXECUTE FUNCTION create_reel_comment_notification();

-- Update the comments count in reels table when comments are added/removed
CREATE OR REPLACE FUNCTION update_reel_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reels 
    SET comments_count = COALESCE(comments_count, 0) + 1 
    WHERE id = NEW.reel_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reels 
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) 
    WHERE id = OLD.reel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating comments count
DROP TRIGGER IF EXISTS reel_comments_count_trigger ON public.reels_comments;
CREATE TRIGGER reel_comments_count_trigger
  AFTER INSERT OR DELETE ON public.reels_comments
  FOR EACH ROW EXECUTE FUNCTION update_reel_comments_count();

-- Ensure reels table has comments_count column
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Update existing reels with correct comment counts
UPDATE public.reels 
SET comments_count = (
  SELECT COUNT(*) 
  FROM public.reels_comments 
  WHERE reel_id = reels.id
);