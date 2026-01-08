import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MORSE_CODE } from '../../utils/morseData';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

const MorseRacer: React.FC = () => {
  const navigate = useNavigate();
  const [target, setTarget] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
  const timerRef = useRef<any>(null);

  const startNewTarget = () => {
    const randomChar = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    setTarget(randomChar);
    setInput('');
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
    startNewTarget();
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setGameState('gameOver');
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing') return;
    
    const val = e.target.value;
    setInput(val);

    const expected = MORSE_CODE[target];
    if (val.trim() === expected) {
      setScore(prev => prev + 1);
      startNewTarget();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex items-center justify-center">
      <div className="max-w-xl w-full">
        <button 
          onClick={() => navigate('/learn')}
          className="text-blue-600 hover:underline mb-6 block"
        >
          ← Back to Learning
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border-t-8 border-orange-500">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Morse Racer 🏎️</h1>
            <div className="flex gap-4">
              <div className="text-center">
                <span className="block text-[10px] text-gray-400 font-bold uppercase">Time</span>
                <span className={`text-2xl font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'dark:text-white'}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] text-gray-400 font-bold uppercase">Score</span>
                <span className="text-2xl font-mono dark:text-white">{score}</span>
              </div>
            </div>
          </div>

          {gameState === 'idle' ? (
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xs mx-auto">
                Test your speed! Type the Morse code for each character as fast as you can.
              </p>
              <button 
                onClick={startGame}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-xl hover:bg-orange-600 transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
              >
                START RACING!
              </button>
            </div>
          ) : gameState === 'playing' ? (
            <div className="space-y-12">
              <div className="text-center">
                <span className="text-gray-400 text-sm uppercase font-bold mb-4 block">Current Target:</span>
                <div className="text-9xl font-black text-gray-900 dark:text-white mb-2">{target}</div>
                <div className="text-2xl font-mono text-blue-600 dark:text-blue-400 h-8">
                   {/* Hint shown subtly if they wait? Let's keep it pure for now */}
                </div>
              </div>

              <div>
                <input
                  autoFocus
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  className="w-full text-center text-4xl p-6 bg-gray-100 dark:bg-gray-700 border-none rounded-2xl dark:text-white font-mono placeholder-gray-300"
                  placeholder=".--."
                />
                <p className="text-center mt-4 text-xs text-gray-400 font-medium">
                  HINT: {target} is <span className="text-gray-600 dark:text-gray-200">{MORSE_CODE[target]}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Race Over! 🏁</h2>
              <p className="text-gray-500 mb-8">You achieved a score of:</p>
              <div className="text-8xl font-black text-blue-600 mb-10">{score}</div>
              <button 
                onClick={startGame}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-lg mb-4"
              >
                TRY AGAIN
              </button>
              <button 
                onClick={() => navigate('/learn')}
                className="w-full py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                GO BACK
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MorseRacer;
