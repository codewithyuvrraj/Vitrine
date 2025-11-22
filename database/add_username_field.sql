-- Add username field to profiles table
ALTER TABLE profiles ADD COLUMN username VARCHAR(30) UNIQUE;

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- Update existing profiles to have usernames based on display_name
UPDATE profiles 
SET username = LOWER(REGEXP_REPLACE(display_name, '[^a-zA-Z0-9]', '', 'g'))
WHERE username IS NULL AND display_name IS NOT NULL;

-- For profiles without display_name, generate username from auth_id
UPDATE profiles 
SET username = 'user_' || SUBSTRING(auth_id::text, 1, 8)
WHERE username IS NULL;

-- Make username NOT NULL after populating existing data
ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;