// Teacher My Students Page
// Premium student management and progress tracking for teachers

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronRight,
  MessageSquare,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  PageTransition,
  FadeIn,
  Stagger,
  StaggerItem,
} from '@shared/components/ui/motion';
import { Button } from '@shared/components/ui/Button';
import { Card, CardBody, StatCard } from '@shared/components/ui/Card';
import { SearchInput, Select } from '@shared/components/ui/Input';
import { StatusBadge, Badge } from '@shared/components/ui/Badge';
import { AvatarWithName } from '@shared/components/ui/Avatar';
import { Table, Pagination } from '@shared/components/ui/Table';
import { SkeletonTable } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  batch: {
    id: string;
    name: string;
  };
  enrolledAt: string;
  progress: number;
  avgScore: number;
  attendance: number;
  status: 'active' | 'inactive' | 'at_risk';
  lastActivity?: string;
  trend: 'up' | 'down' | 'stable';
}

const statusColors: Record<string, 'success' | 'warning' | 'danger'> = {
  active: 'success',
  inactive: 'warning',
  at_risk: 'danger',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  at_risk: 'At Risk',
};

export function MyStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    atRisk: 0,
    avgProgress: 0,
  });

  useEffect(() => {
    fetchStudents();
    fetchBatches();
    fetchStats();
  }, [currentPage, batchFilter, statusFilter, searchQuery]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(batchFilter !== 'all' && { batchId: batchFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/v2/teacher/students?${params}`);
      const data = await response.json();

      if (data.success) {
        setStudents(data.data.students);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/v2/teacher/batches');
      const data = await response.json();
      if (data.success) {
        setBatches(data.data.map((b: any) => ({ id: b.id, name: b.name })));
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v2/teacher/students/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/v2/teacher/students/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export students:', error);
    }
  };

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (student: Student) => (
        <AvatarWithName
          name={`${student.firstName} ${student.lastName}`}
          subtitle={student.email}
          src={student.avatar}
          size="sm"
        />
      ),
    },
    {
      key: 'batch',
      header: 'Batch',
      render: (student: Student) => (
        <Badge variant="default">{student.batch.name}</Badge>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (student: Student) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                student.progress >= 80
                  ? 'bg-success-500'
                  : student.progress >= 50
                  ? 'bg-primary-500'
                  : 'bg-warning-500'
              }`}
              style={{ width: `${student.progress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-neutral-700">
            {student.progress}%
          </span>
        </div>
      ),
    },
    {
      key: 'avgScore',
      header: 'Avg. Score',
      render: (student: Student) => (
        <div className="flex items-center gap-1">
          <span className="font-medium text-neutral-900">{student.avgScore}%</span>
          {student.trend === 'up' && (
            <TrendingUp className="w-4 h-4 text-success-500" />
          )}
          {student.trend === 'down' && (
            <TrendingDown className="w-4 h-4 text-danger-500" />
          )}
        </div>
      ),
    },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (student: Student) => (
        <span
          className={`font-medium ${
            student.attendance >= 80
              ? 'text-success-600'
              : student.attendance >= 60
              ? 'text-warning-600'
              : 'text-danger-600'
          }`}
        >
          {student.attendance}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (student: Student) => (
        <StatusBadge
          status={statusColors[student.status]}
          label={statusLabels[student.status]}
        />
      ),
    },
    {
      key: 'lastActivity',
      header: 'Last Active',
      render: (student: Student) => (
        <span className="text-sm text-neutral-600">
          {student.lastActivity
            ? format(new Date(student.lastActivity), 'MMM d, h:mm a')
            : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (student: Student) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" title="Send message">
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Link to={`/dashboard/student/${student.id}`}>
            <Button variant="ghost" size="sm" title="View profile">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">My Students</h1>
              <p className="text-neutral-600 mt-1">
                Track student progress and performance across your batches
              </p>
            </div>
            <Button
              variant="outline"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExport}
            >
              Export
            </Button>
          </div>
        </FadeIn>

        {/* Stats */}
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard
              title="Total Students"
              value={stats.total}
              icon={<Users className="w-5 h-5" />}
              color="primary"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Active"
              value={stats.active}
              icon={<TrendingUp className="w-5 h-5" />}
              color="success"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="At Risk"
              value={stats.atRisk}
              icon={<TrendingDown className="w-5 h-5" />}
              color="danger"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Avg. Progress"
              value={`${stats.avgProgress}%`}
              icon={<BarChart3 className="w-5 h-5" />}
              color="info"
            />
          </StaggerItem>
        </Stagger>

        {/* At Risk Students Alert */}
        {stats.atRisk > 0 && (
          <FadeIn delay={0.1}>
            <Card className="border-l-4 border-l-danger-500 bg-danger-50/50">
              <CardBody className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-danger-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-danger-800">
                      {stats.atRisk} Students Need Attention
                    </h3>
                    <p className="text-sm text-danger-600">
                      These students have low attendance or performance scores
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-danger-300 text-danger-700 hover:bg-danger-100"
                    onClick={() => setStatusFilter('at_risk')}
                  >
                    View All
                  </Button>
                </div>
              </CardBody>
            </Card>
          </FadeIn>
        )}

        {/* Filters */}
        <FadeIn delay={0.15}>
          <Card>
            <CardBody className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Search students by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Select
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="w-44"
                  >
                    <option value="all">All Batches</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-36"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="at_risk">At Risk</option>
                  </Select>
                </div>
              </div>
            </CardBody>
          </Card>
        </FadeIn>

        {/* Students Table */}
        <FadeIn delay={0.2}>
          <Card>
            {loading ? (
              <SkeletonTable rows={5} columns={8} />
            ) : students.length === 0 ? (
              <EmptyState
                title="No students found"
                description={
                  searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Students will appear here once enrolled in your batches'
                }
                icon={<Users className="w-12 h-12" />}
              />
            ) : (
              <>
                <Table data={students} columns={columns} />
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
