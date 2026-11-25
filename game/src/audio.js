// Procedural Web Audio API sound effects for Lantern & Ladle.
// Generates knife chops, wok sizzle, simmering plops, brass service bell,
// and celebratory combo chimes offline with zero external audio assets.

export function createAudioEngine() {
  let ctx = null;
  let noiseBuffer = null;
  let muted = false;

  function ensureContext() {
    if (muted) return null;
    if (!ctx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      try {
        ctx = new AudioCtor();
        const sampleRate = ctx.sampleRate;
        const length = Math.floor(sampleRate * 0.5);
        noiseBuffer = ctx.createBuffer(1, length, sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) {
          data[i] = Math.random() * 2 - 1;
        }
      } catch {
        ctx = null;
        return null;
      }
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playTone(freqStart, freqEnd, duration, type = 'sine', gainPeak = 0.12, delay = 0) {
    const audio = ensureContext();
    if (!audio) return;
    const now = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playFilteredNoise(filterFreq, q, duration, gainPeak, filterType = 'bandpass', delay = 0) {
    const audio = ensureContext();
    if (!audio || !noiseBuffer) return;
    const now = audio.currentTime + delay;
    const src = audio.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = audio.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.setValueAtTime(q, now);
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  return {
    unlock() {
      ensureContext();
    },
    isMuted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      if (!muted) playTone(520, 660, 0.09, 'triangle', 0.08);
      return muted;
    },
    playPickup() {
      playTone(340, 480, 0.07, 'triangle', 0.08);
    },
    playChop(hitIndex = 0) {
      const pitch = 240 + (hitIndex % 3) * 35;
      playTone(pitch, 90, 0.06, 'triangle', 0.14);
      playFilteredNoise(1800, 2.2, 0.045, 0.12, 'bandpass');
    },
    playWokSizzle() {
      playFilteredNoise(3200, 1.1, 0.28, 0.09, 'highpass');
      playTone(170, 110, 0.12, 'sawtooth', 0.03);
    },
    playWokToss() {
      playFilteredNoise(2400, 0.9, 0.22, 0.14, 'bandpass');
      playTone(220, 420, 0.12, 'sine', 0.07);
    },
    playKettleStart() {
      playTone(210, 310, 0.14, 'sine', 0.08);
      playTone(315, 420, 0.12, 'sine', 0.05, 0.05);
    },
    playPlateLayer() {
      playTone(620, 880, 0.08, 'sine', 0.08);
    },
    playDishComplete() {
      playTone(523.25, 523.25, 0.11, 'triangle', 0.1, 0);
      playTone(659.25, 659.25, 0.11, 'triangle', 0.1, 0.07);
      playTone(783.99, 783.99, 0.18, 'triangle', 0.12, 0.14);
    },
    playServeBell(combo = 1) {
      // Crisp resonant brass service bell overtones + tip coin shimmer
      const boost = Math.min(combo, 5) * 40;
      playTone(1320 + boost, 1310 + boost, 0.42, 'sine', 0.13, 0);
      playTone(2640 + boost, 2620 + boost, 0.25, 'sine', 0.05, 0);
      playTone(987.77, 1174.66, 0.14, 'triangle', 0.09, 0.1);
    },
    playTrash() {
      playTone(240, 110, 0.15, 'sawtooth', 0.08);
      playFilteredNoise(900, 1.5, 0.12, 0.08, 'lowpass');
    },
    playError() {
      playTone(185, 130, 0.12, 'square', 0.06);
    },
    playOrderSpawn() {
      playTone(440, 554, 0.08, 'sine', 0.05);
    },
    playBurnWarn() {
      playTone(720, 520, 0.09, 'sawtooth', 0.05);
    },
    playShiftComplete() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => playTone(n, n, 0.24, 'triangle', 0.1, idx * 0.09));
    },
  };
}
