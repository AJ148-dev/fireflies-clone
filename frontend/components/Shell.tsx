"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { ToastProvider, useToast } from "@/components/Toast";

const PRIMARY = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/ask", label: "AskFred", icon: "ask" },
  { href: "/meetings", label: "Meetings", icon: "camera" },
  { href: "/tasks", label: "Tasks", icon: "tasks" },
  { href: "", label: "AI Skills", icon: "skills" },
];

const SECONDARY = [
  { href: "/analytics", label: "Analytics", icon: "chart" },
  { href: "", label: "Voice Agents", icon: "headset" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ShellFrame>{children}</ShellFrame>
    </ToastProvider>
  );
}

function ShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const toast = useToast();
  const [expanded, setExpanded] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const narrow = pathname.startsWith("/meetings") || pathname.startsWith("/upgrade") || pathname.startsWith("/ask");
  const collapsed = narrow || !expanded;
  const pageLabel = pathname === "/ask" ? "AskFred" : pathname.startsWith("/meetings") ? "Meetings" : pathname.startsWith("/tasks") ? "Tasks" : pathname.startsWith("/analytics") ? "Analytics" : pathname.startsWith("/upgrade") ? "Plan" : pathname === "/settings" ? "Settings" : "Home";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#121214] text-[#f4f4f5]">
      <div className="bg-[#3a246b] py-1.5 text-center text-[12px] text-[#f3e8ff]">
        You are eligible for 7 days business plan free trial.{" "}
        <Link href="/upgrade" className="font-medium underline">
          Start free trial
        </Link>
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className={`relative flex shrink-0 flex-col border-r border-white/5 bg-[#17171a] ${collapsed ? "w-14 items-center py-2" : "w-[232px]"}`}>
          {collapsed ? (
            <IconRail pathname={pathname} onProfile={() => setProfileOpen((open) => !open)} onExpand={narrow ? undefined : () => setExpanded(true)} />
          ) : (
            <WideSidebar pathname={pathname} inviteOpen={inviteOpen} onCloseInvite={() => setInviteOpen(false)} onCollapse={() => setExpanded(false)} onProfile={() => setProfileOpen((open) => !open)} toast={toast} />
          )}
          {profileOpen ? (
            <ProfileMenu collapsed={collapsed} onClose={() => setProfileOpen(false)} toast={toast} />
          ) : null}
        </aside>
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-white/5 px-4 py-2">
            <span className="shrink-0 text-[13px] text-[#d4d4d8]">{pageLabel}</span>
            <Suspense fallback={<div className="h-8 w-full max-w-md rounded-lg bg-[#1c1c20]" />}>
              <GlobalSearch />
            </Suspense>
            <div className="ml-auto flex items-center gap-2">
              {!collapsed ? (
                <>
                  <span className="hidden items-center gap-1.5 text-xs text-[#86efac] lg:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />3 Free meetings
                  </span>
                  <Link href="/upgrade" className="rounded-md border border-[#166534] px-2 py-1 text-xs text-[#86efac]">
                    Upgrade
                  </Link>
                </>
              ) : null}
              <button type="button" aria-label="Notifications" onClick={() => toast("No new notifications")} className="text-[#a1a1aa]">
                <Icon name="bell" />
              </button>
              <Link href="/?upload=1" aria-label="Capture" className="flex items-center gap-1.5 rounded-lg bg-[#6d4aff] px-3 py-1.5 text-sm font-medium">
                {!collapsed ? "Capture" : "+"}
                {!collapsed ? <span className="text-[10px] opacity-80">▾</span> : null}
              </Link>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          <button
            type="button"
            aria-label="Help"
            onClick={() => toast("Help is coming soon")}
            className="absolute right-5 bottom-5 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#2a2a2e] text-sm text-[#d4d4d8]"
          >
            ?
          </button>
        </div>
      </div>
    </div>
  );
}

function IconRail({ pathname, onProfile, onExpand }: { pathname: string; onProfile: () => void; onExpand?: () => void }) {
  const items = [...PRIMARY, ...SECONDARY, { href: "/upgrade", label: "Upgrade", icon: "bolt" }, { href: "/settings", label: "Settings", icon: "gear" }];
  return (
    <>
      <button type="button" aria-label="Profile" onClick={onProfile} className="mb-2 grid h-7 w-7 place-items-center rounded-md bg-[#1f6f64] text-[11px] font-semibold text-white">
        A
      </button>
      {onExpand ? (
        <button type="button" aria-label="Expand sidebar" title="Expand sidebar" onClick={onExpand} className="mb-1 grid h-8 w-8 place-items-center rounded-lg text-[#a1a1aa] hover:bg-white/5">
          <Icon name="panels" />
        </button>
      ) : null}
      {items.filter((item) => item.href).map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.label} href={item.href} title={item.label} className={`my-0.5 grid h-8 w-8 place-items-center rounded-lg ${active ? "bg-white/10 text-white" : "text-[#a1a1aa] hover:bg-white/5"}`}>
            <Icon name={item.icon} />
          </Link>
        );
      })}
    </>
  );
}

function WideSidebar({
  pathname,
  inviteOpen,
  onCloseInvite,
  onCollapse,
  onProfile,
  toast,
}: {
  pathname: string;
  inviteOpen: boolean;
  onCloseInvite: () => void;
  onCollapse: () => void;
  onProfile: () => void;
  toast: (message: string) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-3">
        <button type="button" aria-label="Profile" onClick={onProfile} className="flex min-w-0 items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[#1f6f64] text-[11px] font-semibold text-white">A</span>
          <span className="truncate text-[13px] font-medium">23/CS/075</span>
          <span className="text-[10px] text-[#a1a1aa]">▾</span>
        </button>
        <button type="button" aria-label="Collapse sidebar" onClick={onCollapse} className="ml-auto text-[#a1a1aa]">
          <Icon name="panels" />
        </button>
      </div>
      <nav className="flex flex-col px-2">
        {PRIMARY.map((item) => (
          <NavRow key={item.label} item={item} pathname={pathname} toast={toast} />
        ))}
        <div className="mx-2 my-2 border-t border-white/10" />
        {SECONDARY.map((item) => (
          <NavRow key={item.label} item={item} pathname={pathname} toast={toast} />
        ))}
        <div className="mx-2 my-2 border-t border-white/10" />
        <Link href="/upgrade" className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] ${pathname.startsWith("/upgrade") ? "bg-[#2c2c31] font-medium" : "text-[#d4d4d8] hover:bg-white/5"}`}>
          <Icon name="bolt" />
          Upgrade
          <span className="ml-auto rounded-md bg-[#14532d] px-1.5 py-0.5 text-[10px] font-semibold text-[#86efac]">40% OFF</span>
        </Link>
      </nav>
      <div className="mt-auto px-2 pb-3">
        <button type="button" onClick={() => toast("Email assistant is coming soon")} className="flex w-full items-center gap-2 rounded-lg bg-[#241b45] px-2.5 py-2 text-left text-[13px] font-medium">
          <GmailMark />
          Try Email Assistant
        </button>
        <button type="button" onClick={() => toast("Integrations are coming soon")} className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-[#d4d4d8] hover:bg-white/5">
          <Icon name="puzzle" />
          Integrations
        </button>
        <Link href="/settings" className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] ${pathname === "/settings" ? "bg-[#2c2c31] font-medium" : "text-[#d4d4d8] hover:bg-white/5"}`}>
          <Icon name="gear" />
          Settings
        </Link>
        <div className="px-1 pt-3">
        {inviteOpen ? (
          <div className="relative rounded-xl border border-white/10 bg-[#121214] p-3">
            <button type="button" aria-label="Dismiss invite" onClick={onCloseInvite} className="absolute top-2 right-2 text-xs text-[#71717a]">
              ×
            </button>
            <p className="pr-4 text-[13px] leading-5 text-[#e4e4e7]">Invite coworkers to your Fireflies team</p>
            <button type="button" onClick={() => toast("Teams are coming soon")} className="mt-3 w-full rounded-lg bg-[#6d4aff] py-2 text-sm font-medium">
              Create Team
            </button>
          </div>
        ) : null}
        <div className="mt-2 flex justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d4d4d8]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#3f3f46]" />
        </div>
        </div>
      </div>
    </>
  );
}

function ProfileMenu({
  collapsed,
  onClose,
  toast,
}: {
  collapsed: boolean;
  onClose: () => void;
  toast: (message: string) => void;
}) {
  return (
    <>
      <button type="button" aria-label="Close profile" className="fixed inset-0 z-20 cursor-default" onClick={onClose} />
      <div className={`absolute z-30 w-52 rounded-xl border border-white/10 bg-[#242428] p-2 text-[13px] shadow-lg ${collapsed ? "top-2 left-12" : "top-12 left-3"}`}>
        <p className="px-2 py-1 font-medium">23/CS/075</p>
        <p className="px-2 pb-2 text-xs text-[#a1a1aa]">Profile is a placeholder. This workspace is already signed in.</p>
        <button
          type="button"
          className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/5"
          onClick={() => {
            onClose();
            toast("Account settings are coming soon");
          }}
        >
          Account
        </button>
        <Link href="/settings" onClick={onClose} className="block rounded-lg px-2 py-1.5 hover:bg-white/5">
          Settings
        </Link>
      </div>
    </>
  );
}

function NavRow({
  item,
  pathname,
  toast,
}: {
  item: { href: string; label: string; icon: string };
  pathname: string;
  toast: (message: string) => void;
}) {
  const active = item.href !== "" && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
  const className = `flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] ${active ? "bg-[#2c2c31] font-medium text-white" : "text-[#d4d4d8] hover:bg-white/5"}`;
  const icon = <span className={item.icon === "ask" ? "text-[#a78bfa]" : ""}><Icon name={item.icon} /></span>;
  if (!item.href) {
    return (
      <button type="button" onClick={() => toast(`${item.label} is coming soon`)} className={className}>
        {icon}
        {item.label}
      </button>
    );
  }
  return (
    <Link href={item.href} className={className}>
      {icon}
      {item.label}
    </Link>
  );
}

function GmailMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4caf50" d="M45 16.2 35 23.7V40h7c1.7 0 3-1.3 3-3V16.2z" />
      <path fill="#1e88e5" d="M3 16.2 13 23.7V40H6c-1.7 0-3-1.3-3-3V16.2z" />
      <path fill="#e53935" d="M35 11.2 24 19.5 13 11.2 13 23.7 24 32 35 23.7z" />
      <path fill="#c62828" d="M3 12.3V16.2l10 7.5V11.2L9.9 8.9A4.3 4.3 0 0 0 3 12.3z" />
      <path fill="#fbc02d" d="M45 12.3V16.2l-10 7.5V11.2l3.1-2.3A4.3 4.3 0 0 1 45 12.3z" />
    </svg>
  );
}

function GlobalSearch() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const q = params.get("q") ?? "";

  return (
    <div className="relative mx-auto w-full max-w-md">
    <input
      aria-label="Search by title or keyword"
      value={q}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) next.set("q", event.target.value);
        else next.delete("q");
        const base = pathname === "/" || pathname === "/meetings" ? pathname : "/meetings";
        const query = next.toString();
        router.replace(query ? `${base}?${query}` : base);
      }}
      placeholder="Search by title or keyword"
      className="w-full rounded-lg border border-white/10 bg-[#1c1c20] py-1.5 pr-12 pl-3 text-[13px] outline-none placeholder:text-[#71717a] focus:border-[#6d4aff]"
    />
      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-white/10 px-1 text-[10px] text-[#71717a]">⌘K</span>
    </div>
  );
}

function Icon({ name }: { name: string }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (name === "home") return <svg {...props}><path d="M2.5 7.2 8 2.8l5.5 4.4V13a1 1 0 0 1-1 1h-3.2V9.5H6.7V14H3.5a1 1 0 0 1-1-1V7.2Z" /></svg>;
  if (name === "ask") return <svg {...props}><rect x="4" y="4" width="8" height="7" rx="3" /><path d="M6.5 7h.1M9.5 7h.1M8 2.2v1.6M5.2 12.2 6.2 11M10.8 12.2 9.8 11" /></svg>;
  if (name === "bolt") return <svg {...props}><path d="M9 1.8 4.2 9h3.2L6.8 14.2 12 6.6H8.6L9 1.8Z" /></svg>;
  if (name === "headset") return <svg {...props}><path d="M3 8.5a5 5 0 0 1 10 0" /><rect x="2.2" y="8" width="2.4" height="4" rx="1" /><rect x="11.4" y="8" width="2.4" height="4" rx="1" /></svg>;
  if (name === "puzzle") return <svg {...props}><path d="M6 2.5h3.2v2.1a1.4 1.4 0 1 0 0 2.6V9H6.2V7.2a1.4 1.4 0 1 1 0-2.6V2.5Z" /><path d="M9.2 9H13v3.2h-2.1a1.4 1.4 0 1 0-2.6 0H6V9" /></svg>;
  if (name === "camera") return <svg {...props}><rect x="1.8" y="4" width="8.2" height="8" rx="1.3" /><path d="M10 6.8 14.2 4.6v6.8L10 9.2" /></svg>;
  if (name === "tasks") return <svg {...props}><path d="M3 4.2h10M3 8h10M3 11.8h6" /></svg>;
  if (name === "skills") return <svg {...props}><path d="M8 2.2 8.7 5l2.8.7-2.8.7L8 9.2 7.3 6.4 4.5 5.7 7.3 5 8 2.2ZM12 9.2l.4 1.4 1.4.4-1.4.4-.4 1.4-.4-1.4-1.4-.4 1.4-.4.4-1.4Z" /></svg>;
  if (name === "chart") return <svg {...props}><path d="M3 13V8.5M8 13V3.5M13 13V6.5" /></svg>;
  if (name === "wave") return <svg {...props}><path d="M1.8 8h1M4.2 5.2v5.6M6.6 3.2v9.6M9 5.6v4.8M11.4 4.4v7.2M13.8 7v2" /></svg>;
  if (name === "upgrade") return <svg {...props}><path d="M8 2.4 13.2 13H2.8L8 2.4Z" /></svg>;
  if (name === "plug") return <svg {...props}><path d="M6 2.2v2.6M10 2.2v2.6M4.2 4.8h7.6v3.1a3.8 3.8 0 0 1-7.6 0V4.8Z" /></svg>;
  if (name === "gear") return <svg {...props}><circle cx="8" cy="8" r="2" /><path d="M8 2.1v1.5M8 12.4v1.5M2.1 8h1.5M12.4 8h1.5M3.9 3.9l1.1 1.1M11 11l1.1 1.1M12.1 3.9 11 5M5 11l-1.1 1.1" /></svg>;
  if (name === "bell") return <svg {...props}><path d="M4 11.4h8l-.8-1.1V7.1a3.2 3.2 0 0 0-6.4 0v3.2L4 11.4Z" /><path d="M6.7 12.5a1.3 1.3 0 0 0 2.6 0" /></svg>;
  if (name === "capture") return <svg {...props}><rect x="2.2" y="3.2" width="11.6" height="9.6" rx="1.4" /><path d="M6.2 8h3.6M8 6.2v3.6" /></svg>;
  return <svg {...props}><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>;
}
