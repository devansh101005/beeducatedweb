import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const TakeExam = () => {
  const { examId } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // answers: { [questionId]: { selectedOptionIds: string[], numericalAnswer: number|null, textAnswer: string|null } }
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [markedForReview, setMarkedForReview] = useState({});
  const saveTimeoutRef = useRef({});

  // Start or resume exam attempt
  useEffect(() => {
    const startExam = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/v2/exams/${examId}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to start exam');
        }

        const attemptData = data.data;
        setAttempt(attemptData);
        setQuestions(attemptData.questions || []);

        // Calculate time remaining
        if (attemptData.started_at) {
          // Get the exam duration from the attempt or fetch exam details
          const examRes = await fetch(`${API_URL}/v2/exams/${examId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const examData = await examRes.json();
          if (examData.success && examData.data) {
            const durationSecs = (examData.data.duration_minutes || 60) * 60;
            const startedAt = new Date(attemptData.started_at).getTime();
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const remaining = Math.max(0, durationSecs - elapsed);
            setTimeLeft(remaining);
          }
        }

        // Initialize answers from existing responses if resuming
        const initialAnswers = {};
        (attemptData.questions || []).forEach((q) => {
          initialAnswers[q.id] = { selectedOptionIds: [], numericalAnswer: null, textAnswer: null };
        });
        setAnswers(initialAnswers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    startExam();
  }, [examId, getToken]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || !attempt) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, timeLeft > 0]);

  // Auto-submit on time up
  useEffect(() => {
    if (timeUp && attempt && !submitting) {
      handleSubmit(true);
    }
  }, [timeUp]);

  // Save answer to server (debounced)
  const saveAnswer = useCallback(
    async (questionId, answerData) => {
      if (!attempt) return;

      // Clear existing timeout for this question
      if (saveTimeoutRef.current[questionId]) {
        clearTimeout(saveTimeoutRef.current[questionId]);
      }

      saveTimeoutRef.current[questionId] = setTimeout(async () => {
        try {
          const token = await getToken();
          await fetch(`${API_URL}/v2/exams/attempts/${attempt.id}/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              questionId,
              selectedOptionIds: answerData.selectedOptionIds || [],
              numericalAnswer: answerData.numericalAnswer,
              textAnswer: answerData.textAnswer,
              isMarkedForReview: markedForReview[questionId] || false,
            }),
          });
        } catch (err) {
          console.error('Failed to save answer:', err);
        }
      }, 500);
    },
    [attempt, getToken, markedForReview]
  );

  const handleOptionSelect = (questionId, optionId, questionType) => {
    setAnswers((prev) => {
      const current = prev[questionId] || { selectedOptionIds: [], numericalAnswer: null, textAnswer: null };
      let newSelectedIds;

      if (questionType === 'multiple_choice') {
        // Toggle option
        if (current.selectedOptionIds.includes(optionId)) {
          newSelectedIds = current.selectedOptionIds.filter((id) => id !== optionId);
        } else {
          newSelectedIds = [...current.selectedOptionIds, optionId];
        }
      } else {
        // Single select
        newSelectedIds = [optionId];
      }

      const newAnswer = { ...current, selectedOptionIds: newSelectedIds };
      saveAnswer(questionId, newAnswer);
      return { ...prev, [questionId]: newAnswer };
    });
  };

  const handleNumericalAnswer = (questionId, value) => {
    setAnswers((prev) => {
      const current = prev[questionId] || { selectedOptionIds: [], numericalAnswer: null, textAnswer: null };
      const newAnswer = { ...current, numericalAnswer: value === '' ? null : parseFloat(value) };
      saveAnswer(questionId, newAnswer);
      return { ...prev, [questionId]: newAnswer };
    });
  };

  const handleTextAnswer = (questionId, value) => {
    setAnswers((prev) => {
      const current = prev[questionId] || { selectedOptionIds: [], numericalAnswer: null, textAnswer: null };
      const newAnswer = { ...current, textAnswer: value || null };
      saveAnswer(questionId, newAnswer);
      return { ...prev, [questionId]: newAnswer };
    });
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      if (!confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/exams/attempts/${attempt.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        navigate(`/exam-results/${examId}`, {
          state: { attemptId: attempt.id },
        });
      } else {
        setError(data.message || 'Failed to submit');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(
      (a) => (a.selectedOptionIds?.length > 0) || a.numericalAnswer !== null || a.textAnswer
    ).length;
  };

  const isQuestionAnswered = (qId) => {
    const a = answers[qId];
    return a && ((a.selectedOptionIds?.length > 0) || a.numericalAnswer !== null || a.textAnswer);
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading exam...</p>
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
          <h2 className="text-xl font-bold text-slate-800 mb-2">Cannot Start Exam</h2>
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

  if (!attempt || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Questions Found</h2>
          <p className="text-slate-600 mb-6">This exam doesn't have any questions yet.</p>
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

  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ.id] || { selectedOptionIds: [], numericalAnswer: null, textAnswer: null };
  const isMultiple = currentQ.question_type === 'multiple_choice';
  const isNumerical = currentQ.question_type === 'numerical';
  const isSubjective = currentQ.question_type === 'subjective';
  const hasOptions = currentQ.options && currentQ.options.length > 0;

  const timerColor =
    timeLeft <= 300 ? 'bg-red-50 border-red-300 text-red-700' :
    timeLeft <= 600 ? 'bg-amber-50 border-amber-300 text-amber-700' :
    'bg-emerald-50 border-emerald-300 text-emerald-700';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 py-4 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-sm text-slate-500">
              Question {currentIndex + 1} of {questions.length} &middot; {getAnsweredCount()} answered
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-mono font-bold text-lg ${timerColor}`}>
            <span>&#9200;</span>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <span className="text-lg font-semibold text-slate-800">
              Question {currentIndex + 1}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
              {currentQ.question_type?.replace('_', ' ') || 'MCQ'}
            </span>
          </div>

          <div className="text-slate-700 text-lg leading-relaxed mb-6 whitespace-pre-wrap">
            {currentQ.question_text}
          </div>

          {/* Options */}
          {hasOptions && (
            <div className="space-y-3">
              {currentQ.options
                .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0))
                .map((opt) => {
                  const isSelected = currentAnswer.selectedOptionIds.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionSelect(currentQ.id, opt.id, currentQ.question_type)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isMultiple ? (
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold ${
                              isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && '✓'}
                          </div>
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        )}
                      </div>
                      <span className="text-slate-700">{opt.option_text}</span>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Numerical input */}
          {isNumerical && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">Your Answer</label>
              <input
                type="number"
                step="any"
                value={currentAnswer.numericalAnswer ?? ''}
                onChange={(e) => handleNumericalAnswer(currentQ.id, e.target.value)}
                className="w-full max-w-xs px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-lg"
                placeholder="Enter number..."
              />
            </div>
          )}

          {/* Subjective textarea */}
          {isSubjective && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">Your Answer</label>
              <textarea
                value={currentAnswer.textAnswer || ''}
                onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-y"
                placeholder="Write your answer..."
              />
            </div>
          )}
        </div>

        {/* Question Navigator */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                  idx === currentIndex
                    ? 'bg-indigo-600 text-white shadow-md'
                    : isQuestionAnswered(q.id)
                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                    : markedForReview[q.id]
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex-1" />

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Time Up Overlay */}
      {timeUp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">&#9200;</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Time's Up!</h2>
            <p className="text-slate-600">Your exam is being submitted automatically...</p>
            <div className="mt-6">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeExam;
