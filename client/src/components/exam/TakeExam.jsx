import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ExamTimer from './ExamTimer';
import QuestionDisplay from './QuestionDisplay';
import ProgressIndicator from './ProgressIndicator';

const TakeExam = () => {
  const { examId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exams/${examId}/start`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load exam');
      }

      const examData = await response.json();
      setExam(examData);

      const initialAnswers = {};
      examData.questions.forEach(q => {
        initialAnswers[q.id] = [];
      });
      setAnswers(initialAnswers);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, selectedOptions) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOptions
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitExam = async () => {
    if (!confirm('Are you sure you want to submit the exam? You cannot change your answers after submission.')) {
      return;
    }

    setSubmitting(true);

    try {
      const answersArray = Object.entries(answers).map(([questionId, selected]) => ({
        questionId: parseInt(questionId),
        selected
      }));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: answersArray })
      });

      if (!response.ok) {
        throw new Error('Failed to submit exam');
      }

      const result = await response.json();
      navigate(`/exam-results/${examId}`, {
        state: { result, examTitle: exam.title }
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    setTimeUp(true);
    handleSubmitExam();
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(answer => answer.length > 0).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading exam...</p>
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
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/available-exams')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Exam Not Found</h2>
          <p className="text-gray-600 mb-6">The exam you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/available-exams')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Timer */}
        <div className="flex justify-center">
          <ExamTimer
            duration={exam.duration}
            onTimeUp={handleTimeUp}
            isActive={!timeUp}
          />
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{exam.title}</h1>
          <div className="flex flex-wrap gap-4 text-gray-600">
            <span className="flex items-center gap-1">
              <span>⏰</span> {exam.duration} minutes
            </span>
            <span className="flex items-center gap-1">
              <span>📝</span> {exam.questions.length} questions
            </span>
          </div>
        </div>

        {/* Progress */}
        <ProgressIndicator
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={exam.questions.length}
          answeredQuestions={getAnsweredCount()}
        />

        {/* Question */}
        <QuestionDisplay
          question={{
            ...currentQuestion,
            questionNumber: currentQuestionIndex + 1
          }}
          onAnswerSelect={handleAnswerSelect}
          selectedAnswers={answers[currentQuestion.id] || []}
        />

        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              ← Previous
            </button>

            <div className="flex flex-wrap justify-center gap-2 flex-1">
              {exam.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg font-medium text-sm transition-all duration-200 ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white shadow-md'
                      : answers[exam.questions[index].id]?.length > 0
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex === exam.questions.length - 1 ? (
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Time Up Overlay */}
      {timeUp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Time's Up!</h2>
            <p className="text-gray-600">Your exam time has expired. Submitting your answers...</p>
            <div className="mt-6">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeExam;
