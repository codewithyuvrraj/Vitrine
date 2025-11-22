-- Add constraint to prevent same user from liking and disliking same post
CREATE OR REPLACE FUNCTION prevent_like_dislike_conflict()
RETURNS TRIGGER AS $$
BEGIN
  -- If inserting into likes, remove any existing dislike
  IF TG_TABLE_NAME = 'likes' THEN
    DELETE FROM dislikes WHERE user_id = NEW.user_id AND post_id = NEW.post_id;
  END IF;
  
  -- If inserting into dislikes, remove any existing like
  IF TG_TABLE_NAME = 'dislikes' THEN
    DELETE FROM likes WHERE user_id = NEW.user_id AND post_id = NEW.post_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS prevent_like_dislike_on_likes ON likes;
DROP TRIGGER IF EXISTS prevent_like_dislike_on_dislikes ON dislikes;

CREATE TRIGGER prevent_like_dislike_on_likes
  BEFORE INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_like_dislike_conflict();

CREATE TRIGGER prevent_like_dislike_on_dislikes
  BEFORE INSERT ON dislikes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_like_dislike_conflict();