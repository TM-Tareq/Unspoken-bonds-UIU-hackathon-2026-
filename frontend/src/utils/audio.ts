const DOT_DURATION = 100; // ms

export const playMorseSound = (morse: string) => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);

  let currentTime = audioCtx.currentTime;

  morse.split('').forEach(char => {
    if (char === '.') {
      gainNode.gain.setValueAtTime(1, currentTime);
      currentTime += DOT_DURATION / 1000;
      gainNode.gain.setValueAtTime(0, currentTime);
    } else if (char === '-') {
      gainNode.gain.setValueAtTime(1, currentTime);
      currentTime += (DOT_DURATION * 3) / 1000;
      gainNode.gain.setValueAtTime(0, currentTime);
    }
    // Inter-element gap
    currentTime += DOT_DURATION / 1000;
    
    if (char === ' ' || char === '/') {
       // Space between letters/words (simplified)
       currentTime += (DOT_DURATION * 2) / 1000;
    }
  });

  oscillator.start();
  oscillator.stop(currentTime);
};
