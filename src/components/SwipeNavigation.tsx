import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { Undo2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface Props {
  onBack: () => void;
  children: React.ReactNode;
}

export default function SwipeNavigation({ onBack, children }: Props) {
  const touchStart = useRef<{ x: number, y: number } | null>(null);
  const [gesture, setGesture] = React.useState<"left" | "right" | "down" | null>(null);
  const [progress, setProgress] = React.useState(0);

  const THRESHOLD = 100; // px to trigger

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const deltaX = e.touches[0].clientX - touchStart.current.x;
      const deltaY = e.touches[0].clientY - touchStart.current.y;

      // Determine primary direction if not set
      if (!gesture) {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            setGesture(deltaX > 0 ? "right" : "left");
          } else if (deltaY > 0) {
            // Only trigger down swipe if we are at the top of the scrollable container
            const target = e.target as HTMLElement;
            const scrollParent = target.closest?.('.overflow-y-auto, .overflow-auto') as HTMLElement;
            if (!scrollParent || scrollParent.scrollTop <= 0) {
              setGesture("down");
            }
          }
        }
      }

      if (gesture) {
        let p = 0;
        if (gesture === "right") p = deltaX / THRESHOLD;
        if (gesture === "left") p = -deltaX / THRESHOLD;
        if (gesture === "down") p = deltaY / THRESHOLD;
        setProgress(Math.min(Math.max(p, 0), 1.2));
      }
    };

    const handleTouchEnd = () => {
      if (progress >= 1) {
        onBack();
      }
      setGesture(null);
      setProgress(0);
      touchStart.current = null;
    };

    // Wheel support (trackpads)
    const handleWheel = (e: WheelEvent) => {
        // Only trigger if no active gesture and strong intentional swipe
        if (Math.abs(e.deltaX) > 50 || e.deltaY > 50) {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                // Horizontal
                onBack();
            } else if (e.deltaY > 50) {
                // Vertical down
                onBack();
            }
        }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
    // window.addEventListener("wheel", handleWheel); // Can be annoying if browsing list

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [gesture, progress, onBack]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {children}

      <AnimatePresence>
        {gesture && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[999] flex items-center justify-center"
          >
            {/* Visual feedback circles */}
            {gesture === "right" && (
              <motion.div 
                style={{ scale: progress, opacity: progress }}
                className="absolute left-8 w-20 h-20 bg-white/10 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md"
              >
                <ChevronRight className="text-white" size={32} />
              </motion.div>
            )}
            
            {gesture === "left" && (
              <motion.div 
                style={{ scale: progress, opacity: progress }}
                className="absolute right-8 w-20 h-20 bg-white/10 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md"
              >
                <ChevronLeft className="text-white" size={32} />
              </motion.div>
            )}

            {gesture === "down" && (
              <motion.div 
                style={{ scale: progress, opacity: progress }}
                className="absolute top-8 w-20 h-20 bg-white/10 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md"
              >
                <ChevronDown className="text-white" size={32} />
              </motion.div>
            )}

            {/* Global Flash when threshold met */}
            {progress >= 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                className="absolute inset-0 bg-white"
              />
            )}

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
              <motion.div
                animate={{ scale: progress >= 1 ? 1.2 : 1 }}
                className={`p-6 rounded-full ${progress >= 1 ? 'bg-violet-500' : 'bg-white/10'} backdrop-blur-xl border border-white/20 shadow-2xl transition-colors`}
              >
                <Undo2 className={progress >= 1 ? 'text-white' : 'text-white/40'} size={40} />
              </motion.div>
              <p className={`text-xs font-bold uppercase tracking-[0.3em] ${progress >= 1 ? 'text-violet-400' : 'text-white/20'}`}>
                {progress >= 1 ? "Release to Go Back" : "Swipe to Navigation"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
