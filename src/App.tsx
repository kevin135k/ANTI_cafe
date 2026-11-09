import { useState, useEffect, useRef } from 'react';
import { RECIPES } from './data/recipes';
import type { Recipe, ScaledStep, BrewerType } from './types/recipe';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailView } from './components/RecipeDetailView';
import { BrewingTimerView } from './components/BrewingTimerView';
import { Coffee, Search, ChevronLeft } from 'lucide-react';

export function App() {
  const [selectedCategory, setSelectedCategory] = useState<BrewerType>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Navigation state
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<'library' | 'detail' | 'timer'>('library');

  // Swipe gesture state
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; isEdge: boolean } | null>(null);

  // Brewing state
  const [brewConfig, setBrewConfig] = useState<{
    coffeeAmount: number;
    waterAmount: number;
    scaledSteps: ScaledStep[];
    beanName: string;
  } | null>(null);

  // Edge swipe back gesture (iOS-like swipe from left edge)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Only initiate swipe if touch starts within 40px of left edge
      if (touch.clientX <= 45 && viewMode !== 'library') {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          isEdge: true,
        };
      } else {
        touchStartRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || !touchStartRef.current.isEdge) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      // Horizontal dominant swipe to the right
      if (deltaX > 0 && deltaX > deltaY) {
        setSwipeOffset(Math.min(deltaX, 150));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || !touchStartRef.current.isEdge) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      if (deltaX > 75 && deltaX > deltaY) {
        // Trigger back action
        if (viewMode === 'timer') {
          setViewMode('detail');
        } else if (viewMode === 'detail') {
          setViewMode('library');
        }
      }

      setSwipeOffset(0);
      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [viewMode]);

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
    <div className="min-h-screen bg-[#151311] text-[#e8e2d8] relative select-none">
      {/* Swipe Back Indicator Hint */}
      {swipeOffset > 15 && (
        <div
          style={{ transform: `translateX(${swipeOffset * 0.4}px)` }}
          className="fixed left-2 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-[#d4a373] text-[#140e08] flex items-center justify-center shadow-xl transition-transform"
        >
          <ChevronLeft size={24} />
        </div>
      )}

      {/* View 1: Recipe Library (模板庫) */}
      {viewMode === 'library' && (
        <div className="max-w-xl mx-auto pb-10">
          {/* Sticky Header: Title + Search Bar + Category Pills */}
          <div className="sticky top-0 z-30 bg-[#151311]/95 backdrop-blur-md px-4 pt-4 pb-2 border-b border-[#292520] shadow-md">
            {/* Title Bar */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#29231c] border border-[#3d3429] flex items-center justify-center text-[#d4a373]">
                  <Coffee size={22} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#f5efe6] tracking-wide">
                  模板庫
                </h1>
              </div>
              <span className="text-xs sm:text-sm text-[#8f8374] px-3 py-1 rounded-full bg-[#1f1c18] border border-[#2e2923]">
                {RECIPES.length} 款手沖配方
              </span>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#807669]"
              />
              <input
                type="text"
                placeholder="搜尋配方、濾杯或沖煮作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1c1a17] border border-[#2e2a25] rounded-xl pl-11 pr-4 py-3 text-base text-[#e8e2d8] placeholder-[#736a5e] focus:outline-none focus:border-[#d4a373] transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {(['All', 'V60', 'Kalita Wave', 'Origami', '冰手沖'] as BrewerType[]).map(
                (category) => {
                  const isSelected = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap transition-all duration-150 ${
                        isSelected
                          ? 'bg-[#d4a373] text-[#1c140d] font-bold shadow-sm'
                          : 'bg-[#211e1a] hover:bg-[#2b2722] text-[#9c9183] border border-[#2e2924]'
                      }`}
                    >
                      {category === 'All' ? '全部配方' : category}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Recipe List */}
          <div className="px-4 pt-4 space-y-4">
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={handleSelectRecipe}
                />
              ))
            ) : (
              <div className="py-20 text-center text-[#827668]">
                <p className="text-base">沒有符合條件的沖煮配方</p>
              </div>
            )}
          </div>

          {/* Bottom Footer notes */}
          <div className="mt-8 px-4 pt-6 border-t border-[#26221d] text-center text-xs text-[#6b6256] leading-relaxed space-y-2">
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
          onClose={() => setViewMode('detail')}
        />
      )}
    </div>
  );
}

export default App;
