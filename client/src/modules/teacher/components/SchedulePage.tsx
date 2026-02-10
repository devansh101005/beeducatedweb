// Teacher Schedule Page
// Shows weekly class schedule derived from batch schedules

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface BatchSchedule {
  id: string;
  name: string;
  code: string;
  batch_type: string;
  schedule: Record<string, string[]> | null; // { "Monday": ["10:00-12:00"], ... }
  studentCount: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const batchTypeColors: Record<string, string> = {
  coaching_offline: 'bg-blue-100 text-blue-700 border-blue-200',
  coaching_online: 'bg-purple-100 text-purple-700 border-purple-200',
  test_series: 'bg-amber-100 text-amber-700 border-amber-200',
  home_tuition: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

interface ScheduleSlot {
  batchId: string;
  batchName: string;
  batchCode: string;
  batchType: string;
  time: string;
  startTime: string;
  endTime: string;
  studentCount: number;
}

export function SchedulePage() {
  const { getToken } = useAuth();
  const [batches, setBatches] = useState<BatchSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    // Convert Sunday=0 to our Monday=0 index
    return today === 0 ? 6 : today - 1;
  });

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/v2/teacher/batches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBatches(
          (data.data || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            code: b.code,
            batch_type: b.batch_type || '',
            schedule: b.schedule,
            studentCount: b.studentCount || b.student_count || 0,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build schedule map: day -> slots (sorted by time)
  const scheduleByDay = useMemo(() => {
    const map: Record<string, ScheduleSlot[]> = {};
    DAYS.forEach((d) => (map[d] = []));

    batches.forEach((batch) => {
      if (!batch.schedule) return;
      Object.entries(batch.schedule).forEach(([day, times]) => {
        if (!map[day]) return;
        (times || []).forEach((timeSlot) => {
          const [start, end] = timeSlot.split('-').map((t) => t.trim());
          map[day].push({
            batchId: batch.id,
            batchName: batch.name,
            batchCode: batch.code,
            batchType: batch.batch_type,
            time: timeSlot,
            startTime: start || '',
            endTime: end || '',
            studentCount: batch.studentCount,
          });
        });
      });
    });

    // Sort each day by start time
    Object.values(map).forEach((slots) =>
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
    );
    return map;
  }, [batches]);

  const todayIndex = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  })();

  const totalClassesToday = scheduleByDay[DAYS[todayIndex]]?.length || 0;
  const totalClasses = Object.values(scheduleByDay).reduce((sum, s) => sum + s.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Class Schedule</h1>
        <p className="text-slate-600 mt-1">Your weekly teaching schedule</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Today's Classes</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalClassesToday}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Weekly Classes</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalClasses}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Active Batches</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{batches.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Students</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {batches.reduce((s, b) => s + b.studentCount, 0)}
          </p>
        </div>
      </div>

      {/* Day Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-slate-900">{DAYS[selectedDay]}</h2>
            {selectedDay === todayIndex && (
              <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Today</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedDay((p) => (p === 0 ? 6 : p - 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDay((p) => (p === 6 ? 0 : p + 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div className="px-4 py-3 border-b border-slate-100 flex gap-1 overflow-x-auto">
          {DAYS.map((day, idx) => {
            const count = scheduleByDay[day]?.length || 0;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(idx)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  idx === selectedDay
                    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                    : idx === todayIndex
                    ? 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span>{DAY_SHORT[idx]}</span>
                {count > 0 && (
                  <span className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    idx === selectedDay ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Schedule Slots */}
        <div className="p-4">
          {scheduleByDay[DAYS[selectedDay]]?.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No classes on {DAYS[selectedDay]}</p>
              <p className="text-sm text-slate-400 mt-1">Enjoy your free day!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduleByDay[DAYS[selectedDay]].map((slot, idx) => (
                <div
                  key={`${slot.batchId}-${idx}`}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors hover:shadow-sm ${
                    batchTypeColors[slot.batchType] || 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Clock className="w-4 h-4 opacity-60" />
                    <span className="font-mono text-sm font-semibold">{slot.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{slot.batchName}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs opacity-75">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> {slot.batchCode}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {slot.studentCount} students
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
