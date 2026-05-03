import { usePlayerStore } from "@/lib/store/playerStore";
import { ILyricLine } from "@/lib/utils/lyric-parser";
import { motion } from "framer-motion";
import { forwardRef, useMemo } from "react";

const TOTAL = 3;
const FADE_IN_MS = 1000;
const FADE_OUT_MS = 750;
const TARGET_BREATHE_MS = 1500;

function easeOutExpo(x: number): number {
  return x >= 1 ? 1 : 1 - 2 ** (-10 * x);
}

function easeInOutBack(x: number): number {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return x < 0.5
    ? ((2 * x) ** 2 * ((c2 + 1) * 2 * x - c2)) / 2
    : ((2 * x - 2) ** 2 * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

export const LyricLeadDots = forwardRef<
  HTMLDivElement,
  { isActive: boolean; targetScrollY: number; lyricLine: ILyricLine }
>(function LyricLeadDots({ isActive, targetScrollY, lyricLine }, ref) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const elapsed = currentTime * 1000 - lyricLine.lineStart;
  const duration = lyricLine.leadDotsDuration ?? 3000;

  const { globalOpacity, scale, dots } = useMemo(() => {
    const t = Math.max(0, elapsed);
    const remaining = duration - t;

    // 入场淡入
    let opacity = 1;
    if (t < 500) opacity = 0;
    else if (t < FADE_IN_MS) opacity = (t - 500) / 500;

    // 退场淡出
    if (remaining < FADE_OUT_MS) {
      opacity *= Math.max(0, remaining / FADE_OUT_MS);
    }

    // 呼吸缩放
    const numBreathes = Math.ceil(duration / TARGET_BREATHE_MS);
    const breatheDuration = duration / numBreathes;
    let s =
      Math.sin(1.5 * Math.PI - (t / breatheDuration) * Math.PI * 2) / 20 + 1;

    // 入场放大
    if (t < 2000) {
      s *= easeOutExpo(t / 2000);
    }

    // 退场缩小
    if (remaining < FADE_OUT_MS) {
      s *= 1 - easeInOutBack((FADE_OUT_MS - remaining) / FADE_OUT_MS / 2);
    }

    s = Math.max(0, s) * 0.7;

    // 三点依次亮起
    const dotsDuration = Math.max(0, duration - FADE_OUT_MS);
    const dotData = Array.from({ length: TOTAL }).map((_, i) => {
      const raw = ((t - (dotsDuration * i) / TOTAL) * TOTAL) / dotsDuration;
      return Math.max(0.25, Math.min(1, raw));
    });

    return { globalOpacity: opacity, scale: s, dots: dotData };
  }, [elapsed, duration]);

  return (
    <motion.div
      layout="position"
      ref={ref}
      animate={{ y: targetScrollY }}
      transition={{
        y: { type: "spring", stiffness: 120, damping: 20, mass: 0.8 },
      }}
    >
      {isActive && (
        <motion.div
          className="flex items-center justify-center gap-3 px-4 py-4 select-none pointer-events-none h-24"
          style={{ opacity: globalOpacity, scale }}
        >
          {dots.map((dotOpacity, i) => (
            <motion.span
              key={i}
              className="size-4 rounded-full bg-white"
              animate={{
                opacity: dotOpacity,
                scale: dotOpacity > 0.3 ? 1.2 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
});
LyricLeadDots.displayName = "LyricLeadDots";
