import { useState, useEffect, useRef, useMemo } from 'react';
import { RECIPES } from './data/recipes';
import type { Recipe, ScaledStep, BrewerType } from './types/recipe';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailView } from './components/RecipeDetailView';
import { BrewingTimerView } from './components/BrewingTimerView';
import { CustomRecipeCreator } from './components/CustomRecipeCreator';
import { Coffee, Search, ChevronLeft, ChevronRight, Sun, Moon, Plus } from 'lucide-react';

export function App() {
  const [selectedCategory, setSelectedCategory] = useState<BrewerType>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Theme state: dark | light (Toggled by clicking the top-left coffee cup icon)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Custom Recipes stored in localStorage
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = localStorage.getItem('anti_cafe_custom_recipes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Navigation state: 'library' | 'detail' | 'timer' | 'custom-creator'
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<'library' | 'detail' | 'timer' | 'custom-creator'>('library');

  // Swipe gesture state
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; edge: 'left' | 'right' | null } | null>(null);

  // Brewing state
  const [brewConfig, setBrewConfig] = useState<{
    coffeeAmount: number;
    waterAmount: number;
    scaledSteps: ScaledStep[];
    beanName: string;
    iceAmount?: number;
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

  // Combine default and custom recipes
  const allRecipes = useMemo(() => {
    return [...customRecipes, ...RECIPES];
  }, [customRecipes]);

  // Compute available categories dynamically
  const categories: BrewerType[] = useMemo(() => {
    const defaultCats = [
      'All',
      '自訂',
      'V60',
      'Chemex',
      'Kalita Wave',
      'Origami',
      '聰明濾杯',
      'Melitta',
      'April',
      '冰手沖',
    ];
    // Gather any additional custom drippers from custom recipes
    const customCats = customRecipes
      .map((r) => r.category)
      .filter((c) => !defaultCats.includes(c));

    return [...defaultCats, ...Array.from(new Set(customCats))];
  }, [customRecipes]);

  // Dual Edge Swipe Navigation:
  // Restricted strictly to 'library' and 'detail' (準備這一杯).
  // Disabled when in 'timer', 'custom-creator', or when the Picker modal is open.
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Disabled in timer or custom creator
      if (viewMode === 'timer' || viewMode === 'custom-creator') {
        touchStartRef.current = null;
        return;
      }

      // Disabled when adjusting grams / water (picker modal is open)
      if (document.querySelector('[data-picker-modal]')) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.touches[0];
      const winW = window.innerWidth;

      if (touch.clientX <= 45 && viewMode === 'detail') {
        // Left edge swipe inward in 'detail' -> Return to 'library'
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, edge: 'left' };
      } else if (touch.clientX >= winW - 45 && viewMode === 'library' && activeRecipe) {
        // Right edge swipe inward in 'library' -> Go to active recipe 'detail'
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, edge: 'right' };
      } else {
        touchStartRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || !touchStartRef.current.edge) return;
      if (viewMode === 'timer' || viewMode === 'custom-creator' || document.querySelector('[data-picker-modal]')) {
        touchStartRef.current = null;
        setSwipeOffset(0);
        return;
      }

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      if (touchStartRef.current.edge === 'left' && deltaX > 0 && deltaX > deltaY) {
        setSwipeOffset(Math.min(deltaX, 100));
      } else if (touchStartRef.current.edge === 'right' && deltaX < 0 && Math.abs(deltaX) > deltaY) {
        setSwipeOffset(Math.max(deltaX, -100));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || !touchStartRef.current.edge) return;
      if (viewMode === 'timer' || viewMode === 'custom-creator' || document.querySelector('[data-picker-modal]')) {
        touchStartRef.current = null;
        setSwipeOffset(0);
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      if (touchStartRef.current.edge === 'left' && deltaX > 65 && deltaX > deltaY) {
        // Back navigation (detail -> library)
        if (viewMode === 'detail') {
          setViewMode('library');
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
      } else if (touchStartRef.current.edge === 'right' && deltaX < -65 && Math.abs(deltaX) > deltaY) {
        // Next navigation (library -> activeRecipe detail)
        if (viewMode === 'library' && activeRecipe) {
          setViewMode('detail');
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
  const filteredRecipes = allRecipes.filter((r) => {
    let matchesCategory = false;
    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === '自訂') {
      matchesCategory = Boolean(r.isCustom);
    } else if (selectedCategory === '冰手沖') {
      matchesCategory = r.category === '冰手沖' || Boolean(r.defaultIce && r.defaultIce > 0);
    } else {
      matchesCategory = r.category === selectedCategory;
    }

    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referenceAuthor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleSelectRecipe = (recipe: Recipe) => {
    setActiveRecipe(recipe);
    setViewMode('detail');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleCategoryChange = (cat: BrewerType) => {
    setSelectedCategory(cat);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleStartBrewing = (
    recipe: Recipe,
    coffeeAmount: number,
    waterAmount: number,
    scaledSteps: ScaledStep[],
    beanName: string,
    iceAmount?: number
  ) => {
    setActiveRecipe(recipe);
    setBrewConfig({
      coffeeAmount,
      waterAmount,
      scaledSteps,
      beanName,
      iceAmount,
    });
    setViewMode('timer');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Custom Recipe Persistence
  const handleSaveCustomRecipe = (recipe: Recipe) => {
    setCustomRecipes((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === recipe.id || r.name === recipe.name);
      let updated: Recipe[];
      if (existingIdx !== -1) {
        updated = [...prev];
        updated[existingIdx] = recipe;
      } else {
        updated = [recipe, ...prev];
      }
      try {
        localStorage.setItem('anti_cafe_custom_recipes', JSON.stringify(updated));
      } catch {
        // storage fallback
      }
      return updated;
    });

    setActiveRecipe(recipe);
    setViewMode('detail');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleDeleteCustomRecipe = (recipeId: string) => {
    setCustomRecipes((prev) => {
      const updated = prev.filter((r) => r.id !== recipeId);
      try {
        localStorage.setItem('anti_cafe_custom_recipes', JSON.stringify(updated));
      } catch {
        // storage fallback
      }
      return updated;
    });

    if (activeRecipe?.id === recipeId) {
      setActiveRecipe(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] relative select-none">
      {/* Swipe Feedback Hints */}
      {swipeOffset > 15 && (
        <div
          style={{ transform: `translateX(${swipeOffset * 0.4}px)` }}
          className="fixed left-2 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full liquid-glass flex items-center justify-center shadow-xl transition-transform"
        >
          <ChevronLeft size={22} />
        </div>
      )}
      {swipeOffset < -15 && (
        <div
          style={{ transform: `translateX(${swipeOffset * 0.4}px)` }}
          className="fixed right-2 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full liquid-glass flex items-center justify-center shadow-xl transition-transform"
        >
          <ChevronRight size={22} />
        </div>
      )}

      {/* View 1: Recipe Library (模板庫) */}
      {viewMode === 'library' && (
        <div className="max-w-md mx-auto pb-12 fade-enter">
          {/* Sticky Header with iPhone Status Bar Clearance */}
          <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-md safe-top px-4 pb-2 border-b border-[var(--border-color)] shadow-xs">
            {/* Title Bar */}
            <div className="flex items-center justify-between mb-2.5 pt-1">
              <div className="flex items-center gap-2.5">
                {/* Coffee Cup Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  title="點擊切換深色/淺色模式"
                  className="w-10 h-10 rounded-2xl liquid-glass-secondary flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-sm relative group"
                >
                  <Coffee size={20} />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--accent-coffee)] text-[9px] text-white dark:text-[#1a1208] flex items-center justify-center font-bold">
                    {theme === 'dark' ? <Sun size={8} /> : <Moon size={8} />}
                  </span>
                </button>
                <h1 className="text-2xl font-serif font-bold text-[var(--text-main)] tracking-wide">
                  模板庫
                </h1>
              </div>

              {/* Action Buttons: Add Recipe & Quick Return Badge */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setViewMode('custom-creator');
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                  className="px-3 py-1.5 rounded-full liquid-glass text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer active:scale-95"
                >
                  <Plus size={14} />
                  <span>新增配方</span>
                </button>

                {activeRecipe && (
                  <button
                    onClick={() => {
                      setViewMode('detail');
                      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    }}
                    className="text-xs text-[var(--accent-coffee)] px-3 py-1.5 rounded-full liquid-glass-secondary flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <span className="truncate max-w-[80px]">{activeRecipe.name}</span>
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-2.5">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                placeholder="搜尋配方、濾杯或作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-2 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coffee)] transition-colors"
              />
            </div>

            {/* Category Filter Pills (Liquid Glass Style with Custom Filter & Add) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3.5 py-1 text-xs rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'liquid-glass font-bold shadow-md'
                        : 'liquid-glass-secondary text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {category === 'All' ? '全部配方' : category}
                  </button>
                );
              })}

              {/* <新增> Pill */}
              <button
                onClick={() => {
                  setViewMode('custom-creator');
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }}
                className="px-3.5 py-1 text-xs rounded-full whitespace-nowrap liquid-glass-secondary text-[var(--accent-coffee)] hover:text-[var(--text-main)] flex items-center gap-1 cursor-pointer"
              >
                <Plus size={11} />
                <span>新增</span>
              </button>
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
                  onDelete={recipe.isCustom ? handleDeleteCustomRecipe : undefined}
                />
              ))
            ) : (
              <div className="py-20 text-center text-[var(--text-muted)]">
                <p className="text-sm">沒有符合條件的沖煮配方</p>
                {selectedCategory === '自訂' && (
                  <button
                    onClick={() => setViewMode('custom-creator')}
                    className="mt-4 px-4 py-2 rounded-2xl liquid-glass text-xs font-bold cursor-pointer"
                  >
                    建立第一個自訂配方
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Footer notes */}
          <div className="mt-8 px-4 pt-6 border-t border-[var(--border-color)] text-center text-[11px] text-[var(--text-muted)] leading-relaxed space-y-1">
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
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
          iceAmount={brewConfig.iceAmount}
          onClose={() => {
            setViewMode('detail');
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }}
        />
      )}

      {/* View 4: Custom Recipe Creator (自訂食譜) */}
      {viewMode === 'custom-creator' && (
        <CustomRecipeCreator
          onBack={() => {
            setViewMode('library');
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }}
          onSave={handleSaveCustomRecipe}
          existingRecipes={allRecipes}
        />
      )}
    </div>
  );
}

export default App;
