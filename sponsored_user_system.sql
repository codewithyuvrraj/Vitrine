-- Sponsored User System Implementation
-- Add user_type field to profiles table to identify sponsored users

-- Add user_type column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'regular';

-- Add sponsored_by column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sponsored_by TEXT;

-- Add sponsored_by column to reels table  
ALTER TABLE reels ADD COLUMN IF NOT EXISTS sponsored_by TEXT;

-- Create index for user_type for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Update existing profiles to have 'regular' user_type
UPDATE profiles SET user_type = 'regular' WHERE user_type IS NULL;

-- Create sponsored admin user profile (will be created programmatically)
-- The sponsored admin user will have:
-- - email: sponseredadmin@gmail.com
-- - password: admin1234
-- - user_type: 'sponsored'
-- - display_name: 'Sponsored Admin'

-- Add comments for clarity
COMMENT ON COLUMN profiles.user_type IS 'Type of user: regular, sponsored, admin';
COMMENT ON COLUMN posts.sponsored_by IS 'Display name of the user who sponsored this post';
COMMENT ON COLUMN reels.sponsored_by IS 'Display name of the user who sponsored this reel';