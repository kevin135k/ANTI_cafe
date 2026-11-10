import React from 'react';
import type { Recipe } from '../types/recipe';
import { ChevronRight, Trash2 } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onDelete?: (recipeId: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect, onDelete }) => {
  // Format total seconds into mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get total duration of all steps for proportional bar
  const totalDuration =
    recipe.steps.reduce((acc, step) => acc + step.duration, 0) ||
    recipe.totalTimeSeconds;

  const hasIce = Boolean(recipe.defaultIce && recipe.defaultIce > 0);
  const totalLiquid = recipe.defaultWater + (recipe.defaultIce || 0);
  const ratioText = hasIce
    ? `1:${(totalLiquid / recipe.defaultCoffee).toFixed(1)} (含冰)`
    : recipe.ratio;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-coffee)]/50 rounded-3xl p-5 transition-all duration-150 shadow-md text-left">
      {/* Top badges */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[var(--bg-card-sub)] text-[var(--accent-coffee)] border border-[var(--border-color)]">
            {recipe.category}
          </span>
          {recipe.isCustom && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--accent-coffee)]/20 text-[var(--accent-coffee)] border border-[var(--accent-coffee)]/40">
              自訂
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] truncate max-w-[150px]">
            {recipe.referenceAuthor}
          </span>
          {recipe.isCustom && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`確定要刪除自訂配方「${recipe.name}」嗎？`)) {
                  onDelete(recipe.id);
                }
              }}
              title="刪除此配方"
              className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1 cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-serif font-bold text-[var(--text-main)] mb-2 tracking-wide">
        {recipe.name}
      </h3>

      {/* Meta Specs Bar */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)] mb-3">
        <span className="font-semibold text-[var(--text-main)]">{recipe.defaultCoffee}g</span>
        <span>•</span>
        <span className="font-semibold text-[var(--text-main)]">
          {hasIce ? `熱水 ${recipe.defaultWater}g` : `${recipe.defaultWater}g`}
        </span>
        {hasIce && (
          <>
            <span>•</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-medium">
              冰塊 {recipe.defaultIce}g
            </span>
            <span>•</span>
            <span className="font-semibold text-[var(--text-main)]">
              總液量 {totalLiquid}g
            </span>
          </>
        )}
        <span>•</span>
        <span>{recipe.temperature}°C</span>
        <span>•</span>
        <span>{formatTime(recipe.totalTimeSeconds)}</span>
        <span>•</span>
        <span className="text-[var(--accent-coffee)] font-medium">{ratioText}</span>
      </div>

      {/* Proportional Timeline Bar */}
      <div className="flex items-center gap-1 w-full h-2 mb-3.5 bg-[var(--bg-card-sub)] rounded-full p-0.5 overflow-hidden">
        {recipe.steps.map((step, idx) => {
          const widthPercent = Math.max(5, (step.duration / totalDuration) * 100);
          const isPour = step.type === 'pour';
          return (
            <div
              key={idx}
              title={`${step.title} (${step.duration}s)`}
              style={{ width: `${widthPercent}%` }}
              className={`h-full rounded-sm transition-all ${
                isPour
                  ? 'bg-[var(--accent-coffee)]'
                  : 'bg-[var(--border-color)]'
              }`}
            />
          );
        })}
      </div>

      {/* Recipe summary */}
      <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-3.5">
        {recipe.summary}
      </p>

      {/* Flavor & Grind Advice */}
      <div className="space-y-1.5 mb-4 text-xs">
        <div>
          <span className="text-[var(--accent-coffee)] font-semibold block mb-0.5">
            研磨與風味
          </span>
          <p className="text-[var(--text-muted)] leading-relaxed">
            {recipe.grindAndFlavor}
          </p>
        </div>
        <div>
          <span className="text-[var(--accent-coffee)] font-semibold block mb-0.5">
            豆子搭配
          </span>
          <p className="text-[var(--text-muted)] leading-relaxed">
            {recipe.beanPairing}
          </p>
        </div>
      </div>

      {/* Action Button: Consistent Liquid Glass Style with Floating Elevation */}
      <button
        onClick={() => onSelect(recipe)}
        className="w-full py-3.5 px-4 liquid-glass font-bold text-sm rounded-2xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
      >
        <span>開始沖煮</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
export default RecipeCard;
