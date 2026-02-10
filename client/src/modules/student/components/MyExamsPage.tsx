// Student My Exams Page
// Premium exam listing with upcoming, ongoing, and past exams

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  FileQuestion,
  Calendar,
  Play,
  Timer,
  Target,
  Award,
  BarChart3,
  Lock,
  CheckCircle,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast, differenceInMinutes } from 'date-fns';
import {
  PageTransition,
  FadeIn,
  Stagger,
  StaggerItem,
  HoverScale,
} from '@shared/components/ui/motion';
import { Button } from '@shared/components/ui/Button';
import { Card, CardBody, StatCard } from '@shared/components/ui/Card';
import { Badge } from '@shared/components/ui/Badge';
import { SkeletonCard } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Exam {
  id: string;
  title: string;
  description?: string;
  examType: string | null;
  duration: number; // minutes
  totalMarks: number;
  passingMarks: number;
  scheduledAt?: string;
  endsAt?: string;
  status: 'upcoming' | 'live' | 'completed' | 'missed';
}

const typeColors: Record<string, string> = {
  quiz: 'info',
  test: 'primary',
  mock_test: 'warning',
  final: 'danger',
  unit_test: 'primary',
  mid_term: 'warning',
  practice: 'info',
};

const typeLabels: Record<string, string> = {
  quiz: 'Quiz',
  test: 'Test',
  mock_test: 'Mock Test',
  final: 'Final Exam',
  unit_test: 'Unit Test',
  mid_term: 'Mid Term',
  practice: 'Practice',
};

export function MyExamsPage() {
  const { getToken } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [now, setNow] = useState(new Date());

  // Tick every 30s so countdowns and entry windows update
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/v2/exams/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const mapped: Exam[] = (data.data || []).map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          examType: e.exam_type,
          duration: e.duration_minutes,
          totalMarks: e.total_marks || 0,
          passingMarks: e.passing_marks || 0,
          scheduledAt: e.start_time,
          endsAt: e.end_time,
          status: (() => {
            const now = new Date();
            // If end_time has passed → completed
            if (e.end_time && new Date(e.end_time) < now) return 'completed' as const;
            // If start_time has passed (and end_time hasn't) → live
            if (e.start_time && new Date(e.start_time) <= now) return 'live' as const;
            // DB says live but dates say otherwise — trust dates
            if (e.status === 'live') return 'live' as const;
            return 'upcoming' as const;
          })(),
        }));
        setExams(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  // Compute stats client-side
  const stats = {
    upcoming: exams.filter((e) => e.status === 'upcoming').length,
    live: exams.filter((e) => e.status === 'live').length,
    completed: exams.filter((e) => e.status === 'completed').length,
    total: exams.length,
  };

  const filteredExams = exams.filter((exam) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return exam.status === 'upcoming' || exam.status === 'live';
    return exam.status === 'completed' || exam.status === 'missed';
  });

  // Sort: Live first, then exams enterable soon, then upcoming by date
  const sortedExams = [...filteredExams].sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
    const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
    return aTime - bTime;
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
        <Stagger className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              title="Live Now"
              value={stats.live}
              icon={<Play className="w-5 h-5" />}
              color="success"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Completed"
              value={stats.completed}
              icon={<CheckCircle className="w-5 h-5" />}
              color="primary"
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
                    to={`/take-exam/${exams.find((e) => e.status === 'live')?.id}`}
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
                <ExamCard exam={exam} now={now} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </PageTransition>
  );
}

// Exam Card Component
function ExamCard({ exam, now }: { exam: Exam; now: Date }) {
  const navigate = useNavigate();
  const isLive = exam.status === 'live';
  const isUpcoming = exam.status === 'upcoming';
  const isCompleted = exam.status === 'completed';

  // Check if student can enter (10 min before start time)
  const canEnter = (() => {
    if (isCompleted) return false;
    if (isLive) return true;
    if (!exam.scheduledAt) return false;
    const startTime = new Date(exam.scheduledAt);
    const minsUntilStart = differenceInMinutes(startTime, now);
    return minsUntilStart <= 10;
  })();

  const getTimeInfo = () => {
    if (isCompleted) {
      if (exam.endsAt) return `Ended ${formatDistanceToNow(new Date(exam.endsAt), { addSuffix: true })}`;
      if (exam.scheduledAt) return `Was ${formatDistanceToNow(new Date(exam.scheduledAt), { addSuffix: true })}`;
      return null;
    }
    if (!exam.scheduledAt) return null;
    const startTime = new Date(exam.scheduledAt);
    if (isPast(startTime)) return null;
    const minsUntilStart = differenceInMinutes(startTime, now);
    if (minsUntilStart <= 10) {
      return `Starts in ${minsUntilStart <= 0 ? 'less than a minute' : `${minsUntilStart} min`}`;
    }
    return formatDistanceToNow(startTime, { addSuffix: true });
  };

  const handleAction = () => {
    if (isLive || canEnter) {
      navigate(`/take-exam/${exam.id}`);
    }
  };

  const typeKey = exam.examType || 'test';

  return (
    <HoverScale scale={1.01}>
      <Card
        className={`transition-all ${
          isLive ? 'border-2 border-success-400 shadow-lg shadow-success-100' :
          canEnter && isUpcoming ? 'border-2 border-amber-300 shadow-lg shadow-amber-50' :
          isCompleted ? 'opacity-75' : ''
        }`}
      >
        <CardBody className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Left - Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={(typeColors[typeKey] || 'primary') as any}>
                  {typeLabels[typeKey] || typeKey}
                </Badge>
                {isLive && (
                  <span className="flex items-center gap-1 text-xs font-medium text-success-600 bg-success-100 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                    LIVE NOW
                  </span>
                )}
                {canEnter && isUpcoming && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    ENTRY OPEN
                  </span>
                )}
                {isCompleted && (
                  <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    ENDED
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-neutral-900">{exam.title}</h3>

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
                  <Award className="w-4 h-4" />
                  Pass: {exam.passingMarks} marks
                </span>
              </div>
            </div>

            {/* Right - Schedule + Action */}
            <div className="flex flex-col items-end gap-3">
              {exam.scheduledAt && (
                <div className="text-right">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">
                    {isCompleted ? 'Was Scheduled' : 'Scheduled'}
                  </p>
                  <p className="text-sm font-medium text-neutral-900">
                    {format(new Date(exam.scheduledAt), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {format(new Date(exam.scheduledAt), 'h:mm a')}
                  </p>
                  {getTimeInfo() && (
                    <p className={`text-xs mt-1 ${
                      isCompleted ? 'text-slate-500' :
                      canEnter ? 'text-amber-600 font-semibold' : 'text-warning-600'
                    }`}>
                      {getTimeInfo()}
                    </p>
                  )}
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

              {isUpcoming && canEnter && (
                <Button
                  variant="warning"
                  leftIcon={<Play className="w-4 h-4" />}
                  onClick={handleAction}
                >
                  Enter Exam
                </Button>
              )}

              {isUpcoming && !canEnter && (
                <Button variant="outline" disabled leftIcon={<Lock className="w-4 h-4" />}>
                  Not Available Yet
                </Button>
              )}

              {isCompleted && (
                <Button
                  variant="outline"
                  leftIcon={<BarChart3 className="w-4 h-4" />}
                  onClick={() => navigate(`/exam-results/${exam.id}`)}
                >
                  View Results
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </HoverScale>
  );
}
