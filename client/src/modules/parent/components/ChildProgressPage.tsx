// Parent - Child Progress Page
// Shows academic progress of linked children (exam results, course progress)

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  TrendingUp,
  Trophy,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Child {
  id: string;
  student_id: string;
  user: { first_name: string; last_name: string; avatar_url?: string };
}

interface ExamResult {
  id: string;
  exam_id: string;
  exam_title: string;
  best_marks: number;
  best_percentage: number;
  total_marks: number;
  is_passed: boolean;
  attempts_count: number;
}

interface CourseProgress {
  course_id: string;
  course_name: string;
  progress_percent: number;
  status: string;
  enrolled_at: string;
}

export function ChildProgressPage() {
  const { getToken } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [childData, setChildData] = useState<Record<string, { exams: ExamResult[]; courses: CourseProgress[] }>>({});
  const [loadingChild, setLoadingChild] = useState<string | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const meRes = await fetch(`${API_URL}/v2/parents/me`, { headers });
      const meData = await meRes.json();
      if (!meData.success || !meData.data) { setLoading(false); return; }

      const childRes = await fetch(`${API_URL}/v2/parents/${meData.data.id}/children`, { headers });
      const childData = await childRes.json();
      if (childData.success) {
        const kids = childData.data || [];
        setChildren(kids);
        // Auto-expand first child
        if (kids.length > 0) {
          toggleChild(kids[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch children:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleChild = async (childId: string) => {
    if (expandedChild === childId) {
      setExpandedChild(null);
      return;
    }

    setExpandedChild(childId);

    // Fetch data if not cached
    if (childData[childId]) return;

    setLoadingChild(childId);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch courses and exam results for this student
      const [coursesRes, examsRes] = await Promise.all([
        fetch(`${API_URL}/v2/students/${childId}/courses`, { headers }).catch(() => null),
        fetch(`${API_URL}/v2/exams/student/${childId}/results`, { headers }).catch(() => null),
      ]);

      let courses: CourseProgress[] = [];
      let exams: ExamResult[] = [];

      if (coursesRes?.ok) {
        const data = await coursesRes.json();
        courses = (data.data || []).map((c: any) => ({
          course_id: c.course_id || c.id,
          course_name: c.course?.title || c.course_name || 'Course',
          progress_percent: c.progress_percent || 0,
          status: c.status || 'active',
          enrolled_at: c.enrolled_at || c.created_at,
        }));
      }

      if (examsRes?.ok) {
        const data = await examsRes.json();
        exams = (data.data || []).map((e: any) => ({
          id: e.id,
          exam_id: e.exam_id,
          exam_title: e.exam?.title || e.exam_title || 'Exam',
          best_marks: e.best_marks || 0,
          best_percentage: e.best_percentage || 0,
          total_marks: e.exam?.total_marks || e.total_marks || 100,
          is_passed: e.is_passed || false,
          attempts_count: e.attempts_count || 1,
        }));
      }

      setChildData((prev) => ({ ...prev, [childId]: { courses, exams } }));
    } catch (err) {
      console.error('Failed to fetch child data:', err);
    } finally {
      setLoadingChild(null);
    }
  };

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
        <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">No Children Linked</h2>
        <p className="text-slate-500 mt-2">Link your children's accounts to view their progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Academic Progress</h1>
        <p className="text-slate-600 mt-1">Track your children's learning progress and exam results</p>
      </div>

      <div className="space-y-4">
        {children.map((child) => {
          const isExpanded = expandedChild === child.id;
          const data = childData[child.id];
          const isLoading = loadingChild === child.id;

          return (
            <div key={child.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Child Header (clickable) */}
              <button
                onClick={() => toggleChild(child.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {child.user.avatar_url ? (
                    <img src={child.user.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center font-bold text-amber-700">
                      {child.user.first_name?.[0]}{child.user.last_name?.[0]}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{child.user.first_name} {child.user.last_name}</p>
                    <p className="text-xs text-slate-500">ID: {child.student_id}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : data ? (
                    <div className="p-5 space-y-6">
                      {/* Exam Results */}
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                          <Trophy className="w-4 h-4 text-amber-500" /> Exam Results
                        </h3>
                        {data.exams.length === 0 ? (
                          <p className="text-sm text-slate-400 pl-6">No exam results yet</p>
                        ) : (
                          <div className="space-y-2">
                            {data.exams.map((exam) => (
                              <div key={exam.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{exam.exam_title}</p>
                                  <p className="text-xs text-slate-500">{exam.attempts_count} attempt(s)</p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-bold ${exam.is_passed ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {Math.round(exam.best_percentage)}%
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {exam.best_marks}/{exam.total_marks}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Course Progress */}
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                          <BookOpen className="w-4 h-4 text-indigo-500" /> Course Progress
                        </h3>
                        {data.courses.length === 0 ? (
                          <p className="text-sm text-slate-400 pl-6">No course enrollments yet</p>
                        ) : (
                          <div className="space-y-2">
                            {data.courses.map((course) => (
                              <div key={course.course_id} className="p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-slate-900">{course.course_name}</p>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    course.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    course.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {course.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-amber-500 rounded-full transition-all"
                                      style={{ width: `${course.progress_percent}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-slate-600 w-10 text-right">
                                    {Math.round(course.progress_percent)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 text-center text-slate-400 text-sm">Failed to load data</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
