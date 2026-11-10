import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Droplets,
  Clock,
  Hand,
  Plus,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import type { Recipe, Step, BrewerType, GrindLevel } from '../types/recipe';

interface CustomRecipeCreatorProps {
  onBack: () => void;
  onSave: (recipe: Recipe) => void;
  existingRecipes: Recipe[];
}

export const CustomRecipeCreator: React.FC<CustomRecipeCreatorProps> = ({
  onBack,
  onSave,
  existingRecipes,
}) => {
  // Basic Recipe Info
  const [name, setName] = useState<string>('');
  const [dripper, setDripper] = useState<BrewerType>('V60');
  const [availableDrippers, setAvailableDrippers] = useState<string[]>([
    'V60',
    'Chemex',
    'Kalita Wave',
    'Origami',
    '聰明濾杯',
    'Melitta',
    'April',
  ]);
  const [customDripperInput, setCustomDripperInput] = useState<string>('');
  const [showAddDripperModal, setShowAddDripperModal] = useState<boolean>(false);

  // Core Parameters
  const [coffeeAmount, setCoffeeAmount] = useState<number>(15);
  const [temperature, setTemperature] = useState<number>(93);
  const [grindLevel, setGrindLevel] = useState<GrindLevel>('Medium');
  const [iceAmount, setIceAmount] = useState<number>(0);

  // Flavor Notes
  const [grindAndFlavor, setGrindAndFlavor] = useState<string>('');
  const [beanPairing, setBeanPairing] = useState<string>('');

  // Step List
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, type: 'pour', title: 'Bloom', waterAmount: 40, duration: 30, description: '潤濕所有咖啡粉' },
    { id: 2, type: 'wait', title: '等待', waterAmount: 0, duration: 30, description: '靜置排氣' },
    { id: 3, type: 'pour', title: '注水', waterAmount: 100, duration: 30, description: '繞圈均勻注水' },
  ]);

  // Expanded step for editing
  const [expandedStepId, setExpandedStepId] = useState<number | null>(1);

  // Duplicate name confirmation modal
  const [duplicateRecipeToOverwrite, setDuplicateRecipeToOverwrite] = useState<Recipe | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Calculations: Total Water, Total Time, Ratio
  const totalWater = useMemo(() => {
    return steps.reduce((sum, s) => sum + (s.waterAmount || 0), 0);
  }, [steps]);

  const totalTimeSeconds = useMemo(() => {
    return steps.reduce((sum, s) => sum + (s.duration || 0), 0);
  }, [steps]);

  const calculatedRatio = useMemo(() => {
    const totalLiquid = totalWater + iceAmount;
    if (coffeeAmount <= 0) return '0';
    return (totalLiquid / coffeeAmount).toFixed(1);
  }, [totalWater, iceAmount, coffeeAmount]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Cumulative line chart path coordinates
  const chartData = useMemo(() => {
    const points: { time: number; water: number }[] = [{ time: 0, water: 0 }];
    let currentTime = 0;
    let currentWater = 0;

    steps.forEach((step) => {
      currentTime += step.duration;
      currentWater += step.waterAmount;
      points.push({ time: currentTime, water: currentWater });
    });

    const maxTime = Math.max(1, currentTime);
    const maxWater = Math.max(1, currentWater);

    const width = 340;
    const height = 110;
    const paddingX = 14;
    const paddingY = 12;

    const coords = points.map((p) => {
      const x = paddingX + (p.time / maxTime) * (width - paddingX * 2);
      const y = height - paddingY - (p.water / maxWater) * (height - paddingY * 2);
      return { x, y };
    });

    if (coords.length < 2) return { linePath: '', areaPath: '', points: coords };

    const linePath = coords.reduce(
      (acc, c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`),
      ''
    );

    const last = coords[coords.length - 1];
    const first = coords[0];
    const areaPath = `${linePath} L ${last.x} ${height - paddingY} L ${first.x} ${height - paddingY} Z`;

    return { linePath, areaPath, points: coords };
  }, [steps]);

  // Step Modification Handlers
  const handleStepTitleChange = (id: number, newTitle: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s)));
  };

  const handleStepWaterChange = (id: number, delta: number) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, waterAmount: Math.max(0, s.waterAmount + delta) } : s))
    );
  };

  const handleStepDurationChange = (id: number, delta: number) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, duration: Math.max(5, s.duration + delta) } : s))
    );
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    const nextSteps = [...steps];
    const temp = nextSteps[index];
    nextSteps[index] = nextSteps[targetIndex];
    nextSteps[targetIndex] = temp;
    setSteps(nextSteps);
  };

  const handleDeleteStep = (id: number) => {
    if (steps.length <= 1) {
      alert('食譜至少需要保留一個步驟！');
      return;
    }
    setSteps((prev) => prev.filter((s) => s.id !== id));
    if (expandedStepId === id) setExpandedStepId(null);
  };

  // Add Step by Type (Pour, Wait, Action)
  const handleAddStep = (type: 'pour' | 'wait' | 'stir') => {
    const nextId = (steps.length > 0 ? Math.max(...steps.map((s) => s.id)) : 0) + 1;
    let newStep: Step;

    if (type === 'pour') {
      newStep = {
        id: nextId,
        type: 'pour',
        title: '注水',
        waterAmount: 50,
        duration: 30,
        description: '均勻繞圈注水',
      };
    } else if (type === 'wait') {
      newStep = {
        id: nextId,
        type: 'wait',
        title: '等待',
        waterAmount: 0,
        duration: 20,
        description: '等待水流下降',
      };
    } else {
      newStep = {
        id: nextId,
        type: 'stir',
        title: '操作',
        waterAmount: 0,
        duration: 10,
        description: '攪拌或輕旋濾杯',
      };
    }

    setSteps((prev) => [...prev, newStep]);
    setExpandedStepId(nextId);
  };

  // Cycle Grind Level
  const grindOptions: GrindLevel[] = ['Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse'];
  const handleCycleGrind = () => {
    const currentIdx = grindOptions.indexOf(grindLevel);
    const nextIdx = (currentIdx + 1) % grindOptions.length;
    setGrindLevel(grindOptions[nextIdx]);
  };

  // Save Validation & Execution
  const executeSave = (confirmedOverwrite = false) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('請輸入方式名稱！');
      return;
    }
    if (totalWater <= 0) {
      setErrorMessage('食譜總水量不能為 0！');
      return;
    }

    // Check duplicate name
    if (!confirmedOverwrite) {
      const existing = existingRecipes.find(
        (r) => r.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (existing) {
        setDuplicateRecipeToOverwrite(existing);
        return;
      }
    }

    // Build Recipe Object
    const effectiveCategory: BrewerType = iceAmount > 0 ? '冰手沖' : dripper;
    const newRecipe: Recipe = {
      id: duplicateRecipeToOverwrite ? duplicateRecipeToOverwrite.id : `custom-${Date.now()}`,
      name: trimmedName,
      category: effectiveCategory,
      referenceAuthor: '自訂配方',
      defaultCoffee: coffeeAmount,
      defaultWater: totalWater,
      defaultIce: iceAmount > 0 ? iceAmount : undefined,
      temperature,
      totalTimeSeconds,
      ratio: `1:${calculatedRatio}${iceAmount > 0 ? ' (含冰)' : ''}`,
      summary: `粉量 ${coffeeAmount}g、${iceAmount > 0 ? `熱水 ${totalWater}g、冰塊 ${iceAmount}g` : `水量 ${totalWater}g`}、水溫 ${temperature}°C。共 ${steps.length} 段步驟，總時長 ${formatTime(totalTimeSeconds)}。`,
      grindAndFlavor: grindAndFlavor.trim() || `研磨度建議：${grindLevel}。可依喜好微調風味。`,
      beanPairing: beanPairing.trim() || '適合各類烘焙度的單品豆。',
      steps,
      isCustom: true,
      grindLevel,
      createdAt: Date.now(),
    };

    onSave(newRecipe);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] pb-36 fade-enter select-none">
      {/* Top Navbar */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-md safe-top border-b border-[var(--border-color)] px-4 pb-3 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full liquid-glass-secondary flex items-center justify-center transition-colors cursor-pointer shrink-0"
          aria-label="返回"
        >
          <ChevronLeft size={22} />
        </button>

        <h2 className="text-base font-medium text-[var(--text-main)]">沖煮方式</h2>

        <div className="w-10 shrink-0" />
      </div>

      <div className="max-w-md mx-auto px-5 pt-4 text-left">
        {/* Title Input */}
        <div className="mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="方式名稱 *"
            className="w-full text-2xl sm:text-3xl font-serif font-bold bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none border-b border-transparent focus:border-[var(--accent-coffee)] py-1 tracking-wide"
          />
          {errorMessage && (
            <p className="text-xs text-red-500 mt-1 font-medium">{errorMessage}</p>
          )}
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-3.5">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 text-center shadow-xs">
            <span className="font-serif text-2xl font-bold text-[var(--text-main)] block leading-tight">
              {totalWater} <span className="text-xs font-sans font-normal text-[var(--text-muted)]">g</span>
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5 block">水量</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 text-center shadow-xs">
            <span className="font-serif text-2xl font-bold text-[var(--text-main)] block leading-tight">
              {formatTime(totalTimeSeconds)}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5 block">時間</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 text-center shadow-xs">
            <span className="font-serif text-2xl font-bold text-[var(--accent-coffee)] block leading-tight">
              1:{calculatedRatio}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5 block">粉水比</span>
          </div>
        </div>

        {/* Dynamic Cumulative Extraction Curve Line Chart (Matching IMG_6915) */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3.5 mb-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] px-1 mb-1">
            <span>萃取曲線圖</span>
            <span className="font-mono">
              {totalWater}g · {formatTime(totalTimeSeconds)}
            </span>
          </div>

          <div className="w-full h-28 relative flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 340 110">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4a373" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#d4a373" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="14" y1="20" x2="326" y2="20" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.6" />
              <line x1="14" y1="55" x2="326" y2="55" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.6" />
              <line x1="14" y1="98" x2="326" y2="98" stroke="var(--border-color)" opacity="0.8" />

              {/* Area fill */}
              {chartData.areaPath && (
                <path d={chartData.areaPath} fill="url(#chartGradient)" />
              )}

              {/* Extraction Line */}
              {chartData.linePath && (
                <path
                  d={chartData.linePath}
                  fill="none"
                  stroke="#d4a373"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Step Keypoints */}
              {chartData.points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={i === 0 ? 2 : 3.5}
                  fill={i === 0 ? '#d4a373' : 'var(--bg-card)'}
                  stroke="#d4a373"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Dripper Selection (Filter Pills) */}
        <div className="mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {availableDrippers.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDripper(d)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  dripper === d
                    ? 'liquid-glass font-bold shadow-md'
                    : 'liquid-glass-secondary text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {d}
              </button>
            ))}

            {/* <新增> Button */}
            <button
              type="button"
              onClick={() => setShowAddDripperModal(true)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap liquid-glass-secondary text-[var(--accent-coffee)] hover:text-[var(--text-main)] flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              <span>新增濾杯</span>
            </button>
          </div>
        </div>

        {/* 2x2 Core Parameters (粉量, 水溫, 研磨度, 冰塊) */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Card 1: 粉量 */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3.5 flex flex-col justify-between shadow-xs">
            <span className="text-xs text-[var(--text-muted)] block">粉量</span>
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => setCoffeeAmount((v) => Math.max(5, v - 1))}
                className="w-8 h-8 rounded-full bg-[var(--bg-card-sub)] border border-[var(--border-color)] text-[var(--text-main)] font-bold flex items-center justify-center active:scale-95 cursor-pointer"
              >
                -
              </button>
              <span className="font-serif text-2xl font-bold text-[var(--text-main)]">
                {coffeeAmount} <span className="text-xs font-sans font-normal text-[var(--text-muted)]">g</span>
              </span>
              <button
                type="button"
                onClick={() => setCoffeeAmount((v) => v + 1)}
                className="w-8 h-8 rounded-full bg-[var(--bg-card-sub)] border border-[var(--border-color)] text-[var(--text-main)] font-bold flex items-center justify-center active:scale-95 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Card 2: 水溫 */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3.5 flex flex-col justify-between shadow-xs">
            <span className="text-xs text-[var(--text-muted)] block">水溫</span>
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => setTemperature((v) => Math.max(70, v - 1))}
                className="w-8 h-8 rounded-full bg-[var(--bg-card-sub)] border border-[var(--border-color)] text-[var(--text-main)] font-bold flex items-center justify-center active:scale-95 cursor-pointer"
              >
                -
              </button>
              <span className="font-serif text-2xl font-bold text-[var(--text-main)]">
                {temperature} <span className="text-xs font-sans font-normal text-[var(--text-muted)]">°C</span>
              </span>
              <button
                type="button"
                onClick={() => setTemperature((v) => Math.min(100, v + 1))}
                className="w-8 h-8 rounded-full bg-[var(--bg-card-sub)] border border-[var(--border-color)] text-[var(--text-main)] font-bold flex items-center justify-center active:scale-95 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Card 3: 研磨度 (Tap to cycle) */}
          <div
            onClick={handleCycleGrind}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-coffee)]/50 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs cursor-pointer active:scale-[0.98] transition-all"
          >
            <span className="text-xs text-[var(--text-muted)] block">研磨度 (點擊切換)</span>
            <div className="mt-3 text-center">
              <span className="font-serif text-lg font-bold text-[var(--text-main)] block">
                {grindLevel}
              </span>
            </div>
          </div>

          {/* Card 4: 冰塊 */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3.5 flex flex-col justify-between shadow-xs">
            <span className="text-xs text-[var(--text-muted)] block">冰塊</span>
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => setIceAmount((v) => Math.max(0, v - 10))}
                className="w-8 h-8 rounded-full bg-[var(--bg-card-sub)] border border-[var(--border-color)] text-[var(--text-main)] font-bold flex items-center justify-center active:scale-95 cursor-pointer"
              >
                -
              </button>
              <span className="font-serif text-2xl font-bold text-[var(--text-main)]">
                {iceAmount} <span className="text-xs font-sans font-normal text-[var(--text-muted)]">g</span>
              </span>
              <button
                type="button"
                onClick={() => setIceAmount((v) => v + 10)}
                className="w-8 h-8 rounded-full bg-[var(--bg-card-sub)] border border-[var(--border-color)] text-[var(--text-main)] font-bold flex items-center justify-center active:scale-95 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Steps List (展開編輯) */}
        <div className="mb-6">
          <h3 className="text-base font-serif font-bold text-[var(--text-main)] mb-3">
            步驟
          </h3>

          <div className="space-y-2 mb-3">
            {steps.map((step, idx) => {
              const isExpanded = expandedStepId === step.id;

              // Calculate timestamp up to this step
              let elapsedBefore = 0;
              for (let i = 0; i < idx; i++) {
                elapsedBefore += steps[i].duration;
              }

              return (
                <div
                  key={step.id}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden transition-all shadow-xs"
                >
                  {/* Step Header Row */}
                  <div
                    onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                    className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Step Number Circle */}
                      <span className="w-6 h-6 rounded-full bg-[var(--accent-coffee)] text-white dark:text-[#161009] text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {/* Time Marker */}
                      <span className="text-xs font-mono text-[var(--text-muted)] shrink-0">
                        {formatTime(elapsedBefore)}
                      </span>

                      {/* Type Icon */}
                      <span className="text-[var(--accent-coffee)] shrink-0">
                        {step.type === 'pour' && <Droplets size={15} />}
                        {step.type === 'wait' && <Clock size={15} />}
                        {step.type === 'stir' && <Hand size={15} />}
                      </span>

                      {/* Step Title */}
                      <span className="text-sm font-medium text-[var(--text-main)]">
                        {step.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[var(--text-muted)]">
                        {step.waterAmount > 0 && `${step.waterAmount}g `}
                        {step.duration}s
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-[var(--text-muted)]" />
                      ) : (
                        <ChevronDown size={16} className="text-[var(--text-muted)]" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Step Editor */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-color)]/60 bg-[var(--bg-card-sub)]/30 space-y-3.5">
                      {/* Label Input */}
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <span className="text-xs text-[var(--text-muted)] shrink-0">標籤</span>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleStepTitleChange(step.id, e.target.value)}
                          className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-coffee)]"
                        />
                      </div>

                      {/* Water Amount Controls */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text-muted)]">水量</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleStepWaterChange(step.id, -10)}
                            className="w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] font-bold flex items-center justify-center active:scale-95 cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="font-serif text-base font-bold text-[var(--text-main)] w-12 text-center">
                            {step.waterAmount} <span className="text-[10px] font-sans font-normal text-[var(--text-muted)]">g</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStepWaterChange(step.id, 10)}
                            className="w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] font-bold flex items-center justify-center active:scale-95 cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Duration Controls */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text-muted)]">時間</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleStepDurationChange(step.id, -5)}
                            className="w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] font-bold flex items-center justify-center active:scale-95 cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="font-serif text-base font-bold text-[var(--text-main)] w-12 text-center">
                            {step.duration} <span className="text-[10px] font-sans font-normal text-[var(--text-muted)]">s</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStepDurationChange(step.id, 5)}
                            className="w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] font-bold flex items-center justify-center active:scale-95 cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Step Actions: Move up, Move down, Delete */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveStep(idx, 'up')}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] text-[var(--text-main)] disabled:opacity-30 cursor-pointer"
                          >
                            上移
                          </button>
                          <button
                            type="button"
                            disabled={idx === steps.length - 1}
                            onClick={() => handleMoveStep(idx, 'down')}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] text-[var(--text-main)] disabled:opacity-30 cursor-pointer"
                          >
                            下移
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteStep(step.id)}
                          className="text-[11px] text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer font-medium px-2 py-1"
                        >
                          <Trash2 size={12} />
                          <span>刪除</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 3 Add Step Choices: 注水, 等待, 操作 */}
          <div className="border border-dashed border-[var(--border-color)] rounded-2xl p-3 bg-[var(--bg-card)]/40 text-center">
            <span className="text-xs text-[var(--text-muted)] mb-2 block font-medium">
              + 新增步驟
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleAddStep('pour')}
                className="py-2.5 px-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--accent-coffee)]/15 border border-[var(--border-color)] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <Droplets size={16} className="text-[var(--accent-coffee)]" />
                <span className="text-xs font-medium text-[var(--text-main)]">注水</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddStep('wait')}
                className="py-2.5 px-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--accent-coffee)]/15 border border-[var(--border-color)] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <Clock size={16} className="text-[var(--accent-coffee)]" />
                <span className="text-xs font-medium text-[var(--text-main)]">等待</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddStep('stir')}
                className="py-2.5 px-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--accent-coffee)]/15 border border-[var(--border-color)] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <Hand size={16} className="text-[var(--accent-coffee)]" />
                <span className="text-xs font-medium text-[var(--text-main)]">操作</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notes Section (風味筆記) */}
        <div className="mb-6 space-y-4">
          <h3 className="text-base font-serif font-bold text-[var(--text-main)]">
            風味筆記
          </h3>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">
              研磨與風味
            </label>
            <textarea
              rows={3}
              value={grindAndFlavor}
              onChange={(e) => setGrindAndFlavor(e.target.value)}
              placeholder="例：建議偏粗。太細會苦澀、滴得慢；太粗會偏酸、水感。"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coffee)] leading-relaxed resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">
              豆子搭配
            </label>
            <textarea
              rows={3}
              value={beanPairing}
              onChange={(e) => setBeanPairing(e.target.value)}
              placeholder="例：淺焙花果調能突出酸質與花香；深焙豆甜感厚實，但容易苦。"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coffee)] leading-relaxed resize-none"
            />
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none safe-bottom px-5">
        <button
          type="button"
          onClick={() => executeSave(false)}
          className="pointer-events-auto w-full max-w-md py-4 rounded-3xl liquid-glass font-bold text-base flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95 transition-all"
        >
          <span>儲存方式</span>
        </button>
      </div>

      {/* Duplicate Recipe Confirmation Modal */}
      {duplicateRecipeToOverwrite && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 fade-enter">
          <div className="w-full max-w-xs bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl text-center animate-pop-in">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-coffee)]/15 text-[var(--accent-coffee)] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-serif font-bold text-[var(--text-main)] mb-1.5">
              覆蓋現有配方？
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-5">
              已有相同名稱的配方「{duplicateRecipeToOverwrite.name}」，確定要覆蓋並保存這次的調整嗎？
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDuplicateRecipeToOverwrite(null)}
                className="flex-1 py-3 rounded-2xl liquid-glass-secondary font-medium text-xs transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setDuplicateRecipeToOverwrite(null);
                  executeSave(true);
                }}
                className="flex-1 py-3 rounded-2xl liquid-glass font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                確認覆蓋
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Dripper Modal */}
      {showAddDripperModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 fade-enter">
          <div className="w-full max-w-xs bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-2xl text-center animate-pop-in">
            <h3 className="text-base font-serif font-bold text-[var(--text-main)] mb-3">
              新增濾杯分類
            </h3>
            <input
              type="text"
              value={customDripperInput}
              onChange={(e) => setCustomDripperInput(e.target.value)}
              placeholder="輸入濾杯名稱 (如 AeroPress)..."
              className="w-full bg-[var(--bg-card-sub)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coffee)] mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomDripperInput('');
                  setShowAddDripperModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl liquid-glass-secondary text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmed = customDripperInput.trim();
                  if (trimmed) {
                    if (!availableDrippers.includes(trimmed)) {
                      setAvailableDrippers((prev) => [...prev, trimmed]);
                    }
                    setDripper(trimmed);
                  }
                  setCustomDripperInput('');
                  setShowAddDripperModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl liquid-glass text-xs font-bold cursor-pointer"
              >
                確認新增
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomRecipeCreator;
