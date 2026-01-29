import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  School,
  Monitor,
  FileText,
  Home,
  ChevronRight,
  Clock,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import type { CourseType } from '../types';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  School,
  Monitor,
  FileText,
  Home,
};

export function CoursesPage() {
  const navigate = useNavigate();
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourseTypes();
  }, []);

  const fetchCourseTypes = async () => {
    try {
      const res = await fetch('/api/v2/course-types');
      const data = await res.json();

      if (data.success) {
        setCourseTypes(data.data);
      } else {
        setError('Failed to load courses');
      }
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (courseType: CourseType) => {
    if (courseType.isActive) {
      navigate(`/courses/${courseType.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchCourseTypes}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Explore Our Programs
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Choose Your Learning Path
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
              Quality education designed for your success. Select a program that fits your learning style and goals.
            </p>
          </motion.div>
        </div>

        {/* Wave decoration */}
        <div className="h-16 bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-t-[3rem]"></div>
      </div>

      {/* Course Types Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {courseTypes.map((courseType, index) => {
            const IconComponent = iconMap[courseType.icon || 'School'] || School;
            const isActive = courseType.isActive;

            return (
              <motion.div
                key={courseType.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div
                  onClick={() => handleCardClick(courseType)}
                  className={`
                    relative group bg-white rounded-2xl overflow-hidden
                    border-2 transition-all duration-300
                    ${isActive
                      ? 'border-transparent hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100 cursor-pointer'
                      : 'border-slate-100 opacity-90'
                    }
                    shadow-lg
                  `}
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-8">
                    {/* Icon */}
                    <div
                      className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center mb-6
                        ${isActive ? 'bg-gradient-to-br' : 'bg-slate-100'}
                      `}
                      style={isActive ? {
                        background: `linear-gradient(135deg, ${courseType.color}20 0%, ${courseType.color}40 100%)`,
                      } : {}}
                    >
                      <IconComponent
                        className="w-8 h-8"
                        style={{ color: isActive ? courseType.color || '#3B82F6' : '#94A3B8' }}
                      />
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      {courseType.name}
                    </h3>
                    <p className="text-slate-600 mb-6 line-clamp-2">
                      {courseType.description}
                    </p>

                    {/* Features */}
                    {courseType.features && courseType.features.length > 0 && (
                      <ul className="space-y-2 mb-6">
                        {courseType.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle
                              className="w-4 h-4 mt-0.5 flex-shrink-0"
                              style={{ color: isActive ? courseType.color || '#3B82F6' : '#94A3B8' }}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* CTA */}
                    {isActive ? (
                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: courseType.color || '#3B82F6' }}
                        >
                          View Classes
                        </span>
                        <div
                          className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            transition-transform duration-300 group-hover:translate-x-1
                          `}
                          style={{ backgroundColor: `${courseType.color}15` }}
                        >
                          <ChevronRight
                            className="w-5 h-5"
                            style={{ color: courseType.color || '#3B82F6' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-500">
                          {courseType.comingSoonMessage || 'This program is coming soon!'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom accent line */}
                  {isActive && (
                    <div
                      className="h-1 w-full"
                      style={{ backgroundColor: courseType.color || '#3B82F6' }}
                    ></div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              Not sure which program to choose?
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-6">
              Our counselors are here to help you find the perfect learning path. Get personalized guidance based on your goals and learning style.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Talk to a Counselor
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default CoursesPage;
