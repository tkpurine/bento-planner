import { inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/index.js'
import { recipes } from '../db/schema.js'

export const shoppingRoute = new Hono()

// POST /shopping/list
// body: { items: [{ recipeId: number, multiplier: number }] }
//
// 選択したレシピの材料を集計して買い物リストを返す
// 同じ食材名・同じ単位は合算する
shoppingRoute.post('/list', async (c) => {
  const body = await c.req.json()
  const items: { recipeId: number; multiplier: number }[] = body.items ?? []

  if (items.length === 0) return c.json({ categories: [] })

  const recipeIds = items.map((i) => i.recipeId)
  const multiplierMap = new Map(items.map((i) => [i.recipeId, i.multiplier]))

  const rows = await db.query.recipes.findMany({
    where: inArray(recipes.id, recipeIds),
    with: {
      recipeIngredients: {
        with: { category: true },
        orderBy: (ing, { asc }) => asc(ing.sortOrder),
      },
    },
  })

  // 材料を集計: key = "名前__単位"
  type AggItem = {
    name: string
    amount: number | null
    unit: string | null
    note: string | null
    categoryId: number | null
    categoryName: string | null
    categorySortOrder: number
    isAdHoc: boolean // 適量（amount=null）フラグ
  }
  const aggregated = new Map<string, AggItem>()

  for (const recipe of rows) {
    const multiplier = multiplierMap.get(recipe.id) ?? 1
    const baseServings = recipe.servings

    for (const ing of recipe.recipeIngredients) {
      const key = `${ing.name}__${ing.unit ?? ''}`
      const existing = aggregated.get(key)
      const scaledAmount =
        ing.amount != null ? (ing.amount / baseServings) * multiplier * baseServings : null

      if (existing) {
        if (scaledAmount != null && existing.amount != null) {
          existing.amount += scaledAmount
        }
      } else {
        aggregated.set(key, {
          name: ing.name,
          amount: scaledAmount,
          unit: ing.unit,
          note: ing.note,
          categoryId: ing.categoryId,
          categoryName: ing.category?.name ?? 'その他',
          categorySortOrder: ing.category?.sortOrder ?? 999,
          isAdHoc: ing.amount == null,
        })
      }
    }
  }

  // カテゴリ別にグループ化してソート
  const categoryMap = new Map<string, { categoryName: string; sortOrder: number; items: AggItem[] }>()

  for (const item of aggregated.values()) {
    const key = item.categoryName ?? 'その他'
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        categoryName: key,
        sortOrder: item.categorySortOrder,
        items: [],
      })
    }
    categoryMap.get(key)!.items.push(item)
  }

  const categories = [...categoryMap.values()].sort((a, b) => a.sortOrder - b.sortOrder)

  return c.json({ categories })
})
