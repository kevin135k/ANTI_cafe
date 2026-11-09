import React from 'react';
import type { Recipe } from '../types/recipe';
import { ChevronRight } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect }) => {
  // Format total seconds into mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get total duration of all steps for proportional bar
  const totalDuration = recipe.steps.reduce((acc, step) => acc + step.duration, 0) || recipe.totalTimeSeconds;

  return (
    <div className="bg-[#1c1a17] border border-[#2e2a25] hover:border-[#4a4238] rounded-2xl p-5 mb-5 transition-all duration-200 shadow-lg text-left">
      {/* Top badges */}
      <div className="flex items-center justify-between mb-2">
        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#292521] text-[#c9bfae] border border-[#3b352e]">
          {recipe.category}
        </span>
        <span className="text-xs text-[#8f8578] truncate max-w-[200px]">
          {recipe.referenceAuthor}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-serif font-bold text-[#f5efe6] mb-2 tracking-wide">
        {recipe.name}
      </h3>

      {/* Meta Specs Bar */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#a89d8f] mb-3">
        <span>{recipe.defaultCoffee}g</span>
        <span>•</span>
        <span>{recipe.defaultWater}g</span>
        {recipe.defaultIce && (
          <>
            <span>•</span>
            <span className="text-cyan-400">冰塊 {recipe.defaultIce}g</span>
          </>
        )}
        <span>•</span>
        <span>{recipe.temperature}°C</span>
        <span>•</span>
        <span>{formatTime(recipe.totalTimeSeconds)}</span>
        <span>•</span>
        <span>{recipe.ratio}</span>
      </div>

      {/* Proportional Timeline Bar */}
      <div className="flex items-center gap-1 w-full h-2 mb-4 bg-[#26221d] rounded-full p-0.5 overflow-hidden">
        {recipe.steps.map((step, idx) => {
          const widthPercent = Math.max(5, (step.duration / totalDuration) * 100);
          const isPour = step.type === 'pour';
          return (
            <div
              key={idx}
              title={`${step.title} (${step.duration}s)`}
              style={{ width: `${widthPercent}%` }}
              className={`h-full rounded-sm transition-all ${
                isPour ? 'bg-[#d4a373]' : 'bg-[#52483d]'
              }`}
            />
          );
        })}
      </div>

      {/* Recipe summary */}
      <p className="text-sm text-[#cdc4b7] leading-relaxed mb-4">
        {recipe.summary}
      </p>

      {/* Flavor & Grind Advice */}
      <div className="space-y-2 mb-5 text-xs">
        <div>
          <span className="text-[#a89887] font-medium block mb-0.5">研磨與風味</span>
          <p className="text-[#9e9486] leading-relaxed">{recipe.grindAndFlavor}</p>
        </div>
        <div>
          <span className="text-[#a89887] font-medium block mb-0.5">豆子搭配</span>
          <p className="text-[#9e9486] leading-relaxed">{recipe.beanPairing}</p>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onSelect(recipe)}
        className="w-full py-3 px-4 bg-[#d4a373] hover:bg-[#e0b284] active:bg-[#c49261] text-[#1c140d] font-bold text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-md hover:shadow-[#d4a373]/20"
      >
        <span>開始沖煮</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
