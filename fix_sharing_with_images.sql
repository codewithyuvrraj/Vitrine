-- Create a unified sharing table that can handle both posts and reels with proper image storage
CREATE TABLE IF NOT EXISTS public.shared_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('post', 'reel', 'story')),
  content_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  original_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple table without RLS for now
-- RLS can be added later when auth system is properly configured

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_content_receiver ON public.shared_content(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_content_sender ON public.shared_content(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_content_type ON public.shared_content(content_type);