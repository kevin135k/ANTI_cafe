import React, { useState, useEffect } from 'react';
import type { Recipe, ScaledStep } from '../types/recipe';
import { sound } from '../utils/sound';
import { requestWakeLock, releaseWakeLock } from '../utils/wakeLock';
import confetti from 'canvas-confetti';
import {
  X,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Award
} from 'lucide-react';

interface BrewingTimerViewProps {
  recipe: Recipe;
  coffeeAmount: number;
  waterAmount: number;
  scaledSteps: ScaledStep[];
  onClose: () => void;
}

export const BrewingTimerView: React.FC<BrewingTimerViewProps> = ({
  recipe,
  coffeeAmount,
  waterAmount,
  scaledSteps,
  onClose,
}) => {
  // Current active step index (0-indexed)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  // Seconds remaining in current step
  const [stepSecondsLeft, setStepSecondsLeft] = useState<number>(
    scaledSteps[0]?.duration || 10
  );
  // Total elapsed time in seconds across entire brew
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(0);
  // Is timer actively running
  const [isRunning, setIsRunning] = useState<boolean>(false);
  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(!sound.enabled);
  // Has finished all steps
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  // Step transition slide animation trigger
  const [slideKey, setSlideKey] = useState<number>(0);

  // Total duration of entire recipe
  const totalBrewSeconds = scaledSteps.reduce((acc, s) => acc + s.duration, 0) || 1;

  const currentStep = scaledSteps[currentStepIndex] || scaledSteps[0];
  const nextStep = scaledSteps[currentStepIndex + 1] || null;

  // Wake Lock on mount
  useEffect(() => {
    requestWakeLock();
    return () => {
      releaseWakeLock();
    };
  }, []);

  // Timer loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && !isCompleted) {
      interval = setInterval(() => {
        setTotalElapsedSeconds((prev) => prev + 1);

        setStepSecondsLeft((prev) => {
          // Play beeps for final 3 seconds
          if (prev <= 4 && prev > 1) {
            sound.playCountdownBeep(587.33, 0.08);
          } else if (prev === 1) {
            sound.playCountdownBeep(880, 0.15);
          }

          if (prev <= 1) {
            // Advance to next step
            if (currentStepIndex < scaledSteps.length - 1) {
              sound.playStepChime();
              const nextIndex = currentStepIndex + 1;
              setCurrentStepIndex(nextIndex);
              setSlideKey((k) => k + 1); // trigger sliding push animation
              return scaledSteps[nextIndex].duration;
            } else {
              // Brewing completed!
              setIsRunning(false);
              setIsCompleted(true);
              sound.playCompleteSound();
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#d4a373', '#e8cbb0', '#ffffff', '#ffd166'],
              });
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isCompleted, currentStepIndex, scaledSteps]);

  // Toggle Mute
  const handleToggleMute = () => {
    sound.enabled = !sound.enabled;
    setIsMuted(!sound.enabled);
  };

  // Jump to specific step
  const handleJumpStep = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < scaledSteps.length) {
      setCurrentStepIndex(newIndex);
      setSlideKey((k) => k + 1);
      setStepSecondsLeft(scaledSteps[newIndex].duration);
      let elapsed = 0;
      for (let i = 0; i < newIndex; i++) {
        elapsed += scaledSteps[i].duration;
      }
      setTotalElapsedSeconds(elapsed);
    }
  };

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setCurrentStepIndex(0);
    setSlideKey(0);
    setStepSecondsLeft(scaledSteps[0].duration);
    setTotalElapsedSeconds(0);
  };

  // Format seconds to mm:ss
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG Circular progress calculation
  const currentStepDuration = currentStep.duration || 1;
  const progressRatio = (currentStepDuration - stepSecondsLeft) / currentStepDuration;
  const radius = 120; // Sized for standard iPhone 6.1" screen
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Video-like overall elapsed percentage
  const overallProgressPercent = Math.min(
    100,
    (totalElapsedSeconds / totalBrewSeconds) * 100
  );

  // Formatted labels for Now & Next
  const getNowLabel = () => {
    if (currentStep.type === 'wait') {
      return currentStep.title;
    } else if (currentStep.type === 'stir' || currentStep.type === 'swirl') {
      return currentStep.title;
    } else {
      return `注水至 ${currentStep.accumulatedWater}g`;
    }
  };

  const getNextLabel = () => {
    if (!nextStep) return '即將完成 · 享受咖啡香氣';
    if (nextStep.type === 'wait') {
      return nextStep.title;
    } else if (nextStep.scaledWater > 0) {
      return `注水至 ${nextStep.accumulatedWater}g (${nextStep.duration}s)`;
    } else {
      return `${nextStep.title} (${nextStep.duration}s)`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121110] text-[#e8e2d8] flex flex-col justify-between overflow-y-auto select-none safe-top safe-bottom">
      {/* Top Bar with iPhone Status Bar clearance */}
      <div className="px-5 pt-2 pb-1 flex items-center justify-between">
        {/* Close Button */}
        <button
          onClick={() => {
            if (isRunning) {
              if (window.confirm('確定要結束沖煮計時嗎？')) {
                onClose();
              }
            } else {
              onClose();
            }
          }}
          className="w-10 h-10 rounded-full liquid-glass-secondary flex items-center justify-center text-[#d4a373] transition-colors cursor-pointer"
          aria-label="離開"
        >
          <X size={20} />
        </button>

        {/* Step Capsule Badge */}
        <div className="px-4 py-1.5 rounded-full liquid-glass-secondary text-[#dfd6c8] text-xs font-medium tracking-wider">
          第 {currentStepIndex + 1} / {scaledSteps.length} 步
        </div>

        {/* Sound Toggle Button */}
        <button
          onClick={handleToggleMute}
          className="w-10 h-10 rounded-full liquid-glass-secondary flex items-center justify-center text-[#d4a373] transition-colors cursor-pointer"
          aria-label={isMuted ? '開啟聲音' : '靜音'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Main Center Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-1">
        {/* Big Circular Countdown Ring */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
            {/* Background Circle */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="transparent"
              stroke="#26211c"
              strokeWidth="5"
            />
            {/* Animated Progress Circle */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="transparent"
              stroke="#d4a373"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-linear"
            />
          </svg>

          {/* Large Serif Countdown Numbers inside Circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xs text-[#8c8071] tracking-widest uppercase mb-0.5">
              本段倒數
            </span>
            <span className="font-serif-num text-6xl sm:text-7xl font-light text-[#f7f2ea] tracking-tight leading-none my-1">
              {formatTime(stepSecondsLeft)}
            </span>
            <span className="text-xs text-[#8c8071] tracking-wider mt-1 font-mono">
              {formatTime(totalElapsedSeconds)} / {formatTime(totalBrewSeconds)}
            </span>
          </div>
        </div>

        {/* Dynamic Now & Next Push-Transition Area (圓圈下方) */}
        <div className="w-full max-w-xs text-center my-2 min-h-[70px] flex flex-col justify-center overflow-hidden">
          {/* Keyed container for push-up transition */}
          <div key={slideKey} className="step-slide-in flex flex-col items-center">
            {/* Line 1: Bold theme color "Now: <當前操作提示>" */}
            <div className="text-base sm:text-lg font-bold text-[#d4a373] tracking-wide flex items-center justify-center gap-1.5">
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[#d4a373]/20 text-[#d4a373] font-semibold">
                NOW
              </span>
              <span>{getNowLabel()}</span>
            </div>

            {/* Line 2: Subtle gray "Next: <下一步提示>" */}
            <div className="text-xs sm:text-sm text-[#8c8274] tracking-normal mt-1 flex items-center justify-center gap-1.5">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2b251f] text-[#8c8274]">
                NEXT
              </span>
              <span className="truncate max-w-[240px]">{getNextLabel()}</span>
            </div>
          </div>
        </div>

        {/* Line 3: Target Weight on Scale (秤上應為) */}
        <div className="text-center my-1.5 py-1 px-4 rounded-2xl bg-[#181512] border border-[#2b2620] inline-flex flex-col items-center">
          <span className="text-[11px] text-[#8f8578] tracking-wider">
            秤上應為
          </span>
          <div className="flex items-baseline justify-center gap-1 font-serif-num">
            <span className="text-3xl sm:text-4xl font-bold text-[#f5efe6]">
              {currentStep.accumulatedWater}
            </span>
            <span className="text-base text-[#d4a373] font-sans font-medium mr-1.5">g</span>
            <span className="text-sm text-[#595147]">/</span>
            <span className="text-sm text-[#857b6f] ml-1.5">
              {waterAmount} g
            </span>
          </div>
        </div>
      </div>

      {/* Video-style Progress Bar */}
      <div className="px-6 pb-2">
        <div className="relative w-full h-2.5 mb-2 bg-[#2d2721] rounded-full overflow-hidden shadow-inner">
          <div
            style={{
              width: `${overallProgressPercent}%`,
              transition: isRunning ? 'width 1s linear' : 'width 0.3s ease-out',
            }}
            className="h-full rounded-full bg-gradient-to-r from-[#b3824f] via-[#d4a373] to-[#e4b689] shadow-[0_0_10px_rgba(212,163,115,0.6)]"
          />
          <div className="absolute inset-0 flex justify-between pointer-events-none">
            {scaledSteps.map((_, idx) => {
              if (idx === 0) return null;
              let elapsedBefore = 0;
              for (let i = 0; i < idx; i++) elapsedBefore += scaledSteps[i].duration;
              const markPercent = (elapsedBefore / totalBrewSeconds) * 100;
              return (
                <div
                  key={idx}
                  style={{ left: `${markPercent}%` }}
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#121110]/80 z-10"
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#8c8071] font-mono px-0.5">
          <span className="text-[#d4a373] font-sans font-medium">
            步驟 {currentStepIndex + 1}: {currentStep.title}
          </span>
          <span>
            {formatTime(totalElapsedSeconds)} / {formatTime(totalBrewSeconds)}
          </span>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-8 pb-4 pt-1 flex items-center justify-center gap-7">
        {/* Previous Step Button */}
        <button
          onClick={() => handleJumpStep(currentStepIndex - 1)}
          disabled={currentStepIndex === 0}
          className={`w-13 h-13 rounded-full liquid-glass-secondary flex items-center justify-center text-[#d4a373] transition-all ${
            currentStepIndex === 0
              ? 'opacity-25 cursor-not-allowed'
              : 'cursor-pointer active:scale-95'
          }`}
          aria-label="上一步"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Center Main Play / Pause Glowing Button (Liquid Glass) */}
        <button
          onClick={() => {
            if (isCompleted) {
              handleReset();
            } else {
              setIsRunning(!isRunning);
            }
          }}
          className="w-18 h-18 rounded-full liquid-glass text-[#140e08] flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shadow-lg"
          aria-label={isRunning ? '暫停' : '開始'}
        >
          {isCompleted ? (
            <RotateCcw size={28} />
          ) : isRunning ? (
            <Pause size={30} fill="currentColor" />
          ) : (
            <Play size={30} fill="currentColor" className="ml-1" />
          )}
        </button>

        {/* Next Step Button */}
        <button
          onClick={() => handleJumpStep(currentStepIndex + 1)}
          disabled={currentStepIndex === scaledSteps.length - 1}
          className={`w-13 h-13 rounded-full liquid-glass-secondary flex items-center justify-center text-[#d4a373] transition-all ${
            currentStepIndex === scaledSteps.length - 1
              ? 'opacity-25 cursor-not-allowed'
              : 'cursor-pointer active:scale-95'
          }`}
          aria-label="下一步"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Completion Modal */}
      {isCompleted && (
        <div className="absolute inset-0 z-50 bg-[#121110]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in safe-top safe-bottom">
          <div className="w-16 h-16 rounded-full bg-[#2d241c] border border-[#d4a373] flex items-center justify-center text-[#d4a373] mb-3">
            <Award size={36} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif-num font-bold text-[#f5efe6] mb-1.5">
            沖煮完成！
          </h2>
          <p className="text-sm text-[#a39788] mb-5">
            享受這杯精心萃取的 {recipe.name}
          </p>

          <div className="w-full max-w-xs bg-[#1c1a17] border border-[#2b2722] rounded-2xl p-4 mb-5 text-left space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-[#8f8578]">
              <span>使用配方</span>
              <span className="text-[#e8e2d8] font-medium">{recipe.name}</span>
            </div>
            <div className="flex justify-between text-[#8f8578]">
              <span>粉水參數</span>
              <span className="text-[#d4a373] font-medium font-mono">
                {coffeeAmount}g / {waterAmount}g
              </span>
            </div>
            <div className="flex justify-between text-[#8f8578]">
              <span>總沖煮時間</span>
              <span className="text-[#e8e2d8] font-medium font-mono">
                {formatTime(totalElapsedSeconds)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={handleReset}
              className="w-full py-3.5 liquid-glass-secondary text-[#d4a373] font-medium text-sm rounded-2xl transition-colors cursor-pointer"
            >
              再次沖煮
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 liquid-glass text-[#1a130b] font-bold text-sm rounded-2xl shadow-lg cursor-pointer"
            >
              完成並返回模板庫
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
