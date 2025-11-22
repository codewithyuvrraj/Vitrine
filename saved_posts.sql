-- Create saved_posts table for Instagram clone
-- This table stores which posts/reels users have saved

CREATE TABLE saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only save a post once
    UNIQUE(user_id, post_id)
);

-- Create indexes for better performance
CREATE INDEX idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX idx_saved_posts_post_id ON saved_posts(post_id);
CREATE INDEX idx_saved_posts_created_at ON saved_posts(created_at);

-- Grant permissions
GRANT ALL ON saved_posts TO PUBLIC;

-- Add comments for documentation
COMMENT ON TABLE saved_posts IS 'Stores saved posts and reels for users';
COMMENT ON COLUMN saved_posts.user_id IS 'References profiles.id - the user who saved the post';
COMMENT ON COLUMN saved_posts.post_id IS 'UUID of the saved post/reel (references posts.id or reels.id)';
COMMENT ON COLUMN saved_posts.created_at IS 'When the post was saved';