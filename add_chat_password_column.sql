-- Add chat_password column to profiles table
-- This stores the password required to toggle hide chat functionality

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS chat_password VARCHAR(255) DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN profiles.chat_password IS 'Password required to toggle hide chat functionality';