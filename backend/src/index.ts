import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { categoriesRoute } from './routes/categories.js'
import { recipesRoute } from './routes/recipes.js'
import { shoppingRoute } from './routes/shopping.js'
import { tagsRoute } from './routes/tags.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors())

app.get('/health', (c) => c.json({ ok: true }))

app.route('/api/recipes', recipesRoute)
app.route('/api/shopping', shoppingRoute)
app.route('/api/tags', tagsRoute)
app.route('/api/categories', categoriesRoute)

const port = Number(process.env.PORT ?? 3001)
console.log(`Server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
