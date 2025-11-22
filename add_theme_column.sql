-- Add theme column to profiles table
ALTER TABLE profiles 
ADD COLUMN theme VARCHAR(50) DEFAULT 'dark';

-- Update existing users to have default theme
UPDATE profiles 
SET theme = 'dark' 
WHERE theme IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON profiles(theme);