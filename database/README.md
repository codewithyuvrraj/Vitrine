# Database Setup Instructions

## 1. Run SQL in Hasura Console

1. Go to **Hasura Console** → **Data** → **SQL**
2. Copy and paste the content from `all_tables.sql`
3. Click **Run!**

## 2. Track All Tables

After creating tables, track them in Hasura:

1. Go to **Data** tab
2. Click **Track** for each table:
   - `user_profiles`
   - `posts` 
   - `reels`
   - `likes`
   - `comments`
   - `follows`
   - `stories`

## 3. Set Permissions

For each table, set these permissions:

### user_profiles
- **Insert**: Allow users to insert their own profile
- **Select**: Allow all users to read profiles
- **Update**: Allow users to update their own profile

### posts, reels
- **Insert**: Allow authenticated users
- **Select**: Allow all users
- **Update**: Allow users to update their own posts
- **Delete**: Allow users to delete their own posts

### likes, comments, follows
- **Insert**: Allow authenticated users
- **Select**: Allow all users
- **Delete**: Allow users to delete their own records

### stories
- **Insert**: Allow authenticated users
- **Select**: Allow all users
- **Delete**: Allow users to delete their own stories

## 4. Test Queries

Test these queries in GraphQL playground:

```graphql
# Get user profile
query {
  user_profiles(where: {user_id: {_eq: "your-user-id"}}) {
    display_name
    avatar_url
    bio
  }
}

# Get all reels
query {
  reels(order_by: {created_at: desc}) {
    id
    video_url
    caption
    user_id
  }
}
```