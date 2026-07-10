"use client";

import {
  LayoutGrid,
  Rocket,
  Users2,
  MessageSquare,
  UserCog,
  Plug,
  Megaphone,
  Phone,
  ListChecks,
  Webhook,
  Building2,
  ChevronRight,
} from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
}

function NavItem({ icon, label, active, disabled }: NavItemProps) {
  return (
    <div
      title={disabled ? "Not part of this demo" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
        active
          ? "bg-signal-500/10 text-signal-600 dark:text-signal-500"
          : disabled
          ? "cursor-not-allowed text-ink-300 dark:text-ink-600"
          : "text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
      }`}
    >
      <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span className="flex-1">{label}</span>
      {disabled && (
        <span className="rounded bg-ink-100 dark:bg-ink-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-300 dark:text-ink-600">
          Soon
        </span>
      )}
    </div>
  );
}

export default function Sidebar({ active }: { active: "leads" | "sources" }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 lg:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-900 dark:bg-white">
          <span className="font-display text-sm font-bold text-white dark:text-ink-900">G</span>
        </div>
        <span className="font-display text-base font-bold text-ink-900 dark:text-white">
          GrowEasy
        </span>
      </div>

      <div className="mx-3 mb-4 flex items-center justify-between rounded-lg border border-ink-200 dark:border-ink-700 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-signal-500 text-xs font-semibold text-white">
            VK
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-800 dark:text-ink-100">VK Test</p>
            <p className="text-[10px] uppercase tracking-wide text-ink-400">Owner</p>
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-300 dark:text-ink-600">
            Main
          </p>
          <div className="space-y-0.5">
            <NavItem icon={<LayoutGrid />} label="Dashboard" disabled />
            <NavItem icon={<Rocket />} label="Generate Leads" disabled />
            <NavItem icon={<ListChecks />} label="Manage Leads" active={active === "leads"} />
            <NavItem icon={<MessageSquare />} label="Engage Leads" disabled />
          </div>
        </div>

        <div>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-300 dark:text-ink-600">
            Control Center
          </p>
          <div className="space-y-0.5">
            <NavItem icon={<Users2 />} label="Team Members" disabled />
            <NavItem icon={<Plug />} label="Lead Sources" active={active === "sources"} disabled={active !== "sources"} />
            <NavItem icon={<Megaphone />} label="Ad Accounts" disabled />
            <NavItem icon={<MessageSquare />} label="WhatsApp Account" disabled />
            <NavItem icon={<Phone />} label="Tele Calling" disabled />
            <NavItem icon={<UserCog />} label="CRM Fields" disabled />
            <NavItem icon={<Webhook />} label="API Center" disabled />
          </div>
        </div>
      </nav>

      <div className="border-t border-ink-200 dark:border-ink-800 px-3 py-3">
        <NavItem icon={<Building2 />} label="Business Center" disabled />
      </div>
    </aside>
  );
}