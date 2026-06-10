import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import type { Recipe } from '@/api/types'
import { RecipeCard } from '@/components/RecipeCard'
import { RecipeForm } from '@/components/RecipeForm'
import { Button, Input, Spinner } from '@/components/ui'

export function RecipeListPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null)

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: api.recipes.list,
  })

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: ['recipes'] })
    setShowForm(false)
    setEditRecipe(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('このレシピを削除しますか？')) return
    await api.recipes.delete(id)
    qc.invalidateQueries({ queryKey: ['recipes'] })
  }

  if (showForm || editRecipe) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {editRecipe ? 'レシピを編集' : '新しいレシピ'}
        </h2>
        <RecipeForm
          recipe={editRecipe ?? undefined}
          onSave={handleSaved}
          onCancel={() => { setShowForm(false); setEditRecipe(null) }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">レシピ</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={16} />追加
        </Button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="レシピを検索..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🍱</p>
          <p className="text-sm">{search ? '該当するレシピがありません' : 'レシピを登録しましょう'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((recipe) => (
            <div key={recipe.id} className="group relative">
              <RecipeCard
                recipe={recipe}
                onEdit={() => setEditRecipe(recipe)}
              />
              <button
                onClick={() => handleDelete(recipe.id)}
                className="absolute top-3 right-12 hidden group-hover:block text-xs text-red-400 hover:text-red-600"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}

      {recipes.length > 0 && (
        <div className="fixed bottom-6 right-4 left-4 max-w-lg mx-auto">
          <Button
            size="lg"
            className="w-full shadow-lg"
            onClick={() => navigate('/planner')}
          >
            <ShoppingCart size={18} />
            買い物リストを作る
          </Button>
        </div>
      )}
    </div>
  )
}
