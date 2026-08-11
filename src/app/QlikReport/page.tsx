'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  HiOutlineShoppingCart,
  HiOutlineCreditCard,
  HiOutlineChartBar,
  HiOutlineArrowRight,
  HiOutlineDocumentReport,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineTrendingUp,
  HiOutlineClipboardList,
  HiOutlineCash,
  HiOutlineRefresh,
  HiOutlineTruck,
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineCollection,
} from 'react-icons/hi';

import { usePreferences } from '@/components/preferences/PreferencesContext';
import { RootState } from '@/redux/store';

/**
 * Real report counts, derived from the actual folders under
 * src/app/QlikReport/PurchaseOrder and src/app/QlikReport/Pos.
 * Update these if report folders are added/removed.
 */
const PURCHASE_REPORT_COUNT = 12;
const POS_REPORT_COUNT = 14;

type IconType = React.ComponentType<{
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}>;

interface ModuleItem {
  href: string;
  icon: IconType;
  label: string;
  value: string;
  desc: string;
  color: string;
}

interface QuickReportItem {
  label: string;
  path: string;
  color: string;
  icon: IconType;
  desc: string;
}

interface FlowItem {
  label: string;
  color: string;
  icon: IconType;
}

interface StatCard {
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: IconType;
}

function useGreeting() {
  return useMemo(() => {
    const h = new Date().getHours();

    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';

    return 'Good evening';
  }, []);
}

const MODULES: ModuleItem[] = [
  {
    href: '/QlikReport/PurchaseOrder',
    icon: HiOutlineShoppingCart,
    label: 'Purchase',
    value: 'PO',
    desc: 'Purchase orders and supplier reports',
    color: '#2563eb',
  },
  {
    href: '/QlikReport/Pos',
    icon: HiOutlineCreditCard,
    label: 'POS',
    value: 'Sales',
    desc: 'Billing, sales and payment reports',
    color: '#059669',
  },
];

const QUICK_REPORTS: QuickReportItem[] = [
  {
    label: 'Purchase Order',
    path: '/QlikReport/PurchaseOrder/Purchaseorder',
    color: '#2563eb',
    icon: HiOutlineClipboardList,
    desc: 'Purchase orders',
  },
  {
    label: 'Outstanding',
    path: '/QlikReport/PurchaseOrder/Outstanding',
    color: '#2563eb',
    icon: HiOutlineCash,
    desc: 'Supplier payments',
  },
  {
    label: 'RM Dispatch',
    path: '/QlikReport/PurchaseOrder/rawmaterial2',
    color: '#2563eb',
    icon: HiOutlineTruck,
    desc: 'Material dispatch',
  },
  {
    label: 'Overall Sales',
    path: '/QlikReport/Pos/SalasReport',
    color: '#059669',
    icon: HiOutlineTrendingUp,
    desc: 'Sales summary',
  },
  {
    label: 'Item Order',
    path: '/QlikReport/Pos/ItemOrder',
    color: '#059669',
    icon: HiOutlineViewGrid,
    desc: 'Item sales',
  },
  {
    label: 'Sales Order',
    path: '/QlikReport/Pos/saleOrder',
    color: '#059669',
    icon: HiOutlineClipboardList,
    desc: 'Order details',
  },
];

const FLOW_ITEMS: FlowItem[] = [
  { label: 'Purchase', color: '#2563eb', icon: HiOutlineShoppingCart },
  { label: 'GRN', color: '#2563eb', icon: HiOutlineCube },
  { label: 'AP Invoice', color: '#2563eb', icon: HiOutlineDocumentReport },
  { label: 'Outstanding', color: '#2563eb', icon: HiOutlineCash },
  { label: 'Debit', color: '#7c3aed', icon: HiOutlineClipboardList },
  { label: 'Production', color: '#7c3aed', icon: HiOutlineSparkles },
  { label: 'Dispatch', color: '#7c3aed', icon: HiOutlineTruck },
  { label: 'Sales', color: '#059669', icon: HiOutlineTrendingUp },
  { label: 'Sales Return', color: '#059669', icon: HiOutlineRefresh },
  { label: 'Waste', color: '#f97316', icon: HiOutlineTrash },
  { label: 'Warehouse Return', color: '#f97316', icon: HiOutlineRefresh },
  { label: 'Stock Close', color: '#059669', icon: HiOutlineCube },
  { label: 'Day End', color: '#f59e0b', icon: HiOutlineSun },
  { label: 'Overall Sales', color: '#059669', icon: HiOutlineTrendingUp },
];

const STAT_CARDS: StatCard[] = [
  {
    label: 'Active Modules',
    value: String(MODULES.length),
    sub: 'Purchase + POS',
    color: '#2563eb',
    icon: HiOutlineViewGrid,
  },
  {
    label: 'Quick Reports',
    value: String(QUICK_REPORTS.length),
    sub: 'Ready access',
    color: '#059669',
    icon: HiOutlineDocumentReport,
  },
  {
    label: 'ERP Flow',
    value: String(FLOW_ITEMS.length),
    sub: 'Mapped steps',
    color: '#7c3aed',
    icon: HiOutlineSparkles,
  },
  {
    label: 'Total Reports',
    value: String(PURCHASE_REPORT_COUNT + POS_REPORT_COUNT),
    sub: 'Across all modules',
    color: '#f97316',
    icon: HiOutlineCollection,
  },
];

function ModuleCard({
  href,
  icon: Icon,
  label,
  value,
  desc,
  color,
  dark,
}: ModuleItem & { dark: boolean }) {
  const card = (
    <div
      className={`group flex h-full min-h-[102px] flex-col rounded-2xl border p-[clamp(10px,1vw,14px)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        dark
          ? 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className="flex size-[clamp(40px,3.4vw,50px)] shrink-0 items-center justify-center rounded-2xl border"
          style={{
            background: `${color}12`,
            borderColor: `${color}22`,
          }}
        >
          <Icon size={21} style={{ color }} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-[clamp(12px,0.95vw,14px)] font-black ${
              dark ? 'text-slate-200' : 'text-slate-900'
            }`}
          >
            {label}
          </p>

          <h3
            className="truncate text-[clamp(19px,2vw,27px)] font-black leading-tight"
            style={{ color }}
          >
            {value}
          </h3>

          <p
            className={`mt-1 line-clamp-2 text-[clamp(10px,0.8vw,12px)] leading-4 ${
              dark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {desc}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-2">
        <div className="inline-flex items-center gap-1 text-[11px] font-black" style={{ color }}>
          Open module
          <HiOutlineArrowRight size={13} />
        </div>
      </div>
    </div>
  );

  return (
    <Link href={href} prefetch={false} className="block h-full min-h-0">
      {card}
    </Link>
  );
}

function QuickReportCard({
  item,
  dark,
}: {
  item: QuickReportItem;
  dark: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.path}
      prefetch={false}
      className={`group flex min-h-0 min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 transition-all duration-200 ${
        dark
          ? 'border-slate-800 bg-slate-950/20 text-slate-300 hover:bg-slate-800'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-xl border"
        style={{
          background: `${item.color}12`,
          borderColor: `${item.color}22`,
        }}
      >
        <Icon size={15} style={{ color: item.color }} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[12px] font-black ${
            dark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {item.label}
        </p>

        <p className={`truncate text-[10px] ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
          {item.desc}
        </p>
      </div>

      <HiOutlineArrowRight
        size={14}
        className="shrink-0 text-blue-600 transition group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function FlowPill({
  item,
  index,
  dark,
}: {
  item: FlowItem;
  index: number;
  dark: boolean;
}) {
  const Icon = item.icon;

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div
        className={`flex h-10 min-w-0 items-center gap-1.5 rounded-xl border px-2.5 ${
          dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
        }`}
      >
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${item.color}12` }}
        >
          <Icon size={13} style={{ color: item.color }} />
        </div>

        <span
          className={`max-w-[116px] truncate text-[11px] font-black ${
            dark ? 'text-slate-100' : 'text-slate-900'
          }`}
          title={item.label}
        >
          {item.label}
        </span>
      </div>

      {index < FLOW_ITEMS.length - 1 ? (
        <HiOutlineArrowRight
          size={13}
          className={`hidden shrink-0 sm:block ${dark ? 'text-slate-600' : 'text-slate-400'}`}
        />
      ) : null}
    </div>
  );
}

function ReportsOverview({ dark }: { dark: boolean }) {
  return (
    <div
      className={`min-h-0 rounded-2xl border p-[clamp(10px,1vw,14px)] ${
        dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="mb-2.5 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className={`truncate text-[18px] font-black ${
              dark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Reports Overview
          </h2>

          <p className={`text-[12px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            ERP flow overview
          </p>
        </div>

        <div className="hidden grid-cols-2 gap-2 lg:grid">
          {[
            {
              label: 'Purchase',
              value: String(PURCHASE_REPORT_COUNT),
              icon: HiOutlineClipboardList,
              bg: 'bg-blue-50',
              text: 'text-blue-600',
            },
            {
              label: 'POS',
              value: String(POS_REPORT_COUNT),
              icon: HiOutlineTrendingUp,
              bg: 'bg-emerald-50',
              text: 'text-emerald-600',
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className={`flex h-11 items-center gap-2 rounded-xl border px-2.5 ${
                  dark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
                }`}
              >
                <div className={`flex size-7 items-center justify-center rounded-lg ${item.bg}`}>
                  <Icon size={14} className={item.text} />
                </div>

                <div>
                  <p
                    className={`text-[10px] font-bold leading-none ${
                      dark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    {item.label}
                  </p>

                  <p
                    className={`mt-0.5 text-[16px] font-black leading-none ${
                      dark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={`rounded-2xl border p-2.5 ${
          dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {FLOW_ITEMS.map((item, index) => (
            <FlowPill key={`${item.label}-${index}`} item={item} index={index} dark={dark} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsSection({ dark }: { dark: boolean }) {
  return (
    <div
      className={`min-h-0 rounded-2xl border p-[clamp(9px,1vw,12px)] ${
        dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {STAT_CARDS.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={`flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                dark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: `${item.color}14` }}
              >
                <Icon size={17} style={{ color: item.color }} />
              </div>

              <div className="min-w-0">
                <p className="text-[18px] font-black leading-tight" style={{ color: item.color }}>
                  {item.value}
                </p>

                <p
                  className={`truncate text-[12px] font-black leading-tight ${
                    dark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {item.label}
                </p>

                <p className={`truncate text-[10px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MainPage: React.FC = () => {
  const greeting = useGreeting();
  const { preferences, resolvedThemeMode } = usePreferences();
  const username = useSelector((state: RootState) => state.auth.username) || 'Admin';

  const dark = resolvedThemeMode === 'dark';
  const companyInitial = (preferences.branding.companyName || 'Y')[0]?.toUpperCase() || 'Y';

  return (
    <div
      className={`flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden ${
        dark ? 'bg-slate-950' : 'bg-slate-50'
      }`}
    >
      <div
        className={`shrink-0 border-b px-[clamp(10px,1.3vw,18px)] py-2 ${
          dark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80'
        }`}
      >
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: preferences.theme.primaryColor || '#1E3A5F' }}
            >
              {companyInitial}
            </div>

            <div className="min-w-0">
              <p
                className={`truncate text-sm font-black leading-tight ${
                  dark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {preferences.branding.companyName || 'Yen ERP'}
              </p>

              <p className={`truncate text-[11px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                {preferences.branding.reportName || 'Reports UI'}
              </p>
            </div>
          </div>

          <span
            className={`hidden items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${
              dark
                ? 'border-slate-700 bg-slate-800 text-slate-300'
                : 'border-slate-200 bg-slate-100 text-slate-600'
            }`}
          >
            {dark ? <HiOutlineMoon size={12} /> : <HiOutlineSun size={12} />}
            {dark ? 'Dark' : 'Light'}
          </span>
        </div>
      </div>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2.5 xl:grid-cols-[minmax(0,1fr)_minmax(220px,255px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(235px,270px)]">
        <section className="grid min-h-0 grid-rows-[auto_auto_auto] gap-2 overflow-hidden">
          <div
            className={`min-h-0 rounded-2xl border p-[clamp(11px,1.1vw,16px)] ${
              dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="mb-3 flex min-w-0 items-center gap-3">
              <div className="flex size-[clamp(42px,3.8vw,52px)] shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
                <HiOutlineChartBar size={24} />
              </div>

              <div className="min-w-0">
                <h1
                  className={`truncate text-[clamp(20px,2.2vw,30px)] font-black tracking-tight ${
                    dark ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  {greeting}, <span className="text-blue-600">{username}</span>
                </h1>

                <p
                  className={`line-clamp-1 text-[clamp(11px,0.95vw,14px)] ${
                    dark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Welcome back! Here&apos;s your ERP reports overview today.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {MODULES.map((module) => (
                <ModuleCard key={module.label} {...module} dark={dark} />
              ))}
            </div>
          </div>

          <ReportsOverview dark={dark} />

          <StatsSection dark={dark} />
        </section>

        <aside
          className={`hidden min-h-0 overflow-hidden rounded-2xl border xl:flex xl:flex-col ${
            dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="shrink-0 px-3 pb-1.5 pt-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2
                  className={`truncate text-[17px] font-black leading-tight ${
                    dark ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  Quick Reports
                </h2>

                <p
                  className={`truncate text-[12px] ${
                    dark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Frequently used reports
                </p>
              </div>

              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                <HiOutlineDocumentReport size={17} />
              </div>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-6 gap-1.5 overflow-hidden px-3 pb-3 pt-1.5">
            {QUICK_REPORTS.map((item) => (
              <QuickReportCard key={item.path} item={item} dark={dark} />
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default MainPage;





