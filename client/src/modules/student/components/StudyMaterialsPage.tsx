// Student Study Materials Page
// Premium study materials library organized by subject and content type

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  FileText,
  Video,
  Download,
  FolderOpen,
  BookOpen,
  FileImage,
  File,
  ExternalLink,
  Clock,
  Eye,
  Play,
  Brain,
  Calculator,
  Beaker,
  Globe,
  BookMarked,
  Lightbulb,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  Button,
  SearchInput,
  EmptyState,
  Skeleton,
  Badge,
} from '@shared/components/ui';
import { fadeInUp } from '@shared/components/ui/motion';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'document' | 'image' | 'link' | 'audio';
  materialType?: 'lecture' | 'notes' | 'dpp' | 'dpp_pdf' | 'dpp_video' | 'quiz';
  classId: string;
  className: string;
  subjectId?: string;
  subjectName?: string;
  subjectCode?: string;
  fileUrl?: string;
  fileSize?: number;
  duration?: number;
  thumbnailUrl?: string;
  isDownloadable: boolean;
  isFree: boolean;
  isCompleted?: boolean;
  progressPercent?: number;
  createdAt: string;
}

interface EnrolledClass {
  classId: string;
  className: string;
  courseTypeName: string;
  daysRemaining: number | null;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  color: string | null;
  icon: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Icon mapping for content types
const typeIcons: Record<string, React.ReactElement> = {
  pdf: <FileText className="w-5 h-5 text-rose-500" />,
  video: <Video className="w-5 h-5 text-sky-500" />,
  document: <File className="w-5 h-5 text-blue-500" />,
  image: <FileImage className="w-5 h-5 text-emerald-500" />,
  link: <ExternalLink className="w-5 h-5 text-amber-500" />,
  audio: <BookOpen className="w-5 h-5 text-violet-500" />,
};

// Subject icon mapping
const subjectIcons: Record<string, React.ReactElement> = {
  MATH: <Calculator className="w-5 h-5" />,
  PHY: <Lightbulb className="w-5 h-5" />,
  CHEM: <Beaker className="w-5 h-5" />,
  BIO: <Brain className="w-5 h-5" />,
  ENG: <BookMarked className="w-5 h-5" />,
  SCI: <Beaker className="w-5 h-5" />,
  SST: <Globe className="w-5 h-5" />,
  GK: <Brain className="w-5 h-5" />,
  MM: <Calculator className="w-5 h-5" />,
  HIST: <BookOpen className="w-5 h-5" />,
  GEO: <Globe className="w-5 h-5" />,
  POL: <BookMarked className="w-5 h-5" />,
  ECO: <ClipboardCheck className="w-5 h-5" />,
};

// Material type labels and colors
const materialTypeConfig: Record<string, { label: string; color: string; icon: React.ReactElement }> = {
  lecture: { label: 'Lectures', color: 'bg-sky-100 text-sky-700', icon: <Video className="w-4 h-4" /> },
  notes: { label: 'Notes', color: 'bg-amber-100 text-amber-700', icon: <FileText className="w-4 h-4" /> },
  dpp: { label: 'DPP', color: 'bg-violet-100 text-violet-700', icon: <ClipboardCheck className="w-4 h-4" /> },
  dpp_pdf: { label: 'DPP PDF', color: 'bg-rose-100 text-rose-700', icon: <FileText className="w-4 h-4" /> },
  dpp_video: { label: 'DPP Video', color: 'bg-emerald-100 text-emerald-700', icon: <Video className="w-4 h-4" /> },
  quiz: { label: 'Quiz', color: 'bg-blue-100 text-blue-700', icon: <ClipboardCheck className="w-4 h-4" /> },
};

// ============================================
// MAIN COMPONENT
// ============================================

export function StudyMaterialsPage() {
  const { getToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [classSubjects, setClassSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get('classId') || '');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('all');

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      setError('');

      try {
        const token = await getToken();
        const params = new URLSearchParams();

        if (selectedClass) params.append('classId', selectedClass);
        if (selectedSubject) params.append('subjectId', selectedSubject);
        if (selectedMaterialType !== 'all') params.append('materialType', selectedMaterialType);

        const response = await fetch(`${API_URL}/v2/student/materials?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.success) {
          setMaterials(data.data?.materials || []);
          setEnrolledClasses(data.data?.enrolledClasses || []);
          setError(''); // Clear error on success - empty state will be handled by UI

          // Auto-select first class if not already selected
          if (!selectedClass && data.data?.enrolledClasses?.length > 0) {
            setSelectedClass(data.data.enrolledClasses[0].classId);
          }
        } else {
          setError(data.message || 'Failed to load materials');
        }
      } catch (err) {
        console.error('Failed to fetch materials:', err);
        setError('Failed to load study materials. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [selectedClass, selectedSubject, selectedMaterialType, getToken]);

  // Fetch subjects when class changes
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) {
        setClassSubjects([]);
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/v2/course-types/classes/${selectedClass}/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (data.success) {
          setClassSubjects(data.data?.map((cs: any) => cs.subject) || []);
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
    };

    fetchSubjects();
    setSelectedSubject(''); // Reset subject when class changes
  }, [selectedClass, getToken]);

  // Update URL when class filter changes
  useEffect(() => {
    if (selectedClass) {
      searchParams.set('classId', selectedClass);
    } else {
      searchParams.delete('classId');
    }
    setSearchParams(searchParams, { replace: true });
  }, [selectedClass]);

  // Filter materials by search query
  const filteredMaterials = materials.filter((m) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.title?.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query) ||
      m.subjectName?.toLowerCase().includes(query)
    );
  });

  // Group materials by subject
  const materialsBySubject = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    filteredMaterials.forEach((m) => {
      const key = m.subjectId || 'other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });
    return grouped;
  }, [filteredMaterials]);

  // Group materials by material type
  const materialsByType = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    filteredMaterials.forEach((m) => {
      const key = m.materialType || 'other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });
    return grouped;
  }, [filteredMaterials]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins} min`;
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleMaterialClick = async (material: Material, download = false) => {
    if (!material.fileUrl && material.type !== 'link') return;

    // External links open directly
    if (material.type === 'link' && material.fileUrl) {
      window.open(material.fileUrl, '_blank');
      return;
    }

    try {
      setDownloadingId(material.id);
      const token = await getToken();
      const params = download ? '?download=true' : '';
      const response = await fetch(`${API_URL}/v2/content/${material.id}/signed-url${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success && data.data?.url) {
        window.open(data.data.url, '_blank');
      } else {
        console.error('Failed to get signed URL:', data.message);
        setError(data.message || 'Failed to access file. Please try again.');
      }
    } catch (err) {
      console.error('Failed to get signed URL:', err);
      setError('Failed to access file. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-2xl font-heading font-semibold text-slate-900 flex items-center gap-2">
          <FolderOpen className="w-7 h-7 text-amber-600" />
          Study Materials
        </h1>
        <p className="text-slate-500 mt-1">
          Access notes, videos, and resources for your enrolled classes
        </p>
      </motion.div>

      {/* Class Selection Cards */}
      {enrolledClasses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {enrolledClasses.map((cls) => (
            <button
              key={cls.classId}
              onClick={() => setSelectedClass(cls.classId)}
              className={clsx(
                'p-4 rounded-xl border-2 transition-all text-left',
                selectedClass === cls.classId
                  ? 'border-amber-500 bg-amber-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm',
                  selectedClass === cls.classId
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                    : 'bg-gradient-to-br from-slate-400 to-slate-500'
                )}>
                  {cls.className.replace(/[^0-9]/g, '') || cls.className.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{cls.className}</p>
                  <p className="text-xs text-slate-500">{cls.courseTypeName}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Subject Pills */}
      {selectedClass && classSubjects.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Subjects</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubject('')}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                !selectedSubject
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              All Subjects
            </button>
            {classSubjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={clsx(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                  selectedSubject === subject.id
                    ? 'text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
                style={selectedSubject === subject.id ? { backgroundColor: subject.color || '#F59E0B' } : {}}
              >
                {subjectIcons[subject.code] || <BookOpen className="w-4 h-4" />}
                {subject.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Content Type Tabs & Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, subject..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMaterialType('all')}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                selectedMaterialType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              All Types
            </button>
            {Object.entries(materialTypeConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedMaterialType(key)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                  selectedMaterialType === key
                    ? config.color
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {config.icon}
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Materials List */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-rose-600 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      ) : enrolledClasses.length === 0 ? (
        <EmptyState
          title="No Active Enrollments"
          description="You need to enroll in a class to access study materials."
          icon={<FolderOpen className="w-12 h-12" />}
          action={{
            label: 'Browse Classes',
            onClick: () => (window.location.href = '/courses'),
            variant: 'primary' as const,
          }}
        />
      ) : filteredMaterials.length === 0 ? (
        <EmptyState
          title="No Materials Found"
          description={
            searchQuery
              ? 'Try adjusting your search or filters.'
              : 'Materials will appear here once your teacher uploads them.'
          }
          icon={<FolderOpen className="w-12 h-12" />}
        />
      ) : selectedSubject ? (
        // Show materials grouped by type when subject is selected
        <div className="space-y-6">
          {Object.entries(materialTypeConfig).map(([type, config]) => {
            const typeMaterials = materialsByType[type] || [];
            if (typeMaterials.length === 0) return null;

            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={clsx('p-2 rounded-lg', config.color)}>
                    {config.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900">{config.label}</h3>
                  <Badge size="sm">{typeMaterials.length}</Badge>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeMaterials.map((material) => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      onView={() => handleMaterialClick(material)}
                      onDownload={() => handleMaterialClick(material, true)}
                      isLoading={downloadingId === material.id}
                      formatFileSize={formatFileSize}
                      formatDuration={formatDuration}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Show materials grouped by subject when no subject selected
        <div className="space-y-6">
          {classSubjects.map((subject) => {
            const subjectMaterials = materialsBySubject[subject.id] || [];
            if (subjectMaterials.length === 0) return null;

            return (
              <div key={subject.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-2 rounded-lg text-white"
                      style={{ backgroundColor: subject.color || '#6366F1' }}
                    >
                      {subjectIcons[subject.code] || <BookOpen className="w-5 h-5" />}
                    </div>
                    <h3 className="font-semibold text-slate-900">{subject.name}</h3>
                    <Badge size="sm">{subjectMaterials.length}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSubject(subject.id)}
                    className="text-amber-600"
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectMaterials.slice(0, 3).map((material) => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      onView={() => handleMaterialClick(material)}
                      onDownload={() => handleMaterialClick(material, true)}
                      isLoading={downloadingId === material.id}
                      formatFileSize={formatFileSize}
                      formatDuration={formatDuration}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Materials without subject */}
          {materialsBySubject['other']?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-slate-200 text-slate-600">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Other Materials</h3>
                <Badge size="sm">{materialsBySubject['other'].length}</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materialsBySubject['other'].map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onView={() => handleMaterialClick(material)}
                    onDownload={() => handleMaterialClick(material, true)}
                    isLoading={downloadingId === material.id}
                    formatFileSize={formatFileSize}
                    formatDuration={formatDuration}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// MATERIAL CARD COMPONENT
// ============================================

interface MaterialCardProps {
  material: Material;
  onView: () => void;
  onDownload?: () => void;
  isLoading?: boolean;
  formatFileSize: (bytes?: number) => string;
  formatDuration: (seconds?: number) => string;
}

function MaterialCard({ material, onView, onDownload, isLoading, formatFileSize, formatDuration }: MaterialCardProps) {
  const config = material.materialType ? materialTypeConfig[material.materialType] : null;

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            {typeIcons[material.type] || <File className="w-5 h-5 text-slate-500" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900 truncate">{material.title}</h3>

            {/* Subject & Class */}
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              {material.subjectName && (
                <span className="flex items-center gap-1">
                  {subjectIcons[material.subjectCode || ''] || null}
                  {material.subjectName}
                </span>
              )}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {config && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                  {config.label}
                </span>
              )}
              {material.fileSize && (
                <span className="text-xs text-slate-400">{formatFileSize(material.fileSize)}</span>
              )}
              {material.duration && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(material.duration)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {material.description && (
          <p className="text-sm text-slate-600 mt-3 line-clamp-2">{material.description}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          {material.type === 'video' ? (
            <Button size="sm" className="flex-1" leftIcon={<Play className="w-4 h-4" />} onClick={onView} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Watch'}
            </Button>
          ) : material.type === 'link' ? (
            <Button
              size="sm"
              className="flex-1"
              leftIcon={<ExternalLink className="w-4 h-4" />}
              onClick={onView}
            >
              Open Link
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" className="flex-1" leftIcon={<Eye className="w-4 h-4" />} onClick={onView} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'View'}
              </Button>
              {material.isDownloadable && (
                <Button size="sm" className="flex-1" leftIcon={<Download className="w-4 h-4" />} onClick={onDownload} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Download'}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Progress indicator */}
        {material.progressPercent !== undefined && material.progressPercent > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Progress</span>
              <span>{material.progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${material.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default StudyMaterialsPage;
