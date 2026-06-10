import { Hono } from 'hono'
import { db } from '../db/index.js'
import { ingredientCategories } from '../db/schema.js'

export const categoriesRoute = new Hono()

categoriesRoute.get('/', async (c) => {
  const rows = await db.select().from(ingredientCategories).orderBy(ingredientCategories.sortOrder)
  return c.json(rows)
})

categoriesRoute.post('/', async (c) => {
  const { name, sortOrder = 0 } = await c.req.json()
  const [category] = await db.insert(ingredientCategories).values({ name, sortOrder }).returning()
  return c.json(category, 201)
})
