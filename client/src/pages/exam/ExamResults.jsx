import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ExamResults = () => {
  const { examId } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const attemptId = location.state?.attemptId;

  const [result, setResult] = useState(null); // ExamResult (summary)
  const [review, setReview] = useState(null); // Detailed review with responses
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch overall result (ExamResult record)
      const resultRes = await fetch(`${API_URL}/v2/exams/${examId}/result`, { headers });
      const resultData = await resultRes.json();
      if (resultRes.ok && resultData.success && resultData.data) {
        setResult(resultData.data);
      }

      // If we have attemptId, fetch detailed review
      if (attemptId) {
        const reviewRes = await fetch(`${API_URL}/v2/exams/attempts/${attemptId}/review`, { headers });
        const reviewData = await reviewRes.json();
        if (reviewRes.ok && reviewData.success && reviewData.data) {
          setReview(reviewData.data);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard/my-exams')}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Back to My Exams
          </button>
        </div>
      </div>
    );
  }

  // Use review data if available, otherwise use result summary
  const attempt = review?.attempt;
  const exam = review?.exam;
  const responses = review?.responses || [];

  const marksObtained = attempt?.marks_obtained ?? result?.best_marks ?? 0;
  const totalMarks = exam?.total_marks ?? 100;
  const passingMarks = exam?.passing_marks ?? Math.round(totalMarks * 0.4);
  const percentage = attempt?.percentage ?? result?.best_percentage ?? 0;
  const isPassed = result?.is_passed ?? percentage >= (passingMarks / totalMarks) * 100;
  const correctAnswers = attempt?.correct_answers ?? 0;
  const wrongAnswers = attempt?.wrong_answers ?? 0;
  const skippedQuestions = attempt?.skipped_questions ?? 0;
  const timeTaken = attempt?.time_taken_seconds;
  const examTitle = exam?.title || 'Exam';

  const formatTime = (secs) => {
    if (!secs) return '--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  if (!result && !review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-600 text-3xl">?</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Results Found</h2>
          <p className="text-slate-600 mb-6">Results for this exam are not available yet. They may appear after grading is completed.</p>
          <button
            onClick={() => navigate('/dashboard/my-exams')}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Back to My Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Exam Results</h1>
          <h2 className="text-lg text-slate-500 mt-1">{examTitle}</h2>
        </div>

        {/* Score Card */}
        <div
          className={`rounded-2xl shadow-lg p-8 text-center ${
            isPassed
              ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-2 border-emerald-200'
              : 'bg-gradient-to-br from-red-50 to-orange-100 border-2 border-red-200'
          }`}
        >
          <div
            className={`text-6xl md:text-7xl font-bold mb-3 ${
              isPassed ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {Math.round(percentage)}%
          </div>
          <div className="text-xl text-slate-700 mb-4">
            Score: <span className="font-bold">{marksObtained}</span> / {totalMarks}
          </div>
          <div
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold text-white ${
              isPassed ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {isPassed ? 'Passed' : 'Not Passed'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-sm text-slate-500 mb-1">Correct</p>
            <p className="text-2xl font-bold text-emerald-600">{correctAnswers}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-sm text-slate-500 mb-1">Wrong</p>
            <p className="text-2xl font-bold text-red-600">{wrongAnswers}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-sm text-slate-500 mb-1">Skipped</p>
            <p className="text-2xl font-bold text-slate-500">{skippedQuestions}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-sm text-slate-500 mb-1">Time Taken</p>
            <p className="text-2xl font-bold text-indigo-600">{formatTime(timeTaken)}</p>
          </div>
        </div>

        {/* Question Review */}
        {responses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Question Review</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {responses.map((resp, index) => {
                const q = resp.question;
                if (!q) return null;

                const isCorrect = resp.is_correct === true;
                const isAttempted = resp.is_attempted;
                const qType = q.question_type;

                // Find selected option texts
                const selectedTexts = (resp.selected_option_ids || [])
                  .map((optId) => q.options?.find((o) => o.id === optId)?.option_text)
                  .filter(Boolean);

                // Find correct option texts
                const correctTexts = (q.options || [])
                  .filter((o) => o.is_correct)
                  .map((o) => o.option_text);

                return (
                  <div key={resp.id || index} className="p-4 md:p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${
                          !isAttempted
                            ? 'bg-slate-100 text-slate-500'
                            : isCorrect
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="font-medium text-slate-800 text-sm whitespace-pre-wrap">{q.question_text}</p>
                          <span
                            className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                              !isAttempted
                                ? 'bg-slate-100 text-slate-500'
                                : isCorrect
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {!isAttempted ? 'Skipped' : isCorrect ? 'Correct' : 'Wrong'}
                          </span>
                        </div>

                        {/* Answer details for MCQ */}
                        {(qType === 'single_choice' || qType === 'multiple_choice' || qType === 'true_false') && (
                          <div className="space-y-1 text-sm">
                            <div className="flex gap-2">
                              <span className="text-slate-500 shrink-0">Your answer:</span>
                              <span className={isCorrect ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                                {selectedTexts.length > 0 ? selectedTexts.join(', ') : 'Not answered'}
                              </span>
                            </div>
                            {!isCorrect && correctTexts.length > 0 && (
                              <div className="flex gap-2">
                                <span className="text-slate-500 shrink-0">Correct:</span>
                                <span className="text-emerald-600 font-medium">{correctTexts.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Numerical */}
                        {qType === 'numerical' && (
                          <div className="space-y-1 text-sm">
                            <div className="flex gap-2">
                              <span className="text-slate-500">Your answer:</span>
                              <span className={isCorrect ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                                {resp.numerical_answer !== null ? resp.numerical_answer : 'Not answered'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Subjective */}
                        {qType === 'subjective' && (
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-slate-500">Your answer:</span>
                              <p className="text-slate-700 mt-1 whitespace-pre-wrap">{resp.text_answer || 'Not answered'}</p>
                            </div>
                            {resp.grader_feedback && (
                              <div>
                                <span className="text-slate-500">Feedback:</span>
                                <p className="text-indigo-700 mt-1">{resp.grader_feedback}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Marks */}
                        {resp.marks_awarded !== null && (
                          <p className="text-xs text-slate-400 mt-1">
                            Marks: {resp.marks_awarded}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center pb-6">
          <button
            onClick={() => navigate('/dashboard/my-exams')}
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
          >
            Back to My Exams
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;
