import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ExamResults = () => {
  const { examId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [results, setResults] = useState(location.state?.result || null);
  const [examTitle, setExamTitle] = useState(location.state?.examTitle || '');
  const [loading, setLoading] = useState(!results);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!results) {
      fetchResults();
    }
  }, [examId]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exams/${examId}/result`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Results Found</h2>
          <p className="text-gray-600">We couldn't find results for this exam.</p>
        </div>
      </div>
    );
  }

  const percentage = Math.round((results.score / results.totalMarks) * 100);
  const isPassed = percentage >= 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Exam Results</h1>
          {examTitle && <h2 className="text-xl text-gray-600">{examTitle}</h2>}
        </div>

        {/* Score Card */}
        <div className={`rounded-2xl shadow-lg p-8 text-center ${
          isPassed
            ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200'
            : 'bg-gradient-to-br from-red-50 to-orange-100 border-2 border-red-200'
        }`}>
          <div className={`text-6xl md:text-7xl font-bold mb-4 ${
            isPassed ? 'text-green-600' : 'text-red-600'
          }`}>
            {percentage}%
          </div>
          <div className="text-xl text-gray-700 mb-4">
            Score: <span className="font-bold">{results.score}</span> / {results.totalMarks}
          </div>
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold ${
            isPassed
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {isPassed ? '✅ Passed' : '❌ Failed'}
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">Question Review</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {results.answers.map((answer, index) => {
              const isCorrect = answer.selected.join(', ') === answer.correct.join(', ');
              return (
                <div key={index} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        isCorrect
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-800">Question {index + 1}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      isCorrect
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {isCorrect ? '✅ Correct' : '❌ Incorrect'}
                    </span>
                  </div>
                  <div className="mt-3 ml-0 sm:ml-13 space-y-2 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-gray-500">Your Answer:</span>
                      <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {answer.selected.join(', ') || 'Not answered'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-gray-500">Correct Answer:</span>
                        <span className="font-medium text-green-600">{answer.correct.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/available-exams')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Back to Exams
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;
