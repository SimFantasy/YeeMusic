export interface LyricWord {
  startTime: number;
  duration: number;
  char: string;
}

export interface ILyricLine {
  lineStart: number;
  lineText: string;
  words?: LyricWord[]; // 逐字歌词用，逐行歌词为 undefined
  showLeadDots: boolean;
  isBG: boolean;
}

function checkIsBgLine(text: string): { text: string; isBG: boolean } {
  const trimmed = text.trim();
  if (trimmed.startsWith("（") && trimmed.endsWith("）")) {
    return { text: trimmed.slice(1, -1), isBG: true };
  }
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    return { text: trimmed.slice(1, -1), isBG: true };
  }
  return { text, isBG: false };
}

/**
 * 将 duration 为 0 的字符合并到相邻的非零字上，
 * 避免 useTransform 输入区间退化导致显示异常。
 * 向后合并：零时长字 append 到前一个字；
 * 行首的零时长字则 prepend 到后一个字。
 */
function mergeZeroDuration(words: LyricWord[]): LyricWord[] {
  if (words.length === 0) return words;

  const result: LyricWord[] = [];
  let pending = "";

  for (const w of words) {
    if (w.duration === 0) {
      if (result.length > 0) {
        result[result.length - 1] = {
          ...result[result.length - 1],
          char: result[result.length - 1].char + w.char,
        };
      } else {
        pending += w.char;
      }
    } else {
      result.push({ ...w, char: pending + w.char });
      pending = "";
    }
  }

  if (pending && result.length > 0) {
    const last = result[result.length - 1];
    result[result.length - 1] = { ...last, char: last.char + pending };
  }

  return result;
}

/**
 * 解析普通 lrc 歌词
 * @param rawString lrc 歌词字符串
 * @returns 返回解析得到的 LyricLine
 */
export function ParseLyric(rawString: string | undefined) {
  if (!rawString) return null;

  const lines = rawString.split("\n");

  const lrcRegex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  const lyrics: ILyricLine[] = [];

  const checkLeadDots = (currentTime: number) => {
    if (lyrics.length === 0) {
      return currentTime >= 10000;
    }
    const prevTime = lyrics[lyrics.length - 1].lineStart;
    return currentTime - prevTime >= 10000;
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const match = lrcRegex.exec(trimmedLine);
    if (match) {
      const m = parseInt(match[1]);
      const s = parseInt(match[2]);
      const ms = parseInt(match[3]);
      const time = m * 60 * 1000 + s * 1000 + ms;
      const text = match[4].trim();

      if (text) {
        const bg = checkIsBgLine(text);
        lyrics.push({
          lineStart: time,
          lineText: bg.text,
          showLeadDots: checkLeadDots(time),
          isBG: bg.isBG,
        });
      }
    }
  });

  return lyrics;
}

/**
 * 解析逐字歌词
 * @param rawString 逐字歌词字符串
 * @returns 返回解析得到的 LyricLine
 */
export function ParseVerbatimLyric(rawString: string | undefined) {
  if (!rawString) return null;

  const lines = rawString.split("\n");
  const lyrics: ILyricLine[] = [];

  const lineRegex = /^\[(\d+),(\d+)\]/;
  const wordRegex = /\((\d+),(\d+),\d+\)([^()]+)/g;

  const checkLeadDots = (currentTime: number) => {
    if (lyrics.length === 0) {
      return currentTime >= 10000;
    }
    const prevTime = lyrics[lyrics.length - 1].lineStart;
    return currentTime - prevTime >= 10000;
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const lineMatch = lineRegex.exec(trimmedLine);
    if (lineMatch) {
      const lineStart = parseInt(lineMatch[1]);
      const words: LyricWord[] = [];
      let lineText = "";

      let wordMatch;

      while ((wordMatch = wordRegex.exec(trimmedLine)) !== null) {
        const startTime = parseInt(wordMatch[1]);
        const duration = parseInt(wordMatch[2]);
        const char = wordMatch[3];

        words.push({ startTime, duration, char });
        lineText += char;
      }

      if (words.length > 0) {
        const merged = mergeZeroDuration(words);
        const bg = checkIsBgLine(lineText);
        const finalWords = bg.isBG ? merged.slice(1, -1) : merged;
        if (finalWords.length > 0) {
          lyrics.push({
            lineStart,
            lineText: bg.text,
            words: finalWords,
            showLeadDots: checkLeadDots(lineStart),
            isBG: bg.isBG,
          });
        }
      }
    }
  });

  return lyrics;
}
