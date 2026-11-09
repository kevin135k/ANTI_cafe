import React, { useRef, useEffect, useState } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(value.toString());
  const isInternalScroll = useRef<boolean>(false);

  // Generate options array
  const options: number[] = [];
  for (let i = min; i <= max + 0.001; i += step) {
    options.push(Math.round(i * 10) / 10);
  }

  const itemHeight = 44; // pixels per item

  // Scroll to current value on mount or external value change
  useEffect(() => {
    if (isInternalScroll.current) {
      isInternalScroll.current = false;
      return;
    }
    const idx = options.findIndex((opt) => Math.abs(opt - value) < step / 2);
    if (idx !== -1 && containerRef.current) {
      containerRef.current.scrollTo({
        top: idx * itemHeight,
        behavior: 'smooth',
      });
    }
    setInputValue(value.toString());
  }, [value, min, max, step]);

  const handleScroll = () => {
    if (!containerRef.current || isEditing) return;
    const scrollTop = containerRef.current.scrollTop;
    const idx = Math.round(scrollTop / itemHeight);
    if (idx >= 0 && idx < options.length) {
      const selectedOption = options[idx];
      if (Math.abs(selectedOption - value) >= 0.01) {
        isInternalScroll.current = true;
        onChange(selectedOption);
      }
    }
  };

  const handleManualInputSubmit = () => {
    setIsEditing(false);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(Math.round(parsed * 10) / 10);
    } else {
      setInputValue(value.toString());
    }
  };

  return (
    <div className="flex-1 bg-[#181614] border border-[#332e27] rounded-2xl p-3 flex flex-col items-center select-none">
      <span className="text-xs font-medium text-[#9c9183] mb-1 tracking-wider uppercase">
        {label}
      </span>

      {/* Roller wheel container */}
      <div className="relative w-full h-[132px] overflow-hidden flex items-center justify-center">
        {/* Selection Center Highlight Bar (iOS Style) */}
        <div className="absolute inset-x-2 top-[44px] h-[44px] rounded-xl bg-[#2a241e] border-y border-[#d4a373]/40 pointer-events-none z-0" />

        {/* Scrollable list */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory py-[44px] relative z-10"
        >
          {options.map((opt) => {
            const isSelected = Math.abs(opt - value) < step / 2;
            return (
              <div
                key={opt}
                onClick={() => {
                  if (isSelected) {
                    setIsEditing(true);
                  } else {
                    onChange(opt);
                  }
                }}
                className={`h-[44px] flex items-center justify-center snap-center cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'text-[#f7f2ea] text-2xl font-serif font-bold scale-105'
                    : 'text-[#6e6457] text-base font-serif scale-90 hover:text-[#9e9282]'
                }`}
              >
                {isSelected && isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleManualInputSubmit();
                    }}
                    className="flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="number"
                      step={step}
                      autoFocus
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onBlur={handleManualInputSubmit}
                      className="w-20 bg-[#12100e] text-[#f7f2ea] border border-[#d4a373] rounded-lg px-1.5 py-0.5 text-center text-xl font-serif font-bold focus:outline-none"
                    />
                  </form>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span>{opt}</span>
                    {isSelected && (
                      <span className="text-xs text-[#d4a373] font-sans font-normal">
                        {unit}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <span className="text-[11px] text-[#786e62] mt-1">
        滾動選擇 · 點擊數字鍵盤輸入
      </span>
    </div>
  );
};
