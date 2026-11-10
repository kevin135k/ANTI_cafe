import React, { useState, useMemo } from 'react';
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
    const scaleFactor = (waterAmount > 0 ? waterAmount : recipe.defaultWater) / recipe.defaultWater;
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
    <div className="min-h-screen bg-[#151311] dark:bg-[#151311] text-[#e8e2d8] pb-32 fade-enter safe-top">
      {/* Top Navbar with iPhone status bar padding */}
      <div className="sticky top-0 z-20 bg-[#151311]/90 backdrop-blur-md border-b border-[#292520] px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full liquid-glass-secondary flex items-center justify-center text-[#d4a373] transition-colors cursor-pointer"
          aria-label="返回"
        >
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-base font-medium text-[#d9d0c5]">準備這一杯</h2>
        <div className="w-10" />
      </div>

      <div className="max-w-md mx-auto px-5 pt-4 text-left">
        {/* Main Title Section */}
        <div className="mb-5">
          <h1 className="text-3xl font-serif-num font-bold text-[#f5efe6] mb-1">
            沖一杯{recipe.name}
          </h1>
          <p className="text-lg font-serif-num text-[#d4a373] mb-2">{recipe.name}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#a39788]">
            <span>{recipe.defaultCoffee} g</span>
            <span>•</span>
            <span>{recipe.defaultWater} g</span>
            {recipe.defaultIce && (
              <>
                <span>•</span>
                <span className="text-cyan-400">冰塊 {recipe.defaultIce} g</span>
              </>
            )}
            <span>•</span>
            <span>{recipe.temperature} °C</span>
            <span>•</span>
            <span>{formatSeconds(recipe.totalTimeSeconds)}</span>
          </div>
        </div>

        {/* Adjust Brew Parameters Section with Tap-to-Pop Picker Wheel */}
        <div className="bg-[#1c1a17] border border-[#2b2722] rounded-3xl p-5 mb-6 shadow-md">
          <h3 className="text-base font-serif-num font-bold text-[#f5efe6] mb-1">
            調整這一杯
          </h3>
          <p className="text-xs text-[#8c8274] leading-relaxed mb-4">
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

          <div className="text-xs text-[#8a7f72] flex items-center justify-between pt-1">
            <span>維持原配方粉水比 {recipe.ratio}</span>
            {coffeeAmount !== recipe.defaultCoffee && (
              <button
                onClick={() => {
                  setCoffeeAmount(recipe.defaultCoffee);
                  setWaterAmount(recipe.defaultWater);
                }}
                className="text-[#d4a373] hover:underline text-xs cursor-pointer"
              >
                重設回預設
              </button>
            )}
          </div>
        </div>

        {/* Steps List */}
        <div className="mb-6">
          <h3 className="text-base font-serif-num font-bold text-[#f5efe6] mb-3">
            本次沖煮步驟
          </h3>

          <div className="divide-y divide-[#26221d] border-t border-b border-[#26221d]">
            {scaledSteps.map((step) => {
              const isWait = step.type === 'wait' || step.scaledWater === 0;
              return (
                <div key={step.id} className="py-3 flex flex-col gap-1">
                  <span className="text-sm font-medium text-[#e8e2d8]">
                    步驟 {step.stepNumber} · {step.title}
                  </span>

                  <div className="text-xs text-[#8c8275] flex items-center gap-2">
                    {isWait ? (
                      <span>等待 {formatSeconds(step.duration)}</span>
                    ) : (
                      <>
                        <span className="text-[#d4a373] font-medium">
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

          <p className="text-xs text-[#7d7367] mt-3.5 leading-relaxed">
            水溫與步驟時間沿用原配方，實際流速可視豆子與器材調整。用量會四捨五入。
          </p>
        </div>
      </div>

      {/* Floating Liquid Glass "開始計時" Action Button */}
      <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-30 safe-bottom">
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
          className="w-full py-4 px-6 rounded-3xl liquid-glass text-[#150f08] font-serif-num font-bold text-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Play size={20} fill="currentColor" />
          <span>開始計時</span>
        </button>
      </div>
    </div>
  );
};
