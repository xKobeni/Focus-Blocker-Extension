import { useState, useEffect } from 'react';
import { Keyboard, Timer, Zap, Gauge } from 'lucide-react';

function TypingChallenge({ challenge, onComplete, onCancel }) {
  const [userText, setUserText] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const targetText = challenge.content.text;
  const requirements = challenge.content.requirements;

  // Timer
  useEffect(() => {
    if (!startTime) return;

    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(timer);
  }, [startTime]);

  // Start timer on first keystroke
  const handleTextChange = (e) => {
    const newText = e.target.value;
    
    if (!startTime && newText.length > 0) {
      setStartTime(Date.now());
    }

    setUserText(newText);

    // Check if completed
    if (newText === targetText && !isFinished) {
      setIsFinished(true);
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      
      // Calculate WPM and accuracy
      const words = targetText.split(' ').length;
      const minutes = timeTaken / 60;
      const wpm = Math.round(words / minutes);
      
      // Calculate accuracy
      const accuracy = 100; // 100% since text must match exactly
      
      // Check if requirements met
      setTimeout(() => {
        onComplete({ wpm, accuracy, text: newText }, timeTaken);
      }, 500);
    }
  };

  // Calculate current WPM
  const calculateCurrentWPM = () => {
    if (!startTime || timeElapsed === 0) return 0;
    const words = userText.split(' ').filter(w => w.length > 0).length;
    const minutes = timeElapsed / 60;
    return Math.round(words / minutes) || 0;
  };

  // Calculate accuracy
  const calculateAccuracy = () => {
    if (userText.length === 0) return 100;
    let correct = 0;
    for (let i = 0; i < userText.length; i++) {
      if (userText[i] === targetText[i]) {
        correct++;
      }
    }
    return Math.round((correct / userText.length) * 100);
  };

  const currentWPM = calculateCurrentWPM();
  const currentAccuracy = calculateAccuracy();

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
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <Keyboard className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">Typing Challenge</h3>
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

      {/* Requirements */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className={`bg-gradient-to-br from-slate-800/90 to-slate-800/70 border ${
          currentWPM >= requirements.minWPM ? 'border-green-500/50' : 'border-slate-600'
        } rounded-xl p-4 text-center`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-green-400" />
            <p className="text-xs text-slate-400 font-semibold uppercase">Speed</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">{currentWPM} WPM</p>
          <p className="text-xs text-slate-500 mt-1">Req: {requirements.minWPM}+ WPM</p>
        </div>
        <div className={`bg-gradient-to-br from-slate-800/90 to-slate-800/70 border ${
          currentAccuracy >= requirements.minAccuracy ? 'border-green-500/50' : 'border-slate-600'
        } rounded-xl p-4 text-center`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-slate-400 font-semibold uppercase">Accuracy</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">{currentAccuracy}%</p>
          <p className="text-xs text-slate-500 mt-1">Req: {requirements.minAccuracy}%+</p>
        </div>
      </div>

      {/* Target Text Display */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-green-500/30 rounded-2xl p-6 mb-4">
        <p className="text-sm text-slate-400 mb-3 font-semibold uppercase tracking-wider text-center">
          Type this text:
        </p>
        <div className="text-lg text-slate-300 leading-relaxed font-mono text-center">
          {targetText.split('').map((char, i) => {
            let color = 'text-slate-500';
            if (i < userText.length) {
              color = userText[i] === char ? 'text-green-400' : 'text-red-400';
            }
            return (
              <span key={i} className={color}>
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Input Area */}
      <div className="mb-4">
        <textarea
          value={userText}
          onChange={handleTextChange}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-slate-100 text-lg font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          placeholder="Start typing here..."
          rows={4}
          autoFocus
          disabled={isFinished}
        />
        <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
          <span>{userText.length} / {targetText.length} characters</span>
          <span>{Math.round((userText.length / targetText.length) * 100)}% complete</span>
        </div>
      </div>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        disabled={isFinished}
        className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-slate-300 font-semibold hover:bg-slate-700/50 transition-all disabled:opacity-50"
      >
        Cancel Challenge
      </button>

      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-500">
          Type the text exactly as shown • Maintain speed and accuracy
        </p>
      </div>
    </div>
  );
}

export default TypingChallenge;
