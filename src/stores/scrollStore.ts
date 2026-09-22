// High-performance direct-reference scroll & animation store
// Decouples high-frequency 60-120fps camera lerp from React state re-renders

class ScrollStore {
  public currentProgress: number = 0;
  public targetProgress: number = 0;
  private listeners: Set<(progress: number) => void> = new Set();
  private isLerping: boolean = false;
  private animFrameId: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    const handleScroll = () => {
      const scrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.scrollingElement ? document.scrollingElement.scrollHeight : 0
      );
      const maxScroll = docHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      this.targetProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
      this.startLerpLoop();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
  }

  private startLerpLoop() {
    if (this.isLerping) return;
    this.isLerping = true;

    const loop = () => {
      const delta = this.targetProgress - this.currentProgress;
      if (Math.abs(delta) < 0.0002) {
        this.currentProgress = this.targetProgress;
        this.notifyListeners();
        this.isLerping = false;
        this.animFrameId = null;
        return;
      }

      this.currentProgress += delta * 0.12;
      this.notifyListeners();
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public setTarget(val: number) {
    this.targetProgress = Math.min(1, Math.max(0, val));
    this.startLerpLoop();
  }

  public update(): number {
    return this.currentProgress;
  }

  public subscribe(listener: (progress: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.currentProgress);
    }
  }
}

export const scrollStore = new ScrollStore();
