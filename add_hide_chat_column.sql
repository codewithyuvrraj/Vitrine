-- Add hide_chat column to profiles table
-- This allows users to hide the chat/messages tab from their navigation

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hide_chat BOOLEAN DEFAULT FALSE;

-- Add comment to document the column
COMMENT ON COLUMN profiles.hide_chat IS 'Whether to hide the chat/messages tab from navigation';

-- Update existing users to have chat visible by default
UPDATE profiles SET hide_chat = FALSE WHERE hide_chat IS NULL;