-- Create user_saved_content table for Instagram clone
-- This table stores both saved posts and reels for users

CREATE TABLE user_saved_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('post', 'reel')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only save the same content once
    UNIQUE(user_id, content_id, content_type)
);

-- Create indexes for better performance
CREATE INDEX idx_user_saved_content_user_id ON user_saved_content(user_id);
CREATE INDEX idx_user_saved_content_content_id ON user_saved_content(content_id);
CREATE INDEX idx_user_saved_content_type ON user_saved_content(content_type);
CREATE INDEX idx_user_saved_content_created_at ON user_saved_content(created_at);

-- Grant permissions
GRANT ALL ON user_saved_content TO PUBLIC;

-- Add comments for documentation
COMMENT ON TABLE user_saved_content IS 'Stores saved posts and reels for users';
COMMENT ON COLUMN user_saved_content.user_id IS 'References profiles.id - the user who saved the content';
COMMENT ON COLUMN user_saved_content.content_id IS 'UUID of the saved post/reel (references posts.id or reels.id)';
COMMENT ON COLUMN user_saved_content.content_type IS 'Type of content: post or reel';
COMMENT ON COLUMN user_saved_content.created_at IS 'When the content was saved';