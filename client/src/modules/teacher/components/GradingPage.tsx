// Teacher Grading Page
// Premium grading interface for reviewing student submissions

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileQuestion,
  ChevronDown,
  Award,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  PageTransition,
  FadeIn,
  Stagger,
  StaggerItem,
  HoverScale,
} from '@shared/components/ui/motion';
import { Button } from '@shared/components/ui/Button';
import { Card, CardBody, StatCard } from '@shared/components/ui/Card';
import { SearchInput, Select, Textarea } from '@shared/components/ui/Input';
import { Badge, StatusBadge } from '@shared/components/ui/Badge';
import { Avatar } from '@shared/components/ui/Avatar';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@shared/components/ui/Modal';
import { SkeletonCard } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';

interface Submission {
  id: string;
  student: {
    id: string;
    name: string;
    avatar?: string;
    batch: string;
  };
  exam: {
    id: string;
    title: string;
    type: 'quiz' | 'test' | 'mock' | 'final';
    totalMarks: number;
  };
  submittedAt: string;
  status: 'pending' | 'graded' | 'needs_review';
  autoScore?: number;
  manualScore?: number;
  timeTaken: number;
  answers: {
    questionId: string;
    questionText: string;
    questionType: 'mcq' | 'short' | 'long' | 'code';
    studentAnswer: string;
    correctAnswer?: string;
    marks: number;
    maxMarks: number;
    isCorrect?: boolean;
    feedback?: string;
  }[];
}

const typeColors: Record<string, string> = {
  quiz: 'info',
  test: 'primary',
  mock: 'warning',
  final: 'danger',
};

const typeLabels: Record<string, string> = {
  quiz: 'Quiz',
  test: 'Test',
  mock: 'Mock Test',
  final: 'Final Exam',
};

const statusColors: Record<string, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  graded: 'success',
  needs_review: 'danger',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending Review',
  graded: 'Graded',
  needs_review: 'Needs Review',
};

export function GradingPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [examFilter, setExamFilter] = useState<string>('all');
  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    graded: 0,
    needsReview: 0,
    avgScore: 0,
  });

  useEffect(() => {
    fetchSubmissions();
    fetchExams();
    fetchStats();
  }, [statusFilter, examFilter, searchQuery]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(examFilter !== 'all' && { examId: examFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/v2/teacher/submissions?${params}`);
      const data = await response.json();

      if (data.success) {
        setSubmissions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/v2/teacher/exams?hasSubmissions=true');
      const data = await response.json();
      if (data.success) {
        setExams(data.data.map((e: any) => ({ id: e.id, title: e.title })));
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v2/teacher/submissions/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const openGradingModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowGradingModal(true);
  };

  const handleGradingComplete = () => {
    setShowGradingModal(false);
    setSelectedSubmission(null);
    fetchSubmissions();
    fetchStats();
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Grading</h1>
            <p className="text-neutral-600 mt-1">
              Review and grade student exam submissions
            </p>
          </div>
        </FadeIn>

        {/* Stats */}
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard
              title="Pending Review"
              value={stats.pending}
              icon={<Clock className="w-5 h-5" />}
              color="warning"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Graded"
              value={stats.graded}
              icon={<CheckCircle className="w-5 h-5" />}
              color="success"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Needs Review"
              value={stats.needsReview}
              icon={<AlertCircle className="w-5 h-5" />}
              color="danger"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Avg. Score"
              value={`${stats.avgScore.toFixed(0)}%`}
              icon={<Award className="w-5 h-5" />}
              color="primary"
            />
          </StaggerItem>
        </Stagger>

        {/* Filters */}
        <FadeIn delay={0.1}>
          <Card>
            <CardBody className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Search by student name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Select
                    value={examFilter}
                    onChange={(e) => setExamFilter(e.target.value)}
                    className="w-52"
                  >
                    <option value="all">All Exams</option>
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-40"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="graded">Graded</option>
                    <option value="needs_review">Needs Review</option>
                  </Select>
                </div>
              </div>
            </CardBody>
          </Card>
        </FadeIn>

        {/* Submissions List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            title="No submissions to review"
            description={
              statusFilter === 'pending'
                ? 'All caught up! No pending submissions'
                : 'No submissions match your filters'
            }
            icon={<FileQuestion className="w-12 h-12" />}
          />
        ) : (
          <Stagger className="space-y-4">
            {submissions.map((submission) => (
              <StaggerItem key={submission.id}>
                <SubmissionCard
                  submission={submission}
                  onGrade={() => openGradingModal(submission)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {/* Grading Modal */}
        {selectedSubmission && (
          <GradingModal
            isOpen={showGradingModal}
            onClose={() => setShowGradingModal(false)}
            submission={selectedSubmission}
            onComplete={handleGradingComplete}
          />
        )}
      </div>
    </PageTransition>
  );
}

// Submission Card Component
function SubmissionCard({
  submission,
  onGrade,
}: {
  submission: Submission;
  onGrade: () => void;
}) {
  const totalScore = submission.answers.reduce((sum, a) => sum + a.marks, 0);
  const totalMaxMarks = submission.answers.reduce((sum, a) => sum + a.maxMarks, 0);
  const percentage = totalMaxMarks > 0 ? (totalScore / totalMaxMarks) * 100 : 0;

  return (
    <HoverScale scale={1.01}>
      <Card>
        <CardBody className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Student Info */}
            <div className="flex items-center gap-4 flex-1">
              <Avatar
                name={submission.student.name}
                src={submission.student.avatar}
                size="md"
              />
              <div>
                <h3 className="font-semibold text-neutral-900">
                  {submission.student.name}
                </h3>
                <p className="text-sm text-neutral-500">{submission.student.batch}</p>
              </div>
            </div>

            {/* Exam Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-neutral-900">
                  {submission.exam.title}
                </span>
                <Badge variant={typeColors[submission.exam.type] as any} className="text-xs">
                  {typeLabels[submission.exam.type]}
                </Badge>
              </div>
              <p className="text-sm text-neutral-500">
                Submitted {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
              </p>
            </div>

            {/* Score */}
            <div className="text-right">
              <StatusBadge
                status={statusColors[submission.status]}
                label={statusLabels[submission.status]}
              />
              {submission.status !== 'pending' && (
                <p className="text-lg font-semibold text-neutral-900 mt-1">
                  {totalScore}/{totalMaxMarks}{' '}
                  <span className="text-sm text-neutral-500">({percentage.toFixed(0)}%)</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div>
              <Button
                variant={submission.status === 'pending' ? 'primary' : 'outline'}
                onClick={onGrade}
              >
                {submission.status === 'pending' ? 'Grade' : 'Review'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </HoverScale>
  );
}

// Grading Modal Component
function GradingModal({
  isOpen,
  onClose,
  submission,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
  onComplete: () => void;
}) {
  const [grades, setGrades] = useState<Record<string, { marks: number; feedback: string }>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    // Initialize grades from existing marks
    const initialGrades: Record<string, { marks: number; feedback: string }> = {};
    submission.answers.forEach((answer) => {
      initialGrades[answer.questionId] = {
        marks: answer.marks,
        feedback: answer.feedback || '',
      };
    });
    setGrades(initialGrades);
  }, [submission]);

  const updateGrade = (questionId: string, marks: number, feedback: string) => {
    setGrades((prev) => ({
      ...prev,
      [questionId]: { marks, feedback },
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/v2/teacher/submissions/${submission.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grades: Object.entries(grades).map(([questionId, { marks, feedback }]) => ({
            questionId,
            marks,
            feedback,
          })),
        }),
      });

      if (response.ok) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to submit grades:', error);
    } finally {
      setSaving(false);
    }
  };

  const totalScore = Object.values(grades).reduce((sum, g) => sum + g.marks, 0);
  const totalMaxMarks = submission.answers.reduce((sum, a) => sum + a.maxMarks, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader onClose={onClose}>
        <div>
          <div className="flex items-center gap-2">
            <span>Grade Submission</span>
            <Badge variant={typeColors[submission.exam.type] as any}>
              {typeLabels[submission.exam.type]}
            </Badge>
          </div>
          <p className="text-sm font-normal text-neutral-500 mt-1">
            {submission.student.name} - {submission.exam.title}
          </p>
        </div>
      </ModalHeader>
      <ModalBody className="max-h-[60vh] overflow-y-auto">
        <div className="space-y-4">
          {submission.answers.map((answer, idx) => (
            <Card key={answer.questionId} variant="outlined">
              <CardBody className="p-4">
                {/* Question Header */}
                <button
                  onClick={() =>
                    setExpandedQuestion(
                      expandedQuestion === answer.questionId ? null : answer.questionId
                    )
                  }
                  className="w-full flex items-start justify-between text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-neutral-900">Q{idx + 1}.</span>
                      <Badge
                        variant={answer.questionType === 'mcq' ? 'info' : 'default'}
                        className="text-xs"
                      >
                        {answer.questionType.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-neutral-500">
                        ({answer.maxMarks} marks)
                      </span>
                    </div>
                    <p className="text-neutral-700">{answer.questionText}</p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-400 transition-transform ${
                      expandedQuestion === answer.questionId ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedQuestion === answer.questionId && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
                        {/* Student's Answer */}
                        <div>
                          <label className="text-sm font-medium text-neutral-700 mb-1 block">
                            Student's Answer
                          </label>
                          <div className="p-3 bg-neutral-50 rounded-lg text-neutral-700">
                            {answer.studentAnswer || (
                              <span className="text-neutral-400 italic">No answer provided</span>
                            )}
                          </div>
                        </div>

                        {/* Correct Answer (for MCQ) */}
                        {answer.correctAnswer && (
                          <div>
                            <label className="text-sm font-medium text-neutral-700 mb-1 block">
                              Correct Answer
                            </label>
                            <div className="p-3 bg-success-50 rounded-lg text-success-700">
                              {answer.correctAnswer}
                            </div>
                          </div>
                        )}

                        {/* Grading */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-neutral-700 mb-1 block">
                              Marks (out of {answer.maxMarks})
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={answer.maxMarks}
                              value={grades[answer.questionId]?.marks || 0}
                              onChange={(e) =>
                                updateGrade(
                                  answer.questionId,
                                  Math.min(answer.maxMarks, Math.max(0, parseInt(e.target.value) || 0)),
                                  grades[answer.questionId]?.feedback || ''
                                )
                              }
                              className="input w-full"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateGrade(
                                  answer.questionId,
                                  answer.maxMarks,
                                  grades[answer.questionId]?.feedback || ''
                                )
                              }
                            >
                              Full Marks
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateGrade(
                                  answer.questionId,
                                  0,
                                  grades[answer.questionId]?.feedback || ''
                                )
                              }
                            >
                              Zero
                            </Button>
                          </div>
                        </div>

                        {/* Feedback */}
                        <div>
                          <label className="text-sm font-medium text-neutral-700 mb-1 block">
                            Feedback (Optional)
                          </label>
                          <Textarea
                            value={grades[answer.questionId]?.feedback || ''}
                            onChange={(e) =>
                              updateGrade(
                                answer.questionId,
                                grades[answer.questionId]?.marks || 0,
                                e.target.value
                              )
                            }
                            placeholder="Add feedback for the student..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick Grade (when collapsed) */}
                {expandedQuestion !== answer.questionId && (
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {answer.isCorrect !== undefined && (
                        answer.isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-success-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-danger-500" />
                        )
                      )}
                      <span className="text-sm text-neutral-600">
                        Awarded: {grades[answer.questionId]?.marks || 0}/{answer.maxMarks}
                      </span>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      </ModalBody>
      <ModalFooter className="border-t border-neutral-200">
        <div className="flex items-center justify-between w-full">
          <div className="text-lg">
            <span className="text-neutral-600">Total: </span>
            <span className="font-bold text-neutral-900">
              {totalScore}/{totalMaxMarks}
            </span>
            <span className="text-neutral-500 ml-2">
              ({((totalScore / totalMaxMarks) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              Submit Grades
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
