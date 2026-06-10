import { Hono } from 'hono'
import { db } from '../db/index.js'
import { tags } from '../db/schema.js'

export const tagsRoute = new Hono()

tagsRoute.get('/', async (c) => {
  const rows = await db.select().from(tags)
  return c.json(rows)
})

tagsRoute.post('/', async (c) => {
  const { name } = await c.req.json()
  const [tag] = await db.insert(tags).values({ name }).returning()
  return c.json(tag, 201)
})
