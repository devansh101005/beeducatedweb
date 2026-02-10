// Parent - My Children Page
// Shows parent's linked children with their key info

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Child {
  id: string;
  student_id: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
  class_grade?: string;
  school?: string;
  date_of_birth?: string;
  batches?: { id: string; name: string }[];
  courses?: { id: string; name: string }[];
}

export function MyChildrenPage() {
  const { getToken } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // First get parent profile to get parent ID
      const meRes = await fetch(`${API_URL}/v2/parents/me`, { headers });
      const meData = await meRes.json();

      if (!meData.success || !meData.data) {
        setLoading(false);
        return;
      }

      const pId = meData.data.id;
      setParentId(pId);

      // Get children
      const childRes = await fetch(`${API_URL}/v2/parents/${pId}/children`, { headers });
      const childData = await childRes.json();

      if (childData.success) {
        setChildren(childData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch children:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!parentId) {
    return (
      <div className="text-center py-20">
        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">Parent Profile Not Found</h2>
        <p className="text-slate-500 mt-2">Your parent profile has not been set up yet. Please contact the administration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Children</h1>
        <p className="text-slate-600 mt-1">View your children's profiles and academic information</p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-800">No Children Linked</h2>
          <p className="text-slate-500 mt-2">No student accounts have been linked to your profile yet.<br />Please contact the administration to link your child's account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {children.map((child) => (
            <div key={child.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  {child.user.avatar_url ? (
                    <img src={child.user.avatar_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-amber-200 flex items-center justify-center text-xl font-bold text-amber-700">
                      {child.user.first_name?.[0]}{child.user.last_name?.[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {child.user.first_name} {child.user.last_name}
                    </h3>
                    <p className="text-sm text-slate-500">Student ID: {child.student_id || '-'}</p>
                    {child.class_grade && (
                      <span className="inline-block mt-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Class {child.class_grade}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{child.user.email}</span>
                </div>
                {child.user.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{child.user.phone}</span>
                  </div>
                )}
                {child.school && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>{child.school}</span>
                  </div>
                )}
                {child.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{new Date(child.date_of_birth).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
