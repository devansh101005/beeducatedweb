// Teacher My Batches Page
// Premium batch management for teachers

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  GraduationCap,
  Bell,
  Video,
  FileText,
  Plus,
  Calendar,
  Clock,
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
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
import { AvatarGroup } from '@shared/components/ui/Avatar';
import { SkeletonCard } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';

interface Batch {
  id: string;
  name: string;
  code: string;
  course: {
    id: string;
    name: string;
  };
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  startDate: string;
  endDate?: string;
  studentCount: number;
  maxStudents: number;
  status: 'active' | 'upcoming' | 'completed';
  nextClass?: string;
  recentActivity?: {
    type: string;
    count: number;
  };
  topStudents: {
    name: string;
    avatar?: string;
  }[];
}

interface UpcomingClass {
  batchId: string;
  batchName: string;
  courseName: string;
  time: string;
  date: string;
  topic?: string;
}

const daysShort: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const statusColors: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  upcoming: 'warning',
  completed: 'default',
};

export function MyBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');
  const [stats, setStats] = useState({
    totalBatches: 0,
    activeBatches: 0,
    totalStudents: 0,
    classesToday: 0,
  });

  useEffect(() => {
    fetchBatches();
    fetchUpcomingClasses();
    fetchStats();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v2/teacher/batches');
      const data = await response.json();
      if (data.success) {
        setBatches(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingClasses = async () => {
    try {
      const response = await fetch('/api/v2/teacher/classes/upcoming');
      const data = await response.json();
      if (data.success) {
        setUpcomingClasses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch upcoming classes:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v2/teacher/batches/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (activeTab === 'all') return true;
    return b.status === 'active';
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">My Batches</h1>
              <p className="text-neutral-600 mt-1">
                Manage your assigned classes and track student progress
              </p>
            </div>
            <Link to="/dashboard/create-material">
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                Upload Material
              </Button>
            </Link>
          </div>
        </FadeIn>

        {/* Stats */}
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard
              title="Total Batches"
              value={stats.totalBatches}
              icon={<BookOpen className="w-5 h-5" />}
              color="primary"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Active Batches"
              value={stats.activeBatches}
              icon={<GraduationCap className="w-5 h-5" />}
              color="success"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={<Users className="w-5 h-5" />}
              color="info"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Classes Today"
              value={stats.classesToday}
              icon={<Calendar className="w-5 h-5" />}
              color="warning"
            />
          </StaggerItem>
        </Stagger>

        {/* Upcoming Classes Alert */}
        {upcomingClasses.length > 0 && (
          <FadeIn delay={0.1}>
            <Card className="bg-gradient-to-r from-primary-50 to-primary-100/50 border-primary-200">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary-900">Upcoming Class</h3>
                      <p className="text-sm text-primary-700">
                        {upcomingClasses[0].batchName} - {upcomingClasses[0].courseName}
                      </p>
                      <p className="text-xs text-primary-600 mt-0.5">
                        {isToday(new Date(upcomingClasses[0].date))
                          ? 'Today'
                          : isTomorrow(new Date(upcomingClasses[0].date))
                          ? 'Tomorrow'
                          : format(new Date(upcomingClasses[0].date), 'MMM d')}
                        {' at '}
                        {upcomingClasses[0].time}
                      </p>
                    </div>
                  </div>
                  <Button variant="primary">
                    Start Class
                  </Button>
                </div>
              </CardBody>
            </Card>
          </FadeIn>
        )}

        {/* Tabs */}
        <FadeIn delay={0.15}>
          <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg w-fit">
            {[
              { key: 'active', label: 'Active Batches' },
              { key: 'all', label: 'All Batches' },
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

        {/* Batches Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredBatches.length === 0 ? (
          <EmptyState
            title="No batches assigned"
            description="You don't have any batches assigned yet"
            icon={<BookOpen className="w-12 h-12" />}
          />
        ) : (
          <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <StaggerItem key={batch.id}>
                <BatchCard batch={batch} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </PageTransition>
  );
}

// Batch Card Component
function BatchCard({ batch }: { batch: Batch }) {
  const enrollmentPercent = (batch.studentCount / batch.maxStudents) * 100;

  return (
    <HoverScale>
      <Card className="h-full">
        <CardBody className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-neutral-900">{batch.name}</h3>
                <Badge variant="default" className="text-xs">
                  {batch.code}
                </Badge>
              </div>
              <p className="text-sm text-neutral-600">{batch.course.name}</p>
            </div>
            <StatusBadge
              status={statusColors[batch.status]}
              label={batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
            />
          </div>

          {/* Schedule */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="w-4 h-4" />
              <span>
                {batch.schedule.days.map((d) => daysShort[d.toLowerCase()]).join(', ')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Clock className="w-4 h-4" />
              <span>
                {batch.schedule.startTime} - {batch.schedule.endTime}
              </span>
            </div>
          </div>

          {/* Students */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-500" />
              <span className="text-sm text-neutral-600">
                {batch.studentCount} / {batch.maxStudents} students
              </span>
            </div>
            {batch.topStudents.length > 0 && (
              <AvatarGroup
                avatars={batch.topStudents.map((s) => ({
                  name: s.name,
                  src: s.avatar,
                }))}
                max={3}
                size="xs"
              />
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${enrollmentPercent}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`h-full rounded-full ${
                  enrollmentPercent >= 90
                    ? 'bg-danger-500'
                    : enrollmentPercent >= 70
                    ? 'bg-warning-500'
                    : 'bg-success-500'
                }`}
              />
            </div>
          </div>

          {/* Recent Activity */}
          {batch.recentActivity && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Bell className="w-4 h-4 text-primary-500" />
              <span className="text-neutral-600">
                {batch.recentActivity.count} new {batch.recentActivity.type}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Link to={`/dashboard/batch/${batch.id}`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
            <Link to={`/dashboard/batch/${batch.id}/students`}>
              <Button size="sm" variant="ghost">
                <Users className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={`/dashboard/batch/${batch.id}/exams`}>
              <Button size="sm" variant="ghost">
                <FileText className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </HoverScale>
  );
}
