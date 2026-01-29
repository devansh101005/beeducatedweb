// Student My Exams Page
// Premium exam listing with upcoming, ongoing, and past exams

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileQuestion,
  Clock,
  Calendar,
  Play,
  CheckCircle,
  AlertCircle,
  Timer,
  Target,
  Award,
  ChevronRight,
  BarChart3,
  Lock,
  Bell,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast, isFuture, differenceInMinutes } from 'date-fns';
import {
  PageTransition,
  FadeIn,
  Stagger,
  StaggerItem,
  HoverScale,
} from '@shared/components/ui/motion';
import { Button } from '@shared/components/ui/Button';
import { Card, CardBody, StatCard } from '@shared/components/ui/Card';
import { Badge, StatusBadge } from '@shared/components/ui/Badge';
import { SkeletonCard } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';

interface Exam {
  id: string;
  title: string;
  description?: string;
  course: {
    id: string;
    name: string;
  };
  type: 'quiz' | 'test' | 'mock' | 'final';
  duration: number; // minutes
  totalMarks: number;
  passingMarks: number;
  totalQuestions: number;
  scheduledAt?: string;
  endsAt?: string;
  status: 'upcoming' | 'live' | 'completed' | 'missed';
  attempt?: {
    id: string;
    score: number;
    percentage: number;
    passed: boolean;
    completedAt: string;
    timeTaken: number;
  };
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

export function MyExamsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    avgScore: 0,
    passRate: 0,
  });

  useEffect(() => {
    fetchExams();
    fetchStats();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v2/student/exams');
      const data = await response.json();
      if (data.success) {
        setExams(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v2/student/exams/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const filteredExams = exams.filter((exam) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return exam.status === 'upcoming' || exam.status === 'live';
    return exam.status === 'completed' || exam.status === 'missed';
  });

  // Sort: Live first, then upcoming by date, then completed
  const sortedExams = [...filteredExams].sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
    if (b.status === 'upcoming' && a.status !== 'upcoming') return 1;
    return 0;
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Exams</h1>
            <p className="text-neutral-600 mt-1">
              View upcoming assessments and track your performance
            </p>
          </div>
        </FadeIn>

        {/* Stats */}
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard
              title="Upcoming"
              value={stats.upcoming}
              icon={<Calendar className="w-5 h-5" />}
              color="warning"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Completed"
              value={stats.completed}
              icon={<CheckCircle className="w-5 h-5" />}
              color="success"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Avg. Score"
              value={`${stats.avgScore.toFixed(0)}%`}
              icon={<BarChart3 className="w-5 h-5" />}
              color="primary"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Pass Rate"
              value={`${stats.passRate.toFixed(0)}%`}
              icon={<Award className="w-5 h-5" />}
              color="info"
            />
          </StaggerItem>
        </Stagger>

        {/* Tabs */}
        <FadeIn delay={0.1}>
          <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg w-fit">
            {[
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'completed', label: 'Completed' },
              { key: 'all', label: 'All Exams' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Live Exam Alert */}
        {exams.some((e) => e.status === 'live') && (
          <FadeIn delay={0.15}>
            <Card className="border-l-4 border-l-success-500 bg-success-50/50">
              <CardBody className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                    <Play className="w-5 h-5 text-success-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-success-800">Exam in Progress</h3>
                    <p className="text-sm text-success-600">
                      You have an exam that is currently live. Don't miss it!
                    </p>
                  </div>
                  <Link
                    to={`/dashboard/exam/${exams.find((e) => e.status === 'live')?.id}`}
                  >
                    <Button variant="success" leftIcon={<Play className="w-4 h-4" />}>
                      Start Now
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          </FadeIn>
        )}

        {/* Exams List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : sortedExams.length === 0 ? (
          <EmptyState
            title={activeTab === 'completed' ? 'No completed exams yet' : 'No exams scheduled'}
            description={
              activeTab === 'completed'
                ? 'Your completed exams will appear here'
                : 'Check back later for upcoming exams'
            }
            icon={<FileQuestion className="w-12 h-12" />}
          />
        ) : (
          <Stagger className="space-y-4">
            {sortedExams.map((exam) => (
              <StaggerItem key={exam.id}>
                <ExamCard exam={exam} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </PageTransition>
  );
}

// Exam Card Component
function ExamCard({ exam }: { exam: Exam }) {
  const navigate = useNavigate();
  const isLive = exam.status === 'live';
  const isUpcoming = exam.status === 'upcoming';
  const isCompleted = exam.status === 'completed';
  const isMissed = exam.status === 'missed';

  const getTimeRemaining = () => {
    if (!exam.scheduledAt) return null;
    const scheduled = new Date(exam.scheduledAt);
    if (isPast(scheduled)) return null;
    return formatDistanceToNow(scheduled, { addSuffix: true });
  };

  const handleAction = () => {
    if (isLive) {
      navigate(`/dashboard/exam/${exam.id}/take`);
    } else if (isCompleted && exam.attempt) {
      navigate(`/dashboard/exam/${exam.id}/result`);
    }
  };

  return (
    <HoverScale scale={1.01}>
      <Card
        className={`transition-all ${
          isLive ? 'border-2 border-success-400 shadow-lg shadow-success-100' : ''
        }`}
      >
        <CardBody className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Left - Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={typeColors[exam.type] as any}>
                  {typeLabels[exam.type]}
                </Badge>
                {isLive && (
                  <span className="flex items-center gap-1 text-xs font-medium text-success-600 bg-success-100 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                    LIVE NOW
                  </span>
                )}
                {isMissed && (
                  <Badge variant="danger">Missed</Badge>
                )}
              </div>

              <h3 className="text-lg font-semibold text-neutral-900">{exam.title}</h3>
              <p className="text-sm text-neutral-500 mt-1">{exam.course.name}</p>

              {exam.description && (
                <p className="text-sm text-neutral-600 mt-2 line-clamp-1">
                  {exam.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <Timer className="w-4 h-4" />
                  {exam.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {exam.totalMarks} marks
                </span>
                <span className="flex items-center gap-1">
                  <FileQuestion className="w-4 h-4" />
                  {exam.totalQuestions} questions
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  Pass: {exam.passingMarks} marks
                </span>
              </div>
            </div>

            {/* Right - Schedule/Result */}
            <div className="flex flex-col items-end gap-3">
              {isUpcoming && exam.scheduledAt && (
                <div className="text-right">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Scheduled</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {format(new Date(exam.scheduledAt), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {format(new Date(exam.scheduledAt), 'h:mm a')}
                  </p>
                  <p className="text-xs text-warning-600 mt-1">
                    {getTimeRemaining()}
                  </p>
                </div>
              )}

              {isCompleted && exam.attempt && (
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    {exam.attempt.passed ? (
                      <CheckCircle className="w-5 h-5 text-success-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-danger-500" />
                    )}
                    <span
                      className={`text-lg font-bold ${
                        exam.attempt.passed ? 'text-success-600' : 'text-danger-600'
                      }`}
                    >
                      {exam.attempt.score}/{exam.totalMarks}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    {exam.attempt.percentage.toFixed(0)}% •{' '}
                    {exam.attempt.passed ? 'Passed' : 'Failed'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Completed {format(new Date(exam.attempt.completedAt), 'MMM d')}
                  </p>
                </div>
              )}

              {/* Action Button */}
              {isLive && (
                <Button
                  variant="success"
                  leftIcon={<Play className="w-4 h-4" />}
                  onClick={handleAction}
                >
                  Start Exam
                </Button>
              )}

              {isUpcoming && (
                <Button variant="outline" disabled leftIcon={<Lock className="w-4 h-4" />}>
                  Not Available Yet
                </Button>
              )}

              {isCompleted && exam.attempt && (
                <Button
                  variant="outline"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  onClick={handleAction}
                >
                  View Result
                </Button>
              )}

              {isMissed && (
                <Button variant="ghost" disabled>
                  Exam Missed
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </HoverScale>
  );
}
