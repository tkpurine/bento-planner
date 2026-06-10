import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check, ClipboardCopy, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import type { ShoppingCategory } from '@/api/types'
import { RecipeCard } from '@/components/RecipeCard'
import { Button, Card, Spinner } from '@/components/ui'

interface SelectedItem {
  recipeId: number
  multiplier: number
}

export function PlannerPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Map<number, SelectedItem>>(new Map())
  const [shoppingResult, setShoppingResult] = useState<ShoppingCategory[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: api.recipes.list,
  })

  const toggleRecipe = (id: number) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.set(id, { recipeId: id, multiplier: 1 })
      }
      return next
    })
    setShoppingResult(null)
  }

  const changeMultiplier = (id: number, delta: number) => {
    setSelected((prev) => {
      const next = new Map(prev)
      const item = next.get(id)
      if (!item) return prev
      const newVal = Math.max(0.5, Math.min(10, item.multiplier + delta))
      next.set(id, { ...item, multiplier: newVal })
      return next
    })
    setShoppingResult(null)
  }

  const generateList = async () => {
    if (selected.size === 0) return
    setLoading(true)
    try {
      const result = await api.shopping.list([...selected.values()])
      setShoppingResult(result.categories)
      setCheckedItems(new Set())
    } finally {
      setLoading(false)
    }
  }

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const copyToClipboard = () => {
    if (!shoppingResult) return
    const text = shoppingResult
      .map((cat) => {
        const items = cat.items
          .map((i) => `・${i.name}${i.amount != null ? `　${i.amount}${i.unit ?? ''}` : '　適量'}`)
          .join('\n')
        return `【${cat.categoryName}】\n${items}`
      })
      .join('\n\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const formatAmount = (amount: number | null, unit: string | null) => {
    if (amount == null) return '適量'
    const rounded = Math.round(amount * 10) / 10
    return `${rounded}${unit ?? ''}`
  }

  if (isLoading) return <Spinner />

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">献立を選ぶ</h1>
      </div>

      {/* レシピ選択 */}
      <div className="space-y-3 mb-6">
        {recipes.map((recipe) => {
          const isSelected = selected.has(recipe.id)
          const item = selected.get(recipe.id)
          return (
            <div key={recipe.id}>
              <RecipeCard
                recipe={recipe}
                selected={isSelected}
                onSelect={() => toggleRecipe(recipe.id)}
              />
              {isSelected && item && (
                <div className="mt-1.5 flex items-center justify-end gap-2 px-1">
                  <span className="text-xs text-gray-500">倍率</span>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                    <button
                      onClick={() => changeMultiplier(recipe.id, -0.5)}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-30"
                      disabled={item.multiplier <= 0.5}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.multiplier}</span>
                    <button
                      onClick={() => changeMultiplier(recipe.id, 0.5)}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-30"
                      disabled={item.multiplier >= 10}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">倍</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 買い物リスト結果 */}
      {shoppingResult && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart size={18} className="text-emerald-600" />
              買い物リスト
            </h2>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <ClipboardCopy size={14} />}
              {copied ? 'コピーしました' : 'コピー'}
            </button>
          </div>

          <div className="space-y-4">
            {shoppingResult.map((category) => (
              <Card key={category.categoryName} className="overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {category.categoryName}
                  </span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {category.items.map((item) => {
                    const key = `${category.categoryName}__${item.name}`
                    const isChecked = checkedItems.has(key)
                    return (
                      <li
                        key={key}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                          isChecked ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                        }`}
                        onClick={() => toggleCheck(key)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                            isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                          }`}>
                            {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <span className={`text-sm ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {item.name}
                          </span>
                          {item.note && (
                            <span className="text-xs text-gray-400">({item.note})</span>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${isChecked ? 'text-gray-400' : 'text-gray-700'}`}>
                          {formatAmount(item.amount, item.unit)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* フッターボタン */}
      <div className="fixed bottom-6 right-4 left-4 max-w-lg mx-auto">
        <Button
          size="lg"
          className="w-full shadow-lg"
          disabled={selected.size === 0 || loading}
          onClick={generateList}
        >
          <ShoppingCart size={18} />
          {loading ? '集計中...' : `買い物リストを作る（${selected.size}品）`}
        </Button>
      </div>
    </div>
  )
}
