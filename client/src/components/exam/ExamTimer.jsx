import { useState, useEffect } from 'react';
import './ExamTimer.css';

const ExamTimer = ({ duration, onTimeUp, isActive = true }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds

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

  const getTimeColor = () => {
    if (timeLeft <= 300) return 'red'; // Last 5 minutes
    if (timeLeft <= 600) return 'orange'; // Last 10 minutes
    return 'green';
  };

  return (
    <div className={`exam-timer ${getTimeColor()}`}>
      <div className="timer-icon">⏰</div>
      <div className="timer-text">
        <span className="time-label">Time Remaining:</span>
        <span className="time-value">{formatTime(timeLeft)}</span>
      </div>
    </div>
  );
};

export default ExamTimer;
