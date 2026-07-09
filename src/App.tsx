/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Dumbbell, 
  Timer, 
  Flame, 
  History, 
  Layers,
  Keyboard,
  Clock
} from 'lucide-react';
import { PauseInterval } from './types';
import { formatTime, formatShortDuration, playStopwatchSound } from './utils/helpers';

export default function App() {
  // --- Timer & Session States ---
  const [elapsedTimeMs, setElapsedTimeMs] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [pauses, setPauses] = useState<PauseInterval[]>([]);
  
  // --- Preferences & UI States ---
  const [volumeEnabled, setVolumeEnabled] = useState<boolean>(true);
  const [isHorizontal, setIsHorizontal] = useState<boolean>(true);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(true);

  // --- Refs for high-precision absolute time tracking ---
  const accumulatedTimeRef = useRef<number>(0);
  const runningSinceRef = useRef<number>(0);
  const stopwatchBtnRef = useRef<HTMLButtonElement>(null);
  const resetBtnRef = useRef<HTMLButtonElement>(null);

  // --- Orientation detection ---
  useEffect(() => {
    const handleResize = () => {
      // Desktop or horizontal mode on mobile has width > height
      setIsHorizontal(window.innerWidth > window.innerHeight);
    };
    
    handleResize(); // run initially
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Core Action Functions ---
  const handleStartPause = () => {
    const now = Date.now();
    
    if (!hasStarted) {
      // 1. Starting session for the first time
      setHasStarted(true);
      setIsRunning(true);
      playStopwatchSound('start', volumeEnabled);
      runningSinceRef.current = now;
      accumulatedTimeRef.current = 0;
      setElapsedTimeMs(0);
    } else if (isRunning) {
      // 2. Running -> Paused (Set ends, rest begins!)
      setIsRunning(false);
      playStopwatchSound('pause', volumeEnabled);
      
      const currentElapsed = accumulatedTimeRef.current + (now - runningSinceRef.current);
      accumulatedTimeRef.current = currentElapsed;
      runningSinceRef.current = 0;
      setElapsedTimeMs(currentElapsed);
      
      const newPause: PauseInterval = {
        id: Math.random().toString(36).substring(2, 9),
        index: pauses.length + 1,
        durationMs: 0,
        startedAt: now,
        stopwatchTimeAtPauseMs: currentElapsed,
        isCompleted: false,
      };
      setPauses((prev) => [...prev, newPause]);
    } else {
      // 3. Paused -> Running (Rest ends, new set begins!)
      playStopwatchSound('start', volumeEnabled);
      
      setPauses((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const completedPause = {
          ...last,
          durationMs: now - last.startedAt,
          isCompleted: true,
          completedAt: now,
        };
        return [...prev.slice(0, -1), completedPause];
      });
      setIsRunning(true);
      runningSinceRef.current = now;
    }
  };

  const handleReset = () => {
    playStopwatchSound('reset', volumeEnabled);
    setIsRunning(false);
    setHasStarted(false);
    accumulatedTimeRef.current = 0;
    runningSinceRef.current = 0;
    setElapsedTimeMs(0);
    setPauses([]);
  };

  // --- Keep keyhandlers fresh and avoid stale closures ---
  const startPauseActionRef = useRef(handleStartPause);
  const resetActionRef = useRef(handleReset);
  
  useEffect(() => {
    startPauseActionRef.current = handleStartPause;
    resetActionRef.current = handleReset;
  });

  // --- Global Keyboard Listeners ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space -> Start/Pause
      if (e.code === 'Space') {
        e.preventDefault(); // Stop standard page scroll
        startPauseActionRef.current();
        
        // Blur button if clicked to prevent space double-triggering
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
      // R or r -> Reset
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetActionRef.current();
        
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- High-Resolution Animation Frame Tick Loop ---
  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      const now = Date.now();

      // 1. If running, calculate absolute elapsed stopwatch time
      if (isRunning && runningSinceRef.current > 0) {
        setElapsedTimeMs(accumulatedTimeRef.current + (now - runningSinceRef.current));
      }

      // 2. If paused (session started), increment the current resting pause time
      if (!isRunning && hasStarted) {
        setPauses((prevPauses) => {
          if (prevPauses.length === 0) return prevPauses;
          const lastPause = prevPauses[prevPauses.length - 1];
          if (lastPause.isCompleted) return prevPauses;

          const updatedPause = {
            ...lastPause,
            durationMs: now - lastPause.startedAt,
          };
          return [...prevPauses.slice(0, -1), updatedPause];
        });
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    if (isRunning || (!isRunning && hasStarted)) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRunning, hasStarted]);

  // --- Helper calculations for display stats ---
  const getSetDuration = (index: number) => {
    if (index === 0) {
      return pauses[0].stopwatchTimeAtPauseMs;
    }
    return pauses[index].stopwatchTimeAtPauseMs - pauses[index - 1].stopwatchTimeAtPauseMs;
  };

  const completedPauses = pauses.filter(p => p.isCompleted);
  const totalPauseDuration = pauses.reduce((acc, p) => acc + p.durationMs, 0);
  const averagePauseDuration = completedPauses.length > 0 
    ? completedPauses.reduce((acc, p) => acc + p.durationMs, 0) / completedPauses.length 
    : 0;

  // Active rest timer check
  const activePause = pauses.find(p => !p.isCompleted);

  // Split formatted time into main and fractional segments for high-end display
  const formattedStopwatch = formatTime(elapsedTimeMs);
  const mainStopwatchPart = formattedStopwatch.slice(0, 8); // hh:mm:ss
  const msStopwatchPart = formattedStopwatch.slice(8); // .cs

  return (
    <div id="workout-app" className="flex flex-col h-screen w-screen bg-[#070913] text-slate-100 select-none overflow-hidden font-sans relative">
      
      {/* Decorative background glow that reacts to timer state */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15 pointer-events-none transition-colors duration-1000 ${
        isRunning 
          ? 'bg-emerald-500/80' 
          : hasStarted 
            ? 'bg-amber-500/80' 
            : 'bg-indigo-500/60'
      }`} />

      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#0d1124]/70 border-b border-slate-800/80 backdrop-blur-md z-10">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isRunning ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'} transition-colors duration-300`}>
            <Dumbbell className="w-5 h-5" id="header-dumbbell-icon" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Workout Pause Timer
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">Track rest periods between sets in real-time</p>
          </div>
        </div>

        {/* Global Controls & Keyboard Shortcuts Indicator */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={`p-2 rounded-lg border transition-all ${
              showShortcuts 
                ? 'bg-slate-800/80 border-slate-700 text-amber-400' 
                : 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
            title="Toggle Keyboard Shortcut Info"
            id="toggle-shortcuts-btn"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            onClick={() => setVolumeEnabled(!volumeEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              volumeEnabled 
                ? 'bg-slate-800/80 border-slate-700 text-indigo-400' 
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400 hover:bg-slate-900/50'
            }`}
            title={volumeEnabled ? "Mute beep sound" : "Enable beep sound"}
            id="toggle-mute-btn"
          >
            {volumeEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Responsive layout container */}
      <main className={`flex-1 flex overflow-hidden ${
        isHorizontal ? 'flex-row' : 'flex-col'
      }`} id="app-split-container">
        
        {/* ========================================== */}
        {/* PART 2: PAUSE TIMES / RESTS                */}
        {/* Located: LEFT (Horizontal) or BOTTOM (Vertical) */}
        {/* ========================================== */}
        <section 
          className={`flex flex-col relative bg-[#090d1a]/45 backdrop-blur-sm overflow-hidden transition-all duration-300 ${
            isHorizontal 
              ? 'w-1/2 h-full border-r border-slate-800/30' 
              : 'h-[52%] w-full'
          }`}
          id="pause-times-section"
        >
          {/* Pause Header & Live Rest Summary */}
          <div className="p-4 bg-[#0c1021]/80 border-b border-slate-800/70 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
                Excess Rest & Set Log
              </h2>
            </div>
            
            {pauses.length > 0 && (
              <div className="flex items-center space-x-4 text-xs">
                <div className="text-right">
                  <span className="text-slate-500 block">Avg. Slack Time</span>
                  <span className="font-mono font-semibold text-slate-300">
                    {averagePauseDuration > 0 ? formatShortDuration(averagePauseDuration) : '--'}
                  </span>
                </div>
                <div className="w-[1px] h-6 bg-slate-800" />
                <div className="text-right">
                  <span className="text-slate-500 block">Total Slack</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {formatShortDuration(totalPauseDuration)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Pause History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin" id="pause-logs-list">
            {pauses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <div className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center mb-3 bg-slate-900/30">
                  <Clock className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-400">No workout sets started yet</p>
                <p className="text-xs text-slate-600 max-w-[280px] mt-1">
                  Start the stopwatch at 0:00. This is your rest time. When you are ready to lift, press <span className="text-slate-400">Pause</span> to start your set. The timer here will track the duration of your set and any excess rest!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-w-md mx-auto">
                {/* Map pauses chronological */}
                {pauses.map((pause, index) => {
                  const setDuration = getSetDuration(index);
                  
                  return (
                    <div 
                      key={pause.id}
                      id={`pause-log-card-${pause.index}`}
                      className={`p-3 rounded-xl border transition-all duration-300 ${
                        !pause.isCompleted 
                          ? 'bg-[#0f1d19] border-emerald-600/30 shadow-lg shadow-emerald-950/10' 
                          : 'bg-[#101426]/70 border-slate-800/80 hover:bg-[#12182d]/90'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            !pause.isCompleted 
                              ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 animate-pulse' 
                              : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            S{pause.index}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                Set {pause.index} + Slack Track
                              </span>
                              {!pause.isCompleted && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-400/10 text-emerald-400 animate-pulse">
                                  Set In Progress
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Pre-Set Rest Duration: <span className="font-mono text-slate-400">{formatShortDuration(setDuration)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Rest timer */}
                        <div className="text-right">
                          <div className={`font-mono font-semibold ${
                            !pause.isCompleted 
                              ? 'text-lg text-emerald-400' 
                              : 'text-base text-slate-200'
                          }`}>
                            {formatTime(pause.durationMs)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Paused at {formatShortDuration(pause.stopwatchTimeAtPauseMs)} total
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Keycap Helpers at bottom of the Left/Bottom panel if enabled */}
          {showShortcuts && (
            <div className="p-3 bg-[#0a0d1a]/90 border-t border-slate-800/80 shrink-0 text-xs text-slate-500 flex items-center justify-center space-x-6">
              <span className="flex items-center space-x-2">
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700 shadow shadow-black">Spacebar</kbd>
                <span>Start / Pause</span>
              </span>
              <span className="flex items-center space-x-2">
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700 shadow shadow-black">R</kbd>
                <span>Reset All</span>
              </span>
            </div>
          )}
        </section>

        {/* ========================================== */}
        {/* DYNAMIC LINE SEPARATOR                     */}
        {/* ========================================== */}
        <div 
          className={`shrink-0 flex items-center justify-center ${
            isHorizontal 
              ? 'w-[1px] h-full bg-slate-800/50' 
              : 'h-[1px] w-full bg-slate-800/50'
          }`}
          id="split-divider-line"
        >
          {/* Subtle logo/icon in the center of the divider for physical console feel */}
          <div className="absolute p-1 bg-[#070913] border border-slate-800/80 rounded-full text-slate-600 scale-90 z-10">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* ========================================== */}
        {/* PART 1: STOPWATCH TIMER                    */}
        {/* Located: RIGHT (Horizontal) or TOP (Vertical) */}
        {/* ========================================== */}
        <section 
          className={`flex-1 flex flex-col justify-center items-center relative transition-all duration-300 ${
            isHorizontal ? 'p-12' : 'p-6 h-[48%]'
          }`}
          id="stopwatch-timer-section"
        >
          {/* Active Status Banner */}
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider gap-1.5 border transition-all duration-500 ${
              isRunning 
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 animate-pulse' 
                : hasStarted 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-slate-800/30 border-slate-800 text-slate-500'
            }`}>
              {isRunning ? (
                <>
                  <Clock className="w-3 h-3 text-indigo-400 animate-spin" />
                  Resting / Preparing for Set {pauses.length + 1}
                </>
              ) : hasStarted ? (
                <>
                  <Flame className="w-3 h-3 text-emerald-400 animate-bounce" />
                  ACTIVE SET: {pauses.length}
                </>
              ) : (
                <>
                  <Timer className="w-3 h-3 text-slate-500" />
                  Ready to Lift
                </>
              )}
            </span>
          </div>

          {/* Stopwatch Big Centered Display */}
          <div className="relative text-center select-all cursor-default" id="stopwatch-display-container">
            {/* Elegant glowing background layer under the numbers */}
            <div className={`absolute inset-0 blur-3xl opacity-10 transition-all duration-1000 ${
              isRunning 
                ? 'bg-emerald-500 scale-105' 
                : hasStarted 
                  ? 'bg-amber-500 scale-105' 
                  : 'bg-indigo-500'
            }`} />

            <div className="relative flex items-baseline justify-center font-mono font-bold tracking-tight text-white">
              {/* Main Time (Hours:Minutes:Seconds) */}
              <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl select-all">
                {mainStopwatchPart}
              </span>
              
              {/* Centiseconds (fraction) in smaller font for refined stopwatch aesthetics */}
              <span className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl transition-colors duration-300 select-all ${
                isRunning 
                  ? 'text-emerald-400' 
                  : hasStarted 
                    ? 'text-amber-400' 
                    : 'text-slate-500'
              }`}>
                {msStopwatchPart}
              </span>
            </div>

            <div className="mt-2 text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Total Workout Action Time
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="mt-8 flex flex-col items-center space-y-4 w-full max-w-sm" id="timer-controls">
            <div className="flex items-center space-x-4 w-full">
              
              {/* Reset Button */}
              <button
                ref={resetBtnRef}
                onClick={handleReset}
                disabled={!hasStarted}
                id="reset-btn"
                className={`flex-1 py-4 px-6 rounded-2xl flex items-center justify-center space-x-2 font-semibold transition-all border shadow-lg ${
                  hasStarted 
                    ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700 active:scale-95 cursor-pointer' 
                    : 'bg-slate-950 border-slate-900/50 text-slate-700 cursor-not-allowed'
                }`}
                title="Reset stopwatch and delete all recorded pause times (R Key)"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reset</span>
              </button>

              {/* Start / Pause Button */}
              <button
                ref={stopwatchBtnRef}
                onClick={handleStartPause}
                id="start-pause-btn"
                className={`flex-[2] py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 font-semibold transition-all active:scale-95 shadow-xl shadow-black/30 cursor-pointer ${
                  isRunning 
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/10' 
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/10'
                }`}
                title="Start or pause the stopwatch (Spacebar)"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 fill-slate-950 text-slate-950" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-slate-950 text-slate-950" />
                    <span>{hasStarted ? 'Resume' : 'Start'}</span>
                  </>
                )}
              </button>

            </div>

            {/* Quick tips */}
            <div className="text-[10px] text-slate-600 text-center uppercase tracking-wider font-semibold pointer-events-none">
              Press Space to toggle • Press R to reset
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

