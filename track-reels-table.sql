-- Track the reels table in Hasura GraphQL
-- Run this in the GraphQL console, not the Database console

mutation {
  track_table(args: {
    table: {
      name: "reels"
      schema: "public"
    }
  }) {
    name
  }
}