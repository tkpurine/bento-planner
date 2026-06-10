import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import type { IngredientCategory, IngredientInput, Recipe, RecipeInput, Tag } from '@/api/types'
import { Button, Input, Label, Select, Textarea } from './ui'

interface Props {
  recipe?: Recipe
  onSave: () => void
  onCancel: () => void
}

const emptyIngredient = (): IngredientInput => ({ name: '', amount: undefined, unit: '', note: '', categoryId: undefined })

export function RecipeForm({ recipe, onSave, onCancel }: Props) {
  const [categories, setCategories] = useState<IngredientCategory[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<RecipeInput>({
    name: recipe?.name ?? '',
    description: recipe?.description ?? '',
    servings: recipe?.servings ?? 2,
    cookingMethod: recipe?.cookingMethod ?? 'normal',
    hotcookMode: recipe?.hotcookMode ?? '',
    cookTimeMinutes: recipe?.cookTimeMinutes ?? undefined,
    isFreezable: recipe?.isFreezable ?? false,
    isMealPrep: recipe?.isMealPrep ?? true,
    memo: recipe?.memo ?? '',
    ingredients: recipe?.recipeIngredients.map((i) => ({
      name: i.name,
      amount: i.amount ?? undefined,
      unit: i.unit ?? '',
      note: i.note ?? '',
      categoryId: i.categoryId ?? undefined,
    })) ?? [emptyIngredient()],
    tagIds: recipe?.recipeTags.map((rt) => rt.tagId) ?? [],
  })

  useEffect(() => {
    api.categories.list().then(setCategories)
    api.tags.list().then(setTags)
  }, [])

  const setField = <K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const setIngredient = (index: number, field: keyof IngredientInput, value: string | number | undefined) =>
    setForm((f) => {
      const ingredients = [...f.ingredients]
      ingredients[index] = { ...ingredients[index], [field]: value }
      return { ...f, ingredients }
    })

  const addIngredient = () => setForm((f) => ({ ...f, ingredients: [...f.ingredients, emptyIngredient()] }))
  const removeIngredient = (i: number) =>
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))

  const toggleTag = (id: number) =>
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(id) ? f.tagIds.filter((t) => t !== id) : [...f.tagIds, id],
    }))

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        ingredients: form.ingredients.filter((i) => i.name.trim()),
      }
      if (recipe) {
        await api.recipes.update(recipe.id, payload)
      } else {
        await api.recipes.create(payload)
      }
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* 基本情報 */}
      <div>
        <Label>料理名 *</Label>
        <Input
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="例: ひじきの煮物"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>人数分</Label>
          <Input
            type="number" min={1} max={20}
            value={form.servings}
            onChange={(e) => setField('servings', Number(e.target.value))}
          />
        </div>
        <div>
          <Label>調理時間（分）</Label>
          <Input
            type="number" min={1}
            value={form.cookTimeMinutes ?? ''}
            onChange={(e) => setField('cookTimeMinutes', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="省略可"
          />
        </div>
      </div>

      <div>
        <Label>調理方法</Label>
        <Select
          value={form.cookingMethod}
          onChange={(e) => setField('cookingMethod', e.target.value as 'normal' | 'hotcook')}
        >
          <option value="normal">通常調理</option>
          <option value="hotcook">ヘルシオホットクック</option>
        </Select>
      </div>

      {form.cookingMethod === 'hotcook' && (
        <div>
          <Label>ホットクックモード</Label>
          <Input
            value={form.hotcookMode ?? ''}
            onChange={(e) => setField('hotcookMode', e.target.value)}
            placeholder="例: 無水調理、煮る、スロー調理"
          />
        </div>
      )}

      <div className="flex gap-4">
        {[
          { key: 'isMealPrep' as const, label: '作り置き向き' },
          { key: 'isFreezable' as const, label: '冷凍可' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(e) => setField(key, e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-600"
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      {tags.length > 0 && (
        <div>
          <Label>タグ</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  form.tagIds.includes(tag.id)
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 材料 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="mb-0">材料</Label>
          <button onClick={addIngredient} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <Plus size={14} />追加
          </button>
        </div>

        <div className="space-y-2">
          {form.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-5 gap-1.5">
                <div className="col-span-2">
                  <Input
                    value={ing.name}
                    onChange={(e) => setIngredient(i, 'name', e.target.value)}
                    placeholder="食材名"
                  />
                </div>
                <Input
                  type="number" min={0} step={0.1}
                  value={ing.amount ?? ''}
                  onChange={(e) => setIngredient(i, 'amount', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="量"
                />
                <Input
                  value={ing.unit ?? ''}
                  onChange={(e) => setIngredient(i, 'unit', e.target.value)}
                  placeholder="単位"
                />
                <Select
                  value={ing.categoryId ?? ''}
                  onChange={(e) => setIngredient(i, 'categoryId', e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">カテゴリ</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <button
                onClick={() => removeIngredient(i)}
                className="mt-1 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>メモ</Label>
        <Textarea
          rows={2}
          value={form.memo ?? ''}
          onChange={(e) => setField('memo', e.target.value)}
          placeholder="調理のコツや注意点など"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={saving || !form.name.trim()} className="flex-1">
          {saving ? '保存中...' : recipe ? '更新する' : 'レシピを登録'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>キャンセル</Button>
      </div>
    </div>
  )
}
