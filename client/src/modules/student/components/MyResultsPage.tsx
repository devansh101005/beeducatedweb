// Student My Results Page
// Premium results and performance analytics

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  ChevronRight,
  Download,
  Filter,
  FileQuestion,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  PageTransition,
  FadeIn,
  Stagger,
  StaggerItem,
} from '@shared/components/ui/motion';
import { Button } from '@shared/components/ui/Button';
import { Card, CardBody, CardHeader, StatCard } from '@shared/components/ui/Card';
import { Select } from '@shared/components/ui/Input';
import { Badge } from '@shared/components/ui/Badge';
import { Table, Pagination } from '@shared/components/ui/Table';
import { SkeletonTable, SkeletonCard } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';

interface Result {
  id: string;
  exam: {
    id: string;
    title: string;
    type: 'quiz' | 'test' | 'mock' | 'final';
    totalMarks: number;
    passingMarks: number;
  };
  course: {
    id: string;
    name: string;
  };
  score: number;
  percentage: number;
  passed: boolean;
  rank?: number;
  totalParticipants?: number;
  timeTaken: number;
  completedAt: string;
}

interface PerformanceData {
  month: string;
  avgScore: number;
  examsTaken: number;
}

interface SubjectPerformance {
  subject: string;
  avgScore: number;
  examsTaken: number;
  trend: 'up' | 'down' | 'stable';
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

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export function MyResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState({
    totalExams: 0,
    avgScore: 0,
    passRate: 0,
    bestScore: 0,
    trend: 0,
  });

  useEffect(() => {
    fetchResults();
    fetchCourses();
    fetchStats();
    fetchPerformanceData();
    fetchSubjectPerformance();
  }, [currentPage, courseFilter, typeFilter]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(courseFilter !== 'all' && { courseId: courseFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      });

      const response = await fetch(`/api/v2/student/results?${params}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.data.results);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/v2/student/courses');
      const data = await response.json();
      if (data.success) {
        setCourses(data.data.map((c: any) => ({ id: c.course.id, name: c.course.name })));
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v2/student/results/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/v2/student/results/performance');
      const data = await response.json();
      if (data.success) {
        setPerformanceData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    }
  };

  const fetchSubjectPerformance = async () => {
    try {
      const response = await fetch('/api/v2/student/results/by-subject');
      const data = await response.json();
      if (data.success) {
        setSubjectPerformance(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch subject performance:', error);
    }
  };

  const columns = [
    {
      key: 'exam',
      header: 'Exam',
      render: (result: Result) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-900">{result.exam.title}</span>
            <Badge variant={typeColors[result.exam.type] as any} className="text-xs">
              {typeLabels[result.exam.type]}
            </Badge>
          </div>
          <p className="text-sm text-neutral-500">{result.course.name}</p>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      render: (result: Result) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg text-neutral-900">
            {result.score}/{result.exam.totalMarks}
          </span>
        </div>
      ),
    },
    {
      key: 'percentage',
      header: 'Percentage',
      render: (result: Result) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                result.percentage >= 80
                  ? 'bg-success-500'
                  : result.percentage >= 60
                  ? 'bg-primary-500'
                  : result.percentage >= 40
                  ? 'bg-warning-500'
                  : 'bg-danger-500'
              }`}
              style={{ width: `${result.percentage}%` }}
            />
          </div>
          <span className="text-sm font-medium text-neutral-700">
            {result.percentage.toFixed(0)}%
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (result: Result) => (
        <div className="flex items-center gap-1">
          {result.passed ? (
            <>
              <CheckCircle className="w-4 h-4 text-success-500" />
              <span className="text-success-600 font-medium">Passed</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-danger-500" />
              <span className="text-danger-600 font-medium">Failed</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'rank',
      header: 'Rank',
      render: (result: Result) => (
        result.rank ? (
          <div className="text-sm">
            <span className="font-semibold text-neutral-900">#{result.rank}</span>
            <span className="text-neutral-500"> / {result.totalParticipants}</span>
          </div>
        ) : (
          <span className="text-neutral-400">-</span>
        )
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (result: Result) => (
        <div className="text-sm text-neutral-600">
          {format(new Date(result.completedAt), 'MMM d, yyyy')}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (result: Result) => (
        <Link to={`/dashboard/exam/${result.exam.id}/result`}>
          <Button size="sm" variant="ghost" rightIcon={<ChevronRight className="w-4 h-4" />}>
            Details
          </Button>
        </Link>
      ),
    },
  ];

  // Calculate pass/fail distribution for pie chart
  const passFailData = [
    { name: 'Passed', value: results.filter((r) => r.passed).length },
    { name: 'Failed', value: results.filter((r) => !r.passed).length },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">My Results</h1>
              <p className="text-neutral-600 mt-1">
                Track your performance and progress over time
              </p>
            </div>
            <Button
              variant="outline"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => {
                // Download report
                window.open('/api/v2/student/results/download', '_blank');
              }}
            >
              Download Report
            </Button>
          </div>
        </FadeIn>

        {/* Stats */}
        <Stagger className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StaggerItem>
            <StatCard
              title="Total Exams"
              value={stats.totalExams}
              icon={<FileQuestion className="w-5 h-5" />}
              color="primary"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Avg. Score"
              value={`${stats.avgScore.toFixed(0)}%`}
              icon={<BarChart3 className="w-5 h-5" />}
              color="info"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Pass Rate"
              value={`${stats.passRate.toFixed(0)}%`}
              icon={<CheckCircle className="w-5 h-5" />}
              color="success"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Best Score"
              value={`${stats.bestScore}%`}
              icon={<Award className="w-5 h-5" />}
              color="warning"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Trend"
              value={stats.trend >= 0 ? `+${stats.trend}%` : `${stats.trend}%`}
              icon={stats.trend >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              color={stats.trend >= 0 ? 'success' : 'danger'}
            />
          </StaggerItem>
        </Stagger>

        {/* Charts Row */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Performance Trend Chart */}
          <FadeIn delay={0.1} className="md:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <h3 className="font-semibold text-neutral-900">Performance Trend</h3>
              </CardHeader>
              <CardBody className="p-4">
                {performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="avgScore"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#scoreGradient)"
                        name="Avg Score"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-neutral-500">
                    No performance data yet
                  </div>
                )}
              </CardBody>
            </Card>
          </FadeIn>

          {/* Pass/Fail Distribution */}
          <FadeIn delay={0.15}>
            <Card className="h-full">
              <CardHeader>
                <h3 className="font-semibold text-neutral-900">Pass/Fail Ratio</h3>
              </CardHeader>
              <CardBody className="p-4">
                {results.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={passFailData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {passFailData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? '#22c55e' : '#ef4444'}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-neutral-500">
                    No data yet
                  </div>
                )}
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success-500 rounded-full" />
                    <span className="text-sm text-neutral-600">Passed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-danger-500 rounded-full" />
                    <span className="text-sm text-neutral-600">Failed</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </FadeIn>
        </div>

        {/* Subject Performance */}
        {subjectPerformance.length > 0 && (
          <FadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-neutral-900">Performance by Subject</h3>
              </CardHeader>
              <CardBody className="p-4">
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {subjectPerformance.map((subject, idx) => (
                    <div
                      key={subject.subject}
                      className="p-4 bg-neutral-50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-neutral-900">{subject.subject}</h4>
                        {subject.trend === 'up' && (
                          <TrendingUp className="w-4 h-4 text-success-500" />
                        )}
                        {subject.trend === 'down' && (
                          <TrendingDown className="w-4 h-4 text-danger-500" />
                        )}
                      </div>
                      <div className="text-2xl font-bold text-neutral-900 mb-1">
                        {subject.avgScore.toFixed(0)}%
                      </div>
                      <p className="text-xs text-neutral-500">
                        {subject.examsTaken} exams taken
                      </p>
                      <div className="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${subject.avgScore}%`,
                            backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </FadeIn>
        )}

        {/* Filters */}
        <FadeIn delay={0.25}>
          <Card>
            <CardBody className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <h3 className="font-semibold text-neutral-900">Results History</h3>
                <div className="flex gap-3">
                  <Select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="w-44"
                  >
                    <option value="all">All Courses</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-36"
                  >
                    <option value="all">All Types</option>
                    <option value="quiz">Quiz</option>
                    <option value="test">Test</option>
                    <option value="mock">Mock Test</option>
                    <option value="final">Final Exam</option>
                  </Select>
                </div>
              </div>
            </CardBody>
          </Card>
        </FadeIn>

        {/* Results Table */}
        <FadeIn delay={0.3}>
          <Card>
            {loading ? (
              <SkeletonTable rows={5} columns={7} />
            ) : results.length === 0 ? (
              <EmptyState
                title="No results found"
                description="Complete exams to see your results here"
                icon={<BarChart3 className="w-12 h-12" />}
              />
            ) : (
              <>
                <Table data={results} columns={columns} />
                <div className="px-6 py-4 border-t border-neutral-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </Card>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
