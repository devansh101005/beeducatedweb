const ProgressIndicator = ({ currentQuestion, totalQuestions, answeredQuestions }) => {
  const progress = (currentQuestion / totalQuestions) * 100;
  const answeredProgress = (answeredQuestions / totalQuestions) * 100;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-700 font-medium">
          Question {currentQuestion} of {totalQuestions}
        </span>
        <span className="text-blue-600 font-bold text-lg">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="space-y-2">
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-300"
            style={{ width: `${answeredProgress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600">Answered:</span>
          <span className="font-semibold text-gray-800">{answeredQuestions}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <span className="text-sm text-gray-600">Remaining:</span>
          <span className="font-semibold text-gray-800">{totalQuestions - answeredQuestions}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;