import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Check, Delete } from 'lucide-react';

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
  // Whether the pop-out wheel modal/sheet is open
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // Current tab inside pop-out: 'wheel' or 'keypad'
  const [activeTab, setActiveTab] = useState<'wheel' | 'keypad'>('wheel');
  // Temp value while interacting in the modal
  const [tempValue, setTempValue] = useState<number>(value);
  // Phone keypad buffer text
  const [keypadText, setKeypadText] = useState<string>(value.toString());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProgrammaticScroll = useRef<boolean>(false);

  const itemHeight = 44; // 44px standard iOS touch target

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
      setKeypadText(value.toString());
    }
  }, [value, isOpen]);

  // Scroll wheel to current value when opening or switching to wheel
  useEffect(() => {
    if (isOpen && activeTab === 'wheel' && scrollContainerRef.current) {
      const idx = options.findIndex((o) => Math.abs(o - tempValue) < step / 2);
      if (idx !== -1) {
        isProgrammaticScroll.current = true;
        scrollContainerRef.current.scrollTop = idx * itemHeight;
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 120);
      }
    }
  }, [isOpen, activeTab]);

  // Handle scroll inside wheel WITHOUT triggering re-render oscillation
  const handleWheelScroll = () => {
    if (!scrollContainerRef.current || isProgrammaticScroll.current) return;

    const currentScrollTop = scrollContainerRef.current.scrollTop;
    const rawIdx = Math.round(currentScrollTop / itemHeight);
    const clampedIdx = Math.max(0, Math.min(options.length - 1, rawIdx));
    const selectedVal = options[clampedIdx];

    if (selectedVal !== undefined && Math.abs(selectedVal - tempValue) >= 0.01) {
      setTempValue(selectedVal);
      setKeypadText(selectedVal.toString());
    }

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

  const handleOptionClick = (opt: number, idx: number) => {
    setTempValue(opt);
    setKeypadText(opt.toString());
    onChange(opt);
    if (scrollContainerRef.current) {
      isProgrammaticScroll.current = true;
      scrollContainerRef.current.scrollTo({
        top: idx * itemHeight,
        behavior: 'smooth',
      });
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 200);
    }
  };

  // Virtual Phone Keypad Handlers (0-9, dot, delete)
  const handleKeypadPress = (digit: string) => {
    let next: string;
    if (keypadText === '0' && digit !== '.') {
      next = digit;
    } else if (digit === '.') {
      if (keypadText.includes('.')) return;
      next = keypadText + '.';
    } else {
      if (keypadText.length >= 5) return;
      next = keypadText + digit;
    }
    setKeypadText(next);
    const parsed = parseFloat(next);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.max(min, Math.min(max, Math.round(parsed * 10) / 10));
      setTempValue(clamped);
      onChange(clamped);
    }
  };

  const handleKeypadDelete = () => {
    if (keypadText.length <= 1) {
      setKeypadText('0');
      return;
    }
    const next = keypadText.slice(0, -1);
    setKeypadText(next);
    const parsed = parseFloat(next);
    if (!isNaN(parsed) && parsed >= min) {
      setTempValue(parsed);
      onChange(parsed);
    }
  };

  return (
    <>
      {/* Static Display Card on page (Prevents accidental page scroll modification) */}
      <button
        type="button"
        onClick={() => {
          setTempValue(value);
          setKeypadText(value.toString());
          setActiveTab('wheel');
          setIsOpen(true);
        }}
        className="flex-1 bg-[#1a1714] dark:bg-[#1a1714] border border-[#332e27] hover:border-[#d4a373]/60 rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-150 cursor-pointer shadow-sm group active:scale-[0.98]"
      >
        <span className="text-xs font-medium text-[#9c9183] mb-1 tracking-wider">
          {label} ({unit.toUpperCase()})
        </span>

        <div className="flex items-baseline gap-1 my-0.5">
          <span className="font-serif text-3xl font-bold text-[#f7f2ea] group-hover:text-[#d4a373] transition-colors">
            {value}
          </span>
          <span className="text-xs text-[#d4a373] font-medium">{unit}</span>
        </div>

        <span className="text-[11px] text-[#786e62] group-hover:text-[#a89b8c] mt-0.5">
          點擊調整刻度
        </span>
      </button>

      {/* Pop-out Bottom Sheet Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#1c1916] border-t border-[#3d352c] rounded-t-3xl p-5 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] text-center relative safe-bottom"
          >
            {/* Sheet Drag Handle */}
            <div className="w-10 h-1 bg-[#473d32] rounded-full mx-auto mb-4" />

            {/* Header: Label & Mode Switcher */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-lg font-serif font-bold text-[#f5efe6]">
                調整{label}
              </span>

              {/* Segmented Tab Switcher */}
              <div className="flex rounded-xl bg-[#26211c] p-0.5 border border-[#383028]">
                <button
                  type="button"
                  onClick={() => setActiveTab('wheel')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'wheel'
                      ? 'bg-[#d4a373] text-[#1a1208] font-bold shadow'
                      : 'text-[#9c9183] hover:text-[#e4ded7]'
                  }`}
                >
                  滾輪刻度
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('keypad');
                    setKeypadText(tempValue.toString());
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'keypad'
                      ? 'bg-[#d4a373] text-[#1a1208] font-bold shadow'
                      : 'text-[#9c9183] hover:text-[#e4ded7]'
                  }`}
                >
                  數字鍵盤
                </button>
              </div>
            </div>

            {/* Fixed Central Display Box */}
            <div className="my-2 py-2 px-4 rounded-2xl bg-[#141210] border border-[#2e2822] flex items-center justify-center gap-1.5">
              <span className="text-xs text-[#8c8274]">目前數值：</span>
              <span className="font-serif text-3xl font-bold text-[#d4a373]">
                {activeTab === 'keypad' ? keypadText : tempValue}
              </span>
              <span className="text-sm text-[#d4a373] font-medium">{unit}</span>
            </div>

            {/* Mode 1: Strict Vertical-Only Picker Wheel */}
            {activeTab === 'wheel' ? (
              <div className="my-3">
                <div className="relative w-full h-[176px] overflow-hidden flex items-center justify-center bg-[#141210] rounded-2xl border border-[#2b2620]">
                  {/* Top & Bottom gradient mask */}
                  <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#141210] to-transparent pointer-events-none z-20" />
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#141210] to-transparent pointer-events-none z-20" />

                  {/* Centered selection bar */}
                  <div className="absolute inset-x-4 top-[66px] h-[44px] rounded-xl bg-[#2a241e]/90 border-y border-[#d4a373]/50 pointer-events-none z-0" />

                  {/* Vertical only scrollable container */}
                  <div
                    ref={scrollContainerRef}
                    onScroll={handleWheelScroll}
                    style={{
                      scrollSnapType: 'y mandatory',
                      WebkitOverflowScrolling: 'touch',
                      touchAction: 'pan-y', // Disable horizontal scroll completely!
                    }}
                    className="w-full h-full overflow-y-scroll overflow-x-hidden no-scrollbar py-[66px] relative z-10"
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
                          <span className="mx-auto text-center">{opt}</span>
                          {isSelected && (
                            <span className="text-xs text-[#d4a373] font-sans font-medium ml-1">
                              {unit}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="text-[11px] text-[#786e62] mt-2">
                  僅支援上下滾動選擇 · 建議範圍：{min}{unit} – {max}{unit}
                </p>
              </div>
            ) : (
              /* Mode 2: In-situ Phone Numeric Keypad (No floating/jumping viewport!) */
              <div className="my-2">
                <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto py-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleKeypadPress(btn)}
                      className="h-12 rounded-2xl bg-[#26211c] hover:bg-[#332c25] active:bg-[#3d342a] active:scale-95 text-[#f5efe6] font-serif text-xl font-bold flex items-center justify-center border border-[#362f28] transition-all cursor-pointer shadow-sm"
                    >
                      {btn}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleKeypadDelete}
                    className="h-12 rounded-2xl bg-[#26211c] hover:bg-[#332c25] active:bg-[#3d342a] active:scale-95 text-[#d4a373] flex items-center justify-center border border-[#362f28] transition-all cursor-pointer shadow-sm"
                    aria-label="刪除"
                  >
                    <Delete size={20} />
                  </button>
                </div>
                <p className="text-[11px] text-[#786e62] mt-2">
                  建議範圍：{min}{unit} – {max}{unit}
                </p>
              </div>
            )}

            {/* Liquid Glass Confirm Button */}
            <button
              type="button"
              onClick={() => {
                const parsed = parseFloat(keypadText);
                if (!isNaN(parsed) && parsed >= min && parsed <= max) {
                  onChange(parsed);
                } else {
                  onChange(tempValue);
                }
                setIsOpen(false);
              }}
              className="w-full mt-3 py-3.5 liquid-glass rounded-2xl text-[#161009] font-serif font-bold text-base flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={18} />
              <span>確認設定</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
