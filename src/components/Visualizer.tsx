import { motion } from "motion/react";
import ZoyaAvatar3D from "./ZoyaAvatar3D";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
  isAnimeMode?: boolean;
}

export default function Visualizer({ state, isAnimeMode }: VisualizerProps) {
  const getRingAnimation = (index: number, reverse: boolean = false): any => {
    const baseSpeed = state === "listening" ? 3 : state === "processing" ? 1.5 : state === "speaking" ? 2 : 15;
    return {
      rotate: reverse ? [-360, 0] : [0, 360],
      transition: { duration: baseSpeed + index * 2, repeat: Infinity, ease: "linear" }
    };
  };

  const getPulseAnimation = (): any => {
    if (state === "speaking") {
      return {
        scale: [1, 1.05, 0.98, 1.02, 1],
        opacity: [0.8, 1, 0.8, 1, 0.8],
        transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "listening") {
      return {
        scale: [1, 1.02, 1],
        opacity: [0.7, 1, 0.7],
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "processing") {
      return {
        scale: [0.98, 1.02, 0.98],
        opacity: [0.6, 0.9, 0.6],
        transition: { duration: 0.8, repeat: Infinity, ease: "linear" }
      };
    }
    return {
      scale: [1, 1.01, 1],
      opacity: [0.4, 0.6, 0.4],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    };
  };

  // JARVIS color palette (Cyan/Blue) with Zoya's personality (Violet/Pink hints)
  const getTheme = () => {
    if (isAnimeMode) {
      switch (state) {
        case "listening": return { color: "rgba(244, 114, 182, 1)", glow: "shadow-pink-400/80", border: "border-pink-300" }; // Anime Pink
        case "processing": return { color: "rgba(192, 132, 252, 1)", glow: "shadow-purple-400/80", border: "border-purple-300" }; // Anime Purple
        case "speaking": return { color: "rgba(251, 113, 133, 1)", glow: "shadow-rose-400/80", border: "border-rose-300" }; // Anime Rose
        default: return { color: "rgba(236, 72, 153, 0.8)", glow: "shadow-pink-500/40", border: "border-pink-500/50" };
      }
    }
    switch (state) {
      case "listening": return { color: "rgba(139, 92, 246, 1)", glow: "shadow-violet-500/60", border: "border-violet-400" };
      case "processing": return { color: "rgba(56, 189, 248, 1)", glow: "shadow-sky-400/80", border: "border-sky-400" };
      case "speaking": return { color: "rgba(236, 72, 153, 1)", glow: "shadow-pink-500/80", border: "border-pink-400" };
      default: return { color: "rgba(6, 182, 212, 0.8)", glow: "shadow-cyan-500/40", border: "border-cyan-500/50" }; // Cyan for idle
    }
  };

  const theme = getTheme();

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Ambient Glow */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[60%] h-[60%] rounded-full blur-[80px] ${theme.glow}`}
        style={{ backgroundColor: theme.color, opacity: 0.15 }}
      />

      {isAnimeMode && (
        <div className="absolute inset-0 z-0 flex items-center justify-center">
           {/* Anime Scanlines or HUD elements */}
           <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(236,72,153,0.1)_1px,transparent_1px)] bg-[length:100%_4px] opacity-20" />
           <div className="absolute top-10 left-10 text-[8px] font-mono text-pink-400 flex flex-col gap-1 opacity-50 uppercase tracking-widest animate-pulse">
              <span>Syncing Neural Core...</span>
              <span>Visual Protocol: MOE_V2</span>
              <span>Direct Link: SAURAV_MASTER</span>
           </div>
           <div className="absolute bottom-10 right-10 text-[8px] font-mono text-pink-400 flex flex-col items-end gap-1 opacity-50 uppercase tracking-widest">
              <span>Connection: STABLE</span>
              <span>Mode: ANIME_GIRL_UI</span>
              <span>ゾヤ OS : ON</span>
           </div>

           {/* Anime Girl Silhouette - Decorative */}
           <div className="opacity-10 pointer-events-none transform translate-y-20 scale-150">
              <svg width="400" height="600" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M200 100C160 100 130 130 130 170C130 190 140 210 150 220C140 230 120 250 120 280C120 310 140 330 160 340V500H240V340C260 330 280 310 280 280C280 250 260 230 250 220C260 210 270 190 270 170C270 130 240 100 200 100Z" fill="url(#pink_gradient)" />
                <path d="M130 150L100 220L130 200" stroke="#ec4899" strokeWidth="2" />
                <path d="M270 150L300 220L270 200" stroke="#ec4899" strokeWidth="2" />
                <defs>
                  <linearGradient id="pink_gradient" x1="200" y1="100" x2="200" y2="500" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ec4899" />
                    <stop offset="1" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
           </div>
        </div>
      )}

      {/* Ring 1: Massive Outer Dashed */}
      <motion.div
        animate={getRingAnimation(4, false)}
        className={`absolute w-[100%] h-[100%] rounded-full border-[1px] border-dashed ${theme.border} opacity-20`}
      />

      {/* Ring 2: Segmented Thick Ring */}
      <motion.div
        animate={getRingAnimation(3, true)}
        className={`absolute w-[85%] h-[85%] rounded-full border-[2px] border-dotted ${theme.border} opacity-30`}
      />

      {/* Ring 3: Scanner Ring (Solid with gaps) */}
      <motion.div
        animate={getRingAnimation(2, false)}
        className={`absolute w-[70%] h-[70%] rounded-full border-[1px] ${theme.border} border-t-transparent border-b-transparent opacity-40`}
      />

      {/* Ring 4: Inner Dashed */}
      <motion.div
        animate={getRingAnimation(1, true)}
        className={`absolute w-[55%] h-[55%] rounded-full border-[2px] border-dashed ${theme.border} opacity-50`}
      />
      
      {/* Ring 5: Core HUD Ring */}
      <motion.div
        animate={getRingAnimation(0, false)}
        className={`absolute w-[40%] h-[40%] rounded-full border-[4px] border-dotted ${theme.border} opacity-70`}
      />

      {/* Core Circle with 3D Avatar and ZOYA Text */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[50%] h-[50%] md:w-[35%] md:h-[35%] lg:w-[25%] lg:h-[25%] rounded-full flex flex-col items-center justify-center z-10`}
      >
        <div className="relative flex items-center justify-center">
          <ZoyaAvatar3D state={state} />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-20 pointer-events-none"
          >
            {isAnimeMode ? (
               <div className="flex flex-col items-center">
                 <h2 className={`text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-pink-500 opacity-20 select-none`}>
                   ZOYA
                 </h2>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <h2 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-pink-300 to-pink-600/20 select-none animate-pulse">
                      ZOYA
                    </h2>
                 </div>
                 {/* Decorative Katakana */}
                 <span className="text-[10px] font-bold text-pink-400/60 mt-[-10px] tracking-[0.5em] uppercase">ゾヤ · アシスタント</span>
               </div>
            ) : (
              <>
                <h2 className={`text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white opacity-20 select-none`}>
                  ZOYA
                </h2>
                <div className={`absolute inset-0 flex items-center justify-center`}>
                  <h2 className={`text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 select-none animate-pulse`}>
                    ZOYA
                  </h2>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
