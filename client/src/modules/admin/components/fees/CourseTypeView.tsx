// Course Type View — lists classes for a course type with fee aggregates
// Used by both Offline Batch and Home Tuition tabs.

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Users,
  IndianRupee,
  AlertCircle,
  MapPin,
  CheckCircle,
  Clock,
  Ban,
} from 'lucide-react';
import { Card, EmptyState, Skeleton, Badge } from '@shared/components/ui';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ClassRow {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  totalStudents: number;
  activeStudents: number;
  pendingStudents: number;
  suspendedStudents: number;
  totalCollected: number;
}

interface Props {
  courseTypeSlug: string;
  showBranchFilter: boolean;
}

const BRANCHES = [
  { value: '', label: 'All Branches' },
  { value: 'lalganj', label: 'Lalganj' },
  { value: 'pratapgarh', label: 'Pratapgarh' },
  { value: 'prayagraj', label: 'Prayagraj' },
];

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function CourseTypeView({ courseTypeSlug, showBranchFilter }: Props) {
  const { getToken } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branch, setBranch] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const fetchClasses = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const params = new URLSearchParams({ courseType: courseTypeSlug });
        if (branch) params.set('branch', branch);

        const res = await fetch(`${API_URL}/v2/admin/fees/classes?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Request failed (${res.status})`);
        }

        const data = await res.json();
        if (cancelled) return;
        setClasses(data.data?.classes || []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || 'Failed to load classes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchClasses();
    return () => {
      cancelled = true;
    };
  }, [courseTypeSlug, branch, getToken]);

  // Aggregate top-line stats
  const totals = useMemo(() => {
    return classes.reduce(
      (acc, c) => {
        acc.students += c.totalStudents;
        acc.collected += c.totalCollected;
        acc.classes += 1;
        return acc;
      },
      { students: 0, collected: 0, classes: 0 }
    );
  }, [classes]);

  return (
    <div className="space-y-5">
      {/* Branch filter (Home Tuition only) */}
      {showBranchFilter && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600 mr-1">Branch:</span>
          {BRANCHES.map(b => (
            <button
              key={b.value || 'all'}
              onClick={() => setBranch(b.value)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                branch === b.value
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {/* Top-line stats */}
      {!loading && !error && classes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<Users className="w-4 h-4" />} label="Classes" value={totals.classes.toString()} accent="blue" />
          <StatCard icon={<Users className="w-4 h-4" />} label="Total Students" value={totals.students.toString()} accent="indigo" />
          <StatCard icon={<IndianRupee className="w-4 h-4" />} label="Total Collected" value={formatINR(totals.collected)} accent="emerald" />
        </div>
      )}

      {/* Class grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Could not load classes</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title="No classes found"
          description={
            showBranchFilter && branch
              ? `No classes for ${BRANCHES.find(b => b.value === branch)?.label || branch}.`
              : 'There are no active classes for this course type yet.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
            >
              <Link
                to={`/dashboard/fees/classes/${c.id}`}
                className="block h-full no-underline"
              >
                <Card className="h-full p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{c.name}</h3>
                      {c.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 capitalize">
                          <MapPin className="w-3 h-3" />
                          {c.location}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Students
                      </span>
                      <span className="font-semibold text-slate-900">{c.totalStudents}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5" />
                        Collected
                      </span>
                      <span className="font-semibold text-emerald-700">{formatINR(c.totalCollected)}</span>
                    </div>
                  </div>

                  {/* Status pills */}
                  {(c.activeStudents > 0 || c.pendingStudents > 0 || c.suspendedStudents > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                      {c.activeStudents > 0 && (
                        <Badge variant="success" size="sm">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {c.activeStudents} active
                        </Badge>
                      )}
                      {c.pendingStudents > 0 && (
                        <Badge variant="warning" size="sm">
                          <Clock className="w-3 h-3 mr-1" />
                          {c.pendingStudents} pending
                        </Badge>
                      )}
                      {c.suspendedStudents > 0 && (
                        <Badge variant="danger" size="sm">
                          <Ban className="w-3 h-3 mr-1" />
                          {c.suspendedStudents} suspended
                        </Badge>
                      )}
                    </div>
                  )}
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: 'blue' | 'indigo' | 'emerald';
}) {
  const accents = {
    blue: 'from-blue-500 to-blue-700',
    indigo: 'from-indigo-500 to-indigo-700',
    emerald: 'from-emerald-500 to-emerald-700',
  } as const;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={clsx('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white', accents[accent])}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
        </div>
      </div>
    </Card>
  );
}
