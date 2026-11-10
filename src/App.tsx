import { useState, useEffect, useRef } from 'react';
import { RECIPES } from './data/recipes';
import type { Recipe, ScaledStep, BrewerType } from './types/recipe';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailView } from './components/RecipeDetailView';
import { BrewingTimerView } from './components/BrewingTimerView';
import { Coffee, Search, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';

export function App() {
  const [selectedCategory, setSelectedCategory] = useState<BrewerType>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Theme state: dark | light (Toggled by clicking the top-left coffee cup icon)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Navigation state
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<'library' | 'detail' | 'timer'>('library');

  // Swipe gesture state (Left-edge swipe right for back; Right-edge swipe left for next)
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; edge: 'left' | 'right' | null } | null>(null);

  // Brewing state
  const [brewConfig, setBrewConfig] = useState<{
    coffeeAmount: number;
    waterAmount: number;
    scaledSteps: ScaledStep[];
    beanName: string;
  } | null>(null);

  // Apply theme class to <html>
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Dual Edge Swipe Navigation (Left-edge: Back; Right-edge: Next)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const winW = window.innerWidth;

      if (touch.clientX <= 45 && viewMode !== 'library') {
        // Left edge swipe -> Go back
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, edge: 'left' };
      } else if (touch.clientX >= winW - 45 && viewMode === 'library' && activeRecipe) {
        // Right edge swipe -> Go next (Return to previously selected recipe)
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, edge: 'right' };
      } else {
        touchStartRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || !touchStartRef.current.edge) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      if (touchStartRef.current.edge === 'left' && deltaX > 0 && deltaX > deltaY) {
        setSwipeOffset(Math.min(deltaX, 120));
      } else if (touchStartRef.current.edge === 'right' && deltaX < 0 && Math.abs(deltaX) > deltaY) {
        setSwipeOffset(Math.max(deltaX, -120));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || !touchStartRef.current.edge) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      if (touchStartRef.current.edge === 'left' && deltaX > 70 && deltaX > deltaY) {
        // Back navigation
        if (viewMode === 'timer') {
          setViewMode('detail');
        } else if (viewMode === 'detail') {
          setViewMode('library');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (touchStartRef.current.edge === 'right' && deltaX < -70 && Math.abs(deltaX) > deltaY) {
        // Next navigation (library -> return to activeRecipe)
        if (viewMode === 'library' && activeRecipe) {
          setViewMode('detail');
          window.scrollTo({ top: 0, behavior: 'smooth' });
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
  }, [viewMode, activeRecipe]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (cat: BrewerType) => {
    setSelectedCategory(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] relative select-none">
      {/* Swipe Feedback Hints */}
      {swipeOffset > 15 && (
        <div
          style={{ transform: `translateX(${swipeOffset * 0.4}px)` }}
          className="fixed left-2 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full liquid-glass text-[#1a1208] flex items-center justify-center shadow-2xl transition-transform"
        >
          <ChevronLeft size={22} />
        </div>
      )}
      {swipeOffset < -15 && (
        <div
          style={{ transform: `translateX(${swipeOffset * 0.4}px)` }}
          className="fixed right-2 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full liquid-glass text-[#1a1208] flex items-center justify-center shadow-2xl transition-transform"
        >
          <ChevronRight size={22} />
        </div>
      )}

      {/* View 1: Recipe Library (模板庫) */}
      {viewMode === 'library' && (
        <div className="max-w-md mx-auto pb-12 fade-enter safe-top">
          {/* Sticky Header with iPhone Status Bar Clearance */}
          <div className="sticky top-0 z-30 bg-[#13110f]/95 dark:bg-[#13110f]/95 backdrop-blur-md px-4 pt-3 pb-2 border-b border-[#292520] shadow-sm">
            {/* Title Bar */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                {/* Coffee Cup Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  title="點擊切換深色/淺色模式"
                  className="w-10 h-10 rounded-2xl liquid-glass-secondary flex items-center justify-center text-[#d4a373] transition-transform active:scale-90 cursor-pointer shadow-sm relative group"
                >
                  <Coffee size={20} />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#d4a373] text-[9px] text-[#1a1208] flex items-center justify-center font-bold">
                    {theme === 'dark' ? <Sun size={8} /> : <Moon size={8} />}
                  </span>
                </button>
                <h1 className="text-2xl font-serif-num font-bold text-[#f5efe6] tracking-wide">
                  模板庫
                </h1>
              </div>

              {/* Previously viewed quick return badge */}
              {activeRecipe ? (
                <button
                  onClick={() => {
                    setViewMode('detail');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs text-[#d4a373] px-3 py-1 rounded-full liquid-glass-secondary flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <span className="truncate max-w-[90px]">{activeRecipe.name}</span>
                  <ChevronRight size={13} />
                </button>
              ) : (
                <span className="text-xs text-[#8f8374] px-2.5 py-1 rounded-full liquid-glass-secondary">
                  {RECIPES.length} 款手沖配方
                </span>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative mb-2.5">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#807669]"
              />
              <input
                type="text"
                placeholder="搜尋配方、濾杯或沖煮作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1c1a17] border border-[#2e2a25] rounded-xl pl-10 pr-4 py-2 text-sm text-[#e8e2d8] placeholder-[#736a5e] focus:outline-none focus:border-[#d4a373] transition-colors"
              />
            </div>

            {/* Category Filter Pills (Liquid Glass Style) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(['All', 'V60', 'Kalita Wave', 'Origami', '冰手沖'] as BrewerType[]).map(
                (category) => {
                  const isSelected = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`px-3.5 py-1 text-xs rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'liquid-glass text-[#150f08] font-bold shadow'
                          : 'liquid-glass-secondary text-[#9c9183] hover:text-[#f0eae1]'
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
                <p className="text-sm">沒有符合條件的沖煮配方</p>
              </div>
            )}
          </div>

          {/* Bottom Footer notes */}
          <div className="mt-8 px-4 pt-6 border-t border-[#26221d] text-center text-[11px] text-[#6b6256] leading-relaxed space-y-1">
            <p>
              參數依各作者公開發表的配方整理。請依烘焙度與口味調整粉量、水溫與研磨度。
            </p>
            <p>
              向左滑動右邊緣可快速重回剛才選擇的食譜。
            </p>
          </div>
        </div>
      )}

      {/* View 2: Recipe Detail & Preparation (準備這一杯) */}
      {viewMode === 'detail' && activeRecipe && (
        <RecipeDetailView
          recipe={activeRecipe}
          onBack={() => {
            setViewMode('library');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onStartBrewing={handleStartBrewing}
        />
      )}

      {/* View 3: Brewing Timer (沖煮計時器) */}
      {viewMode === 'timer' && activeRecipe && brewConfig && (
        <BrewingTimerView
          recipe={activeRecipe}
          coffeeAmount={brewConfig.coffeeAmount}
          waterAmount={brewConfig.waterAmount}
          scaledSteps={brewConfig.scaledSteps}
          onClose={() => {
            setViewMode('detail');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}

export default App;
