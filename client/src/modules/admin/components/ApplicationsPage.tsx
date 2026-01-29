// Applications Management Page
// List and manage pending student/teacher applications

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  UserPlus,
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
} from '@shared/components/ui';
import { Stagger, StaggerItem, fadeInUp } from '@shared/components/ui/motion';
import { ApproveStudentModal } from './ApproveStudentModal';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  email_verified: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// MAIN COMPONENT
// ============================================

export function ApplicationsPage() {
  const { getToken } = useAuth();

  // Data state
  const [applications, setApplications] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState('');

  // Modal state
  const [selectedApplication, setSelectedApplication] = useState<User | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Fetch applications
  const fetchApplications = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const token = await getToken();
      const res = await fetch(
        `${API_URL}/v2/admin/applications/pending?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (data.success) {
        setApplications(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page]);

  const handleRefresh = () => {
    fetchApplications(false);
  };

  const handleApproveSuccess = () => {
    setSelectedApplication(null);
    fetchApplications(false);
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this application?')) {
      return;
    }

    setRejectingId(userId);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/admin/applications/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Application rejected by admin',
        }),
      });

      if (res.ok) {
        fetchApplications(false);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application');
    } finally {
      setRejectingId(null);
    }
  };

  // Filter applications by search
  const filteredApplications = search
    ? applications.filter((app) => {
        const name = [app.first_name, app.last_name].filter(Boolean).join(' ').toLowerCase();
        const email = app.email.toLowerCase();
        const searchLower = search.toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower);
      })
    : applications;

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
            <Users className="w-7 h-7 text-amber-600" />
            Applications
          </h1>
          <p className="text-slate-500 mt-1">
            Review and approve pending student applications
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          leftIcon={
            refreshing ? (
              <Spinner size="sm" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )
          }
        >
          Refresh
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {loading ? '--' : totalItems}
                </p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">--</p>
                <p className="text-xs text-slate-500">Approved Today</p>
              </div>
            </div>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">--</p>
                <p className="text-xs text-slate-500">Rejected</p>
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
              placeholder="Search by name or email..."
            />
          </div>
        </div>
      </Card>

      {/* Applications List */}
      <Card noPadding>
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <EmptyState
            variant="inbox"
            title="No pending applications"
            description="All applications have been reviewed."
            icon={<Users className="w-12 h-12" />}
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {filteredApplications.map((application, index) => {
                const fullName =
                  [application.first_name, application.last_name]
                    .filter(Boolean)
                    .join(' ') || 'Unknown';

                return (
                  <motion.div
                    key={application.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                        {fullName.charAt(0).toUpperCase()}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-900">{fullName}</p>
                          {application.email_verified && (
                            <Badge variant="success" size="sm" dot>
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {application.email}
                          </span>
                          {application.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {application.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(parseISO(application.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(application.id)}
                          disabled={rejectingId === application.id}
                          leftIcon={
                            rejectingId === application.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )
                          }
                          className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedApplication(application)}
                          leftIcon={<UserPlus className="w-4 h-4" />}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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

      {/* Approval Modal */}
      {selectedApplication && (
        <ApproveStudentModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onSuccess={handleApproveSuccess}
        />
      )}
    </div>
  );
}

export default ApplicationsPage;
