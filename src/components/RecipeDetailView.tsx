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
    beanName: string,
    iceAmount?: number
  ) => void;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({
  recipe,
  onBack,
  onStartBrewing,
}) => {
  const [coffeeAmount, setCoffeeAmount] = useState<number>(recipe.defaultCoffee);
  const [waterAmount, setWaterAmount] = useState<number>(recipe.defaultWater);
  const [iceAmount, setIceAmount] = useState<number>(recipe.defaultIce || 0);

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

  const defaultIce = recipe.defaultIce || 0;
  const hasIce = defaultIce > 0;

  // Total liquid ratio: (water + ice) / coffee
  const baseTotalLiquid = recipe.defaultWater + defaultIce;
  const baseTotalRatio = baseTotalLiquid / recipe.defaultCoffee;
  const waterShare = baseTotalLiquid > 0 ? recipe.defaultWater / baseTotalLiquid : 1;

  // Scale calculations with Ice taken into account
  const handleCoffeeChange = (value: number) => {
    if (isNaN(value) || value <= 0) return;
    setCoffeeAmount(value);
    if (hasIce && baseTotalLiquid > 0) {
      const totalLiquid = Math.round(value * baseTotalRatio);
      const newWater = Math.round(totalLiquid * waterShare);
      const newIce = totalLiquid - newWater;
      setWaterAmount(newWater);
      setIceAmount(newIce);
    } else {
      const calculatedWater = Math.round(value * (recipe.defaultWater / recipe.defaultCoffee));
      setWaterAmount(calculatedWater);
    }
  };

  const handleWaterChange = (value: number) => {
    if (isNaN(value) || value <= 0) return;
    setWaterAmount(value);
    if (hasIce && recipe.defaultWater > 0) {
      const newIce = Math.round(value * (defaultIce / recipe.defaultWater));
      setIceAmount(newIce);
      const totalLiquid = value + newIce;
      const calculatedCoffee = Math.round((totalLiquid / baseTotalRatio) * 10) / 10;
      setCoffeeAmount(calculatedCoffee);
    } else {
      const calculatedCoffee =
        Math.round((value / (recipe.defaultWater / recipe.defaultCoffee)) * 10) / 10;
      setCoffeeAmount(calculatedCoffee);
    }
  };

  const handleIceChange = (value: number) => {
    if (isNaN(value) || value < 0) return;
    setIceAmount(value);
    const totalLiquid = waterAmount + value;
    const calculatedCoffee = Math.round((totalLiquid / baseTotalRatio) * 10) / 10;
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

      // If step title mentions original ice amount, scale that mention as well
      let title = step.title;
      if (hasIce && defaultIce > 0 && title.includes('冰塊')) {
        title = title.replace(/\d+\s*g\s*冰塊/, `${iceAmount}g 冰塊`);
      }

      return {
        ...step,
        title,
        stepNumber: idx + 1,
        scaledWater,
        accumulatedWater: accumulated,
      };
    });
  }, [recipe, waterAmount, iceAmount, hasIce, defaultIce]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalLiquid = waterAmount + iceAmount;
  const currentRatioText = coffeeAmount > 0 ? (totalLiquid / coffeeAmount).toFixed(1) : '0';

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
        {/* Main Title Section */}
        <div className="mb-5">
          <h1 className="text-3xl font-serif font-bold text-[var(--text-main)] mb-2 tracking-wide">
            {recipe.name}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">{recipe.defaultCoffee} g</span>
            <span>•</span>
            <span className="font-semibold text-[var(--text-main)]">
              {hasIce ? `熱水 ${recipe.defaultWater} g` : `${recipe.defaultWater} g`}
            </span>
            {hasIce && (
              <>
                <span>•</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                  冰塊 {defaultIce} g
                </span>
                <span>•</span>
                <span className="font-semibold text-[var(--text-main)]">
                  總液量 {baseTotalLiquid} g
                </span>
              </>
            )}
            <span>•</span>
            <span>{recipe.temperature} °C</span>
            <span>•</span>
            <span>{formatSeconds(recipe.totalTimeSeconds)}</span>
            <span>•</span>
            <span className="text-[var(--accent-coffee)] font-medium">
              1:{(baseTotalLiquid / recipe.defaultCoffee).toFixed(1)}{hasIce ? ' (含冰)' : ''}
            </span>
          </div>
        </div>

        {/* Adjust Brew Parameters Section with Tap-to-Pop Floating Picker Modal */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 mb-6 shadow-md">
          <h3 className="text-base font-serif font-bold text-[var(--text-main)] mb-1">
            調整這一杯
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
            {hasIce
              ? '修改粉量、熱水或冰塊，各數值與每段注水會依原配方比例（納入冰塊）自動換算。'
              : '改粉量或總水量，另一項與每段注水會依原配方比例自動換算。只調整這次沖煮，不修改原配方。'}
          </p>

          {/* Dual or Triple Picker Cards */}
          <div className="grid grid-cols-2 gap-3 mb-3">
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
              label={hasIce ? "熱水量" : "總水量"}
              value={waterAmount}
              min={50}
              max={900}
              step={5}
              unit="g"
              onChange={handleWaterChange}
            />
            {hasIce && (
              <div className="col-span-2">
                <PickerWheel
                  label="冰塊量"
                  value={iceAmount}
                  min={10}
                  max={400}
                  step={5}
                  unit="g"
                  onChange={handleIceChange}
                />
              </div>
            )}
          </div>

          <div className="text-xs text-[var(--text-muted)] flex items-center justify-between pt-1">
            <span>
              {hasIce
                ? `維持原配方粉水比 1:${currentRatioText}（含冰 ${iceAmount}g + 熱水 ${waterAmount}g）`
                : `維持原配方粉水比 1:${currentRatioText}`}
            </span>
            {(coffeeAmount !== recipe.defaultCoffee ||
              waterAmount !== recipe.defaultWater ||
              (hasIce && iceAmount !== defaultIce)) && (
              <button
                onClick={() => {
                  setCoffeeAmount(recipe.defaultCoffee);
                  setWaterAmount(recipe.defaultWater);
                  if (hasIce) setIceAmount(defaultIce);
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

      {/* Persistent Floating "開始計時" Action Button */}
      {createPortal(
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none safe-bottom">
          <button
            onClick={() =>
              onStartBrewing(
                recipe,
                coffeeAmount,
                waterAmount,
                scaledSteps,
                '',
                hasIce ? iceAmount : undefined
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
