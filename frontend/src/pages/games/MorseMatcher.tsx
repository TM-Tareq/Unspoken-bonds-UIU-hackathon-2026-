import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { textToMorse } from '../../utils/morseData';

interface Tile {
  id: number;
  content: string;
  type: 'word' | 'morse';
  matchId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

const WORDS = ['HELLO', 'WORLD', 'MORSE', 'COFFEE', 'CODE', 'LOVE', 'PEACE', 'FRIEND'];

const MorseMatcher: React.FC = () => {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [flippedTiles, setFlippedTiles] = useState<Tile[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Select 6 random words for a 12-tile grid
    const selectedWords = [...WORDS].sort(() => 0.5 - Math.random()).slice(0, 6);
    const newTiles: Tile[] = [];

    selectedWords.forEach((word, index) => {
      // Word tile
      newTiles.push({
        id: index * 2,
        content: word,
        type: 'word',
        matchId: index,
        isFlipped: false,
        isMatched: false,
      });
      // Morse tile
      newTiles.push({
        id: index * 2 + 1,
        content: textToMorse(word),
        type: 'morse',
        matchId: index,
        isFlipped: false,
        isMatched: false,
      });
    });

    setTiles(newTiles.sort(() => 0.5 - Math.random()));
    setFlippedTiles([]);
    setMatches(0);
    setMoves(0);
    setGameOver(false);
  };

  const handleTileClick = (tile: Tile) => {
    if (tile.isFlipped || tile.isMatched || flippedTiles.length === 2) return;

    const newFlipped = [...flippedTiles, tile];
    setFlippedTiles(newFlipped);

    // Update tile state
    setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, isFlipped: true } : t));

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [first, second] = newFlipped;

      if (first.matchId === second.matchId) {
        // Match!
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            t.matchId === first.matchId ? { ...t, isMatched: true } : t
          ));
          setFlippedTiles([]);
          setMatches(prev => {
            const newMatches = prev + 1;
            if (newMatches === 6) setGameOver(true);
            return newMatches;
          });
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            t.id === first.id || t.id === second.id ? { ...t, isFlipped: false } : t
          ));
          setFlippedTiles([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <button 
              onClick={() => navigate('/learn')}
              className="text-blue-600 hover:underline mb-2 block"
            >
              ← Back to Learning
            </button>
            <h1 className="text-3xl font-bold dark:text-white">Morse Matcher</h1>
          </div>
          <div className="text-right">
            <p className="text-gray-600 dark:text-gray-400 font-medium">Moves: {moves}</p>
            <p className="text-green-600 dark:text-green-400 font-bold">Matches: {matches} / 6</p>
          </div>
        </div>

        {gameOver ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center shadow-xl border-4 border-green-500 animate-bounce">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">You Won! 🎉</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Perfect! You've matched all the Morse code words in {moves} moves.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={initializeGame}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Play Again
              </button>
              <button 
                onClick={() => navigate('/learn')}
                className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Back to Learn
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tiles.map(tile => (
              <div
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                className={`
                  aspect-square flex items-center justify-center p-2 rounded-2xl cursor-pointer
                  transition-all duration-300 transform font-bold text-center
                  ${tile.isFlipped || tile.isMatched
                    ? 'bg-blue-600 text-white scale-100 rotate-0 shadow-lg'
                    : 'bg-white dark:bg-gray-800 dark:text-gray-600 text-gray-200 hover:scale-105 hover:shadow-md'
                  }
                  ${tile.isMatched ? 'opacity-50 ring-4 ring-green-500 bg-green-600' : ''}
                `}
              >
                <span className={`
                  ${tile.type === 'morse' ? 'text-lg font-mono tracking-tighter' : 'text-xl'}
                  ${!tile.isFlipped && !tile.isMatched ? 'hidden' : 'block'}
                `}>
                  {tile.content}
                </span>
                {!tile.isFlipped && !tile.isMatched && (
                  <span className="text-4xl text-gray-100 dark:text-gray-700">?</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900">
          <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">How to Play:</h3>
          <ul className="text-indigo-800 dark:text-indigo-400 text-sm space-y-1 list-disc list-inside">
            <li>Click a tile to reveal its content.</li>
            <li>Find the English word and its corresponding Morse code.</li>
            <li>Match all 6 pairs to win the game!</li>
            <li>Tip: Pay attention to long and short signals.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MorseMatcher;
