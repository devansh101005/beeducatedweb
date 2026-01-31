// Content Management Page
// Admin interface for uploading and managing study materials

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Upload,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  File,
  FileText,
  Video,
  Image,
  Music,
  Link as LinkIcon,
  Download,
  Globe,
  Lock,
  MoreVertical,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  SearchInput,
  EmptyState,
  Spinner,
  Skeleton,
  Pagination,
  Input,
  Select,
} from '@shared/components/ui';
import { Stagger, StaggerItem, fadeInUp } from '@shared/components/ui/motion';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface Content {
  id: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'pdf' | 'document' | 'image' | 'audio' | 'link';
  material_type: 'lecture' | 'notes' | 'dpp' | 'dpp_solution' | 'ncert' | 'pyq' | null;
  course_id: string | null;
  class_id: string | null;
  subject_id: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  duration_seconds: number | null;
  thumbnail_path: string | null;
  is_free: boolean;
  is_downloadable: boolean;
  is_published: boolean;
  sequence_order: number;
  created_at: string;
  updated_at: string;
  // Hierarchy info
  class_name?: string;
  subject_name?: string;
  course_type_name?: string;
  courses?: {
    name: string;
  };
}

interface Course {
  id: string;
  name: string;
}

interface CourseType {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

interface AcademicClass {
  id: string;
  name: string;
  slug: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  color: string | null;
}

interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  subject: Subject | null;
}

interface MaterialTypeOption {
  value: string;
  label: string;
  description: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

const contentTypes = [
  { value: '', label: 'All Types' },
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'audio', label: 'Audio' },
  { value: 'link', label: 'External Link' },
];

// ============================================
// UPLOAD CONTENT MODAL
// ============================================

interface UploadModalProps {
  courses: Course[];
  onClose: () => void;
  onSuccess: () => void;
}

function UploadContentModal({ courses, onClose, onSuccess }: UploadModalProps) {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Basic content info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<string>('pdf');
  const [externalUrl, setExternalUrl] = useState('');

  // New hierarchy state
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClass[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialTypeOption[]>([]);

  const [selectedCourseType, setSelectedCourseType] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedMaterialType, setSelectedMaterialType] = useState('');

  // Loading states for cascading dropdowns
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Legacy course mapping (optional, for backward compatibility)
  const [courseId, setCourseId] = useState('');

  // Other options
  const [isFree, setIsFree] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  // Fetch course types and material types on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = await getToken();

        // Fetch course types
        const courseTypesRes = await fetch(`${API_URL}/v2/course-types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const courseTypesData = await courseTypesRes.json();
        if (courseTypesData.success) {
          setCourseTypes(courseTypesData.data || []);
        }

        // Fetch material types
        const materialTypesRes = await fetch(`${API_URL}/v2/course-types/material-types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const materialTypesData = await materialTypesRes.json();
        if (materialTypesData.success) {
          setMaterialTypes(materialTypesData.data || []);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };

    fetchInitialData();
  }, [getToken]);

  // Fetch classes when course type changes
  useEffect(() => {
    if (!selectedCourseType) {
      setAcademicClasses([]);
      setSelectedClass('');
      return;
    }

    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const token = await getToken();
        const courseType = courseTypes.find(ct => ct.id === selectedCourseType);
        if (!courseType) return;

        const res = await fetch(`${API_URL}/v2/course-types/${courseType.slug}/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setAcademicClasses(data.data?.classes || []);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
    setSelectedClass('');
    setSelectedSubject('');
  }, [selectedCourseType, courseTypes, getToken]);

  // Fetch subjects when class changes
  useEffect(() => {
    if (!selectedClass) {
      setClassSubjects([]);
      setSelectedSubject('');
      return;
    }

    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/v2/course-types/classes/${selectedClass}/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setClassSubjects(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
    setSelectedSubject('');
  }, [selectedClass, getToken]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill title from filename if empty
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
      // Auto-detect content type
      const mimeType = selectedFile.type;
      if (mimeType.startsWith('video/')) setContentType('video');
      else if (mimeType === 'application/pdf') setContentType('pdf');
      else if (mimeType.startsWith('image/')) setContentType('image');
      else if (mimeType.startsWith('audio/')) setContentType('audio');
      else setContentType('document');
    }
  };

  const handleUpload = async () => {
    if (!title) {
      setError('Title is required');
      return;
    }

    if (contentType === 'link' && !externalUrl) {
      setError('External URL is required for link type');
      return;
    }

    if (contentType !== 'link' && !file) {
      setError('Please select a file to upload');
      return;
    }

    // Validate new hierarchy (at least course type should be selected)
    if (!selectedCourseType) {
      setError('Please select a course type');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const token = await getToken();
      console.log('Starting upload with token:', token ? 'present' : 'missing');

      // Step 1: Create content record with new hierarchy fields
      console.log('Step 1: Creating content record...');
      const createRes = await fetch(`${API_URL}/v2/content`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          contentType,
          // New hierarchy fields
          classId: selectedClass || null,
          subjectId: selectedSubject || null,
          materialType: selectedMaterialType || null,
          // Legacy course mapping (optional)
          courseId: courseId || null,
          // Other options
          isFree,
          isDownloadable,
          isPublished,
          externalUrl: contentType === 'link' ? externalUrl : null,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        console.error('Step 1 failed:', createRes.status, data);
        throw new Error(data.message || 'Failed to create content');
      }

      const createData = await createRes.json();
      console.log('Step 1 success:', createData);
      const contentId = createData.data?.id;

      if (!contentId) {
        throw new Error('Content created but no ID returned');
      }

      setUploadProgress(30);

      // Step 2: Upload file if not a link
      if (contentType !== 'link' && file) {
        console.log('Step 2: Uploading file...', { fileName: file.name, fileSize: file.size, contentId });
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch(`${API_URL}/v2/content/${contentId}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          console.error('Step 2 failed:', uploadRes.status, data);
          throw new Error(data.message || 'Failed to upload file');
        }
        console.log('Step 2 success: File uploaded');

        setUploadProgress(100);
      } else {
        setUploadProgress(100);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Upload error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setError(err.message || 'Failed to upload content');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-slate-900">Upload Content</h2>
                <p className="text-sm text-slate-500">Add study material for students</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* File Upload Area */}
            {contentType !== 'link' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                  file ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept={contentType === 'video' ? 'video/*' : contentType === 'pdf' ? '.pdf' : contentType === 'image' ? 'image/*' : contentType === 'audio' ? 'audio/*' : '*'}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <File className="w-8 h-8 text-amber-600" />
                    <div className="text-left">
                      <p className="font-medium text-slate-900">{file.name}</p>
                      <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Click to select a file or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1">Max file size: 500MB</p>
                  </>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter content title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the content"
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-100 focus:border-amber-300 transition-all resize-none"
              />
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content Type</label>
              <Select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                options={contentTypes.filter(t => t.value !== '')}
              />
            </div>

            {/* External URL for links */}
            {contentType === 'link' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  External URL <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://example.com/resource"
                  leftIcon={<LinkIcon className="w-4 h-4" />}
                />
              </div>
            )}

            {/* Content Hierarchy Section */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
              <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Content Categorization
              </p>

              {/* Course Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Course Type <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={selectedCourseType}
                  onChange={(e) => setSelectedCourseType(e.target.value)}
                  options={[
                    { value: '', label: 'Select Course Type' },
                    ...courseTypes.map(ct => ({ value: ct.id, label: ct.name })),
                  ]}
                />
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={!selectedCourseType || loadingClasses}
                  options={[
                    { value: '', label: loadingClasses ? 'Loading...' : 'Select Class' },
                    ...academicClasses.map(c => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <Select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={!selectedClass || loadingSubjects}
                  options={[
                    { value: '', label: loadingSubjects ? 'Loading...' : 'Select Subject' },
                    ...classSubjects.map(cs => ({
                      value: cs.subject?.id || cs.subjectId,
                      label: cs.subject?.name || 'Unknown',
                    })),
                  ]}
                />
              </div>

              {/* Material Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Material Type</label>
                <Select
                  value={selectedMaterialType}
                  onChange={(e) => setSelectedMaterialType(e.target.value)}
                  options={[
                    { value: '', label: 'Select Material Type' },
                    ...materialTypes.map(mt => ({ value: mt.value, label: mt.label })),
                  ]}
                />
              </div>
            </div>

            {/* Legacy Course (for backward compatibility) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Legacy Course <span className="text-slate-400 text-xs">(Optional - for backward compatibility)</span>
              </label>
              <Select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                options={[
                  { value: '', label: 'No specific course' },
                  ...(Array.isArray(courses) ? courses.map(c => ({ value: c.id, label: c.name })) : []),
                ]}
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Free content</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDownloadable}
                  onChange={(e) => setIsDownloadable(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Downloadable</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Publish now</span>
              </label>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Uploading...</span>
                  <span className="text-amber-600 font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={uploading || !title || (contentType !== 'link' && !file)}
              leftIcon={uploading ? <Spinner size="sm" /> : <Upload className="w-4 h-4" />}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContentManagementPage() {
  const { getToken } = useAuth();

  // Data state
  const [content, setContent] = useState<Content[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');

  // Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch content
  const fetchContent = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (typeFilter) params.append('contentType', typeFilter);
      if (publishedFilter) params.append('isPublished', publishedFilter);

      const res = await fetch(`${API_URL}/v2/content?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        setContent(Array.isArray(data.data) ? data.data : []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch courses for dropdown
  const fetchCourses = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/courses?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCourses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    fetchContent();
    fetchCourses();
  }, [page, typeFilter, publishedFilter]);

  // Debounced search
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 1) {
        fetchContent();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleRefresh = () => {
    fetchContent(false);
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    fetchContent(false);
  };

  const handleTogglePublish = async (contentId: string, currentStatus: boolean) => {
    try {
      const token = await getToken();
      const endpoint = currentStatus ? 'unpublish' : 'publish';
      const res = await fetch(`${API_URL}/v2/content/${contentId}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchContent(false);
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/content/${contentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchContent(false);
      }
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'image': return <Image className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'link': return <LinkIcon className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      video: 'bg-purple-100 text-purple-700',
      pdf: 'bg-rose-100 text-rose-700',
      document: 'bg-sky-100 text-sky-700',
      image: 'bg-emerald-100 text-emerald-700',
      audio: 'bg-amber-100 text-amber-700',
      link: 'bg-slate-100 text-slate-700',
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-7 h-7 text-amber-600" />
            Content Management
          </h1>
          <p className="text-slate-500 mt-1">
            Upload and manage study materials for students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setShowUploadModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Upload Content
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            leftIcon={refreshing ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : totalItems}
                </p>
                <p className="text-xs text-slate-500">Total Content</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : (Array.isArray(content) ? content.filter(c => c.is_published).length : 0)}
                </p>
                <p className="text-xs text-slate-500">Published</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Video className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : (Array.isArray(content) ? content.filter(c => c.content_type === 'video').length : 0)}
                </p>
                <p className="text-xs text-slate-500">Videos</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : (Array.isArray(content) ? content.filter(c => c.content_type === 'pdf').length : 0)}
                </p>
                <p className="text-xs text-slate-500">PDFs</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
      </Stagger>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={contentTypes}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'true', label: 'Published' },
                { value: 'false', label: 'Draft' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Content List */}
      <Card noPadding>
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : !Array.isArray(content) || content.length === 0 ? (
          <EmptyState
            variant="inbox"
            title="No content found"
            description={search ? 'Try adjusting your search.' : 'Upload your first study material.'}
            icon={<FolderOpen className="w-12 h-12" />}
            action={
              !search ? {
                label: 'Upload Content',
                onClick: () => setShowUploadModal(true),
                variant: 'primary',
              } : undefined
            }
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {content.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={clsx(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      getTypeBadge(item.content_type)
                    )}>
                      {getTypeIcon(item.content_type)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                        {item.is_free && (
                          <Badge variant="success" size="sm">Free</Badge>
                        )}
                        {!item.is_published && (
                          <Badge variant="warning" size="sm">Draft</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="capitalize">{item.content_type}</span>
                        {item.courses?.name && (
                          <span>• {item.courses.name}</span>
                        )}
                        {item.file_size && (
                          <span>• {formatFileSize(item.file_size)}</span>
                        )}
                        {item.duration_seconds && (
                          <span>• {formatDuration(item.duration_seconds)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(item.id, item.is_published)}
                        title={item.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {item.is_published ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadContentModal
          courses={courses}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

export default ContentManagementPage;
