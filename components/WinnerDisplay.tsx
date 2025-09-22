import React, { useEffect } from 'react';

// Make sure confetti is available on the window object
declare const confetti: any;

interface WinnerDisplayProps {
  winner: string;
  onClose: () => void;
}

const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ winner, onClose }) => {
  useEffect(() => {
    if (winner) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      // FIX: The generic type <T> was causing an issue with arithmetic operations.
      // Since this function is only used with numbers, specify the type as number.
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [winner]);

  if (!winner) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-900 rounded-2xl p-8 sm:p-12 text-center shadow-2xl border-2 border-purple-500 transform scale-100 transition-transform duration-300 animate-jump-in">
        <p className="text-2xl text-yellow-300 font-semibold">Chúc mừng!</p>
        <h2 className="text-4xl sm:text-6xl font-black my-4 text-white break-words max-w-lg">
          {winner}
        </h2>
        <p className="text-xl text-indigo-300">Bạn là người may mắn hôm nay!</p>
        <button
          onClick={onClose}
          className="mt-8 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-full transition-colors text-lg"
        >
          Đóng
        </button>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
        @keyframes jump-in {
            0% { 
                transform: scale(0.8); 
                opacity: 0; 
            }
            100% { 
                transform: scale(1); 
                opacity: 1; 
            }
        }
        .animate-jump-in {
            animation: jump-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
};

export default WinnerDisplay;