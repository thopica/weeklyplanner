let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

type BellNote = {
  frequency: number;
  startOffset: number;
  attack: number;
  decay: number;
  peakGain: number;
};

/** Ascending bell sequence when a phase ends. Requires prior user gesture in most browsers. */
export function playPhaseCompleteChime(): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.92, ctx.currentTime);
  master.connect(ctx.destination);

  const notes: BellNote[] = [
    { frequency: 392, startOffset: 0, attack: 0.02, decay: 0.55, peakGain: 0.5 },
    { frequency: 523.25, startOffset: 0.22, attack: 0.02, decay: 0.6, peakGain: 0.55 },
    { frequency: 659.25, startOffset: 0.48, attack: 0.02, decay: 0.75, peakGain: 0.58 },
    { frequency: 783.99, startOffset: 0.78, attack: 0.03, decay: 1.15, peakGain: 0.62 },
  ];

  const base = ctx.currentTime;

  for (const note of notes) {
    const start = base + note.startOffset;
    const end = start + note.attack + note.decay;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(note.frequency, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.peakGain, start + note.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(end + 0.08);
  }
}
