import { useState, useEffect } from 'react';
import { Brain, Timer, Zap, Trophy } from 'lucide-react';

function MemoryChallenge({ challenge, onComplete, onCancel }) {
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  // Initialize cards
  useEffect(() => {
    const initialCards = challenge.content.cards.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false
    }));
    setCards(initialCards);
  }, [challenge]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  // Check if game is won
  useEffect(() => {
    if (matchedPairs.length === challenge.content.cards.length / 2 && matchedPairs.length > 0) {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      setTimeout(() => {
        onComplete('completed', timeTaken);
      }, 500);
    }
  }, [matchedPairs, challenge, onComplete, startTime]);

  const handleCardClick = (index) => {
    if (isChecking || flippedIndices.length >= 2 || flippedIndices.includes(index) || cards[index].isMatched) {
      return;
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      setIsChecking(true);

      const [firstIndex, secondIndex] = newFlipped;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.emoji === secondCard.emoji) {
        // Match found!
        setMatchedPairs([...matchedPairs, firstCard.emoji]);
        setCards(cards.map((card, i) => 
          i === firstIndex || i === secondIndex 
            ? { ...card, isMatched: true }
            : card
        ));
        setFlippedIndices([]);
        setIsChecking(false);
      } else {
        // No match, flip back after delay
        setTimeout(() => {
          setFlippedIndices([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      1: 'text-green-400',
      2: 'text-blue-400',
      3: 'text-yellow-400',
      4: 'text-orange-400',
      5: 'text-red-400'
    };
    return colors[difficulty] || 'text-blue-400';
  };

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      1: 'Easy',
      2: 'Medium',
      3: 'Hard',
      4: 'Expert',
      5: 'Master'
    };
    return labels[difficulty] || 'Medium';
  };

  const totalPairs = challenge.content.cards.length / 2;
  const progress = (matchedPairs.length / totalPairs) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">Memory Game</h3>
            <p className={`text-sm font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
              {getDifficultyLabel(challenge.difficulty)} • +{challenge.xpReward} XP
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-mono">{timeElapsed}s</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-mono">{matchedPairs.length}/{totalPairs}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Find all matching pairs • Moves: {moves}
        </p>
      </div>

      {/* Card Grid */}
      <div 
        className="grid gap-3 mb-6"
        style={{
          gridTemplateColumns: `repeat(${challenge.content.cols}, minmax(0, 1fr))`
        }}
      >
        {cards.map((card, index) => {
          const isFlipped = flippedIndices.includes(index) || card.isMatched;
          
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              disabled={isChecking || isFlipped}
              className={`aspect-square rounded-xl transition-all duration-300 transform ${
                isFlipped
                  ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-500/50 scale-95'
                  : 'bg-gradient-to-br from-slate-800 to-slate-700 border-2 border-slate-600 hover:border-purple-500/50 hover:scale-105'
              } ${
                card.isMatched ? 'opacity-50' : ''
              } flex items-center justify-center text-4xl cursor-pointer disabled:cursor-not-allowed`}
            >
              {isFlipped ? (
                <span className="animate-bounce-once">{card.emoji}</span>
              ) : (
                <span className="text-slate-600 text-2xl">?</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-slate-300 font-semibold hover:bg-slate-700/50 transition-all"
      >
        Cancel Challenge
      </button>

      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-500">
          Click cards to flip them and find matching pairs
        </p>
      </div>

      {/* CSS for bounce animation */}
      <style>{`
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default MemoryChallenge;
