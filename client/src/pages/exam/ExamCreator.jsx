import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

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
      setMessage('Question text is required');
      return;
    }

    if (currentQuestion.options.some(option => !option.trim())) {
      setMessage('All options are required');
      return;
    }

    if (currentQuestion.correct.length === 0) {
      setMessage('Please select at least one correct answer');
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
    setMessage('Question added successfully');
    setTimeout(() => setMessage(''), 3000);
  };

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const createExam = async () => {
    if (!examData.title.trim()) {
      setMessage('Exam title is required');
      return;
    }

    if (questions.length === 0) {
      setMessage('At least one question is required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
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

      setMessage('Exam created successfully!');
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
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = message.includes('successfully');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Create New Exam</h1>
          <p className="text-gray-600">Design and configure your exam with questions</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-center font-medium ${
            isSuccess
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {isSuccess ? '✅' : '❌'} {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Exam Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
              Exam Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
                <input
                  type="text"
                  name="title"
                  value={examData.title}
                  onChange={handleExamDataChange}
                  placeholder="Enter exam title"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={examData.subject}
                  onChange={handleExamDataChange}
                  placeholder="e.g., Mathematics"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Level</label>
                <input
                  type="text"
                  name="classLevel"
                  value={examData.classLevel}
                  onChange={handleExamDataChange}
                  placeholder="e.g., Class 10"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                <input
                  type="number"
                  name="duration"
                  value={examData.duration}
                  onChange={handleExamDataChange}
                  min="1"
                  max="480"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={examData.startTime}
                  onChange={handleExamDataChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={examData.endTime}
                  onChange={handleExamDataChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                <input
                  type="number"
                  name="totalMarks"
                  value={examData.totalMarks}
                  onChange={handleExamDataChange}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marking</label>
                <input
                  type="number"
                  name="negativeMarking"
                  value={examData.negativeMarking}
                  onChange={handleExamDataChange}
                  min="0"
                  step="0.25"
                  placeholder="0.25"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={examData.description}
                onChange={handleExamDataChange}
                placeholder="Enter exam description"
                rows="3"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="randomizeQuestions"
                  checked={examData.randomizeQuestions}
                  onChange={handleExamDataChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Randomize question order</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="randomizeOptions"
                  checked={examData.randomizeOptions}
                  onChange={handleExamDataChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Randomize option order</span>
              </label>
            </div>
          </div>

          {/* Questions Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
              Questions ({questions.length})
            </h2>

            {/* Add Question Form */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Question</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                  <textarea
                    name="questionText"
                    value={currentQuestion.questionText}
                    onChange={handleQuestionChange}
                    placeholder="Enter your question"
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <label className="flex items-center gap-2 cursor-pointer min-w-fit">
                          <input
                            type="checkbox"
                            checked={currentQuestion.correct.includes(index)}
                            onChange={() => handleCorrectAnswerChange(index)}
                            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-600">Correct</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                    <input
                      type="number"
                      name="marks"
                      value={currentQuestion.marks}
                      onChange={handleQuestionChange}
                      min="1"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      name="difficulty"
                      value={currentQuestion.difficulty}
                      onChange={handleQuestionChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (optional)</label>
                  <textarea
                    name="explanation"
                    value={currentQuestion.explanation}
                    onChange={handleQuestionChange}
                    placeholder="Explanation for the correct answer"
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <button
                  onClick={addQuestion}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  + Add Question
                </button>
              </div>
            </div>

            {/* Questions List */}
            {questions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Added Questions</h3>
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 line-clamp-1">
                          {question.questionText.substring(0, 50)}...
                        </span>
                      </div>
                      <button
                        onClick={() => removeQuestion(index)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Create Button */}
          <div className="flex justify-center">
            <button
              onClick={createExam}
              disabled={loading}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Creating Exam...' : 'Create Exam'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamCreator;
