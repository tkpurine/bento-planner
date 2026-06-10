export type CookingMethod = 'normal' | 'hotcook'

export interface IngredientCategory {
  id: number
  name: string
  sortOrder: number
}

export interface Tag {
  id: number
  name: string
}

export interface RecipeIngredient {
  id: number
  recipeId: number
  categoryId: number | null
  category: IngredientCategory | null
  name: string
  amount: number | null
  unit: string | null
  note: string | null
  sortOrder: number
}

export interface Recipe {
  id: number
  name: string
  description: string | null
  servings: number
  cookingMethod: CookingMethod
  hotcookMode: string | null
  cookTimeMinutes: number | null
  isFreezable: boolean
  isMealPrep: boolean
  memo: string | null
  createdAt: string
  updatedAt: string
  recipeIngredients: RecipeIngredient[]
  recipeTags: { recipeId: number; tagId: number; tag: Tag }[]
}

export interface RecipeInput {
  name: string
  description?: string
  servings: number
  cookingMethod: CookingMethod
  hotcookMode?: string
  cookTimeMinutes?: number
  isFreezable: boolean
  isMealPrep: boolean
  memo?: string
  ingredients: IngredientInput[]
  tagIds: number[]
}

export interface IngredientInput {
  name: string
  amount?: number
  unit?: string
  note?: string
  categoryId?: number
}

export interface ShoppingItem {
  name: string
  amount: number | null
  unit: string | null
  note: string | null
  categoryName: string
  isAdHoc: boolean
}

export interface ShoppingCategory {
  categoryName: string
  sortOrder: number
  items: ShoppingItem[]
}

export interface ShoppingListResult {
  categories: ShoppingCategory[]
}
