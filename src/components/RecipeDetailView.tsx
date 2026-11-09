import React, { useState, useMemo } from 'react';
import type { Recipe, ScaledStep } from '../types/recipe';
import { ChevronLeft, Coffee, Play } from 'lucide-react';

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
  const [beanName, setBeanName] = useState<string>('未指定豆子');
  const [showBeanInput, setShowBeanInput] = useState<boolean>(false);

  // Ratio calculation: water per 1g coffee
  const baseRatio = recipe.defaultWater / recipe.defaultCoffee;

  // Scale calculations
  const handleCoffeeChange = (value: number) => {
    if (isNaN(value) || value <= 0) {
      setCoffeeAmount(value);
      return;
    }
    setCoffeeAmount(value);
    const calculatedWater = Math.round(value * baseRatio);
    setWaterAmount(calculatedWater);
  };

  const handleWaterChange = (value: number) => {
    if (isNaN(value) || value <= 0) {
      setWaterAmount(value);
      return;
    }
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
    <div className="min-h-screen bg-[#151311] text-[#e8e2d8] pb-32">
      {/* Top Navbar */}
      <div className="sticky top-0 z-20 bg-[#151311]/90 backdrop-blur-md border-b border-[#292520] px-4 py-3.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-[#26221d] text-[#b3a898] transition-colors"
          aria-label="返回"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-base font-medium text-[#d9d0c5]">準備這一杯</h2>
        <div className="w-8" />
      </div>

      <div className="max-w-xl mx-auto px-5 pt-4 text-left">
        {/* Main Title Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-[#f5efe6] mb-1">
            沖一杯{recipe.name}
          </h1>
          <p className="text-lg font-serif text-[#d4a373] mb-2">{recipe.name}</p>
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

        {/* Coffee Bean Tag / Selector */}
        <div className="mb-6">
          <p className="text-xs text-[#8f8578] mb-2">
            豆子可以稍後再填，現在不選也能沖。
          </p>
          {showBeanInput ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={beanName === '未指定豆子' ? '' : beanName}
                placeholder="輸入豆子名稱（如：衣索比亞 耶加雪菲）"
                onChange={(e) => setBeanName(e.target.value)}
                className="bg-[#24201c] border border-[#3d372e] rounded-xl px-3.5 py-2 text-sm text-[#f0eae1] focus:outline-none focus:border-[#d4a373] flex-1"
                autoFocus
              />
              <button
                onClick={() => {
                  if (!beanName.trim()) setBeanName('未指定豆子');
                  setShowBeanInput(false);
                }}
                className="px-3 py-2 bg-[#332c25] hover:bg-[#423930] rounded-xl text-xs text-[#d4a373] font-medium"
              >
                完成
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowBeanInput(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2b2621] hover:bg-[#38312b] border border-[#3d362e] text-xs text-[#cfc5b6] transition-colors"
            >
              <Coffee size={14} className="text-[#d4a373]" />
              <span>{beanName}</span>
            </button>
          )}
        </div>

        {/* Adjust Brew Parameters Section */}
        <div className="bg-[#1c1a17] border border-[#2b2722] rounded-2xl p-5 mb-6 shadow-md">
          <h3 className="text-base font-serif font-bold text-[#f5efe6] mb-1.5">
            調整這一杯
          </h3>
          <p className="text-xs text-[#8c8274] leading-relaxed mb-4">
            改粉量或總水量，另一項與每段注水會依原配方比例自動換算。只調整這次沖煮，不修改原配方。
          </p>

          <div className="grid grid-cols-2 gap-4 mb-3">
            {/* Coffee Ground Amount */}
            <div className="bg-[#151311] border border-[#332e27] rounded-xl p-3 focus-within:border-[#d4a373] transition-colors">
              <label className="block text-[11px] text-[#8a7f72] mb-1">
                粉量 (G)
              </label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="100"
                value={coffeeAmount || ''}
                onChange={(e) => handleCoffeeChange(parseFloat(e.target.value))}
                className="w-full bg-transparent font-serif text-2xl text-[#f5efe6] focus:outline-none"
              />
            </div>

            {/* Total Water Amount */}
            <div className="bg-[#151311] border border-[#332e27] rounded-xl p-3 focus-within:border-[#d4a373] transition-colors">
              <label className="block text-[11px] text-[#8a7f72] mb-1">
                總水量 (G)
              </label>
              <input
                type="number"
                step="5"
                min="50"
                max="1500"
                value={waterAmount || ''}
                onChange={(e) => handleWaterChange(parseFloat(e.target.value))}
                className="w-full bg-transparent font-serif text-2xl text-[#f5efe6] focus:outline-none"
              />
            </div>
          </div>

          <div className="text-xs text-[#8a7f72] flex items-center justify-between">
            <span>維持原配方粉水比 {recipe.ratio}</span>
            {coffeeAmount !== recipe.defaultCoffee && (
              <button
                onClick={() => {
                  setCoffeeAmount(recipe.defaultCoffee);
                  setWaterAmount(recipe.defaultWater);
                }}
                className="text-[#d4a373] hover:underline text-[11px]"
              >
                重設回預設
              </button>
            )}
          </div>
        </div>

        {/* Steps List */}
        <div className="mb-8">
          <h3 className="text-base font-serif font-bold text-[#f5efe6] mb-4">
            本次沖煮步驟
          </h3>

          <div className="divide-y divide-[#26221d] border-t border-b border-[#26221d]">
            {scaledSteps.map((step) => {
              const isWait = step.type === 'wait' || step.scaledWater === 0;
              return (
                <div key={step.id} className="py-3.5 flex flex-col gap-1">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-[#e8e2d8]">
                      步驟 {step.stepNumber} · {step.title}
                    </span>
                  </div>

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

      {/* Fixed Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#151311]/95 backdrop-blur-md border-t border-[#292520] z-20">
        <div className="max-w-xl mx-auto flex flex-col gap-2">
          <button
            onClick={() =>
              onStartBrewing(
                recipe,
                coffeeAmount,
                waterAmount,
                scaledSteps,
                beanName
              )
            }
            className="w-full py-4 px-6 bg-[#d4a373] hover:bg-[#e0b284] active:bg-[#c49261] text-[#1a130b] font-serif font-bold text-lg rounded-2xl shadow-lg transition-all duration-150 flex items-center justify-center gap-2"
          >
            <Play size={20} fill="currentColor" />
            <span>開始計時</span>
          </button>
          <span className="text-[11px] text-[#786e62] text-center">
            計時完成會保存參數，評分與心得可以稍後補。
          </span>
        </div>
      </div>
    </div>
  );
};
