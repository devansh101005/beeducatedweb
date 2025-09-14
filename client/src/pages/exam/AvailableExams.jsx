import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AvailableExams.css';

const AvailableExams = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableExams();
  }, []);

  const fetchAvailableExams = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exams/available`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }

      const data = await response.json();
      setExams(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const startExam = (examId) => {
    navigate(`/take-exam/${examId}`);
  };

  if (loading) {
    return (
      <div className="available-exams">
        <div className="loading">Loading available exams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="available-exams">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="available-exams">
      <h1>�� Available Exams</h1>
      
      {exams.length === 0 ? (
        <div className="no-exams">
          <p>No exams are currently available.</p>
        </div>
      ) : (
        <div className="exams-grid">
          {exams.map((exam) => (
            <div key={exam.id} className="exam-card">
              <h3>{exam.title}</h3>
              <p className="description">{exam.description}</p>
              <div className="exam-details">
                <span>📖 {exam.subject}</span>
                <span>🎓 {exam.classLevel}</span>
                <span>⏰ {exam.duration} minutes</span>
                <span>📝 {exam.totalMarks} marks</span>
              </div>
              <button 
                onClick={() => startExam(exam.id)}
                className="start-exam-btn"
              >
                Start Exam
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableExams;
