// Admin Reports Page
// Generate and view reports: student performance, batch, course, enrollment, exam

import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Download,
  FileText,
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

type ReportType = 'student-performance' | 'batch' | 'course' | 'enrollment' | 'summary';

interface ReportConfig {
  key: ReportType;
  label: string;
  description: string;
  icon: typeof TrendingUp;
  color: string;
  endpoint: string;
  method: 'GET' | 'POST';
}

const reports: ReportConfig[] = [
  {
    key: 'summary',
    label: 'Quick Summary',
    description: 'Overview of students, batches, courses, and finances',
    icon: TrendingUp,
    color: 'bg-amber-100 text-amber-600',
    endpoint: '/v2/reports/quick/summary',
    method: 'GET',
  },
  {
    key: 'student-performance',
    label: 'Student Performance',
    description: 'Detailed performance metrics across batches and courses',
    icon: GraduationCap,
    color: 'bg-blue-100 text-blue-600',
    endpoint: '/v2/reports/student-performance',
    method: 'POST',
  },
  {
    key: 'batch',
    label: 'Batch Report',
    description: 'Batch-wise student count, performance, and enrollment data',
    icon: BookOpen,
    color: 'bg-purple-100 text-purple-600',
    endpoint: '/v2/reports/batch',
    method: 'POST',
  },
  {
    key: 'enrollment',
    label: 'Enrollment Report',
    description: 'Enrollment trends, status breakdown, and revenue data',
    icon: Users,
    color: 'bg-emerald-100 text-emerald-600',
    endpoint: '/v2/reports/enrollment',
    method: 'POST',
  },
];

export function ReportsPage() {
  const { getToken } = useAuth();
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async (config: ReportConfig) => {
    setActiveReport(config.key);
    setLoading(true);
    setError('');
    setReportData(null);

    try {
      const token = await getToken();
      const options: RequestInit = {
        method: config.method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      if (config.method === 'POST') {
        options.body = JSON.stringify({});
      }

      const res = await fetch(`${API_URL}${config.endpoint}`, options);
      const data = await res.json();

      if (data.success) {
        setReportData(data.data);
      } else {
        setError(data.message || 'Failed to generate report');
      }
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async (config: ReportConfig) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}${config.endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: 'csv' }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.key}-report.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-600 mt-1">Generate and download detailed reports</p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((config) => {
          const Icon = config.icon;
          const isActive = activeReport === config.key;
          return (
            <div
              key={config.key}
              className={`bg-white rounded-2xl border transition-all ${
                isActive ? 'border-amber-300 shadow-lg shadow-amber-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {config.method === 'POST' && (
                    <button
                      onClick={() => downloadCSV(config)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Download CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900">{config.label}</h3>
                <p className="text-sm text-slate-500 mt-1">{config.description}</p>
                <button
                  onClick={() => generateReport(config)}
                  disabled={loading && isActive}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading && isActive ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><FileText className="w-4 h-4" /> Generate Report</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Results */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-5 py-4 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {reportData && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-slate-900">
              {reports.find((r) => r.key === activeReport)?.label} Results
            </h2>
          </div>

          {activeReport === 'summary' ? (
            <SummaryView data={reportData} />
          ) : (
            <GenericReportView data={reportData} />
          )}
        </div>
      )}
    </div>
  );
}

function SummaryView({ data }: { data: any }) {
  const summary = data?.summary || data;

  const cards = [
    { label: 'Total Students', value: summary.totalStudents ?? summary.total_students ?? '-' },
    { label: 'Active Students', value: summary.activeStudents ?? summary.active_students ?? '-' },
    { label: 'Total Batches', value: summary.totalBatches ?? summary.total_batches ?? '-' },
    { label: 'Active Batches', value: summary.activeBatches ?? summary.active_batches ?? '-' },
    { label: 'Total Courses', value: summary.totalCourses ?? summary.total_courses ?? '-' },
    { label: 'Total Revenue', value: summary.totalRevenue ?? summary.total_revenue ? `Rs ${Number(summary.totalRevenue ?? summary.total_revenue).toLocaleString('en-IN')}` : '-' },
    { label: 'Pending Fees', value: summary.totalPending ?? summary.pending_amount ? `Rs ${Number(summary.totalPending ?? summary.pending_amount).toLocaleString('en-IN')}` : '-' },
    { label: 'Total Exams', value: summary.totalExams ?? summary.total_exams ?? '-' },
  ];

  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="p-4 bg-slate-50 rounded-xl text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">{card.label}</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function GenericReportView({ data }: { data: any }) {
  const report = data?.report || data;

  // Render as key-value pairs for objects, or table for arrays
  if (Array.isArray(report)) {
    if (report.length === 0) {
      return <div className="p-6 text-center text-slate-500">No data available</div>;
    }

    const keys = Object.keys(report[0]).filter(
      (k) => typeof report[0][k] !== 'object' || report[0][k] === null
    );

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              {keys.map((key) => (
                <th key={key} className="px-4 py-3 text-left font-medium text-slate-600 capitalize whitespace-nowrap">
                  {key.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.slice(0, 50).map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50">
                {keys.map((key) => (
                  <td key={key} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {row[key] === null || row[key] === undefined ? '-' : String(row[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {report.length > 50 && (
          <div className="px-4 py-3 text-sm text-slate-500 bg-slate-50">
            Showing 50 of {report.length} rows
          </div>
        )}
      </div>
    );
  }

  // Object view
  if (report && typeof report === 'object') {
    const entries = Object.entries(report).filter(([, v]) => typeof v !== 'object');
    return (
      <div className="p-6 space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm text-slate-600 capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="text-sm font-medium text-slate-900">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <div className="p-6 text-center text-slate-500">Report generated successfully</div>;
}
