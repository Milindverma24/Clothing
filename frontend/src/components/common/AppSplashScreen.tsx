import React, { useState, useEffect } from 'react';

interface AppSplashScreenProps {
  onFinish?: () => void;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [phaseText, setPhaseText] = useState('CALIBRATING SILHOUETTES...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Only show once per session to maintain fast, respectful navigation
    const hasShown = sessionStorage.getItem('clothing_splash_shown');
    if (hasShown) {
      setIsDone(true);
      if (onFinish) onFinish();
      return;
    }

    // Realistic generative progress ramp
    const duration = 1900; // ~1.9s total
    const startTime = performance.now();

    const updateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      // Ease-out cubic curve for natural feel
      const eased = Math.round((1 - Math.pow(1 - rawProgress, 3)) * 100);

      setProgress(eased);

      if (eased < 30) {
        setPhaseText('CALIBRATING ARCHITECTURAL SILHOUETTES...');
      } else if (eased < 65) {
        setPhaseText('SOURCING SUSTAINABLE MONOCHROME FABRICS...');
      } else if (eased < 90) {
        setPhaseText('SYNCHRONIZING INTELLIGENT SEARCH...');
      } else {
        setPhaseText('WELCOME TO CLOTHING');
      }

      if (rawProgress < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        // Complete & trigger fade out
        sessionStorage.setItem('clothing_splash_shown', 'true');
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsDone(true);
            if (onFinish) onFinish();
          }, 650);
        }, 200);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [onFinish]);

  if (isDone) return null;

  return (
    <div
      onClick={() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setIsDone(true);
          sessionStorage.setItem('clothing_splash_shown', 'true');
          if (onFinish) onFinish();
        }, 300);
      }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white cursor-pointer select-none transition-all duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      aria-label="Loading Application"
      role="status"
    >
      {/* Generative ambient background light glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#f4f4f4] via-[#ebebeb] to-[#f8f8f8] blur-3xl opacity-70 animate-pulse pointer-events-none" />

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm w-full">
        {/* App Logo with soft generative aura */}
        <div className="relative mb-7">
          {/* Ethereal pulsing halo glow */}
          <div className="absolute inset-0 -m-3 rounded-3xl bg-black/5 blur-xl animate-pulse" />
          
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#f8f8f8] border border-black/5 flex items-center justify-center shadow-lg transition-transform duration-500 hover:scale-105">
            <img
              src="/shirt.png"
              alt="Clothing Brand Logo"
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain filter drop-shadow-xs"
            />
          </div>
        </div>

        {/* Brand App Name */}
        <h1 className="text-xl sm:text-2xl font-black tracking-[0.35em] text-black uppercase mb-1 ml-1">
          C L O T H I N G
        </h1>
        <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#8a8a8a] mb-8">
          STUDIO // EDITION 2026
        </span>

        {/* Animated Percentage Counter */}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs sm:text-sm font-mono font-bold tracking-wider text-black">
            {progress}%
          </span>
        </div>

        {/* Minimal Precision Progress Bar Line */}
        <div className="w-56 sm:w-64 h-[2px] bg-[#f0f0f0] rounded-full overflow-hidden relative mb-4">
          <div
            className="h-full bg-black rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Generative phase description */}
        <span className="text-[9px] uppercase tracking-[0.2em] font-mono font-medium text-[#999999] transition-all duration-300">
          {phaseText}
        </span>
      </div>

      {/* Subtle skip hint at bottom */}
      <div className="absolute bottom-8 text-[10px] tracking-widest uppercase font-mono text-[#bbbbbb] opacity-60">
        Click anywhere to enter
      </div>
    </div>
  );
};
