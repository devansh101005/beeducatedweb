import './ProgressIndicator.css';

const ProgressIndicator = ({ currentQuestion, totalQuestions, answeredQuestions }) => {
  const progress = (currentQuestion / totalQuestions) * 100;
  const answeredProgress = (answeredQuestions / totalQuestions) * 100;

  return (
    <div className="progress-indicator">
      <div className="progress-header">
        <span className="progress-text">
          Question {currentQuestion} of {totalQuestions}
        </span>
        <span className="progress-percentage">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="progress-bars">
        <div className="progress-bar">
          <div 
            className="progress-fill current" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="progress-bar answered">
          <div 
            className="progress-fill answered" 
            style={{ width: `${answeredProgress}%` }}
          ></div>
        </div>
      </div>

      <div className="progress-stats">
        <div className="stat">
          <span className="stat-label">Answered:</span>
          <span className="stat-value">{answeredQuestions}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Remaining:</span>
          <span className="stat-value">{totalQuestions - answeredQuestions}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;