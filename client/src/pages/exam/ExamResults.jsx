import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ExamResults.css';

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
      <div className="exam-results">
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-results">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="exam-results">
        <div className="error">No results found</div>
      </div>
    );
  }

  const percentage = Math.round((results.score / results.totalMarks) * 100);
  const isPassed = percentage >= 60;

  return (
    <div className="exam-results">
      <div className="results-header">
        <h1>�� Exam Results</h1>
        <h2>{examTitle}</h2>
      </div>

      <div className="score-summary">
        <div className={`score-card ${isPassed ? 'passed' : 'failed'}`}>
          <div className="score-percentage">{percentage}%</div>
          <div className="score-details">
            <div>Score: {results.score}/{results.totalMarks}</div>
            <div className="status">{isPassed ? '✅ Passed' : '❌ Failed'}</div>
          </div>
        </div>
      </div>

      <div className="answers-review">
        <h3>Question Review</h3>
        {results.answers.map((answer, index) => (
          <div key={index} className="answer-item">
            <div className="question-number">Question {index + 1}</div>
            <div className="answer-details">
              <div className="selected-answer">
                <strong>Your Answer:</strong> {answer.selected.join(', ')}
              </div>
              <div className="correct-answer">
                <strong>Correct Answer:</strong> {answer.correct.join(', ')}
              </div>
              <div className={`answer-status ${answer.selected.join(', ') === answer.correct.join(', ') ? 'correct' : 'incorrect'}`}>
                {answer.selected.join(', ') === answer.correct.join(', ') ? '✅ Correct' : '❌ Incorrect'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="results-actions">
        <button onClick={() => navigate('/available-exams')} className="back-btn">
          Back to Exams
        </button>
      </div>
    </div>
  );
};

export default ExamResults;
