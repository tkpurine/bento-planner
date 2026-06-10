import { relations } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// 食材カテゴリマスタ（野菜、肉・魚、調味料など）
export const ingredientCategories = sqliteTable('ingredient_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

// レシピ
export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  servings: integer('servings').notNull().default(2),
  // normal=通常調理, hotcook=ヘルシオホットクック
  cookingMethod: text('cooking_method', { enum: ['normal', 'hotcook'] }).notNull().default('normal'),
  hotcookMode: text('hotcook_mode'),   // 例: "無水調理", "スロー調理"
  cookTimeMinutes: integer('cook_time_minutes'),
  isFreezable: integer('is_freezable', { mode: 'boolean' }).notNull().default(false),
  isMealPrep: integer('is_meal_prep', { mode: 'boolean' }).notNull().default(false),
  memo: text('memo'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// レシピの材料（1レシピ = 複数の材料行）
export const recipeIngredients = sqliteTable('recipe_ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').references(() => ingredientCategories.id),
  name: text('name').notNull(),
  amount: real('amount'),   // null = "適量"
  unit: text('unit'),       // g, ml, 個, 枚, 大さじ, 小さじ ...
  note: text('note'),       // 薄切り、みじん切り など
  sortOrder: integer('sort_order').notNull().default(0),
})

// タグマスタ（作り置き向き、ホットクック専用、冷凍可 など）
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
})

// レシピ ↔ タグ 中間テーブル
export const recipeTags = sqliteTable('recipe_tags', {
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
})

// --- Drizzle リレーション定義 ---

export const recipesRelations = relations(recipes, ({ many }) => ({
  recipeIngredients: many(recipeIngredients),
  recipeTags: many(recipeTags),
}))

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
  category: one(ingredientCategories, {
    fields: [recipeIngredients.categoryId],
    references: [ingredientCategories.id],
  }),
}))

export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeTags.recipeId], references: [recipes.id] }),
  tag: one(tags, { fields: [recipeTags.tagId], references: [tags.id] }),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  recipeTags: many(recipeTags),
}))

export const ingredientCategoriesRelations = relations(ingredientCategories, ({ many }) => ({
  recipeIngredients: many(recipeIngredients),
}))
