import { useState } from 'react';
import './QuestionDisplay.css';

const QuestionDisplay = ({ 
  question, 
  onAnswerSelect, 
  selectedAnswers = [], 
  isReview = false,
  correctAnswers = null 
}) => {
  const [selected, setSelected] = useState(selectedAnswers);

  const handleOptionClick = (optionIndex) => {
    if (isReview) return; // Don't allow changes in review mode

    let newSelected;
    if (question.correct && question.correct.length > 1) {
      // Multiple choice question
      if (selected.includes(optionIndex)) {
        newSelected = selected.filter(index => index !== optionIndex);
      } else {
        newSelected = [...selected, optionIndex];
      }
    } else {
      // Single choice question
      newSelected = [optionIndex];
    }

    setSelected(newSelected);
    onAnswerSelect(question.id, newSelected);
  };

  const isOptionSelected = (optionIndex) => selected.includes(optionIndex);
  
  const isOptionCorrect = (optionIndex) => {
    if (!isReview || !correctAnswers) return false;
    return correctAnswers.includes(optionIndex);
  };

  const getOptionClass = (optionIndex) => {
    if (!isReview) {
      return isOptionSelected(optionIndex) ? 'selected' : '';
    }
    
    if (isOptionCorrect(optionIndex)) {
      return 'correct';
    } else if (isOptionSelected(optionIndex) && !isOptionCorrect(optionIndex)) {
      return 'incorrect';
    }
    return '';
  };

  return (
    <div className="question-display">
      <div className="question-header">
        <span className="question-number">Question {question.questionNumber}</span>
        <span className="question-marks">{question.marks} marks</span>
      </div>
      
      <div className="question-text">
        {question.questionText}
      </div>
      
      <div className="options-container">
        {question.options.map((option, index) => (
          <div
            key={index}
            className={`option ${getOptionClass(index)}`}
            onClick={() => handleOptionClick(index)}
          >
            <div className="option-radio">
              {question.correct && question.correct.length > 1 ? (
                <div className={`checkbox ${isOptionSelected(index) ? 'checked' : ''}`}>
                  {isOptionSelected(index) && '✓'}
                </div>
              ) : (
                <div className={`radio ${isOptionSelected(index) ? 'checked' : ''}`}>
                  {isOptionSelected(index) && '●'}
                </div>
              )}
            </div>
            <div className="option-text">{option}</div>
          </div>
        ))}
      </div>
      
      {isReview && question.explanation && (
        <div className="explanation">
          <strong>Explanation:</strong> {question.explanation}
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;

