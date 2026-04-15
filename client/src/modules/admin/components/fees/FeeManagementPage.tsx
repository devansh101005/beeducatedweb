// Fee Management — top-level admin page
// Two tabs: Offline Batch (single branch) and Home Tuition (multi-branch)

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Home, Receipt } from 'lucide-react';
import clsx from 'clsx';
import CourseTypeView from './CourseTypeView';

type TabKey = 'offline_batch' | 'home_tuition';

const tabs: Array<{ key: TabKey; label: string; courseTypeSlug: string; showBranchFilter: boolean; icon: React.ComponentType<{ className?: string }> }> = [
  {
    key: 'offline_batch',
    label: 'Offline Batch',
    courseTypeSlug: 'coaching_offline',
    showBranchFilter: false,
    icon: GraduationCap,
  },
  {
    key: 'home_tuition',
    label: 'Home Tuition',
    courseTypeSlug: 'home_tuition',
    showBranchFilter: true,
    icon: Home,
  },
];

export default function FeeManagementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('offline_batch');
  const current = tabs.find(t => t.key === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Management</h1>
          <p className="text-sm text-slate-500">Browse classes, students, and fee status</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  'relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors',
                  isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="fee-tab-underline"
                    className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-700"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <CourseTypeView
        key={current.key}
        courseTypeSlug={current.courseTypeSlug}
        showBranchFilter={current.showBranchFilter}
      />
    </div>
  );
}
