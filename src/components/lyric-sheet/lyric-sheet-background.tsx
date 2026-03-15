import { usePlayerStore } from "@/lib/store/playerStore";
import { useSettingStore } from "@/lib/store/settingStore";
import { MeshGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";
import { extractColors } from "extract-colors";

export function LyricSheetBackground() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const coverUrl = currentSong?.al?.picUrl;
  const meshGradientProps = useSettingStore((s) => s.appearance.meshGradient);

  const [gradientColors, setGradientColors] = useState<string[]>([
    "#1a1a2e",
    "#16213e",
    "#0f3460",
    "#1a1a2e",
  ]);

  useEffect(() => {
    async function getColors() {
      if (!coverUrl) return;

      const colors = await extractColors(coverUrl, {
        pixels: 64000,
        distance: 0.22,
        colorValidator: (_r, _g, _b, alpha) => alpha > 250,
        saturationDistance: 0.2,
        lightnessDistance: 0.2,
        hueDistance: 0.0833,
      });

      const gradientColors = colors
        .filter((c) => c.lightness > 0.1 && c.lightness < 0.9)
        .filter((c) => c.saturation > 0.1)
        .sort((a, b) => b.area - a.area)
        .map((c) => c.hex);

      setGradientColors(
        gradientColors.length > 0 ? gradientColors : colors.map((c) => c.hex),
      );
    }

    getColors();
  }, [coverUrl]);

  return (
    <div className="absolute inset-0">
      <MeshGradient
        colors={gradientColors}
        distortion={meshGradientProps.distortion}
        swirl={meshGradientProps.swirl}
        grainMixer={meshGradientProps.grainMixer}
        grainOverlay={meshGradientProps.grainOverlay}
        speed={isPlaying ? meshGradientProps.speed : 0}
        className="w-full h-full"
      />
    </div>
  );
}
