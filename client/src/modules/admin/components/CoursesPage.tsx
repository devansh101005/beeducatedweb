// Admin Courses Management Page
// Shows course types and their academic classes with enrollment stats

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Users,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  MapPin,
  Monitor,
  Home,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  PageTransition,
  FadeIn,
  Stagger,
  StaggerItem,
} from '@shared/components/ui/motion';
import { Card, StatCard } from '@shared/components/ui/Card';
import { Badge } from '@shared/components/ui/Badge';
import { SkeletonCard } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface CourseType {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  comingSoonMessage: string | null;
  features: string[] | null;
  displayOrder: number;
}

interface FeePlan {
  id: string;
  name: string;
  registrationFee: number;
  tuitionFee: number;
  materialFee: number;
  examFee: number;
  discountAmount: number;
  discountLabel: string | null;
  totalAmount: number;
  validityMonths: number;
  highlightLabel: string | null;
}

interface AcademicClass {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  duration: string | null;
  imageUrl: string | null;
  features: string[] | null;
  targetBoard: string | null;
  targetExam: string | null;
  maxStudents: number | null;
  currentStudents: number;
  enrollmentOpen: boolean;
  feePlan: FeePlan | null;
  feePlans: FeePlan[];
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Course type icons
const courseTypeIcons: Record<string, React.ReactNode> = {
  coaching_offline: <MapPin className="w-5 h-5" />,
  coaching_online: <Monitor className="w-5 h-5" />,
  home_tuition: <Home className="w-5 h-5" />,
  test_series: <FileText className="w-5 h-5" />,
};

const courseTypeColors: Record<string, string> = {
  coaching_offline: 'bg-blue-100 text-blue-600',
  coaching_online: 'bg-violet-100 text-violet-600',
  home_tuition: 'bg-emerald-100 text-emerald-600',
  test_series: 'bg-amber-100 text-amber-600',
};

// ============================================
// MAIN COMPONENT
// ============================================

export function CoursesPage() {
  const { getToken } = useAuth();
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [classesMap, setClassesMap] = useState<Record<string, AcademicClass[]>>({});
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCourseTypes();
  }, []);

  const fetchCourseTypes = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/v2/course-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setCourseTypes(data.data);
        // Auto-expand all and fetch classes
        const slugs = data.data.map((ct: CourseType) => ct.slug);
        setExpandedTypes(new Set(slugs));
        slugs.forEach((slug: string) => fetchClasses(slug));
      }
    } catch (error) {
      console.error('Failed to fetch course types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (slug: string) => {
    setLoadingClasses((prev) => new Set(prev).add(slug));
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/v2/course-types/${slug}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setClassesMap((prev) => ({
          ...prev,
          [slug]: data.data.classes || [],
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch classes for ${slug}:`, error);
    } finally {
      setLoadingClasses((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    }
  };

  const toggleExpand = (slug: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
        if (!classesMap[slug]) {
          fetchClasses(slug);
        }
      }
      return next;
    });
  };

  // Compute stats
  const totalClasses = Object.values(classesMap).flat().length;
  const totalEnrolled = Object.values(classesMap)
    .flat()
    .reduce((sum, c) => sum + (c.currentStudents || 0), 0);
  const openEnrollment = Object.values(classesMap)
    .flat()
    .filter((c) => c.enrollmentOpen).length;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Courses</h1>
            <p className="text-neutral-600 mt-1">
              Manage course types, classes, and fee plans
            </p>
          </div>
        </FadeIn>

        {/* Stats */}
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard
              title="Course Types"
              value={courseTypes.length}
              icon={<BookOpen className="w-5 h-5" />}
              color="primary"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Total Classes"
              value={totalClasses}
              icon={<GraduationCap className="w-5 h-5" />}
              color="info"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Total Enrolled"
              value={totalEnrolled}
              icon={<Users className="w-5 h-5" />}
              color="success"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Open Enrollment"
              value={openEnrollment}
              icon={<Calendar className="w-5 h-5" />}
              color="warning"
            />
          </StaggerItem>
        </Stagger>

        {/* Course Types */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : courseTypes.length === 0 ? (
          <EmptyState
            title="No course types found"
            description="Course types have not been set up yet"
            icon={<BookOpen className="w-12 h-12" />}
          />
        ) : (
          <div className="space-y-4">
            {courseTypes.map((ct) => (
              <FadeIn key={ct.id}>
                <Card className="overflow-hidden">
                  {/* Course Type Header */}
                  <button
                    onClick={() => toggleExpand(ct.slug)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          courseTypeColors[ct.slug] || 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {courseTypeIcons[ct.slug] || <BookOpen className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{ct.name}</h3>
                          {!ct.isActive && (
                            <Badge variant="default">Inactive</Badge>
                          )}
                          {ct.comingSoonMessage && (
                            <Badge variant="warning">Coming Soon</Badge>
                          )}
                        </div>
                        {ct.description && (
                          <p className="text-sm text-slate-500 mt-0.5">{ct.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-slate-500">
                        {classesMap[ct.slug]
                          ? `${classesMap[ct.slug].length} classes`
                          : ''}
                      </div>
                      {expandedTypes.has(ct.slug) ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Classes */}
                  <AnimatePresence>
                    {expandedTypes.has(ct.slug) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-200">
                          {loadingClasses.has(ct.slug) ? (
                            <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {[...Array(3)].map((_, i) => (
                                <div
                                  key={i}
                                  className="h-32 bg-slate-100 animate-pulse rounded-lg"
                                />
                              ))}
                            </div>
                          ) : !classesMap[ct.slug] ||
                            classesMap[ct.slug].length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                              No classes found for this course type
                            </div>
                          ) : (
                            <div className="p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {classesMap[ct.slug].map((cls) => (
                                <ClassCard
                                  key={cls.id}
                                  classItem={cls}
                                  formatCurrency={formatCurrency}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

// ============================================
// CLASS CARD
// ============================================

function ClassCard({
  classItem,
  formatCurrency,
}: {
  classItem: AcademicClass;
  formatCurrency: (amount: number) => string;
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors bg-white">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-slate-900 text-sm">{classItem.name}</h4>
        {classItem.enrollmentOpen ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <Eye className="w-3 h-3" />
            Open
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            <EyeOff className="w-3 h-3" />
            Closed
          </span>
        )}
      </div>

      {classItem.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">
          {classItem.description}
        </p>
      )}

      <div className="space-y-2 text-xs">
        {/* Enrollment count */}
        <div className="flex items-center justify-between text-slate-600">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Students
          </span>
          <span className="font-medium">
            {classItem.currentStudents}
            {classItem.maxStudents ? ` / ${classItem.maxStudents}` : ''}
          </span>
        </div>

        {/* Target board/exam */}
        {(classItem.targetBoard || classItem.targetExam) && (
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              {classItem.targetExam || classItem.targetBoard}
            </span>
          </div>
        )}

        {/* Fee plan */}
        {classItem.feePlan && (
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              Fee
            </span>
            <span className="font-medium text-slate-900">
              {formatCurrency(classItem.feePlan.totalAmount)}
            </span>
          </div>
        )}

        {/* Number of fee plans */}
        {classItem.feePlans && classItem.feePlans.length > 1 && (
          <p className="text-slate-400 text-[11px]">
            {classItem.feePlans.length} fee plans available
          </p>
        )}
      </div>

      {/* Duration */}
      {classItem.duration && (
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          {classItem.duration}
        </div>
      )}
    </div>
  );
}
