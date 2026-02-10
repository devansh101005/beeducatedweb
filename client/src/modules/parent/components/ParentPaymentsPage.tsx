// Parent - Payments Page
// Shows fee and payment info for linked children

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Child {
  id: string;
  student_id: string;
  user: { first_name: string; last_name: string };
}

interface FeeSummary {
  totalFees: number;
  totalPaid: number;
  totalDue: number;
  pendingCount: number;
  overdueCount: number;
}

export function ParentPaymentsPage() {
  const { getToken } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [feeSummaries, setFeeSummaries] = useState<Record<string, FeeSummary>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Get parent
      const meRes = await fetch(`${API_URL}/v2/parents/me`, { headers });
      const meData = await meRes.json();
      if (!meData.success || !meData.data) { setLoading(false); return; }

      // Get children
      const childRes = await fetch(`${API_URL}/v2/parents/${meData.data.id}/children`, { headers });
      const childData = await childRes.json();
      if (!childData.success) { setLoading(false); return; }

      const kids: Child[] = childData.data || [];
      setChildren(kids);

      // Fetch fee summary for each child
      const summaries: Record<string, FeeSummary> = {};
      await Promise.all(
        kids.map(async (child) => {
          try {
            const feeRes = await fetch(`${API_URL}/v2/fees/students/${child.id}/dues`, { headers });
            const feeData = await feeRes.json();
            if (feeData.success && feeData.data) {
              const fees = feeData.data || [];
              const totalFees = fees.reduce((s: number, f: any) => s + Number(f.total_amount || 0), 0);
              const totalPaid = fees.reduce((s: number, f: any) => s + Number(f.amount_paid || 0), 0);
              const totalDue = fees.reduce((s: number, f: any) => s + Number(f.amount_due || 0), 0);
              summaries[child.id] = {
                totalFees, totalPaid, totalDue,
                pendingCount: fees.filter((f: any) => f.status === 'pending').length,
                overdueCount: fees.filter((f: any) => f.status === 'pending' && new Date(f.due_date) < new Date()).length,
              };
            }
          } catch { /* ignore */ }
        })
      );
      setFeeSummaries(summaries);
    } catch (err) {
      console.error('Failed to fetch payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt: number) =>
    `Rs ${amt.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-20">
        <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">No Children Linked</h2>
        <p className="text-slate-500 mt-2">Link your children's accounts to view payment information.</p>
      </div>
    );
  }

  // Aggregate totals
  const totalDueAll = Object.values(feeSummaries).reduce((s, f) => s + f.totalDue, 0);
  const totalPaidAll = Object.values(feeSummaries).reduce((s, f) => s + f.totalPaid, 0);
  const totalOverdueAll = Object.values(feeSummaries).reduce((s, f) => s + f.overdueCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-slate-600 mt-1">Fee and payment overview for your children</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Paid</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaidAll)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Due</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(totalDueAll)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Overdue</p>
              <p className="text-xl font-bold text-red-600">{totalOverdueAll} fee(s)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Child Breakdown */}
      <div className="space-y-4">
        {children.map((child) => {
          const summary = feeSummaries[child.id];
          return (
            <div key={child.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center font-bold text-amber-700">
                    {child.user.first_name?.[0]}{child.user.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{child.user.first_name} {child.user.last_name}</p>
                    <p className="text-xs text-slate-500">ID: {child.student_id}</p>
                  </div>
                </div>
              </div>

              {summary ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <p className="text-xs text-slate-500">Total Fees</p>
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(summary.totalFees)}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-center">
                    <p className="text-xs text-slate-500">Paid</p>
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(summary.totalPaid)}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl text-center">
                    <p className="text-xs text-slate-500">Due</p>
                    <p className="text-sm font-bold text-amber-600">{formatCurrency(summary.totalDue)}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl text-center">
                    <p className="text-xs text-slate-500">Overdue</p>
                    <p className="text-sm font-bold text-red-600">{summary.overdueCount}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 mt-3">No fee data available</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
