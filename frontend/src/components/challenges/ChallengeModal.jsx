import { useState } from 'react';
import { X, Loader2, Trophy, Zap, AlertCircle } from 'lucide-react';
import MathChallenge from './MathChallenge';
import MemoryChallenge from './MemoryChallenge';
import TypingChallenge from './TypingChallenge';
import { verifyChallenge } from '../../services/challengeService';

function ChallengeModal({ challenge, domain, onSuccess, onCancel, onFailure }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChallengeComplete = async (userAnswer, timeTaken) => {
    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyChallenge(challenge.id, userAnswer, timeTaken);
      
      setResult(result);

      if (result.success) {
        // Show success message briefly, then call onSuccess
        setTimeout(() => {
          onSuccess(result);
        }, 2000);
      } else {
        // Show failure message briefly, then call onFailure
        setTimeout(() => {
          onFailure(result);
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
      setIsVerifying(false);
    }
  };

  // Render appropriate challenge component
  const renderChallenge = () => {
    if (result) {
      return (
        <div className="text-center py-12">
          {result.success ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-green-400 mb-2">Challenge Completed!</h3>
              <p className="text-slate-300 mb-4">{result.message}</p>
              <div className="flex items-center justify-center gap-6 mb-4">
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-3xl font-bold text-yellow-400">+{result.xpAwarded}</span>
                  </div>
                  <p className="text-xs text-slate-500">XP Earned</p>
                </div>
                <div className="h-12 w-px bg-slate-600" />
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <span className="text-3xl font-bold text-blue-400">{result.unlockDuration}</span>
                    <span className="text-xl text-slate-400">min</span>
                  </div>
                  <p className="text-xs text-slate-500">Unlocked</p>
                </div>
              </div>
              <div className="inline-block px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-sm text-green-400 font-semibold">
                  {domain} unlocked until {new Date(result.expiresAt).toLocaleTimeString()}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-red-400 mb-2">Challenge Failed</h3>
              <p className="text-slate-300 mb-4">{result.message}</p>
              <p className="text-sm text-slate-500">Try again to unlock this site!</p>
            </>
          )}
        </div>
      );
    }

    if (isVerifying) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
          <p className="text-slate-300 font-semibold">Verifying your answer...</p>
        </div>
      );
    }

    switch (challenge.type) {
      case 'math':
        return (
          <MathChallenge
            challenge={challenge}
            onComplete={handleChallengeComplete}
            onCancel={onCancel}
          />
        );
      case 'memory':
        return (
          <MemoryChallenge
            challenge={challenge}
            onComplete={handleChallengeComplete}
            onCancel={onCancel}
          />
        );
      case 'typing':
        return (
          <TypingChallenge
            challenge={challenge}
            onComplete={handleChallengeComplete}
            onCancel={onCancel}
          />
        );
      default:
        return (
          <div className="text-center py-8">
            <p className="text-slate-400">Challenge type not supported yet</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-800/95 border-b border-slate-700 px-6 py-4 rounded-t-3xl flex items-center justify-between backdrop-blur-sm z-10">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Unlock Challenge
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Complete this challenge to unlock <span className="text-blue-400 font-semibold">{domain}</span> for {challenge.unlockDuration} minutes
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isVerifying || result}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center">
              <AlertCircle className="w-5 h-5 inline-block mr-2" />
              {error}
            </div>
          )}

          {renderChallenge()}
        </div>

        {/* Footer Info */}
        {!result && !isVerifying && challenge.remainingUnlocks !== undefined && (
          <div className="px-6 pb-6">
            <div className="text-center text-xs text-slate-500">
              Remaining unlocks this session: <span className="text-blue-400 font-semibold">{challenge.remainingUnlocks}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChallengeModal;
