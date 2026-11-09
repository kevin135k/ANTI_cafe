import { useState } from 'react';
import { RECIPES } from './data/recipes';
import type { Recipe, ScaledStep, BrewerType } from './types/recipe';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailView } from './components/RecipeDetailView';
import { BrewingTimerView } from './components/BrewingTimerView';
import { Coffee, Search } from 'lucide-react';

export function App() {
  const [selectedCategory, setSelectedCategory] = useState<BrewerType>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Navigation state
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<'library' | 'detail' | 'timer'>('library');

  // Brewing state
  const [brewConfig, setBrewConfig] = useState<{
    coffeeAmount: number;
    waterAmount: number;
    scaledSteps: ScaledStep[];
    beanName: string;
  } | null>(null);

  // Filter recipes
  const filteredRecipes = RECIPES.filter((r) => {
    const matchesCategory =
      selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referenceAuthor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectRecipe = (recipe: Recipe) => {
    setActiveRecipe(recipe);
    setViewMode('detail');
  };

  const handleStartBrewing = (
    recipe: Recipe,
    coffeeAmount: number,
    waterAmount: number,
    scaledSteps: ScaledStep[],
    beanName: string
  ) => {
    setActiveRecipe(recipe);
    setBrewConfig({
      coffeeAmount,
      waterAmount,
      scaledSteps,
      beanName,
    });
    setViewMode('timer');
  };

  return (
    <div className="min-h-screen bg-[#151311] text-[#e8e2d8]">
      {/* View 1: Recipe Library (模板庫) */}
      {viewMode === 'library' && (
        <div className="max-w-xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#29231c] border border-[#3d3429] flex items-center justify-center text-[#d4a373]">
                <Coffee size={20} />
              </div>
              <h1 className="text-2xl font-serif font-bold text-[#f5efe6] tracking-wide">
                模板庫
              </h1>
            </div>
            <span className="text-xs text-[#8f8374] px-2.5 py-1 rounded-full bg-[#1f1c18] border border-[#2e2923]">
              {RECIPES.length} 款手沖配方
            </span>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#807669]"
            />
            <input
              type="text"
              placeholder="搜尋配方、濾杯或沖煮作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c1a17] border border-[#2e2a25] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e8e2d8] placeholder-[#736a5e] focus:outline-none focus:border-[#d4a373] transition-colors"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
            {(['All', 'V60', 'Kalita Wave', 'Origami', '冰手沖'] as BrewerType[]).map(
              (category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#d4a373] text-[#1c140d] font-semibold shadow-sm'
                        : 'bg-[#211e1a] hover:bg-[#2b2722] text-[#9c9183] border border-[#2e2924]'
                    }`}
                  >
                    {category === 'All' ? '全部配方' : category}
                  </button>
                );
              }
            )}
          </div>

          {/* Recipe List */}
          <div className="space-y-4">
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={handleSelectRecipe}
                />
              ))
            ) : (
              <div className="py-16 text-center text-[#827668]">
                <p className="text-sm">沒有符合條件的沖煮配方</p>
              </div>
            )}
          </div>

          {/* Bottom Footer notes matching screenshot */}
          <div className="mt-8 pt-6 border-t border-[#26221d] text-center text-[11px] text-[#6b6256] leading-relaxed space-y-2">
            <p>
              參數依各作者公開發表的配方整理。請依烘焙度與口味調整粉量、水溫與研磨度。
            </p>
            <p>
              內建沖煮模板僅供學習與參考。個人專屬 PWA 工具。
            </p>
          </div>
        </div>
      )}

      {/* View 2: Recipe Detail & Preparation (準備這一杯) */}
      {viewMode === 'detail' && activeRecipe && (
        <RecipeDetailView
          recipe={activeRecipe}
          onBack={() => setViewMode('library')}
          onStartBrewing={handleStartBrewing}
        />
      )}

      {/* View 3: Brewing Timer (沖煮計時器 - IMG_6872) */}
      {viewMode === 'timer' && activeRecipe && brewConfig && (
        <BrewingTimerView
          recipe={activeRecipe}
          coffeeAmount={brewConfig.coffeeAmount}
          waterAmount={brewConfig.waterAmount}
          scaledSteps={brewConfig.scaledSteps}
          beanName={brewConfig.beanName}
          onClose={() => setViewMode('detail')}
        />
      )}
    </div>
  );
}

export default App;
