import type {
  IngredientCategory,
  Recipe,
  RecipeInput,
  ShoppingListResult,
  Tag,
} from './types'

const BASE = '/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  recipes: {
    list: () => req<Recipe[]>('/recipes'),
    get: (id: number) => req<Recipe>(`/recipes/${id}`),
    create: (data: RecipeInput) =>
      req<Recipe>('/recipes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<RecipeInput>) =>
      req<Recipe>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      req<{ ok: boolean }>(`/recipes/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: () => req<IngredientCategory[]>('/categories'),
  },
  tags: {
    list: () => req<Tag[]>('/tags'),
  },
  shopping: {
    list: (items: { recipeId: number; multiplier: number }[]) =>
      req<ShoppingListResult>('/shopping/list', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
  },
}
