import { Clock, Snowflake, Users, Zap } from 'lucide-react'
import type { Recipe } from '@/api/types'
import { Badge, Card } from './ui'

interface Props {
  recipe: Recipe
  selected?: boolean
  onSelect?: () => void
  onEdit?: () => void
}

export function RecipeCard({ recipe, selected, onSelect, onEdit }: Props) {
  const tags = recipe.recipeTags.map((rt) => rt.tag)

  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${
        selected ? 'ring-2 ring-emerald-500 border-emerald-300' : 'hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base leading-snug">{recipe.name}</h3>
            {recipe.cookingMethod === 'hotcook' && (
              <Badge color="purple">ホットクック</Badge>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {recipe.servings}人分
            </span>
            {recipe.cookTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {recipe.cookTimeMinutes}分
              </span>
            )}
            {recipe.isFreezable && (
              <span className="flex items-center gap-1 text-blue-500">
                <Snowflake size={12} />
                冷凍可
              </span>
            )}
            {recipe.isMealPrep && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Zap size={12} />
                作り置き
              </span>
            )}
          </div>

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag.id} color="gray">{tag.name}</Badge>
              ))}
            </div>
          )}

          <div className="mt-2 text-xs text-gray-400">
            材料 {recipe.recipeIngredients.length}品目
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          {selected && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
          )}
          {onEdit && (
            <button
              className="text-xs text-gray-400 hover:text-gray-600 px-1"
              onClick={(e) => { e.stopPropagation(); onEdit() }}
            >
              編集
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}
