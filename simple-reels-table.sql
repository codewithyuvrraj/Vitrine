-- Try this EXACT SQL in Nhost Database → SQL Editor
-- Simple table creation

CREATE TABLE reels (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    video_url TEXT NOT NULL,
    caption TEXT,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);