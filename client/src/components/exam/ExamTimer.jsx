import { useState, useEffect } from 'react';

const ExamTimer = ({ duration, onTimeUp, isActive = true }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onTimeUp]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerStyles = () => {
    if (timeLeft <= 300) {
      return {
        container: 'bg-red-50 border-red-200 text-red-700',
        icon: 'text-red-500',
        value: 'text-red-600'
      };
    }
    if (timeLeft <= 600) {
      return {
        container: 'bg-orange-50 border-orange-200 text-orange-700',
        icon: 'text-orange-500',
        value: 'text-orange-600'
      };
    }
    return {
      container: 'bg-green-50 border-green-200 text-green-700',
      icon: 'text-green-500',
      value: 'text-green-600'
    };
  };

  const styles = getTimerStyles();

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-sm transition-all duration-300 ${styles.container}`}>
      <div className={`text-2xl ${styles.icon}`}>⏰</div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
        <span className="text-sm font-medium opacity-80">Time Remaining:</span>
        <span className={`text-lg sm:text-xl font-bold font-mono ${styles.value}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
};

export default ExamTimer;
