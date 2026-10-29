let audioCtx: AudioContext | undefined

/** A soft blip. Silent unless the player has turned sounds on. */
export function beep(freq: number, enabled: boolean) {
  if (!enabled) return
  try {
    audioCtx ??= new AudioContext()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.15)
  } catch {
    // Audio is a nicety; ignore browsers that refuse it.
  }
}
