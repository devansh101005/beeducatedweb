// Student Study Materials Page
// Premium study materials library with organized categories

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Video,
  Download,
  Search,
  Filter,
  FolderOpen,
  BookOpen,
  FileImage,
  File,
  ExternalLink,
  Clock,
  Eye,
  ChevronRight,
  ChevronDown,
  Star,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  PageTransition,
  FadeIn,
  Stagger,
  StaggerItem,
  HoverScale,
} from '@shared/components/ui/motion';
import { Button, IconButton } from '@shared/components/ui/Button';
import { Card, CardBody, CardHeader } from '@shared/components/ui/Card';
import { SearchInput, Select } from '@shared/components/ui/Input';
import { Badge } from '@shared/components/ui/Badge';
import { SkeletonCard, InlineLoader } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';

interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'document' | 'image' | 'link';
  fileUrl: string;
  fileSize?: number;
  duration?: string; // for videos
  course: {
    id: string;
    name: string;
  };
  chapter?: string;
  topic?: string;
  isBookmarked: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  courseId: string;
  materialsCount: number;
  chapters: {
    name: string;
    materialsCount: number;
  }[];
}

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-danger-500" />,
  video: <Video className="w-5 h-5 text-primary-500" />,
  document: <File className="w-5 h-5 text-info-500" />,
  image: <FileImage className="w-5 h-5 text-success-500" />,
  link: <ExternalLink className="w-5 h-5 text-warning-500" />,
};

const typeLabels: Record<string, string> = {
  pdf: 'PDF',
  video: 'Video',
  document: 'Document',
  image: 'Image',
  link: 'Link',
};

export function StudyMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchMaterials();
    fetchCategories();
  }, [selectedCourse, selectedType, searchQuery, showBookmarked]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(selectedCourse !== 'all' && { courseId: selectedCourse }),
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(searchQuery && { search: searchQuery }),
        ...(showBookmarked && { bookmarked: 'true' }),
      });

      const response = await fetch(`/api/v2/student/materials?${params}`);
      const data = await response.json();
      if (data.success) {
        setMaterials(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v2/student/materials/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const toggleBookmark = async (materialId: string) => {
    try {
      const response = await fetch(`/api/v2/student/materials/${materialId}/bookmark`, {
        method: 'POST',
      });

      if (response.ok) {
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === materialId ? { ...m, isBookmarked: !m.isBookmarked } : m
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const trackDownload = async (materialId: string) => {
    try {
      await fetch(`/api/v2/student/materials/${materialId}/download`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to track download:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Study Materials</h1>
            <p className="text-neutral-600 mt-1">
              Access notes, videos, and resources for your courses
            </p>
          </div>
        </FadeIn>

        {/* Filters */}
        <FadeIn delay={0.1}>
          <Card>
            <CardBody className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Search materials by title or topic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-44"
                  >
                    <option value="all">All Courses</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.courseId}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-36"
                  >
                    <option value="all">All Types</option>
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                    <option value="link">Link</option>
                  </Select>
                  <Button
                    variant={showBookmarked ? 'primary' : 'outline'}
                    leftIcon={showBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    onClick={() => setShowBookmarked(!showBookmarked)}
                  >
                    Bookmarked
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </FadeIn>

        <div className="flex gap-6">
          {/* Sidebar - Categories */}
          <FadeIn delay={0.15} className="hidden lg:block w-72 flex-shrink-0">
            <Card className="sticky top-6">
              <CardHeader>
                <h3 className="font-semibold text-neutral-900">Categories</h3>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-neutral-100">
                  {categories.map((category) => (
                    <div key={category.id}>
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-primary-500" />
                          <span className="text-sm font-medium text-neutral-700">
                            {category.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">
                            {category.materialsCount}
                          </Badge>
                          <ChevronDown
                            className={`w-4 h-4 text-neutral-400 transition-transform ${
                              expandedCategories.includes(category.id) ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedCategories.includes(category.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-neutral-50"
                          >
                            {category.chapters.map((chapter, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSearchQuery(chapter.name)}
                                className="w-full pl-10 pr-4 py-2 text-left text-sm text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 transition-colors flex items-center justify-between"
                              >
                                <span className="truncate">{chapter.name}</span>
                                <span className="text-xs text-neutral-400">
                                  {chapter.materialsCount}
                                </span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </FadeIn>

          {/* Main Content - Materials */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : materials.length === 0 ? (
              <EmptyState
                title={showBookmarked ? 'No bookmarked materials' : 'No materials found'}
                description={
                  showBookmarked
                    ? 'Bookmark materials to access them quickly later'
                    : 'Try adjusting your search or filters'
                }
                icon={<FileText className="w-12 h-12" />}
              />
            ) : (
              <Stagger className="grid md:grid-cols-2 gap-4">
                {materials.map((material) => (
                  <StaggerItem key={material.id}>
                    <MaterialCard
                      material={material}
                      onBookmark={() => toggleBookmark(material.id)}
                      onDownload={() => trackDownload(material.id)}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// Material Card Component
function MaterialCard({
  material,
  onBookmark,
  onDownload,
}: {
  material: Material;
  onBookmark: () => void;
  onDownload: () => void;
}) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handleDownload = () => {
    onDownload();
    window.open(material.fileUrl, '_blank');
  };

  return (
    <HoverScale>
      <Card className="h-full">
        <CardBody className="p-4">
          <div className="flex gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0">
              {typeIcons[material.type]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-neutral-900 truncate">{material.title}</h3>
                  <p className="text-sm text-neutral-500 mt-0.5">{material.course.name}</p>
                </div>
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={onBookmark}
                  className={material.isBookmarked ? 'text-warning-500' : ''}
                >
                  {material.isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 fill-current" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </IconButton>
              </div>

              {material.description && (
                <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                  {material.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                <Badge variant={material.type === 'video' ? 'primary' : 'default'} className="text-xs">
                  {typeLabels[material.type]}
                </Badge>
                {material.fileSize && (
                  <span>{formatFileSize(material.fileSize)}</span>
                )}
                {material.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {material.duration}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {material.viewCount}
                </span>
              </div>

              {/* Chapter/Topic */}
              {(material.chapter || material.topic) && (
                <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                  {material.chapter && (
                    <span className="px-2 py-0.5 bg-neutral-100 rounded">
                      {material.chapter}
                    </span>
                  )}
                  {material.topic && (
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded">
                      {material.topic}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                {material.type === 'video' ? (
                  <Button
                    size="sm"
                    className="flex-1"
                    leftIcon={<Play className="w-4 h-4" />}
                    onClick={handleDownload}
                  >
                    Watch
                  </Button>
                ) : material.type === 'link' ? (
                  <Button
                    size="sm"
                    className="flex-1"
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                    onClick={handleDownload}
                  >
                    Open Link
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      leftIcon={<Eye className="w-4 h-4" />}
                      onClick={handleDownload}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      leftIcon={<Download className="w-4 h-4" />}
                      onClick={handleDownload}
                    >
                      Download
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </HoverScale>
  );
}
