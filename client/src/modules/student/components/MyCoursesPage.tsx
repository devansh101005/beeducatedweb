// Student My Courses Page
// Premium course enrollment and progress tracking

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Play,
  CheckCircle,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import {
  PageTransition,
  FadeIn,
  Stagger,
  StaggerItem,
  HoverScale,
} from '@shared/components/ui/motion';
import { Button } from '@shared/components/ui/Button';
import { Card, CardBody, StatCard } from '@shared/components/ui/Card';
import { StatusBadge } from '@shared/components/ui/Badge';
import { SkeletonCard } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';

interface EnrolledCourse {
  id: string;
  course: {
    id: string;
    name: string;
    description: string;
    thumbnail?: string;
    category: string;
    duration: string;
  };
  batch?: {
    id: string;
    name: string;
    teacher: string;
  };
  progress: number;
  completedLessons: number;
  totalLessons: number;
  completedModules: number;
  totalModules: number;
  lastAccessedAt?: string;
  status: 'active' | 'completed' | 'paused';
  expiresAt?: string;
  enrolledAt: string;
}

const statusColors: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  completed: 'default',
  paused: 'warning',
};

export function MyCoursesPage() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
  const [stats, setStats] = useState({
    enrolled: 0,
    inProgress: 0,
    completed: 0,
    totalHours: 0,
  });

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v2/student/courses');
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v2/student/courses/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed') return c.status === 'completed';
    return c.status === 'active';
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">My Courses</h1>
              <p className="text-neutral-600 mt-1">
                Track your learning progress and continue where you left off
              </p>
            </div>
            <Link to="/dashboard/courses">
              <Button variant="outline" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Browse Courses
              </Button>
            </Link>
          </div>
        </FadeIn>

        {/* Stats */}
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard
              title="Enrolled"
              value={stats.enrolled}
              icon={<BookOpen className="w-5 h-5" />}
              color="primary"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="In Progress"
              value={stats.inProgress}
              icon={<Play className="w-5 h-5" />}
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
              title="Hours Learned"
              value={stats.totalHours}
              icon={<Clock className="w-5 h-5" />}
              color="info"
            />
          </StaggerItem>
        </Stagger>

        {/* Tabs */}
        <FadeIn delay={0.1}>
          <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg w-fit">
            {[
              { key: 'active', label: 'In Progress' },
              { key: 'completed', label: 'Completed' },
              { key: 'all', label: 'All Courses' },
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

        {/* Courses Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <EmptyState
            title={activeTab === 'completed' ? 'No completed courses yet' : 'No courses found'}
            description={
              activeTab === 'completed'
                ? 'Complete your enrolled courses to see them here'
                : "You haven't enrolled in any courses yet"
            }
            icon={<BookOpen className="w-12 h-12" />}
            action={
              <Link to="/dashboard/courses">
                <Button>Browse Courses</Button>
              </Link>
            }
          />
        ) : (
          <Stagger className="grid md:grid-cols-2 gap-6">
            {filteredCourses.map((enrollment) => (
              <StaggerItem key={enrollment.id}>
                <CourseCard enrollment={enrollment} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </PageTransition>
  );
}

// Course Card Component
function CourseCard({ enrollment }: { enrollment: EnrolledCourse }) {
  const { course, batch, progress, completedLessons, totalLessons, status } = enrollment;

  return (
    <HoverScale>
      <Card className="h-full overflow-hidden">
        <div className="flex">
          {/* Thumbnail */}
          <div className="relative w-40 flex-shrink-0 bg-gradient-to-br from-primary-100 to-primary-200">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-primary-300" />
              </div>
            )}
            {status === 'completed' && (
              <div className="absolute inset-0 bg-success-500/20 flex items-center justify-center">
                <div className="bg-success-500 text-white p-2 rounded-full">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <CardBody className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-medium text-primary-600 mb-1">{course.category}</p>
                <h3 className="font-semibold text-neutral-900 line-clamp-1">{course.name}</h3>
              </div>
              <StatusBadge
                status={statusColors[status]}
                label={status.charAt(0).toUpperCase() + status.slice(1)}
              />
            </div>

            {batch && (
              <p className="text-sm text-neutral-500 mb-3">
                Batch: {batch.name} | {batch.teacher}
              </p>
            )}

            {/* Progress */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Progress</span>
                <span className="font-medium text-neutral-900">{progress}%</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`h-full rounded-full ${
                    progress === 100
                      ? 'bg-success-500'
                      : progress >= 50
                      ? 'bg-primary-500'
                      : 'bg-warning-500'
                  }`}
                />
              </div>
              <p className="text-xs text-neutral-500">
                {completedLessons} of {totalLessons} lessons completed
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link to={`/dashboard/course/${enrollment.course.id}`} className="flex-1">
                <Button size="sm" className="w-full" leftIcon={<Play className="w-4 h-4" />}>
                  {status === 'completed' ? 'Review' : 'Continue'}
                </Button>
              </Link>
              <Link to={`/dashboard/course/${enrollment.course.id}/progress`}>
                <Button size="sm" variant="outline">
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardBody>
        </div>
      </Card>
    </HoverScale>
  );
}
