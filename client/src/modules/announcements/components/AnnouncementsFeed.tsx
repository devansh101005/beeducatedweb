// Announcements Feed
// Timeline-style announcement display

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  Calendar,
  User,
  Pin,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import {
  Card,
  Button,
  Badge,
  SearchInput,
  Select,
  Avatar,
  EmptyState,
  Spinner,
  Skeleton,
} from '@shared/components/ui';
import { fadeInUp, staggerItem } from '@shared/components/ui/motion';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'important' | 'urgent' | 'event' | 'academic';
  priority: 'low' | 'normal' | 'high' | 'critical';
  is_pinned: boolean;
  target_audience: string[];
  attachment_url?: string;
  expires_at?: string;
  created_at: string;
  created_by?: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// TYPE CONFIG
// ============================================

const typeConfig: Record<string, { label: string; icon: typeof Megaphone; color: string; bgColor: string }> = {
  general: { label: 'General', icon: Megaphone, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  important: { label: 'Important', icon: Bell, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  urgent: { label: 'Urgent', icon: AlertTriangle, color: 'text-rose-600', bgColor: 'bg-rose-100' },
  event: { label: 'Event', icon: Calendar, color: 'text-sky-600', bgColor: 'bg-sky-100' },
  academic: { label: 'Academic', icon: Info, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
};

const priorityColors: Record<string, string> = {
  low: 'border-l-slate-300',
  normal: 'border-l-sky-400',
  high: 'border-l-amber-400',
  critical: 'border-l-rose-500',
};

// ============================================
// ANNOUNCEMENT CARD
// ============================================

interface AnnouncementCardProps {
  announcement: Announcement;
  index: number;
}

function AnnouncementCard({ announcement, index }: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[announcement.type] || typeConfig.general;
  const TypeIcon = config.icon;

  const isLong = announcement.content.length > 200;
  const displayContent = expanded || !isLong
    ? announcement.content
    : announcement.content.slice(0, 200) + '...';

  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={clsx(
          'p-0 overflow-hidden border-l-4',
          priorityColors[announcement.priority] || priorityColors.normal,
          announcement.is_pinned && 'ring-1 ring-amber-200'
        )}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              config.bgColor
            )}>
              <TypeIcon className={clsx('w-5 h-5', config.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {announcement.is_pinned && (
                      <Pin className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <h3 className="font-medium text-slate-900">
                      {announcement.title}
                    </h3>
                    <Badge variant={
                      announcement.priority === 'critical' ? 'danger' :
                      announcement.priority === 'high' ? 'warning' :
                      'default'
                    } size="sm">
                      {config.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    {announcement.created_by && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {announcement.created_by.first_name} {announcement.created_by.last_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(parseISO(announcement.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="mt-3">
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {displayContent}
                </p>

                {isLong && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 mt-2 text-sm font-medium text-amber-600 hover:text-amber-700"
                  >
                    {expanded ? (
                      <>Show less <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>Read more <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>

              {/* Footer */}
              {announcement.attachment_url && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <a
                    href={announcement.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Attachment
                  </a>
                </div>
              )}

              {/* Target Audience */}
              {announcement.target_audience && announcement.target_audience.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {announcement.target_audience.map((audience, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full capitalize"
                    >
                      {audience.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AnnouncementsFeed() {
  const { getToken } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');

  // Fetch announcements
  const fetchAnnouncements = async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        ...(type && { type }),
        ...(priority && { priority }),
      });

      const response = await fetch(`${API_URL}/v2/announcements?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const items = data.data.items || [];

        if (append) {
          setAnnouncements(prev => [...prev, ...items]);
        } else {
          setAnnouncements(items);
        }

        setHasMore(items.length === 10);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(1);
  }, [type, priority]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAnnouncements(nextPage, true);
  };

  // Separate pinned and regular announcements
  const pinnedAnnouncements = announcements.filter(a => a.is_pinned);
  const regularAnnouncements = announcements.filter(a => !a.is_pinned);

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
          <h1 className="text-2xl font-heading font-semibold text-slate-900">
            Announcements
          </h1>
          <p className="text-slate-500">Stay updated with the latest news and updates</p>
        </div>
      </motion.div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 max-w-sm">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search announcements..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: '', label: 'All Types' },
                { value: 'general', label: 'General' },
                { value: 'important', label: 'Important' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'event', label: 'Event' },
                { value: 'academic', label: 'Academic' },
              ]}
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-36"
            />
            <Select
              options={[
                { value: '', label: 'All Priority' },
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'normal', label: 'Normal' },
                { value: 'low', label: 'Low' },
              ]}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-36"
            />
          </div>
        </div>
      </Card>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          variant="inbox"
          title="No announcements"
          description="There are no announcements at the moment. Check back later."
        />
      ) : (
        <div className="space-y-4">
          {/* Pinned Announcements */}
          {pinnedAnnouncements.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Pin className="w-4 h-4" />
                Pinned
              </h2>
              {pinnedAnnouncements.map((announcement, index) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  index={index}
                />
              ))}
            </div>
          )}

          {/* Regular Announcements */}
          {regularAnnouncements.length > 0 && (
            <div className="space-y-4">
              {pinnedAnnouncements.length > 0 && (
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Recent
                </h2>
              )}
              {regularAnnouncements.map((announcement, index) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  index={index}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                isLoading={loadingMore}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AnnouncementsFeed;
