-- Add website_url field to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN website_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.website_url IS 'User website URL that opens in new tab when clicked';