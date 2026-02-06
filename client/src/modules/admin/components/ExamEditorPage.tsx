// Exam Editor Page
// Add questions, manage sections, and publish exams

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileQuestion,
  Send,
  CheckCircle,
  GripVertical,
  Clock,
  Target,
  Hash,
  Type,
  ToggleLeft,
  Calculator,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Save,
} from 'lucide-react';
import {
  Card,
  Button,
  IconButton,
  Badge,
  Input,
  Textarea,
  Select,
  Spinner,
  EmptyState,
} from '@shared/components/ui';
import { fadeInUp } from '@shared/components/ui/motion';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// TYPES
// ============================================

type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'numerical' | 'subjective';

interface QuestionOption {
  id?: string;
  option_text: string;
  is_correct: boolean;
  sequence_order: number;
}

interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  difficulty: string;
  positive_marks: number;
  negative_marks: number;
  numerical_answer?: number;
  numerical_tolerance?: number;
  model_answer?: string;
  explanation?: string;
  options?: QuestionOption[];
}

interface ExamQuestion {
  id: string;
  exam_id: string;
  question_id: string;
  positive_marks: number | null;
  negative_marks: number | null;
  sequence_order: number;
  question: Question;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  exam_type: string | null;
  duration_minutes: number;
  total_marks: number | null;
  passing_marks: number | null;
  status: string;
  question_count: number;
}

const questionTypeLabels: Record<QuestionType, string> = {
  single_choice: 'Single Choice',
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  numerical: 'Numerical',
  subjective: 'Subjective',
};

const questionTypeIcons: Record<QuestionType, typeof Type> = {
  single_choice: CheckCircle,
  multiple_choice: Hash,
  true_false: ToggleLeft,
  numerical: Calculator,
  subjective: AlignLeft,
};

const difficultyColors: Record<string, string> = {
  easy: 'text-emerald-600 bg-emerald-50',
  medium: 'text-amber-600 bg-amber-50',
  hard: 'text-rose-600 bg-rose-50',
};

// ============================================
// MAIN COMPONENT
// ============================================

export function ExamEditorPage() {
  const { examId } = useParams<{ examId: string }>();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const authHeaders = async (json = false) => {
    const token = await getToken();
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
  };

  // Fetch exam details and questions
  useEffect(() => {
    if (examId) {
      fetchExam();
      fetchQuestions();
    }
  }, [examId]);

  const fetchExam = async () => {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_URL}/v2/exams/${examId}`, { headers });
      const data = await res.json();
      if (data.success) setExam(data.data);
    } catch (err) {
      console.error('Failed to fetch exam:', err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_URL}/v2/exams/${examId}/questions`, { headers });
      const data = await res.json();
      if (data.success) setQuestions(data.data || []);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeQuestion = async (questionId: string) => {
    try {
      const headers = await authHeaders();
      await fetch(`${API_URL}/v2/exams/${examId}/questions/${questionId}`, {
        method: 'DELETE',
        headers,
      });
      fetchQuestions();
      fetchExam();
    } catch (err) {
      console.error('Failed to remove question:', err);
    }
  };

  const publishExam = async () => {
    setPublishing(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_URL}/v2/exams/${examId}/publish`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        fetchExam();
      }
    } catch (err) {
      console.error('Failed to publish:', err);
    } finally {
      setPublishing(false);
    }
  };

  const handleQuestionAdded = () => {
    setShowAddForm(false);
    fetchQuestions();
    fetchExam();
  };

  if (!exam && loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeInUp}>
        <div className="flex items-center gap-3 mb-4">
          <IconButton
            variant="ghost"
            onClick={() => navigate('/dashboard/exams')}
            icon={<ArrowLeft className="w-5 h-5" />}
            aria-label="Back to exams"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold text-slate-900">{exam?.title || 'Exam Editor'}</h1>
            {exam?.description && <p className="text-slate-500 text-sm mt-0.5">{exam.description}</p>}
          </div>

          {/* Status & Publish */}
          <Badge
            variant={
              exam?.status === 'draft' ? 'default' :
              exam?.status === 'scheduled' ? 'warning' :
              exam?.status === 'live' ? 'success' :
              exam?.status === 'completed' ? 'primary' : 'danger'
            }
            size="sm"
          >
            {exam?.status}
          </Badge>

          {exam?.status === 'draft' && (
            <Button
              leftIcon={<Send className="w-4 h-4" />}
              onClick={publishExam}
              loading={publishing}
              disabled={questions.length === 0}
            >
              Publish Exam
            </Button>
          )}
        </div>

        {/* Exam Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-lg font-bold text-slate-900">{exam?.duration_minutes || 0} min</p>
                <p className="text-xs text-slate-500">Duration</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-lg font-bold text-slate-900">{exam?.total_marks || 0}</p>
                <p className="text-xs text-slate-500">Total Marks</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-lg font-bold text-slate-900">{exam?.passing_marks || 0}</p>
                <p className="text-xs text-slate-500">Passing Marks</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-lg font-bold text-slate-900">{questions.length}</p>
                <p className="text-xs text-slate-500">Questions</p>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold text-slate-900">Questions</h2>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            Add Question
          </Button>
        </div>

        {loading ? (
          <Card className="p-8 flex justify-center">
            <Spinner />
          </Card>
        ) : questions.length === 0 ? (
          <Card>
            <EmptyState
              title="No questions yet"
              description="Add questions to this exam to get started"
              icon={<FileQuestion className="w-12 h-12" />}
              action={
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddForm(true)}>
                  Add Question
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((eq, idx) => {
              const q = eq.question;
              const QIcon = questionTypeIcons[q.question_type] || FileQuestion;
              return (
                <motion.div key={eq.id} {...fadeInUp}>
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Number */}
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-sm font-bold text-indigo-600">
                        {idx + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{q.question_text}</p>

                        {/* Options for MCQ */}
                        {q.options && q.options.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {q.options
                              .sort((a, b) => a.sequence_order - b.sequence_order)
                              .map((opt, optIdx) => (
                                <div
                                  key={opt.id || optIdx}
                                  className={clsx(
                                    'flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg',
                                    opt.is_correct ? 'bg-emerald-50 text-emerald-700 font-medium' : 'bg-slate-50 text-slate-600'
                                  )}
                                >
                                  <span className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[10px]"
                                    style={{
                                      borderColor: opt.is_correct ? '#059669' : '#cbd5e1',
                                      backgroundColor: opt.is_correct ? '#059669' : 'transparent',
                                      color: opt.is_correct ? '#fff' : '#64748b',
                                    }}
                                  >
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  {opt.option_text}
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Numerical answer */}
                        {q.question_type === 'numerical' && q.numerical_answer !== undefined && (
                          <p className="mt-2 text-xs text-emerald-600">
                            Answer: {q.numerical_answer} {q.numerical_tolerance ? `(±${q.numerical_tolerance})` : ''}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <QIcon className="w-3.5 h-3.5" />
                            {questionTypeLabels[q.question_type]}
                          </span>
                          <span className={clsx('text-xs px-2 py-0.5 rounded-full', difficultyColors[q.difficulty] || 'text-slate-500 bg-slate-100')}>
                            {q.difficulty}
                          </span>
                          <span className="text-xs text-slate-500">
                            +{q.positive_marks} / -{q.negative_marks} marks
                          </span>
                        </div>
                      </div>

                      {/* Remove */}
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(eq.question_id)}
                        icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                        aria-label="Remove question"
                      />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Question Form (Slide-down) */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AddQuestionForm
              examId={examId!}
              getToken={getToken}
              onAdded={handleQuestionAdded}
              onCancel={() => setShowAddForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// ADD QUESTION FORM
// ============================================

function AddQuestionForm({
  examId,
  getToken,
  onAdded,
  onCancel,
}: {
  examId: string;
  getToken: () => Promise<string | null>;
  onAdded: () => void;
  onCancel: () => void;
}) {
  const [questionType, setQuestionType] = useState<QuestionType>('single_choice');
  const [questionText, setQuestionText] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [positiveMarks, setPositiveMarks] = useState(4);
  const [negativeMarks, setNegativeMarks] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [numericalAnswer, setNumericalAnswer] = useState<number>(0);
  const [numericalTolerance, setNumericalTolerance] = useState<number>(0);
  const [modelAnswer, setModelAnswer] = useState('');
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset options when type changes
  useEffect(() => {
    if (questionType === 'true_false') {
      setOptions([
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false },
      ]);
    } else if (questionType === 'single_choice' || questionType === 'multiple_choice') {
      setOptions([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
    }
  }, [questionType]);

  const handleSave = async () => {
    setError('');

    if (!questionText.trim()) {
      setError('Question text is required');
      return;
    }

    const needsOptions = ['single_choice', 'multiple_choice', 'true_false'].includes(questionType);
    if (needsOptions) {
      const filledOptions = options.filter((o) => o.text.trim());
      if (filledOptions.length < 2) {
        setError('At least 2 options are required');
        return;
      }
      if (!filledOptions.some((o) => o.isCorrect)) {
        setError('Mark at least one correct answer');
        return;
      }
    }

    if (questionType === 'numerical' && numericalAnswer === undefined) {
      setError('Numerical answer is required');
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Step 1: Create question in question bank
      const questionPayload: Record<string, unknown> = {
        questionText,
        questionType,
        difficulty,
        positiveMarks,
        negativeMarks,
        explanation: explanation || null,
      };

      if (needsOptions) {
        questionPayload.options = options
          .filter((o) => o.text.trim())
          .map((o, i) => ({
            option_text: o.text,
            is_correct: o.isCorrect,
            sequence_order: i,
          }));
      }

      if (questionType === 'numerical') {
        questionPayload.numericalAnswer = numericalAnswer;
        questionPayload.numericalTolerance = numericalTolerance;
      }

      if (questionType === 'subjective') {
        questionPayload.modelAnswer = modelAnswer || null;
      }

      const qRes = await fetch(`${API_URL}/v2/questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(questionPayload),
      });

      const qData = await qRes.json();
      if (!qRes.ok || !qData.success) {
        setError(qData.message || 'Failed to create question');
        setSaving(false);
        return;
      }

      const createdQuestionId = qData.data.id;

      // Step 2: Link question to exam
      await fetch(`${API_URL}/v2/exams/${examId}/questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          questionId: createdQuestionId,
          positiveMarks,
          negativeMarks,
        }),
      });

      onAdded();
    } catch (err) {
      console.error('Failed to add question:', err);
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const needsOptions = ['single_choice', 'multiple_choice', 'true_false'].includes(questionType);

  return (
    <Card className="p-6 border-2 border-indigo-200 bg-indigo-50/30">
      <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Add New Question</h3>

      <div className="space-y-4">
        {/* Type & Difficulty */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Select
            label="Question Type"
            value={questionType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setQuestionType(e.target.value as QuestionType)}
            options={[
              { value: 'single_choice', label: 'Single Choice' },
              { value: 'multiple_choice', label: 'Multiple Choice' },
              { value: 'true_false', label: 'True / False' },
              { value: 'numerical', label: 'Numerical' },
              { value: 'subjective', label: 'Subjective' },
            ]}
          />
          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDifficulty(e.target.value)}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
          />
          <Input
            label="+ Marks"
            type="number"
            min={0}
            value={positiveMarks}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPositiveMarks(parseInt(e.target.value) || 0)}
          />
          <Input
            label="- Marks"
            type="number"
            min={0}
            value={negativeMarks}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNegativeMarks(parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Question Text */}
        <Textarea
          label="Question Text"
          value={questionText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestionText(e.target.value)}
          placeholder="Enter the question..."
          rows={3}
          isRequired
        />

        {/* Options (for MCQ / True-False) */}
        {needsOptions && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Options <span className="text-slate-400">(check the correct answer)</span>
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (questionType === 'single_choice' || questionType === 'true_false') {
                      setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })));
                    } else {
                      setOptions(options.map((o, i) => i === idx ? { ...o, isCorrect: !o.isCorrect } : o));
                    }
                  }}
                  className={clsx(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    opt.isCorrect
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 hover:border-emerald-400'
                  )}
                >
                  {opt.isCorrect && <CheckCircle className="w-3.5 h-3.5" />}
                </button>
                <Input
                  value={opt.text}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOptions(options.map((o, i) => i === idx ? { ...o, text: e.target.value } : o))
                  }
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  disabled={questionType === 'true_false'}
                />
                {questionType !== 'true_false' && options.length > 2 && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                    icon={<Trash2 className="w-4 h-4 text-rose-400" />}
                    aria-label="Remove option"
                  />
                )}
              </div>
            ))}
            {questionType !== 'true_false' && options.length < 6 && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setOptions([...options, { text: '', isCorrect: false }])}
              >
                Add Option
              </Button>
            )}
          </div>
        )}

        {/* Numerical Answer */}
        {questionType === 'numerical' && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Correct Answer"
              type="number"
              value={numericalAnswer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumericalAnswer(parseFloat(e.target.value) || 0)}
              isRequired
            />
            <Input
              label="Tolerance (±)"
              type="number"
              min={0}
              step={0.01}
              value={numericalTolerance}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumericalTolerance(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        {/* Subjective Model Answer */}
        {questionType === 'subjective' && (
          <Textarea
            label="Model Answer (Optional)"
            value={modelAnswer}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setModelAnswer(e.target.value)}
            placeholder="The ideal answer for reference..."
            rows={3}
          />
        )}

        {/* Explanation */}
        <Textarea
          label="Explanation (Optional)"
          value={explanation}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExplanation(e.target.value)}
          placeholder="Explain the answer (shown to students after submission)..."
          rows={2}
        />

        {/* Error */}
        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            leftIcon={<Save className="w-4 h-4" />}
            onClick={handleSave}
            loading={saving}
          >
            Add Question
          </Button>
        </div>
      </div>
    </Card>
  );
}
