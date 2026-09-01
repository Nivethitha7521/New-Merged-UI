'use client';

import Link from 'next/link';
import { HiOutlineArrowRight, HiOutlineCreditCard } from 'react-icons/hi';
import { defaultModules } from '@/components/reports-layout/Sidebar';
import { usePreferences } from '@/components/preferences/PreferencesContext';

export default function PosHome() {
  const { resolvedThemeMode } = usePreferences();
  const dark = resolvedThemeMode === 'dark';
  const posModule = defaultModules.find((module) => module.id === 'pos');
  const reports = posModule?.children ?? [];

  return (
    <div className={`flex h-full min-h-0 w-full flex-col ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className={`shrink-0 border-b px-4 py-3 ${dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <HiOutlineCreditCard size={20} />
          </div>
          <div>
            <h1 className={`text-lg font-black ${dark ? 'text-white' : 'text-slate-950'}`}>POS Reports</h1>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Choose a POS report to continue</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <Link
              key={report.path}
              href={report.path}
              prefetch={false}
              className={`group flex items-center justify-between gap-3 rounded-xl border p-4 transition hover:-translate-y-0.5 ${
                dark
                  ? 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
              }`}
            >
              <span className="min-w-0 truncate text-sm font-bold">{report.label}</span>
              <HiOutlineArrowRight className="shrink-0 text-emerald-600 transition group-hover:translate-x-0.5" size={16} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
