// Free Resources Page
// Browse all content (free + locked paid) across course types and classes
// Drives enrollment by showing locked premium content alongside free materials

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Video,
  Download,
  FolderOpen,
  BookOpen,
  File,
  ExternalLink,
  Clock,
  Eye,
  Play,
  Lock,
  Unlock,
  ArrowLeft,
  MapPin,
  Monitor,
  Home,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Users,
  X,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  EmptyState,
  Skeleton,
} from '@shared/components/ui';
import { PageTransition, FadeIn, fadeInUp } from '@shared/components/ui/motion';
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
  features: string[] | null;
}

interface AcademicClass {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  currentStudents: number;
  enrollmentOpen: boolean;
  feePlan: {
    totalAmount: number;
  } | null;
}

interface BrowseContent {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  material_type: string | null;
  file_size: number | null;
  duration_seconds: number | null;
  is_free: boolean;
  is_downloadable: boolean;
  class_id: string;
  class_name: string;
  subject_id: string | null;
  subject_name: string | null;
  subject_code: string | null;
  created_at: string;
}

// ============================================
// CONSTANTS
// ============================================

const API_URL = import.meta.env.VITE_API_URL || '/api';

const courseTypeConfig: Record<string, { icon: React.ReactNode; gradient: string; bg: string }> = {
  coaching_offline: {
    icon: <MapPin className="w-7 h-7" />,
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50 text-blue-600',
  },
  coaching_online: {
    icon: <Monitor className="w-7 h-7" />,
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 text-violet-600',
  },
  home_tuition: {
    icon: <Home className="w-7 h-7" />,
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 text-emerald-600',
  },
  test_series: {
    icon: <FileText className="w-7 h-7" />,
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50 text-amber-600',
  },
};

const materialTypeLabels: Record<string, { label: string; color: string }> = {
  lecture: { label: 'Lecture', color: 'bg-blue-100 text-blue-700' },
  notes: { label: 'Notes', color: 'bg-emerald-100 text-emerald-700' },
  dpp: { label: 'DPP', color: 'bg-purple-100 text-purple-700' },
  dpp_pdf: { label: 'DPP PDF', color: 'bg-violet-100 text-violet-700' },
  dpp_video: { label: 'DPP Video', color: 'bg-fuchsia-100 text-fuchsia-700' },
  quiz: { label: 'Quiz', color: 'bg-amber-100 text-amber-700' },
};

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-rose-500" />,
  video: <Video className="w-5 h-5 text-blue-500" />,
  document: <FileText className="w-5 h-5 text-amber-500" />,
  image: <File className="w-5 h-5 text-emerald-500" />,
  link: <ExternalLink className="w-5 h-5 text-violet-500" />,
  audio: <File className="w-5 h-5 text-sky-500" />,
};

// ============================================
// MAIN COMPONENT
// ============================================

export function FreeResourcesPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  // Navigation state
  const [step, setStep] = useState<'types' | 'classes' | 'content'>('types');
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [selectedType, setSelectedType] = useState<CourseType | null>(null);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<AcademicClass | null>(null);
  const [content, setContent] = useState<BrowseContent[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Loading states
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Enrollment prompt modal
  const [showEnrollPrompt, setShowEnrollPrompt] = useState(false);
  const [promptContent, setPromptContent] = useState<BrowseContent | null>(null);

  useEffect(() => {
    fetchCourseTypes();
  }, []);

  const fetchCourseTypes = async () => {
    setLoadingTypes(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/course-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCourseTypes(data.data.filter((ct: CourseType) => ct.isActive));
      }
    } catch (err) {
      console.error('Error fetching course types:', err);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleSelectType = async (ct: CourseType) => {
    setSelectedType(ct);
    setStep('classes');
    setLoadingClasses(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/course-types/${ct.slug}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setClasses(data.data.classes || []);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSelectClass = async (cls: AcademicClass) => {
    setSelectedClass(cls);
    setStep('content');
    setLoadingContent(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/content/browse?classId=${cls.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setContent(data.data.content || []);
        setIsEnrolled(data.data.isEnrolled || false);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleContentClick = async (item: BrowseContent, download = false) => {
    // If paid and not enrolled, show enrollment prompt
    if (!item.is_free && !isEnrolled) {
      setPromptContent(item);
      setShowEnrollPrompt(true);
      return;
    }

    // Access content
    try {
      setDownloadingId(item.id);
      const token = await getToken();
      const params = download ? '?download=true' : '';
      const res = await fetch(`${API_URL}/v2/content/${item.id}/signed-url${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.open(data.data.url, '_blank');
      }
    } catch (err) {
      console.error('Error accessing content:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const goBack = () => {
    if (step === 'content') {
      setStep('classes');
      setSelectedClass(null);
      setContent([]);
    } else if (step === 'classes') {
      setStep('types');
      setSelectedType(null);
      setClasses([]);
    }
  };

  // Group content by subject
  const groupedContent = content.reduce<Record<string, BrowseContent[]>>((acc, item) => {
    const key = item.subject_name || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const freeCount = content.filter((c) => c.is_free).length;
  const paidCount = content.filter((c) => !c.is_free).length;

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // Breadcrumb
  const breadcrumb = [
    { label: 'Resources', onClick: () => { setStep('types'); setSelectedType(null); setSelectedClass(null); } },
    ...(selectedType ? [{ label: selectedType.name, onClick: () => { setStep('classes'); setSelectedClass(null); } }] : []),
    ...(selectedClass ? [{ label: selectedClass.name, onClick: undefined as (() => void) | undefined }] : []),
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex items-start justify-between">
            <div>
              {step !== 'types' && (
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <h1 className="text-2xl font-bold text-slate-900">Free Resources</h1>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 mt-1">
                {breadcrumb.map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                    {item.onClick ? (
                      <button
                        onClick={item.onClick}
                        className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ============================================ */}
        {/* STEP 1: Course Types */}
        {/* ============================================ */}
        <AnimatePresence mode="wait">
          {step === 'types' && (
            <motion.div
              key="types"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-slate-500 mb-6">
                Select a course type to browse study materials, lectures, notes, and more.
              </p>

              {loadingTypes ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-2xl" />
                  ))}
                </div>
              ) : courseTypes.length === 0 ? (
                <EmptyState
                  title="No course types available"
                  description="Course types haven't been set up yet"
                  icon={<BookOpen className="w-12 h-12" />}
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courseTypes.map((ct) => {
                    const config = courseTypeConfig[ct.slug] || courseTypeConfig.coaching_offline;
                    return (
                      <motion.button
                        key={ct.id}
                        onClick={() => handleSelectType(ct)}
                        className="group text-left"
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card className="h-full overflow-hidden border-2 border-transparent hover:border-blue-200 transition-all duration-300">
                          <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
                          <div className="p-5">
                            <div className={`w-14 h-14 rounded-2xl ${config.bg} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                              {config.icon}
                            </div>
                            <h3 className="font-semibold text-slate-900 text-lg mb-1">{ct.name}</h3>
                            {ct.description && (
                              <p className="text-sm text-slate-500 line-clamp-2">{ct.description}</p>
                            )}
                            <div className="flex items-center gap-1 mt-3 text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Browse Classes <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </Card>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ============================================ */}
          {/* STEP 2: Classes */}
          {/* ============================================ */}
          {step === 'classes' && (
            <motion.div
              key="classes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-slate-500 mb-6">
                Select a class to view available study materials.
              </p>

              {loadingClasses ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                  ))}
                </div>
              ) : classes.length === 0 ? (
                <EmptyState
                  title="No classes available"
                  description="No classes have been set up for this course type yet"
                  icon={<GraduationCap className="w-12 h-12" />}
                />
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {classes.map((cls) => (
                    <motion.button
                      key={cls.id}
                      onClick={() => handleSelectClass(cls)}
                      className="group text-left"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card className="h-full p-4 border-2 border-transparent hover:border-blue-200 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                            <GraduationCap className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                          </div>
                          <h3 className="font-semibold text-slate-900 text-sm">{cls.name}</h3>
                        </div>
                        {cls.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-2">{cls.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Users className="w-3.5 h-3.5" />
                          <span>{cls.currentStudents} students</span>
                        </div>
                      </Card>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ============================================ */}
          {/* STEP 3: Content */}
          {/* ============================================ */}
          {step === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Stats bar */}
              {!loadingContent && content.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <Badge variant="success" className="gap-1.5">
                    <Unlock className="w-3.5 h-3.5" />
                    {freeCount} Free
                  </Badge>
                  {paidCount > 0 && (
                    <Badge variant="default" className="gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      {paidCount} Premium
                    </Badge>
                  )}
                  {isEnrolled && (
                    <Badge variant="info" className="gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      You&apos;re enrolled — full access
                    </Badge>
                  )}
                </div>
              )}

              {loadingContent ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : content.length === 0 ? (
                <EmptyState
                  title="No content available"
                  description="Study materials haven't been uploaded for this class yet"
                  icon={<FolderOpen className="w-12 h-12" />}
                />
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedContent).map(([subjectName, items]) => (
                    <div key={subjectName}>
                      <h3 className="font-semibold text-slate-800 text-lg mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-slate-400" />
                        {subjectName}
                      </h3>
                      <div className="grid gap-3">
                        {items.map((item) => {
                          const isLocked = !item.is_free && !isEnrolled;
                          const isLoading = downloadingId === item.id;

                          return (
                            <motion.div key={item.id} {...fadeInUp}>
                              <Card
                                className={clsx(
                                  'relative overflow-hidden transition-all duration-300',
                                  isLocked
                                    ? 'border-slate-200 bg-slate-50/50 hover:border-amber-300 hover:shadow-md cursor-pointer'
                                    : 'hover:shadow-md'
                                )}
                                onClick={isLocked ? () => handleContentClick(item) : undefined}
                              >
                                <div className="p-4">
                                  <div className="flex gap-4">
                                    {/* Icon with lock overlay */}
                                    <div className="relative flex-shrink-0">
                                      <div
                                        className={clsx(
                                          'w-12 h-12 rounded-xl flex items-center justify-center',
                                          isLocked ? 'bg-slate-100' : 'bg-slate-100'
                                        )}
                                      >
                                        {isLocked ? (
                                          <Lock className="w-5 h-5 text-slate-400" />
                                        ) : (
                                          typeIcons[item.content_type] || <File className="w-5 h-5 text-slate-500" />
                                        )}
                                      </div>
                                      {/* Free badge */}
                                      {item.is_free && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                          <Unlock className="w-3 h-3 text-white" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Content info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h4
                                          className={clsx(
                                            'font-medium truncate',
                                            isLocked ? 'text-slate-500' : 'text-slate-900'
                                          )}
                                        >
                                          {item.title}
                                        </h4>
                                        {item.is_free ? (
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                            Free
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                            Premium
                                          </span>
                                        )}
                                      </div>

                                      {item.description && (
                                        <p
                                          className={clsx(
                                            'text-sm mt-0.5 line-clamp-1',
                                            isLocked ? 'text-slate-400' : 'text-slate-500'
                                          )}
                                        >
                                          {item.description}
                                        </p>
                                      )}

                                      {/* Meta */}
                                      <div className="flex flex-wrap items-center gap-2 mt-2">
                                        {item.material_type && materialTypeLabels[item.material_type] && (
                                          <span
                                            className={clsx(
                                              'text-xs px-2 py-0.5 rounded-full',
                                              isLocked ? 'bg-slate-100 text-slate-400' : materialTypeLabels[item.material_type].color
                                            )}
                                          >
                                            {materialTypeLabels[item.material_type].label}
                                          </span>
                                        )}
                                        {item.file_size && (
                                          <span className="text-xs text-slate-400">
                                            {formatFileSize(item.file_size)}
                                          </span>
                                        )}
                                        {item.duration_seconds && (
                                          <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDuration(item.duration_seconds)}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {isLocked ? (
                                        <div className="flex items-center gap-2 text-amber-600">
                                          <Lock className="w-4 h-4" />
                                          <span className="text-xs font-medium hidden sm:inline">Enroll to unlock</span>
                                        </div>
                                      ) : (
                                        <>
                                          {item.content_type === 'video' ? (
                                            <Button
                                              size="sm"
                                              leftIcon={<Play className="w-4 h-4" />}
                                              onClick={() => handleContentClick(item)}
                                              disabled={isLoading}
                                            >
                                              {isLoading ? 'Loading...' : 'Watch'}
                                            </Button>
                                          ) : item.content_type === 'link' ? (
                                            <Button
                                              size="sm"
                                              leftIcon={<ExternalLink className="w-4 h-4" />}
                                              onClick={() => handleContentClick(item)}
                                            >
                                              Open
                                            </Button>
                                          ) : (
                                            <>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                leftIcon={<Eye className="w-4 h-4" />}
                                                onClick={() => handleContentClick(item)}
                                                disabled={isLoading}
                                              >
                                                {isLoading ? 'Loading...' : 'View'}
                                              </Button>
                                              {item.is_downloadable && (
                                                <Button
                                                  size="sm"
                                                  leftIcon={<Download className="w-4 h-4" />}
                                                  onClick={() => handleContentClick(item, true)}
                                                  disabled={isLoading}
                                                >
                                                  {isLoading ? '...' : 'Download'}
                                                </Button>
                                              )}
                                            </>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Locked overlay gradient */}
                                {isLocked && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-50/80 pointer-events-none" />
                                )}
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================ */}
        {/* ENROLLMENT PROMPT MODAL */}
        {/* ============================================ */}
        <AnimatePresence>
          {showEnrollPrompt && promptContent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Header gradient */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white relative">
                  <button
                    onClick={() => setShowEnrollPrompt(false)}
                    className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Premium Content</h3>
                      <p className="text-white/80 text-sm">Enrollment required</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                  <p className="text-slate-700 mb-1">
                    <span className="font-medium">&ldquo;{promptContent.title}&rdquo;</span> is available
                    for enrolled students.
                  </p>
                  <p className="text-sm text-slate-500 mb-5">
                    Enroll in <span className="font-medium text-slate-700">{selectedClass?.name}</span> to
                    unlock all premium study materials, lectures, and notes.
                  </p>

                  {selectedClass?.feePlan && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Starting from</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(selectedClass.feePlan.totalAmount)}
                        </p>
                      </div>
                      <GraduationCap className="w-10 h-10 text-slate-300" />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowEnrollPrompt(false)}
                    >
                      Maybe Later
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0"
                      onClick={() => {
                        setShowEnrollPrompt(false);
                        // Navigate to the course type classes page for enrollment
                        if (selectedType) {
                          navigate(`/courses/${selectedType.slug}`);
                        }
                      }}
                    >
                      Enroll Now
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

export default FreeResourcesPage;
