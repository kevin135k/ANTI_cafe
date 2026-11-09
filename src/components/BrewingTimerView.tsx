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
  Info,
  Award
} from 'lucide-react';

interface BrewingTimerViewProps {
  recipe: Recipe;
  coffeeAmount: number;
  waterAmount: number;
  scaledSteps: ScaledStep[];
  beanName?: string;
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
  // Show tip modal / accordion
  const [showTip, setShowTip] = useState<boolean>(false);

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
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Video-like overall elapsed percentage
  const overallProgressPercent = Math.min(
    100,
    (totalElapsedSeconds / totalBrewSeconds) * 100
  );

  // Determine current step status text
  const getStepStatusText = () => {
    if (currentStep.type === 'wait') {
      return '等待中';
    } else if (currentStep.type === 'stir' || currentStep.type === 'swirl') {
      return '攪拌 / 搖晃中';
    } else {
      return `注水至 ${currentStep.accumulatedWater}g`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121110] text-[#e8e2d8] flex flex-col justify-between overflow-y-auto select-none">
      {/* Top Bar (matches IMG_6872) */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
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
          className="w-11 h-11 rounded-full bg-[#24201c] hover:bg-[#332c25] flex items-center justify-center text-[#9c9183] transition-colors"
          aria-label="離開"
        >
          <X size={22} />
        </button>

        {/* Step Capsule Badge */}
        <div className="px-4 py-1.5 rounded-full bg-[#24201c] text-[#dfd6c8] text-sm font-medium tracking-wider border border-[#302b25]">
          第 {currentStepIndex + 1} / {scaledSteps.length} 步
        </div>

        {/* Sound Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className="w-11 h-11 rounded-full bg-[#24201c] hover:bg-[#332c25] flex items-center justify-center text-[#9c9183] transition-colors"
            aria-label={isMuted ? '開啟聲音' : '靜音'}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>

      {/* Main Center Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-2">
        {/* Big Circular Countdown Ring */}
        <div className="relative w-76 h-76 sm:w-84 sm:h-84 flex items-center justify-center my-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
            {/* Background Circle */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              fill="transparent"
              stroke="#2e2720"
              strokeWidth="5"
            />
            {/* Animated Progress Circle */}
            <circle
              cx="150"
              cy="150"
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

          {/* Texts Inside the Circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {/* Action State Title */}
            <span className="text-base font-medium text-[#b0a494] mb-1 tracking-wide">
              {getStepStatusText()}
            </span>

            {/* Countdown Large Serif Numbers */}
            <span className="font-serif text-7xl sm:text-8xl font-light text-[#f7f2ea] tracking-tight leading-none my-1">
              {formatTime(stepSecondsLeft)}
            </span>

            {/* Elapsed / Total Time */}
            <span className="text-sm text-[#8c8071] tracking-widest mt-2 font-mono">
              {formatTime(totalElapsedSeconds)} / {formatTime(totalBrewSeconds)}
            </span>
          </div>
        </div>

        {/* Target Weight on Scale */}
        <div className="text-center my-3">
          <div className="text-sm text-[#9c9183] tracking-wider mb-1">
            秤上應為
          </div>
          <div className="flex items-baseline justify-center gap-1.5 font-serif">
            <span className="text-5xl sm:text-6xl font-normal text-[#d4a373]">
              {currentStep.accumulatedWater}
            </span>
            <span className="text-3xl text-[#d4a373] mr-2">g</span>
            <span className="text-xl text-[#665e53]">/</span>
            <span className="text-xl text-[#857b6f] ml-1">
              {waterAmount} g
            </span>
          </div>
        </div>

        {/* Next Step Preview Capsule */}
        {nextStep ? (
          <div className="mt-2 px-5 py-2.5 rounded-full bg-[#1e1b18] border border-[#2e2923] text-sm text-[#b8ad9e] flex items-center gap-2 max-w-sm truncate">
            <span className="text-[#8c8072]">接下來</span>
            <span>•</span>
            <span className="truncate">
              {nextStep.scaledWater > 0
                ? `注水至 ${nextStep.accumulatedWater}g`
                : nextStep.title}
            </span>
            <span>•</span>
            <span className="text-[#8c8072]">{nextStep.duration}s</span>
          </div>
        ) : (
          <div className="mt-2 px-5 py-2 rounded-full bg-[#1e1b18] border border-[#2e2923] text-sm text-[#8c8072]">
            最後一步 · 享受咖啡香氣
          </div>
        )}

        {/* Tip Button */}
        <button
          onClick={() => setShowTip(!showTip)}
          className="mt-3 text-sm text-[#8c8072] hover:text-[#d4a373] flex items-center gap-1.5 transition-colors"
        >
          <Info size={15} />
          <span>沖煮小技巧：{currentStep.title}</span>
        </button>

        {showTip && (
          <div className="mt-2 p-3.5 bg-[#1c1916] border border-[#332c25] rounded-xl text-sm text-[#a89d8f] max-w-sm text-left leading-relaxed">
            <p className="font-medium text-[#d4a373] mb-1">{recipe.name} · 手法提示</p>
            <p>{currentStep.description || recipe.grindAndFlavor}</p>
          </div>
        )}
      </div>

      {/* Video-style Progress Bar (按秒數逐漸由淺灰色變主題色) */}
      <div className="px-6 pb-2">
        {/* Progress Track */}
        <div className="relative w-full h-3 mb-2 bg-[#332d26] rounded-full overflow-hidden shadow-inner">
          {/* Active Progress Fill */}
          <div
            style={{
              width: `${overallProgressPercent}%`,
              transition: isRunning ? 'width 1s linear' : 'width 0.3s ease-out',
            }}
            className="h-full rounded-full bg-gradient-to-r from-[#b3824f] via-[#d4a373] to-[#e4b689] shadow-[0_0_12px_rgba(212,163,115,0.6)]"
          />

          {/* Step Boundary Markers on Track */}
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
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#121110]/60 z-10"
                />
              );
            })}
          </div>
        </div>

        {/* Labels under Progress Bar */}
        <div className="flex items-center justify-between text-xs text-[#8c8071] font-mono px-0.5">
          <span className="text-[#d4a373] font-sans font-medium">
            步驟 {currentStepIndex + 1}: {currentStep.title}
          </span>
          <span>
            {formatTime(totalElapsedSeconds)} / {formatTime(totalBrewSeconds)}
          </span>
        </div>
      </div>

      {/* Bottom Controls (matches IMG_6872) */}
      <div className="px-8 pb-8 pt-3 flex items-center justify-center gap-8">
        {/* Previous Step Button */}
        <button
          onClick={() => handleJumpStep(currentStepIndex - 1)}
          disabled={currentStepIndex === 0}
          className={`w-14 h-14 rounded-full bg-[#24201c] flex items-center justify-center text-[#d4a373] transition-all ${
            currentStepIndex === 0
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-[#332c25] active:scale-95'
          }`}
          aria-label="上一步"
        >
          <ChevronLeft size={26} />
        </button>

        {/* Center Main Play / Pause Glowing Button */}
        <button
          onClick={() => {
            if (isCompleted) {
              handleReset();
            } else {
              setIsRunning(!isRunning);
            }
          }}
          className="w-20 h-20 rounded-full bg-[#d4a373] hover:bg-[#e0b284] active:scale-95 text-[#140e08] flex items-center justify-center shadow-lg shadow-[#d4a373]/30 transition-all duration-200 cursor-pointer"
          aria-label={isRunning ? '暫停' : '開始'}
        >
          {isCompleted ? (
            <RotateCcw size={32} />
          ) : isRunning ? (
            <Pause size={34} fill="currentColor" />
          ) : (
            <Play size={34} fill="currentColor" className="ml-1" />
          )}
        </button>

        {/* Next Step Button */}
        <button
          onClick={() => handleJumpStep(currentStepIndex + 1)}
          disabled={currentStepIndex === scaledSteps.length - 1}
          className={`w-14 h-14 rounded-full bg-[#24201c] flex items-center justify-center text-[#d4a373] transition-all ${
            currentStepIndex === scaledSteps.length - 1
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-[#332c25] active:scale-95'
          }`}
          aria-label="下一步"
        >
          <ChevronRight size={26} />
        </button>
      </div>

      {/* Completion Modal */}
      {isCompleted && (
        <div className="absolute inset-0 z-50 bg-[#121110]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-18 h-18 rounded-full bg-[#2d241c] border border-[#d4a373] flex items-center justify-center text-[#d4a373] mb-4">
            <Award size={42} />
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#f5efe6] mb-2">
            沖煮完成！
          </h2>
          <p className="text-base text-[#a39788] mb-6">
            享受這杯精心萃取的 {recipe.name}
          </p>

          <div className="w-full max-w-sm bg-[#1c1a17] border border-[#2b2722] rounded-2xl p-5 mb-6 text-left space-y-2.5 text-sm">
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

          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              onClick={handleReset}
              className="w-full py-4 bg-[#2b2621] hover:bg-[#38312b] text-[#d4a373] font-medium text-base rounded-2xl border border-[#3d362e] transition-colors"
            >
              再次沖煮
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-[#d4a373] hover:bg-[#e0b284] text-[#1a130b] font-bold text-base rounded-2xl transition-colors shadow-lg cursor-pointer"
            >
              完成並返回模板庫
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
