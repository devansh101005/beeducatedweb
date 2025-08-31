import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ExamCreator.css';

const ExamCreator = () => {
  const { token } = useAuth();
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    subject: '',
    classLevel: '',
    duration: 60,
    startTime: '',
    endTime: '',
    totalMarks: 100,
    negativeMarking: 0,
    randomizeQuestions: false,
    randomizeOptions: false
  });

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correct: [],
    marks: 1,
    difficulty: 'Easy',
    explanation: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleExamDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExamData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const handleCorrectAnswerChange = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      correct: prev.correct.includes(index)
        ? prev.correct.filter(i => i !== index)
        : [...prev.correct, index]
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.questionText.trim()) {
      setMessage('❌ Question text is required');
      return;
    }

    if (currentQuestion.options.some(option => !option.trim())) {
      setMessage('❌ All options are required');
      return;
    }

    if (currentQuestion.correct.length === 0) {
      setMessage('❌ Please select at least one correct answer');
      return;
    }

    setQuestions(prev => [...prev, { ...currentQuestion, id: Date.now() }]);
    setCurrentQuestion({
      questionText: '',
      options: ['', '', '', ''],
      correct: [],
      marks: 1,
      difficulty: 'Easy',
      explanation: ''
    });
    setMessage('✅ Question added successfully');
  };

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const createExam = async () => {
    if (!examData.title.trim()) {
      setMessage('❌ Exam title is required');
      return;
    }

    if (questions.length === 0) {
      setMessage('❌ At least one question is required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Create exam
      const examResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...examData,
          startTime: new Date(examData.startTime).toISOString(),
          endTime: new Date(examData.endTime).toISOString()
        })
      });

      const examResult = await examResponse.json();

      if (!examResponse.ok) {
        throw new Error(examResult.error || 'Failed to create exam');
      }

      // Add questions
      for (const question of questions) {
        const questionResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exams/${examResult.id}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(question)
        });

        if (!questionResponse.ok) {
          throw new Error('Failed to add questions');
        }
      }

      setMessage('✅ Exam created successfully!');
      setExamData({
        title: '',
        description: '',
        subject: '',
        classLevel: '',
        duration: 60,
        startTime: '',
        endTime: '',
        totalMarks: 100,
        negativeMarking: 0,
        randomizeQuestions: false,
        randomizeOptions: false
      });
      setQuestions([]);

    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exam-creator">
      <div className="creator-header">
        <h1>�� Create New Exam</h1>
        <p>Design and configure your exam with questions</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="creator-content">
        <div className="exam-details">
          <h2>Exam Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Exam Title *</label>
              <input
                type="text"
                name="title"
                value={examData.title}
                onChange={handleExamDataChange}
                placeholder="Enter exam title"
                required
              />
            </div>

            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                name="subject"
                value={examData.subject}
                onChange={handleExamDataChange}
                placeholder="e.g., Mathematics"
              />
            </div>

            <div className="form-group">
              <label>Class Level</label>
              <input
                type="text"
                name="classLevel"
                value={examData.classLevel}
                onChange={handleExamDataChange}
                placeholder="e.g., Class 10"
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={examData.duration}
                onChange={handleExamDataChange}
                min="1"
                max="480"
              />
            </div>

            <div className="form-group">
              <label>Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                value={examData.startTime}
                onChange={handleExamDataChange}
              />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <input
                type="datetime-local"
                name="endTime"
                value={examData.endTime}
                onChange={handleExamDataChange}
              />
            </div>

            <div className="form-group">
              <label>Total Marks</label>
              <input
                type="number"
                name="totalMarks"
                value={examData.totalMarks}
                onChange={handleExamDataChange}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Negative Marking</label>
              <input
                type="number"
                name="negativeMarking"
                value={examData.negativeMarking}
                onChange={handleExamDataChange}
                min="0"
                step="0.25"
                placeholder="0.25"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              name="description"
              value={examData.description}
              onChange={handleExamDataChange}
              placeholder="Enter exam description"
              rows="3"
            />
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="randomizeQuestions"
                checked={examData.randomizeQuestions}
                onChange={handleExamDataChange}
              />
              Randomize question order
            </label>
            <label>
              <input
                type="checkbox"
                name="randomizeOptions"
                checked={examData.randomizeOptions}
                onChange={handleExamDataChange}
              />
              Randomize option order
            </label>
          </div>
        </div>

        <div className="questions-section">
          <h2>Questions ({questions.length})</h2>
          
          <div className="add-question">
            <h3>Add New Question</h3>
            <div className="form-group">
              <label>Question Text *</label>
              <textarea
                name="questionText"
                value={currentQuestion.questionText}
                onChange={handleQuestionChange}
                placeholder="Enter your question"
                rows="3"
              />
            </div>

            <div className="options-section">
              <label>Options *</label>
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="option-input">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={currentQuestion.correct.includes(index)}
                      onChange={() => handleCorrectAnswerChange(index)}
                    />
                    Correct
                  </label>
                </div>
              ))}
            </div>

            <div className="question-meta">
              <div className="form-group">
                <label>Marks</label>
                <input
                  type="number"
                  name="marks"
                  value={currentQuestion.marks}
                  onChange={handleQuestionChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Difficulty</label>
                <select
                  name="difficulty"
                  value={currentQuestion.difficulty}
                  onChange={handleQuestionChange}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Explanation (optional)</label>
              <textarea
                name="explanation"
                value={currentQuestion.explanation}
                onChange={handleQuestionChange}
                placeholder="Explanation for the correct answer"
                rows="2"
              />
            </div>

            <button onClick={addQuestion} className="add-question-btn">
              ➕ Add Question
            </button>
          </div>

          {questions.length > 0 && (
            <div className="questions-list">
              <h3>Added Questions</h3>
              {questions.map((question, index) => (
                <div key={question.id} className="question-item">
                  <div className="question-preview">
                    <strong>Q{index + 1}:</strong> {question.questionText.substring(0, 50)}...
                  </div>
                  <button 
                    onClick={() => removeQuestion(index)}
                    className="remove-btn"
                  >
                    🗑️ Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="creator-actions">
        <button 
          onClick={createExam} 
          disabled={loading}
          className="create-exam-btn"
        >
          {loading ? 'Creating...' : '🚀 Create Exam'}
        </button>
      </div>
    </div>
  );
};

export default ExamCreator;
