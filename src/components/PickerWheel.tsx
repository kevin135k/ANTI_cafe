import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Check, Minus, Plus, Keyboard } from 'lucide-react';

interface PickerWheelProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
}

export const PickerWheel: React.FC<PickerWheelProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}) => {
  // Whether the pop-out wheel modal/popover is open
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // Temp value while scrolling inside the popover
  const [tempValue, setTempValue] = useState<number>(value);
  // Manual keyboard input mode
  const [isKeyboardMode, setIsKeyboardMode] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>(value.toString());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProgrammaticScroll = useRef<boolean>(false);

  const itemHeight = 48; // 48px per row for generous touch target

  // Precompute options list
  const options = useMemo(() => {
    const arr: number[] = [];
    for (let v = min; v <= max + 0.001; v += step) {
      arr.push(Math.round(v * 10) / 10);
    }
    return arr;
  }, [min, max, step]);

  // Sync external value when closed
  useEffect(() => {
    if (!isOpen) {
      setTempValue(value);
      setInputText(value.toString());
    }
  }, [value, isOpen]);

  // When popover opens, scroll smoothly to the initial value
  useEffect(() => {
    if (isOpen && !isKeyboardMode && scrollContainerRef.current) {
      const idx = options.findIndex((o) => Math.abs(o - tempValue) < step / 2);
      if (idx !== -1) {
        isProgrammaticScroll.current = true;
        scrollContainerRef.current.scrollTop = idx * itemHeight;
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 150);
      }
    }
  }, [isOpen, isKeyboardMode]);

  // Handle scroll inside the popover wheel WITHOUT triggering parent re-renders or oscillation
  const handleWheelScroll = () => {
    if (!scrollContainerRef.current || isProgrammaticScroll.current) return;

    const currentScrollTop = scrollContainerRef.current.scrollTop;
    const rawIdx = Math.round(currentScrollTop / itemHeight);
    const clampedIdx = Math.max(0, Math.min(options.length - 1, rawIdx));
    const selectedVal = options[clampedIdx];

    if (selectedVal !== undefined && Math.abs(selectedVal - tempValue) >= 0.01) {
      setTempValue(selectedVal);
      setInputText(selectedVal.toString());
    }

    // Debounce snap settle: only commit to parent after finger stops scrolling
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      if (!scrollContainerRef.current) return;
      const finalIdx = Math.max(
        0,
        Math.min(
          options.length - 1,
          Math.round(scrollContainerRef.current.scrollTop / itemHeight)
        )
      );
      const settledValue = options[finalIdx];
      if (settledValue !== undefined) {
        setTempValue(settledValue);
        onChange(settledValue);
      }
    }, 120);
  };

  // Step nudge buttons (- / +) for fine 1-tick control
  const handleStepNudge = (delta: number) => {
    const nextVal = Math.max(
      min,
      Math.min(max, Math.round((tempValue + delta) * 10) / 10)
    );
    setTempValue(nextVal);
    setInputText(nextVal.toString());
    onChange(nextVal);

    if (scrollContainerRef.current) {
      const idx = options.findIndex((o) => Math.abs(o - nextVal) < step / 2);
      if (idx !== -1) {
        isProgrammaticScroll.current = true;
        scrollContainerRef.current.scrollTo({
          top: idx * itemHeight,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 250);
      }
    }
  };

  // Handle direct click on an option row
  const handleOptionClick = (opt: number, idx: number) => {
    if (Math.abs(opt - tempValue) < step / 2) {
      // Clicking the already-centered number opens keyboard input
      setIsKeyboardMode(true);
      setInputText(tempValue.toString());
    } else {
      // Clicking an adjacent number smoothly scrolls to it
      setTempValue(opt);
      setInputText(opt.toString());
      onChange(opt);
      if (scrollContainerRef.current) {
        isProgrammaticScroll.current = true;
        scrollContainerRef.current.scrollTo({
          top: idx * itemHeight,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 250);
      }
    }
  };

  const handleKeyboardSubmit = () => {
    const parsed = parseFloat(inputText);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.max(min, Math.min(max, Math.round(parsed * 10) / 10));
      setTempValue(clamped);
      onChange(clamped);
    } else {
      setInputText(tempValue.toString());
    }
    setIsKeyboardMode(false);
  };

  return (
    <>
      {/* Static Display Card (Prevents accidental scrolling when scrolling the page) */}
      <button
        type="button"
        onClick={() => {
          setTempValue(value);
          setIsKeyboardMode(false);
          setIsOpen(true);
        }}
        className="flex-1 bg-[#161412] hover:bg-[#1f1c18] active:scale-[0.98] border border-[#332e27] hover:border-[#d4a373]/60 rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-150 cursor-pointer shadow-inner group"
      >
        <span className="text-xs font-medium text-[#9c9183] mb-1.5 tracking-wider">
          {label} ({unit.toUpperCase()})
        </span>

        <div className="flex items-baseline gap-1 my-1">
          <span className="font-serif text-3xl sm:text-4xl font-bold text-[#f7f2ea] group-hover:text-[#d4a373] transition-colors">
            {value}
          </span>
          <span className="text-sm text-[#d4a373] font-medium">{unit}</span>
        </div>

        <span className="text-[11px] text-[#786e62] group-hover:text-[#a89b8c] mt-1 flex items-center gap-1">
          <span>點擊調整刻度</span>
        </span>
      </button>

      {/* Pop-out Tactile Picker Mini-Interface */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-[#1c1916] border border-[#3d352c] rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-center relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-serif font-bold text-[#f5efe6]">
                調整{label}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsKeyboardMode(!isKeyboardMode);
                  setInputText(tempValue.toString());
                }}
                className="px-2.5 py-1 rounded-lg bg-[#2a241e] hover:bg-[#383028] text-xs text-[#d4a373] flex items-center gap-1 border border-[#3d352c] cursor-pointer"
              >
                <Keyboard size={13} />
                <span>{isKeyboardMode ? '切換滾輪' : '鍵盤輸入'}</span>
              </button>
            </div>

            {isKeyboardMode ? (
              /* Direct Numeric Keyboard Mode */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleKeyboardSubmit();
                  setIsOpen(false);
                }}
                className="py-6 flex flex-col items-center gap-4"
              >
                <div className="flex items-baseline justify-center gap-2">
                  <input
                    type="number"
                    step={step}
                    autoFocus
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-32 bg-[#12100e] text-[#f7f2ea] border-2 border-[#d4a373] rounded-2xl px-3 py-2.5 text-center text-3xl font-serif font-bold focus:outline-none"
                  />
                  <span className="text-lg text-[#d4a373] font-serif">{unit}</span>
                </div>
                <p className="text-xs text-[#8c8274]">
                  建議範圍：{min}{unit} – {max}{unit}
                </p>
              </form>
            ) : (
              /* Smooth Decoupled Roller Wheel + Fine +/- Stepper */
              <div className="my-2">
                <div className="relative w-full h-[192px] overflow-hidden flex items-center justify-center bg-[#141210] rounded-2xl border border-[#2b2620]">
                  {/* Top & Bottom Fade Masks */}
                  <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#141210] to-transparent pointer-events-none z-20" />
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#141210] to-transparent pointer-events-none z-20" />

                  {/* Center Active Highlight Window */}
                  <div className="absolute inset-x-3 top-[72px] h-[48px] rounded-xl bg-[#2a241e]/90 border-y border-[#d4a373]/50 pointer-events-none z-0 shadow-inner" />

                  {/* Scrollable Wheel Container */}
                  <div
                    ref={scrollContainerRef}
                    onScroll={handleWheelScroll}
                    style={{
                      scrollSnapType: 'y mandatory',
                      WebkitOverflowScrolling: 'touch',
                    }}
                    className="w-full h-full overflow-y-scroll no-scrollbar py-[72px] relative z-10"
                  >
                    {options.map((opt, idx) => {
                      const isSelected = Math.abs(opt - tempValue) < step / 2;
                      return (
                        <div
                          key={opt}
                          onClick={() => handleOptionClick(opt, idx)}
                          style={{ scrollSnapAlign: 'center', height: `${itemHeight}px` }}
                          className={`flex items-center justify-center cursor-pointer select-none transition-transform duration-100 ${
                            isSelected
                              ? 'text-[#f7f2ea] text-2xl font-serif font-bold scale-105'
                              : 'text-[#6e6457] text-base font-serif scale-95 hover:text-[#9c9080]'
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && (
                            <span className="text-xs text-[#d4a373] font-sans font-medium ml-1.5">
                              {unit}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fine-tuning Stepper Buttons */}
                <div className="flex items-center justify-between gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => handleStepNudge(-step)}
                    className="flex-1 py-2 rounded-xl bg-[#26211c] hover:bg-[#332c25] active:scale-95 text-[#d4a373] flex items-center justify-center gap-1 text-sm font-medium border border-[#362f28] cursor-pointer"
                  >
                    <Minus size={15} />
                    <span>{step}{unit}</span>
                  </button>
                  <span className="text-xs text-[#786e62]">點擊中央數字可輸入</span>
                  <button
                    type="button"
                    onClick={() => handleStepNudge(step)}
                    className="flex-1 py-2 rounded-xl bg-[#26211c] hover:bg-[#332c25] active:scale-95 text-[#d4a373] flex items-center justify-center gap-1 text-sm font-medium border border-[#362f28] cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>{step}{unit}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Button */}
            <button
              type="button"
              onClick={() => {
                if (isKeyboardMode) {
                  handleKeyboardSubmit();
                }
                setIsOpen(false);
              }}
              className="w-full mt-4 py-3 bg-[#d4a373] hover:bg-[#e0b284] text-[#1a1208] font-bold text-base rounded-2xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check size={18} />
              <span>完成設定</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
