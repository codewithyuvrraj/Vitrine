-- Fix website field naming consistency
-- The code uses 'website' but schema might use 'links' or 'website_url'

-- First, check if we need to rename the column
-- If using 'links', rename to 'website' for consistency
-- If using 'website_url', rename to 'website' for consistency

-- For profiles table (if it exists)
DO $$ 
BEGIN
    -- Check if 'links' column exists and rename to 'website'
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'links') THEN
        ALTER TABLE profiles RENAME COLUMN links TO website;
    END IF;
    
    -- Check if 'website_url' column exists and rename to 'website'  
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'website_url') THEN
        ALTER TABLE profiles RENAME COLUMN website_url TO website;
    END IF;
    
    -- If neither exists, add the website column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'website') THEN
        ALTER TABLE profiles ADD COLUMN website TEXT;
    END IF;
END $$;

-- For user_profiles table (if it exists)
DO $$ 
BEGIN
    -- Check if 'website_url' column exists and rename to 'website'
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_profiles' AND column_name = 'website_url') THEN
        ALTER TABLE user_profiles RENAME COLUMN website_url TO website;
    END IF;
    
    -- If website column doesn't exist, add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'website') THEN
        ALTER TABLE user_profiles ADD COLUMN website TEXT;
    END IF;
END $$;