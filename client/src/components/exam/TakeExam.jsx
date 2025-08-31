import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ExamTimer from '../../components/exam/ExamTimer';
import QuestionDisplay from '../../components/exam/QuestionDisplay';
import ProgressIndicator from '../../components/exam/ProgressIndicator';
import './TakeExam.css';

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
      
      // Initialize answers object
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
      <div className="exam-loading">
        <div className="loading-spinner"></div>
        <p>Loading exam...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-error">
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/available-exams')}>
          Back to Exams
        </button>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="exam-error">
        <h2>❌ Exam Not Found</h2>
        <p>The exam you're looking for doesn't exist or you don't have access to it.</p>
        <button onClick={() => navigate('/available-exams')}>
          Back to Exams
        </button>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="take-exam">
      <ExamTimer 
        duration={exam.duration} 
        onTimeUp={handleTimeUp}
        isActive={!timeUp}
      />

      <div className="exam-header">
        <h1>{exam.title}</h1>
        <div className="exam-info">
          <span>Duration: {exam.duration} minutes</span>
          <span>Questions: {exam.questions.length}</span>
        </div>
      </div>

      <ProgressIndicator
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={exam.questions.length}
        answeredQuestions={getAnsweredCount()}
      />

      <div className="exam-content">
        <QuestionDisplay
          question={{
            ...currentQuestion,
            questionNumber: currentQuestionIndex + 1
          }}
          onAnswerSelect={handleAnswerSelect}
          selectedAnswers={answers[currentQuestion.id] || []}
        />

        <div className="exam-navigation">
          <button 
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="nav-btn prev"
          >
            ← Previous
          </button>

          <div className="question-indicators">
            {exam.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`indicator ${index === currentQuestionIndex ? 'current' : ''} ${
                  answers[exam.questions[index].id]?.length > 0 ? 'answered' : ''
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
              className="nav-btn submit"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          ) : (
            <button 
              onClick={handleNextQuestion}
              className="nav-btn next"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {timeUp && (
        <div className="time-up-overlay">
          <div className="time-up-modal">
            <h2>⏰ Time's Up!</h2>
            <p>Your exam time has expired. Submitting your answers...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeExam;