// Student Study Materials Page
// Premium study materials library with organized categories

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  Card,
  Button,
  SearchInput,
  Select,
  EmptyState,
  Skeleton,
} from '@shared/components/ui';
import { Stagger, StaggerItem, fadeInUp } from '@shared/components/ui/motion';

// ============================================
// TYPES
// ============================================

interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'document' | 'image' | 'link' | 'audio';
  materialType?: 'lecture' | 'notes' | 'dpp' | 'dpp_solution' | 'ncert' | 'pyq';
  classId: string;
  className: string;
  subjectId?: string;
  subjectName?: string;
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

const API_URL = import.meta.env.VITE_API_URL || '/api';

const typeIcons: Record<string, React.ReactElement> = {
  pdf: <FileText className="w-5 h-5 text-rose-500" />,
  video: <Video className="w-5 h-5 text-sky-500" />,
  document: <File className="w-5 h-5 text-blue-500" />,
  image: <FileImage className="w-5 h-5 text-emerald-500" />,
  link: <ExternalLink className="w-5 h-5 text-amber-500" />,
  audio: <BookOpen className="w-5 h-5 text-violet-500" />,
};

const materialTypeLabels: Record<string, string> = {
  lecture: 'Lecture',
  notes: 'Notes',
  dpp: 'DPP',
  dpp_solution: 'DPP Solution',
  ncert: 'NCERT',
  pyq: 'PYQ',
};

const materialTypeColors: Record<string, string> = {
  lecture: 'bg-sky-100 text-sky-700',
  notes: 'bg-amber-100 text-amber-700',
  dpp: 'bg-violet-100 text-violet-700',
  dpp_solution: 'bg-emerald-100 text-emerald-700',
  ncert: 'bg-rose-100 text-rose-700',
  pyq: 'bg-blue-100 text-blue-700',
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get('classId') || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('all');

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      setError('');

      try {
        const token = await getToken();
        const params = new URLSearchParams();

        if (selectedClass !== 'all') params.append('classId', selectedClass);
        if (selectedType !== 'all') params.append('type', selectedType);
        if (selectedMaterialType !== 'all') params.append('materialType', selectedMaterialType);

        const response = await fetch(`${API_URL}/v2/student/materials?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.success) {
          setMaterials(data.data?.materials || []);
          setEnrolledClasses(data.data?.enrolledClasses || []);
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
  }, [selectedClass, selectedType, selectedMaterialType, getToken]);

  // Update URL when class filter changes
  useEffect(() => {
    if (selectedClass !== 'all') {
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

  const handleMaterialClick = (material: Material) => {
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
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

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, subject..."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-40"
              options={[
                { value: 'all', label: 'All Classes' },
                ...enrolledClasses.map((c) => ({ value: c.classId, label: c.className })),
              ]}
            />
            <Select
              value={selectedMaterialType}
              onChange={(e) => setSelectedMaterialType(e.target.value)}
              className="w-36"
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'lecture', label: 'Lectures' },
                { value: 'notes', label: 'Notes' },
                { value: 'dpp', label: 'DPP' },
                { value: 'dpp_solution', label: 'DPP Solutions' },
                { value: 'ncert', label: 'NCERT' },
                { value: 'pyq', label: 'PYQ' },
              ]}
            />
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-32"
              options={[
                { value: 'all', label: 'All' },
                { value: 'video', label: 'Videos' },
                { value: 'pdf', label: 'PDFs' },
                { value: 'document', label: 'Docs' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Enrolled Classes Summary */}
      {enrolledClasses.length > 0 && selectedClass === 'all' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {enrolledClasses.map((cls) => (
            <button
              key={cls.classId}
              onClick={() => setSelectedClass(cls.classId)}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
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
      ) : filteredMaterials.length === 0 ? (
        <EmptyState
          title={enrolledClasses.length === 0 ? 'No Active Enrollments' : 'No Materials Found'}
          description={
            enrolledClasses.length === 0
              ? 'You need to enroll in a class to access study materials.'
              : searchQuery
              ? 'Try adjusting your search or filters.'
              : 'Materials will appear here once your teacher uploads them.'
          }
          icon={<FolderOpen className="w-12 h-12" />}
          action={
            enrolledClasses.length === 0
              ? {
                  label: 'Browse Classes',
                  onClick: () => (window.location.href = '/courses'),
                  variant: 'primary' as const,
                }
              : undefined
          }
        />
      ) : (
        <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <StaggerItem key={material.id}>
              <MaterialCard
                material={material}
                onView={() => handleMaterialClick(material)}
                formatFileSize={formatFileSize}
                formatDuration={formatDuration}
              />
            </StaggerItem>
          ))}
        </Stagger>
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
  formatFileSize: (bytes?: number) => string;
  formatDuration: (seconds?: number) => string;
}

function MaterialCard({ material, onView, formatFileSize, formatDuration }: MaterialCardProps) {
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
              <span>{material.className}</span>
              {material.subjectName && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>{material.subjectName}</span>
                </>
              )}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {material.materialType && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    materialTypeColors[material.materialType] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {materialTypeLabels[material.materialType] || material.materialType}
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
            <Button size="sm" className="flex-1" leftIcon={<Play className="w-4 h-4" />} onClick={onView}>
              Watch
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
              <Button size="sm" variant="outline" className="flex-1" leftIcon={<Eye className="w-4 h-4" />} onClick={onView}>
                View
              </Button>
              {material.isDownloadable && (
                <Button size="sm" className="flex-1" leftIcon={<Download className="w-4 h-4" />} onClick={onView}>
                  Download
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
