const fetch = require('node-fetch');

async function createDislikesTable() {
  try {
    const response = await fetch('https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
      },
      body: JSON.stringify({
        query: `
          mutation {
            __schema {
              types {
                name
              }
            }
          }
        `
      })
    });

    console.log('Creating dislikes table...');
    console.log('Note: You need to create the dislikes table in your database with the following structure:');
    console.log(`
CREATE TABLE dislikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
    `);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createDislikesTable();