import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/index.js'
import { recipeIngredients, recipeTags, recipes, tags } from '../db/schema.js'

export const recipesRoute = new Hono()

// レシピ一覧（タグ・材料付き）
recipesRoute.get('/', async (c) => {
  const rows = await db.query.recipes.findMany({
    with: {
      recipeIngredients: { with: { category: true }, orderBy: (i, { asc }) => asc(i.sortOrder) },
      recipeTags: { with: { tag: true } },
    },
    orderBy: (r, { desc }) => desc(r.createdAt),
  })
  return c.json(rows)
})

// レシピ詳細
recipesRoute.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const row = await db.query.recipes.findFirst({
    where: eq(recipes.id, id),
    with: {
      recipeIngredients: { with: { category: true }, orderBy: (i, { asc }) => asc(i.sortOrder) },
      recipeTags: { with: { tag: true } },
    },
  })
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

// レシピ作成
recipesRoute.post('/', async (c) => {
  const body = await c.req.json()
  const { ingredients = [], tagIds = [], ...recipeData } = body

  const [recipe] = await db.insert(recipes).values(recipeData).returning()

  if (ingredients.length > 0) {
    await db.insert(recipeIngredients).values(
      ingredients.map((ing: any, i: number) => ({
        ...ing,
        recipeId: recipe.id,
        sortOrder: i,
      }))
    )
  }

  if (tagIds.length > 0) {
    await db.insert(recipeTags).values(
      tagIds.map((tagId: number) => ({ recipeId: recipe.id, tagId }))
    )
  }

  return c.json(recipe, 201)
})

// レシピ更新
recipesRoute.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const { ingredients, tagIds, ...recipeData } = body

  const [updated] = await db
    .update(recipes)
    .set({ ...recipeData, updatedAt: new Date() })
    .where(eq(recipes.id, id))
    .returning()

  if (!updated) return c.json({ error: 'Not found' }, 404)

  if (ingredients !== undefined) {
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id))
    if (ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        ingredients.map((ing: any, i: number) => ({ ...ing, recipeId: id, sortOrder: i }))
      )
    }
  }

  if (tagIds !== undefined) {
    await db.delete(recipeTags).where(eq(recipeTags.recipeId, id))
    if (tagIds.length > 0) {
      await db.insert(recipeTags).values(tagIds.map((tagId: number) => ({ recipeId: id, tagId })))
    }
  }

  return c.json(updated)
})

// レシピ削除
recipesRoute.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await db.delete(recipes).where(eq(recipes.id, id))
  return c.json({ ok: true })
})
