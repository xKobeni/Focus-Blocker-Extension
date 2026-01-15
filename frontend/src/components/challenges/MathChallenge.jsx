import { useState, useEffect } from 'react';
import { Calculator, Timer, Zap } from 'lucide-react';

function MathChallenge({ challenge, onComplete, onCancel }) {
  const [answer, setAnswer] = useState('');
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    onComplete(answer, timeTaken);
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

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
            <Calculator className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">Math Challenge</h3>
            <p className={`text-sm font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
              {getDifficultyLabel(challenge.difficulty)} • +{challenge.xpReward} XP
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Timer className="w-4 h-4" />
          <span className="text-sm font-mono">{timeElapsed}s</span>
        </div>
      </div>

      {/* Question */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-blue-500/30 rounded-2xl p-8 mb-6 text-center">
        <p className="text-sm text-slate-400 mb-3 font-semibold uppercase tracking-wider">Solve this problem:</p>
        <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 font-mono">
          {challenge.content.question}
        </div>
        <p className="text-2xl text-slate-300 font-bold">= ?</p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Your Answer:
          </label>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-slate-100 text-center text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter answer"
            autoFocus
            required
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-slate-300 font-semibold hover:bg-slate-700/50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!answer.trim()}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Zap className="w-4 h-4" />
            Submit
          </button>
        </div>
      </form>

      {/* Hint */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-500">
          Press Enter to submit • Esc to cancel
        </p>
      </div>
    </div>
  );
}

export default MathChallenge;
