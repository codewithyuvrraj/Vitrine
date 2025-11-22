import { nhost } from './nhost'

async function runGQL(query, variables = {}) {
  const result = await nhost.graphql.request(query, variables)
  if (result.errors) throw result.errors
  return result.data
}

export function from(table) {
  return {
    async select(columns = '*', options = {}) {
      const query = `query ${table}_select($limit: Int, $offset: Int) {
        ${table}(limit: $limit, offset: $offset) {
          id
          ${columns === '*' ? 'created_at' : columns}
        }
      }`
      const data = await runGQL(query, { 
        limit: options.limit || 50, 
        offset: options.offset || 0 
      })
      return { data: data?.[table] ?? [] }
    },

    async insert(obj) {
      const mutation = `mutation insert_${table}($object: ${table}_insert_input!) {
        insert_${table}_one(object: $object) {
          id
        }
      }`
      const res = await runGQL(mutation, { object: obj })
      return { data: res?.[`insert_${table}_one`] ?? null }
    },

    async upsert(obj) {
      try {
        return await this.insert(obj)
      } catch (e) {
        return { error: e }
      }
    }
  }
}

export function channel(name) {
  return {
    on: (event, callback) => {
      console.log(`Realtime subscription for ${name} - ${event} (polling fallback)`)
      // Polling fallback until GraphQL subscriptions implemented
      const interval = setInterval(async () => {
        try {
          if (event === 'postgres_changes') {
            // Simple polling - replace with GraphQL subscriptions later
            callback({ new: {}, old: {} })
          }
        } catch (e) {
          console.error('Polling error:', e)
        }
      }, 3000)
      
      return {
        unsubscribe: () => clearInterval(interval)
      }
    }
  }
}