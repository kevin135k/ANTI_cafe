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
    <div className="bg-[#1c1916] border border-[#2b2722] hover:border-[#473d32] rounded-3xl p-5 transition-all duration-150 shadow-md text-left">
      {/* Top badges */}
      <div className="flex items-center justify-between mb-2">
        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#29231c] text-[#c9bfae] border border-[#3b3327]">
          {recipe.category}
        </span>
        <span className="text-xs text-[#9c9183] truncate max-w-[190px]">
          {recipe.referenceAuthor}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-serif-num font-bold text-[#f5efe6] mb-2 tracking-wide">
        {recipe.name}
      </h3>

      {/* Meta Specs Bar */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#b0a494] mb-3">
        <span className="font-medium text-[#f0eae1]">{recipe.defaultCoffee}g</span>
        <span>•</span>
        <span className="font-medium text-[#f0eae1]">{recipe.defaultWater}g</span>
        {recipe.defaultIce && (
          <>
            <span>•</span>
            <span className="text-cyan-400 font-medium">冰塊 {recipe.defaultIce}g</span>
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
      <div className="flex items-center gap-1 w-full h-2 mb-3.5 bg-[#26211c] rounded-full p-0.5 overflow-hidden">
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
      <p className="text-sm text-[#cdc4b7] leading-relaxed mb-3.5">
        {recipe.summary}
      </p>

      {/* Flavor & Grind Advice */}
      <div className="space-y-1.5 mb-4 text-xs">
        <div>
          <span className="text-[#bfa993] font-semibold block mb-0.5">研磨與風味</span>
          <p className="text-[#a69c8e] leading-relaxed">{recipe.grindAndFlavor}</p>
        </div>
        <div>
          <span className="text-[#bfa993] font-semibold block mb-0.5">豆子搭配</span>
          <p className="text-[#a69c8e] leading-relaxed">{recipe.beanPairing}</p>
        </div>
      </div>

      {/* Action Button: Consistent Liquid Glass Style */}
      <button
        onClick={() => onSelect(recipe)}
        className="w-full py-3.5 px-4 liquid-glass text-[#150f08] font-bold text-sm rounded-2xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
      >
        <span>開始沖煮</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
