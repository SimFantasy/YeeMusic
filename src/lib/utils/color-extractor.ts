/**
 * 从图片中提取主要颜色
 * @param imgUrl - 图片 URL
 * @returns {Promise<number[][]>} 返回 5 个 [r, g, b]（0-1）
 */
export async function extractColors(imgUrl: string): Promise<number[][]> {
  try {
    const imgSource = await loadImage(imgUrl);

    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      throw new Error("创建 Canvas 上下文失败");
    }

    tempCanvas.width = 64;
    tempCanvas.height = 64;

    ctx.drawImage(imgSource, 0, 0, tempCanvas.width, tempCanvas.height);
    const imageData = ctx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height,
    );

    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      let r = pixels[i];
      let g = pixels[i + 1];
      let b = pixels[i + 2];

      r = (r - 128) * 0.4 + 128;
      g = (g - 128) * 0.4 + 128;
      b = (b - 128) * 0.4 + 128;

      const gray = r * 0.3 + g * 0.59 + b * 0.11;
      r = gray * -2.0 + r * 3.0;
      g = gray * -2.0 + g * 3.0;
      b = gray * -2.0 + b * 3.0;

      r = (r - 128) * 1.7 + 128;
      g = (g - 128) * 1.7 + 128;
      b = (b - 128) * 1.7 + 128;

      pixels[i] = clamp8(r * 0.75);
      pixels[i + 1] = clamp8(g * 0.75);
      pixels[i + 2] = clamp8(b * 0.75);
    }

    blurImageData(imageData, 2, 4);

    const processedPixels = imageData.data;
    const colorSamples: number[][] = [];
    for (let i = 0; i < processedPixels.length; i += 4) {
      const r = processedPixels[i] / 255;
      const g = processedPixels[i + 1] / 255;
      const b = processedPixels[i + 2] / 255;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum > 0.03 && lum < 0.97) {
        colorSamples.push([r, g, b]);
      }
    }

    if (colorSamples.length < 5) {
      return FALLBACK_COLORS;
    }

    const centroids = kMeansPlusPlus(colorSamples, 5, 12);

    const clusters = assignClusters(colorSamples, centroids);
    const scored = centroids.map((c, i) => {
      const pop = clusters[i].length / colorSamples.length;
      const sat = saturation(c);
      return { color: c, score: pop * (0.3 + sat * 0.7) };
    });
    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.color);
  } catch (err) {
    console.error("[ColorExtractor]", err);
    return FALLBACK_COLORS;
  }
}

const FALLBACK_COLORS = [
  [0.15, 0.12, 0.22],
  [0.1, 0.08, 0.2],
  [0.08, 0.18, 0.3],
  [0.14, 0.1, 0.25],
  [0.12, 0.1, 0.18],
];

function clamp8(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

/**
 * 原地 box blur，迭代多次近似高斯模糊
 */
function blurImageData(
  imageData: ImageData,
  radius: number,
  iterations: number,
): void {
  const w = imageData.width;
  const h = imageData.height;
  const pixels = imageData.data;
  const len = w * h * 4;
  const temp = new Uint8ClampedArray(len);

  for (let iter = 0; iter < iterations; iter++) {
    // 水平方向
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < w) {
            const idx = (y * w + nx) * 4;
            r += pixels[idx];
            g += pixels[idx + 1];
            b += pixels[idx + 2];
            count++;
          }
        }
        const idx = (y * w + x) * 4;
        temp[idx] = (r / count) | 0;
        temp[idx + 1] = (g / count) | 0;
        temp[idx + 2] = (b / count) | 0;
        temp[idx + 3] = 255;
      }
    }

    // 垂直方向
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny >= 0 && ny < h) {
            const idx = (ny * w + x) * 4;
            r += temp[idx];
            g += temp[idx + 1];
            b += temp[idx + 2];
            count++;
          }
        }
        const idx = (y * w + x) * 4;
        pixels[idx] = (r / count) | 0;
        pixels[idx + 1] = (g / count) | 0;
        pixels[idx + 2] = (b / count) | 0;
      }
    }
  }
}

/**
 * K-Means++ 初始化 + 迭代
 */
function kMeansPlusPlus(
  pixels: number[][],
  k: number,
  maxIter: number,
): number[][] {
  const centroids: number[][] = [];

  // 第一个种子：选饱和度最高的像素
  let bestIdx = 0;
  let bestSat = -1;
  for (let i = 0; i < pixels.length; i += 3) {
    const s = saturation(pixels[i]);
    if (s > bestSat) {
      bestSat = s;
      bestIdx = i;
    }
  }
  centroids.push([...pixels[bestIdx]]);

  // 后续种子：选离已有种子最远的点
  for (let c = 1; c < k; c++) {
    let maxMinDist = -1;
    let farthestIdx = 0;
    for (let i = 0; i < pixels.length; i++) {
      let minDist = Infinity;
      for (let j = 0; j < centroids.length; j++) {
        const d = perceptualDistSq(pixels[i], centroids[j]);
        if (d < minDist) minDist = d;
      }
      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        farthestIdx = i;
      }
    }
    centroids.push([...pixels[farthestIdx]]);
  }

  // 迭代优化
  for (let iter = 0; iter < maxIter; iter++) {
    const clusters = assignClusters(pixels, centroids);
    let converged = true;

    for (let c = 0; c < k; c++) {
      if (clusters[c].length === 0) continue;

      const newCentroid = [0, 0, 0];
      for (const px of clusters[c]) {
        newCentroid[0] += px[0];
        newCentroid[1] += px[1];
        newCentroid[2] += px[2];
      }
      newCentroid[0] /= clusters[c].length;
      newCentroid[1] /= clusters[c].length;
      newCentroid[2] /= clusters[c].length;

      const shift = perceptualDistSq(centroids[c], newCentroid);
      if (shift > 0.0001) converged = false;

      centroids[c] = newCentroid;
    }

    if (converged) break;
  }

  return centroids;
}

/**
 * 将像素分配到最近的聚类中心
 */
function assignClusters(
  pixels: number[][],
  centroids: number[][],
): number[][][] {
  const clusters: number[][][] = centroids.map(() => []);
  for (const px of pixels) {
    let minDist = Infinity;
    let bestCluster = 0;
    for (let c = 0; c < centroids.length; c++) {
      const d = perceptualDistSq(px, centroids[c]);
      if (d < minDist) {
        minDist = d;
        bestCluster = c;
      }
    }
    clusters[bestCluster].push(px);
  }
  return clusters;
}

/**
 * 感知加权距离平方
 */
function perceptualDistSq(c1: number[], c2: number[]): number {
  const dr = c1[0] - c2[0];
  const dg = c1[1] - c2[1];
  const db = c1[2] - c2[2];
  return dr * dr * 2 + dg * dg * 4 + db * db * 3;
}

/**
 * 计算 HSV 饱和度
 */
function saturation(c: number[]): number {
  const max = Math.max(c[0], c[1], c[2]);
  const min = Math.min(c[0], c[1], c[2]);
  return max < 0.001 ? 0 : (max - min) / max;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`加载图片失败: ${url}`));
    img.src = url;
  });
}
