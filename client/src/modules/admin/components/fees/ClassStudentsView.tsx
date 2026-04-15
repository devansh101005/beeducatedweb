// Class Students View — list of students enrolled in a class with fee summary
// Reachable via /dashboard/fees/classes/:classId

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  Ban,
  AlertCircle,
  CreditCard,
  Banknote,
  ChevronRight,
  Users,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Card, Badge, Skeleton, EmptyState, Input } from '@shared/components/ui';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface StudentRow {
  enrollmentId: string;
  studentDbId: string;
  studentId: string;
  name: string;
  email: string;
  phone: string | null;
  classGrade: string | null;
  source: 'cashfree' | 'manual';
  status: string;
  registrationPaid: boolean;
  registrationPaidAt: string | null;
  enrolledAt: string | null;
  expiresAt: string | null;
  amountPaid: number;
  suspendedAt: string | null;
  suspensionReason: string | null;
}

interface ClassInfo {
  id: string;
  name: string;
  metadata: Record<string, any> | null;
}

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

export default function ClassStudentsView() {
  const { classId } = useParams<{ classId: string }>();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;

    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/v2/admin/fees/classes/${classId}/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Request failed (${res.status})`);
        }

        const data = await res.json();
        if (cancelled) return;
        setClassInfo(data.data?.class || null);
        setStudents(data.data?.students || []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || 'Failed to load students');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStudents();
    return () => {
      cancelled = true;
    };
  }, [classId, getToken]);

  // Client-side search filter (server also supports ?search= but client filter is instant)
  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.trim().toLowerCase();
    return students.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.studentId || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q)
    );
  }, [students, search]);

  const branch = classInfo?.metadata?.location as string | undefined;

  return (
    <div className="space-y-5">
      {/* Header / breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/dashboard/fees')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fee Management
        </button>
      </div>

      {/* Class header */}
      {classInfo && (
        <Card className="p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{classInfo.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                {branch && (
                  <span className="inline-flex items-center gap-1 capitalize">
                    <MapPin className="w-3.5 h-3.5" />
                    {branch}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {students.length} {students.length === 1 ? 'student' : 'students'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="max-w-md">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, student ID, or phone..."
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Could not load students</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title={search ? 'No matching students' : 'No students enrolled yet'}
          description={search ? `Nothing matches "${search}".` : 'Once students enroll, they will appear here.'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((s, idx) => (
            <motion.div
              key={s.enrollmentId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02, duration: 0.18 }}
            >
              <Link
                to={`/dashboard/fees/students/${s.studentDbId}`}
                className="block no-underline"
              >
                <Card className="p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                      {(s.name || '?').charAt(0).toUpperCase()}
                    </div>

                    {/* Identity */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 truncate">{s.name}</p>
                        <span className="text-xs font-mono text-slate-400">{s.studentId}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                          <Mail className="w-3 h-3" />
                          {s.email}
                        </span>
                        {s.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {s.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Source badge */}
                    <div className="hidden sm:flex">
                      <SourceBadge source={s.source} />
                    </div>

                    {/* Status badge */}
                    <div className="hidden md:flex">
                      <StatusBadge status={s.status} registrationPaid={s.registrationPaid} />
                    </div>

                    {/* Amount + expiry */}
                    <div className="hidden lg:flex flex-col items-end shrink-0">
                      <p className="text-sm font-semibold text-slate-900">{formatINR(s.amountPaid)}</p>
                      {s.expiresAt && (
                        <p className="text-xs text-slate-500 inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          exp {formatDate(s.expiresAt)}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {/* Mobile: badges below */}
                  <div className="flex sm:hidden gap-2 mt-3 flex-wrap">
                    <SourceBadge source={s.source} />
                    <StatusBadge status={s.status} registrationPaid={s.registrationPaid} />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: 'cashfree' | 'manual' }) {
  if (source === 'cashfree') {
    return (
      <Badge variant="info" size="sm">
        <CreditCard className="w-3 h-3 mr-1" />
        Cashfree
      </Badge>
    );
  }
  return (
    <Badge variant="default" size="sm">
      <Banknote className="w-3 h-3 mr-1" />
      Manual
    </Badge>
  );
}

function StatusBadge({ status, registrationPaid }: { status: string; registrationPaid: boolean }) {
  if (status === 'suspended') {
    return (
      <Badge variant="danger" size="sm">
        <Ban className="w-3 h-3 mr-1" />
        Suspended
      </Badge>
    );
  }
  if (status === 'active') {
    return (
      <Badge variant="success" size="sm">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  }
  if (status === 'expired') {
    return (
      <Badge variant="warning" size="sm">
        <Clock className="w-3 h-3 mr-1" />
        Expired
      </Badge>
    );
  }
  // pending
  return (
    <Badge variant="warning" size="sm">
      <Clock className="w-3 h-3 mr-1" />
      {registrationPaid ? 'Awaiting Tuition' : 'Pending'}
    </Badge>
  );
}
