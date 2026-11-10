import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Recipe, ScaledStep } from '../types/recipe';
import { ChevronLeft, Play } from 'lucide-react';
import { PickerWheel } from './PickerWheel';

interface RecipeDetailViewProps {
  recipe: Recipe;
  onBack: () => void;
  onStartBrewing: (
    recipe: Recipe,
    coffeeAmount: number,
    waterAmount: number,
    scaledSteps: ScaledStep[],
    beanName: string
  ) => void;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({
  recipe,
  onBack,
  onStartBrewing,
}) => {
  const [coffeeAmount, setCoffeeAmount] = useState<number>(recipe.defaultCoffee);
  const [waterAmount, setWaterAmount] = useState<number>(recipe.defaultWater);
  // Track scroll state for dynamic navbar title transition
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Guarantee page scrolls to top on entering recipe
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [recipe.id]);

  // Scroll listener to crossfade "準備這一杯" <-> recipe.name
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollY > 35);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ratio calculation: water per 1g coffee
  const baseRatio = recipe.defaultWater / recipe.defaultCoffee;

  // Scale calculations
  const handleCoffeeChange = (value: number) => {
    if (isNaN(value) || value <= 0) return;
    setCoffeeAmount(value);
    const calculatedWater = Math.round(value * baseRatio);
    setWaterAmount(calculatedWater);
  };

  const handleWaterChange = (value: number) => {
    if (isNaN(value) || value <= 0) return;
    setWaterAmount(value);
    const calculatedCoffee = Math.round((value / baseRatio) * 10) / 10;
    setCoffeeAmount(calculatedCoffee);
  };

  // Compute scaled steps
  const scaledSteps: ScaledStep[] = useMemo(() => {
    const scaleFactor =
      (waterAmount > 0 ? waterAmount : recipe.defaultWater) / recipe.defaultWater;
    let accumulated = 0;

    return recipe.steps.map((step, idx) => {
      let scaledWater = 0;
      if (step.waterAmount > 0) {
        scaledWater = Math.round(step.waterAmount * scaleFactor);
        accumulated += scaledWater;
      }

      return {
        ...step,
        stepNumber: idx + 1,
        scaledWater,
        accumulatedWater: accumulated,
      };
    });
  }, [recipe, waterAmount]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] pb-36 fade-enter relative">
      {/* Top Navbar: Sticky with Safe Area padding */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-md safe-top border-b border-[var(--border-color)] px-4 pb-3 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full liquid-glass-secondary flex items-center justify-center transition-colors cursor-pointer shrink-0"
          aria-label="返回"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Dynamic Center Title with Smooth Fade-in/Fade-out on Scroll */}
        <div className="relative flex-1 text-center h-7 flex items-center justify-center overflow-hidden px-2">
          {/* Top State: "準備這一杯" */}
          <span
            className={`absolute transition-all duration-300 font-medium text-base text-[var(--text-main)] ${
              isScrolled
                ? 'opacity-0 -translate-y-3 pointer-events-none'
                : 'opacity-100 translate-y-0'
            }`}
          >
            準備這一杯
          </span>

          {/* Scrolled Down State: Recipe Name */}
          <span
            className={`absolute transition-all duration-300 font-serif font-bold text-base text-[var(--accent-coffee)] truncate max-w-[200px] ${
              isScrolled
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3 pointer-events-none'
            }`}
          >
            {recipe.name}
          </span>
        </div>

        <div className="w-10 shrink-0" />
      </div>

      <div className="max-w-md mx-auto px-5 pt-4 text-left">
        {/* Main Title Section: Removed "沖一杯" text and removed subtitle */}
        <div className="mb-5">
          <h1 className="text-3xl font-serif font-bold text-[var(--text-main)] mb-2 tracking-wide">
            {recipe.name}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">{recipe.defaultCoffee} g</span>
            <span>•</span>
            <span className="font-semibold text-[var(--text-main)]">{recipe.defaultWater} g</span>
            {recipe.defaultIce && (
              <>
                <span>•</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                  冰塊 {recipe.defaultIce} g
                </span>
              </>
            )}
            <span>•</span>
            <span>{recipe.temperature} °C</span>
            <span>•</span>
            <span>{formatSeconds(recipe.totalTimeSeconds)}</span>
          </div>
        </div>

        {/* Adjust Brew Parameters Section with Tap-to-Pop Floating Picker Modal */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 mb-6 shadow-md">
          <h3 className="text-base font-serif font-bold text-[var(--text-main)] mb-1">
            調整這一杯
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
            改粉量或總水量，另一項與每段注水會依原配方比例自動換算。只調整這次沖煮，不修改原配方。
          </p>

          {/* Dual Picker Cards */}
          <div className="flex gap-3 mb-3">
            <PickerWheel
              label="粉量"
              value={coffeeAmount}
              min={8}
              max={60}
              step={0.5}
              unit="g"
              onChange={handleCoffeeChange}
            />
            <PickerWheel
              label="總水量"
              value={waterAmount}
              min={100}
              max={900}
              step={5}
              unit="g"
              onChange={handleWaterChange}
            />
          </div>

          <div className="text-xs text-[var(--text-muted)] flex items-center justify-between pt-1">
            <span>維持原配方粉水比 {recipe.ratio}</span>
            {coffeeAmount !== recipe.defaultCoffee && (
              <button
                onClick={() => {
                  setCoffeeAmount(recipe.defaultCoffee);
                  setWaterAmount(recipe.defaultWater);
                }}
                className="text-[var(--accent-coffee)] hover:underline text-xs cursor-pointer font-medium"
              >
                重設回預設
              </button>
            )}
          </div>
        </div>

        {/* Steps List */}
        <div className="mb-6">
          <h3 className="text-base font-serif font-bold text-[var(--text-main)] mb-3">
            本次沖煮步驟
          </h3>

          <div className="divide-y divide-[var(--border-color)] border-t border-b border-[var(--border-color)]">
            {scaledSteps.map((step) => {
              const isWait = step.type === 'wait' || step.scaledWater === 0;
              return (
                <div key={step.id} className="py-3 flex flex-col gap-1">
                  <span className="text-sm font-medium text-[var(--text-main)]">
                    步驟 {step.stepNumber} · {step.title}
                  </span>

                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                    {isWait ? (
                      <span>等待 {formatSeconds(step.duration)}</span>
                    ) : (
                      <>
                        <span className="text-[var(--accent-coffee)] font-medium">
                          本段 +{step.scaledWater}g
                        </span>
                        <span>•</span>
                        <span>累計注水 {step.accumulatedWater}g</span>
                        <span>•</span>
                        <span>{formatSeconds(step.duration)}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-[var(--text-muted)] mt-3.5 leading-relaxed">
            水溫與步驟時間沿用原配方，實際流速可視豆子與器材調整。用量會四捨五入。
          </p>
        </div>
      </div>

      {/* Persistent Floating "開始計時" Action Button - Portaled directly to body to guarantee screen viewport bottom placement */}
      {createPortal(
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none safe-bottom">
          <button
            onClick={() =>
              onStartBrewing(
                recipe,
                coffeeAmount,
                waterAmount,
                scaledSteps,
                ''
              )
            }
            className="pointer-events-auto px-7 py-3.5 rounded-full liquid-glass font-bold text-base flex items-center gap-2.5 transition-all cursor-pointer shadow-xl active:scale-95"
          >
            <Play size={18} fill="currentColor" />
            <span>開始計時</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};
export default RecipeDetailView;
