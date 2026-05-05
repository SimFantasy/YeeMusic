import { Howl } from "howler";

class CorePlayer {
  private howl: Howl | null = null;
  private rafId: number | null = null;
  private onProgressCallback: ((currentTime: number) => void) | null = null;

  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private smoothVolume: number = 0;
  private isAnalyserInitialized = false;

  private initAnalyser() {
    if (this.isAnalyserInitialized || !Howler.ctx) return;
    try {
      this.analyser = Howler.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      Howler.masterGain.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isAnalyserInitialized = true;
    } catch (e) {
      console.error("[CorePlayer] Web Audio API 分析器初始化失败:", e);
    }
  }

  // 播放歌曲
  play(
    url: string,
    onEnd: () => void,
    onPlay: (duration: number) => void,
    onProgress?: (currentTime: number) => void,
  ) {
    if (this.howl) this.howl.unload();
    this.stopProgressLoop();

    this.onProgressCallback = onProgress || null;

    this.howl = new Howl({
      src: [url],
      html5: true,
      format: ["mp3", "flac"],
      onplay: () => {
        this.initAnalyser();

        onPlay(this.howl?.duration() || 0);
        this.startProgressLoop();
      },
      onpause: () => this.stopProgressLoop(),
      onend: () => {
        this.stopProgressLoop();
        onEnd();
      },
    });

    this.howl?.play();
  }

  private startProgressLoop() {
    const loop = () => {
      if (this.howl && this.onProgressCallback) {
        this.onProgressCallback(this.howl.seek() as number);
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopProgressLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause() {
    this.howl?.pause();
  }

  resume() {
    this.howl?.play();
  }

  seek(per: number) {
    if (!this.howl) return;

    const time = this.howl.duration() * per;
    this.howl.seek(time);
  }

  setVolume(val: number) {
    this.howl?.volume(val);
  }

  getPosition() {
    return this.howl?.seek() || 0;
  }

  isReady() {
    return this.howl !== null;
  }

  getReactVolume(): number {
    if (
      !this.analyser ||
      !this.dataArray ||
      !this.howl ||
      !this.howl.playing()
    ) {
      this.smoothVolume += (0 - this.smoothVolume) * 0.08;
      return this.smoothVolume;
    }

    this.analyser.getByteFrequencyData(
      this.dataArray as Uint8Array<ArrayBuffer>,
    );

    const noiseFloor = 30;
    const binCount = Math.min(50, this.dataArray.length);
    let sum = 0;
    for (let i = 0; i < binCount; ++i) {
      const v = this.dataArray[i];
      sum += v > noiseFloor ? v - noiseFloor : 0;
    }
    const avg = sum / binCount;
    const rawVolume = avg / (255 - noiseFloor);

    const factor = rawVolume > this.smoothVolume ? 0.5 : 0.1;
    this.smoothVolume += (rawVolume - this.smoothVolume) * factor;

    return this.smoothVolume;
  }
}

export const corePlayer = new CorePlayer();
