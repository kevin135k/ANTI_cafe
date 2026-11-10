import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Check, Delete, X } from 'lucide-react';

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
  // Whether the pop-out floating modal is open
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // Current tab inside modal: 'wheel' or 'keypad'
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
        className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-coffee)]/60 rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-150 cursor-pointer shadow-sm group active:scale-[0.98]"
      >
        <span className="text-xs font-medium text-[var(--text-muted)] mb-1 tracking-wider">
          {label} ({unit.toUpperCase()})
        </span>

        <div className="flex items-baseline gap-1 my-0.5">
          <span className="font-serif text-3xl font-bold text-[var(--text-main)] group-hover:text-[var(--accent-coffee)] transition-colors">
            {value}
          </span>
          <span className="text-xs text-[var(--accent-coffee)] font-medium">{unit}</span>
        </div>

        <span className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--accent-coffee)] mt-0.5">
          點擊調整數值
        </span>
      </button>

      {/* Pop-out Centered Floating Modal Dialog (Not a Bottom Sheet) */}
      {isOpen && (
        <div
          data-picker-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-enter"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[320px] sm:max-w-xs bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-2xl text-center relative animate-pop-in select-none"
          >
            {/* Header: Label, Close Button, & Tab Switcher */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-base font-serif font-bold text-[var(--text-main)]">
                調整{label}
              </span>

              <div className="flex items-center gap-2">
                {/* Segmented Tab Switcher */}
                <div className="flex rounded-xl bg-[var(--bg-card-sub)] p-0.5 border border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('wheel')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activeTab === 'wheel'
                        ? 'liquid-glass text-white dark:text-[#1a1208] font-bold shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    滾輪
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('keypad');
                      setKeypadText(tempValue.toString());
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activeTab === 'keypad'
                        ? 'liquid-glass text-white dark:text-[#1a1208] font-bold shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    鍵盤
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-[var(--bg-card-sub)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="關閉"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Central Display Value */}
            <div className="my-2 py-2 px-3 rounded-2xl bg-[var(--bg-card-sub)] border border-[var(--border-color)] flex items-center justify-center gap-1.5">
              <span className="text-xs text-[var(--text-muted)]">目前設定：</span>
              <span className="font-serif text-3xl font-bold text-[var(--accent-coffee)]">
                {activeTab === 'keypad' ? keypadText : tempValue}
              </span>
              <span className="text-sm text-[var(--accent-coffee)] font-medium">{unit}</span>
            </div>

            {/* Mode 1: Strict Vertical-Only Picker Wheel (NO "g" next to options, only numbers) */}
            {activeTab === 'wheel' ? (
              <div className="my-3">
                <div className="relative w-full h-[176px] overflow-hidden flex items-center justify-center bg-[var(--bg-card-sub)] rounded-2xl border border-[var(--border-color)]">
                  {/* Top & Bottom gradient mask */}
                  <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[var(--bg-card-sub)] to-transparent pointer-events-none z-20" />
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[var(--bg-card-sub)] to-transparent pointer-events-none z-20" />

                  {/* Centered selection bar */}
                  <div className="absolute inset-x-3 top-[66px] h-[44px] rounded-xl bg-[var(--accent-coffee)]/15 border-y border-[var(--accent-coffee)]/50 pointer-events-none z-0" />

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
                          className={`flex items-center justify-center cursor-pointer select-none transition-all duration-100 ${
                            isSelected
                              ? 'text-[var(--text-main)] text-2xl font-serif font-bold scale-105'
                              : 'text-[var(--text-muted)] text-base font-serif scale-95 hover:text-[var(--text-main)] opacity-60'
                          }`}
                        >
                          {/* Centered number only - no "g" label */}
                          <span className="w-full text-center leading-none">{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-2">
                  僅支援上下滾動 · 建議範圍：{min}{unit} – {max}{unit}
                </p>
              </div>
            ) : (
              /* Mode 2: In-situ Phone Numeric Keypad (No floating/jumping viewport) */
              <div className="my-2">
                <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto py-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleKeypadPress(btn)}
                      className="h-11 rounded-2xl bg-[var(--bg-card-sub)] hover:bg-[var(--accent-coffee)]/20 active:scale-95 text-[var(--text-main)] font-serif text-lg font-bold flex items-center justify-center border border-[var(--border-color)] transition-all cursor-pointer shadow-sm"
                    >
                      {btn}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleKeypadDelete}
                    className="h-11 rounded-2xl bg-[var(--bg-card-sub)] hover:bg-[var(--accent-coffee)]/20 active:scale-95 text-[var(--accent-coffee)] flex items-center justify-center border border-[var(--border-color)] transition-all cursor-pointer shadow-sm"
                    aria-label="刪除"
                  >
                    <Delete size={18} />
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-2">
                  建議範圍：{min}{unit} – {max}{unit}
                </p>
              </div>
            )}

            {/* Confirm Button */}
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
              className="w-full mt-3 py-3 liquid-glass rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Check size={16} />
              <span>確認設定</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default PickerWheel;
