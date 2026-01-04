import { useState } from 'react';

const QuestionDisplay = ({
  question,
  onAnswerSelect,
  selectedAnswers = [],
  isReview = false,
  correctAnswers = null
}) => {
  const [selected, setSelected] = useState(selectedAnswers);

  const handleOptionClick = (optionIndex) => {
    if (isReview) return;

    let newSelected;
    if (question.correct && question.correct.length > 1) {
      if (selected.includes(optionIndex)) {
        newSelected = selected.filter(index => index !== optionIndex);
      } else {
        newSelected = [...selected, optionIndex];
      }
    } else {
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

  const getOptionStyles = (optionIndex) => {
    const base = 'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200';

    if (!isReview) {
      if (isOptionSelected(optionIndex)) {
        return `${base} border-blue-500 bg-blue-50 shadow-md`;
      }
      return `${base} border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50`;
    }

    if (isOptionCorrect(optionIndex)) {
      return `${base} border-green-500 bg-green-50`;
    } else if (isOptionSelected(optionIndex) && !isOptionCorrect(optionIndex)) {
      return `${base} border-red-500 bg-red-50`;
    }
    return `${base} border-gray-200 bg-white`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-4 border-b border-gray-100">
        <span className="text-lg font-semibold text-gray-800">
          Question {question.questionNumber}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
          {question.marks} marks
        </span>
      </div>

      <div className="text-gray-700 text-lg leading-relaxed mb-6">
        {question.questionText}
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <div
            key={index}
            className={getOptionStyles(index)}
            onClick={() => handleOptionClick(index)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {question.correct && question.correct.length > 1 ? (
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                  isOptionSelected(index)
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 bg-white'
                }`}>
                  {isOptionSelected(index) && '✓'}
                </div>
              ) : (
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isOptionSelected(index)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 bg-white'
                }`}>
                  {isOptionSelected(index) && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              )}
            </div>
            <div className="text-gray-700">{option}</div>
          </div>
        ))}
      </div>

      {isReview && question.explanation && (
        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-amber-800">
            <span className="font-semibold">Explanation:</span> {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;

