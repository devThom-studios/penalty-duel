type CrowdSound = 'chant' | 'goal' | 'disappointed';
export type StadiumMode = 'idle' | 'aim' | 'reveal' | 'finished' | 'paused';

/** Device-local audio; match results still come only from the server. */
export class StadiumAudio {
  private context: AudioContext;
  private master: GainNode;
  private crowdGain: GainNode;
  private buffers = new Map<CrowdSound, AudioBuffer>();
  private loading?: Promise<void>;
  private crowd?: AudioBufferSourceNode;
  private effects = new Map<AudioScheduledSourceNode, () => void>();
  private reaction?: AudioBufferSourceNode;
  private enabled = false;
  private visible = true;
  private disposed = false;
  private mode: StadiumMode = 'idle';

  constructor(private onReadyChange: (ready: boolean) => void = () => {}) {
    const Audio = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
    this.context = new Audio();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    const limiter = this.context.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 18;
    limiter.ratio.value = 4;
    this.master.connect(limiter);
    limiter.connect(this.context.destination);
    this.crowdGain = this.context.createGain();
    this.crowdGain.gain.value = 0;
    this.crowdGain.connect(this.master);
    this.context.onstatechange = () => {
      if (this.disposed) return;
      this.onReadyChange(this.isReady);
      if (this.isReady) this.update();
    };
  }

  async enable() {
    this.enabled = true;
    // Every new tap must reach resume(), even if an earlier attempt is pending.
    // iOS can leave a resume promise unresolved until a supported user gesture.
    const resumed = this.context.resume();
    const prime = this.context.createBufferSource();
    prime.buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
    prime.connect(this.context.destination);
    prime.onended = () => prime.disconnect();
    prime.start();
    if (!this.loading) {
      this.loading = Promise.all((['chant', 'goal', 'disappointed'] as const).map(async name => {
        if (this.buffers.has(name)) return;
        const response = await fetch(`/audio/${name}.mp3`, {signal: AbortSignal.timeout(15000)});
        if (!response.ok) throw new Error('Crowd audio could not load.');
        const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
        if (!this.disposed) this.buffers.set(name, buffer);
      })).then(() => {}).catch(error => { this.loading = undefined; throw error; });
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const resumedInTime = new Promise<void>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Tap to enable sound.')), 2500);
      resumed.then(resolve, reject);
    });
    try {
      await Promise.all([resumedInTime, this.loading]);
      if (!this.disposed && this.context.state !== 'running') throw new Error('Tap to enable sound.');
      if (!this.disposed) { this.update(); this.onReadyChange(this.isReady); }
    } finally { clearTimeout(timer); }
  }

  get isReady() { return this.enabled && !this.disposed && this.isRunning && this.buffers.size === 3; }

  preview() {
    // A brief confirmation is audible even before a match has begun.
    if (!this.isReady || !this.visible || this.mode !== 'idle') return;
    const source = this.context.createBufferSource(), volume = this.context.createGain();
    const time = this.context.currentTime;
    source.buffer = this.buffers.get('chant')!;
    volume.gain.setValueAtTime(0, time);
    volume.gain.linearRampToValueAtTime(.26, time + .08);
    volume.gain.setValueAtTime(.26, time + .65);
    volume.gain.linearRampToValueAtTime(0, time + .95);
    source.connect(volume); volume.connect(this.master);
    this.master.gain.setTargetAtTime(.7, time, .02);
    this.effects.set(source, () => volume.disconnect());
    source.onended = () => { this.effects.delete(source); source.disconnect(); volume.disconnect(); };
    source.start(); source.stop(time + 1);
  }

  get isRunning() { return this.context.state === 'running'; }

  mute() { this.enabled = false; this.silence(); this.onReadyChange(false); }
  setMode(mode: StadiumMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    if (mode === 'idle' || mode === 'paused') this.silence();
    else this.update();
  }
  setVisible(visible: boolean) {
    this.visible = visible;
    if (!visible) this.silence();
    else if (this.enabled && !this.disposed) void this.context.resume().then(() => this.update()).catch(() => {});
  }
  private get audible() {
    return !this.disposed && this.enabled && this.visible && this.context.state === 'running' && this.mode !== 'paused' && this.mode !== 'idle';
  }
  private update() {
    if (!this.audible) return;
    const time = this.context.currentTime;
    this.master.gain.setTargetAtTime(.7, time, .05);
    if (this.mode === 'finished') {
      if (this.crowd) { this.crowd.stop(); this.crowd.disconnect(); this.crowd = undefined; }
      return;
    }
    const buffer = this.buffers.get('chant');
    if (!this.crowd && buffer) {
      this.crowd = this.context.createBufferSource();
      this.crowd.buffer = buffer;
      this.crowd.loop = true;
      this.crowd.connect(this.crowdGain);
      this.crowd.start();
    }
    this.crowdGain.gain.setTargetAtTime(this.reaction ? .07 : this.mode === 'reveal' ? .18 : .38, time, .22);
  }
  react(goal: boolean) {
    if (!this.audible) return;
    const buffer = this.buffers.get(goal ? 'goal' : 'disappointed');
    if (!buffer) return;
    if (this.reaction) this.reaction.stop();
    const source = this.context.createBufferSource();
    const volume = this.context.createGain();
    source.buffer = buffer;
    volume.gain.value = goal ? .85 : .8;
    source.connect(volume); volume.connect(this.master);
    this.reaction = source; this.effects.set(source, () => volume.disconnect());
    source.onended = () => {
      source.disconnect(); volume.disconnect(); this.effects.delete(source);
      if (this.reaction === source) this.reaction = undefined;
      this.update();
    };
    source.start(); this.update();
  }
  kick() {
    if (!this.audible) return;
    const time = this.context.currentTime;
    const thud = this.context.createOscillator(), volume = this.context.createGain();
    thud.frequency.setValueAtTime(155, time);
    thud.frequency.exponentialRampToValueAtTime(48, time + .11);
    volume.gain.setValueAtTime(.38, time);
    volume.gain.exponentialRampToValueAtTime(.001, time + .13);
    thud.connect(volume); volume.connect(this.master);
    this.effects.set(thud, () => volume.disconnect());
    thud.onended = () => { this.effects.delete(thud); thud.disconnect(); volume.disconnect(); };
    thud.start(); thud.stop(time + .14);
  }
  private silence() {
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setValueAtTime(0, this.context.currentTime);
    if (this.crowd) { this.crowd.stop(); this.crowd.disconnect(); this.crowd = undefined; }
    for (const [source, cleanup] of this.effects) { source.onended = null; try { source.stop(); } catch {} source.disconnect(); cleanup(); }
    this.effects.clear(); this.reaction = undefined;
  }
  dispose() {
    this.disposed = true; this.context.onstatechange = null; this.silence(); void this.context.close().catch(() => {});
  }
}
