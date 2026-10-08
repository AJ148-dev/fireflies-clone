"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SearchModal } from "@/components/SearchModal";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  const [inviteOpen, setInviteOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const collapsed = pathname.startsWith("/meetings") || pathname.startsWith("/upgrade") || pathname.startsWith("/ask");
  const pageLabel = pathname === "/ask" ? "AskFred" : pathname.startsWith("/meetings") ? "Meetings" : pathname.startsWith("/tasks") ? "Tasks" : pathname.startsWith("/analytics") ? "Analytics" : pathname.startsWith("/upgrade") ? "Plan" : pathname === "/settings" ? "Settings" : "Home";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ff-bg text-ff-text">
      <div className="flex min-h-0 flex-1">
        <aside className={`relative flex shrink-0 flex-col border-r border-ff bg-ff-sidebar ${collapsed ? "w-14 items-center py-2" : "w-[232px]"}`}>
          {collapsed ? (
            <IconRail pathname={pathname} toast={toast} onProfile={() => setProfileOpen((open) => !open)} />
          ) : (
            <WideSidebar pathname={pathname} inviteOpen={inviteOpen} onCloseInvite={() => setInviteOpen(false)} onProfile={() => setProfileOpen((open) => !open)} toast={toast} />
          )}
          {profileOpen ? (
            <ProfileMenu collapsed={collapsed} onClose={() => setProfileOpen(false)} toast={toast} />
          ) : null}
        </aside>
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-ff bg-ff-bg px-4 py-2">
            <span className="shrink-0 text-[13px] text-ff-text-secondary">{pageLabel}</span>
            <GlobalSearch />
            <div className="ml-auto flex items-center gap-2">
              {!collapsed ? (
                <Link href="/upgrade" className="rounded-md border border-ff-plan bg-ff-plan-bg px-2 py-1 text-xs font-medium text-ff-plan-text hover:bg-[#dcfce7]">
                  Upgrade
                </Link>
              ) : null}
              <ThemeToggle />
              <button type="button" aria-label="Notifications" onClick={() => toast("No new notifications")} className="text-ff-text-secondary hover:text-ff-text">
                <Icon name="bell" />
              </button>
              <Link href="/?upload=1" className="flex items-center whitespace-nowrap rounded-lg bg-[#6d4aff] px-3 py-1.5 text-sm font-medium text-on-accent">
                Create meeting
              </Link>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden bg-ff-bg">{children}</div>
          <button
            type="button"
            aria-label="Help"
            onClick={() => toast("Help is coming soon")}
            className="absolute right-5 bottom-5 grid h-10 w-10 place-items-center rounded-full border border-ff-strong bg-ff-chip text-sm text-ff-text-secondary"
          >
            ?
          </button>
        </div>
      </div>
    </div>
  );
}

const RAIL_MAIN = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/ask", label: "AskFred", icon: "ask" },
  { href: "/meetings", label: "Meetings", icon: "camera" },
  { href: "/tasks", label: "Tasks", icon: "tasks" },
  { href: "", label: "AI Skills", icon: "skills" },
  { href: "/analytics", label: "Analytics", icon: "chart" },
  { href: "", label: "Voice Agents", icon: "robot" },
  { href: "/upgrade", label: "Upgrade", icon: "bolt", dot: true },
];

const RAIL_FOOTER = [
  { href: "", label: "Invite", icon: "invite" },
  { href: "", label: "Integrations", icon: "layers" },
  { href: "/settings", label: "Settings", icon: "gear" },
];

function IconRail({
  pathname,
  toast,
  onProfile,
}: {
  pathname: string;
  toast: (message: string) => void;
  onProfile: () => void;
}) {
  return (
    <>
      <button type="button" aria-label="Profile" onClick={onProfile} className="mb-3 grid h-7 w-7 place-items-center rounded-md bg-[#1f6f64] text-[11px] font-semibold text-white">
        MC
      </button>
      {RAIL_MAIN.map((item) => (
        <RailButton key={item.label} item={item} pathname={pathname} toast={toast} />
      ))}
      <div className="mt-auto flex flex-col items-center gap-1 pb-2">
        {RAIL_FOOTER.map((item) => (
          <RailButton key={item.label} item={item} pathname={pathname} toast={toast} />
        ))}
      </div>
    </>
  );
}

function RailButton({
  item,
  pathname,
  toast,
}: {
  item: { href: string; label: string; icon: string; dot?: boolean };
  pathname: string;
  toast: (message: string) => void;
}) {
  const active = item.href !== "" && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
  const className = `grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-ff-active text-ff-nav-active-text" : "text-ff-text-secondary hover-ff"}`;
  const glyph = (
    <span className={`relative ${item.icon === "ask" ? "text-[#a78bfa]" : ""}`}>
      <Icon name={item.icon} />
      {item.dot ? <span className="absolute -top-0.5 -right-1.5 h-1.5 w-1.5 rounded-full bg-[#22c55e]" /> : null}
    </span>
  );
  if (!item.href) {
    return (
      <button type="button" title={item.label} aria-label={item.label} onClick={() => toast(`${item.label} is coming soon`)} className={className}>
        {glyph}
      </button>
    );
  }
  return (
    <Link href={item.href} title={item.label} aria-label={item.label} className={className}>
      {glyph}
    </Link>
  );
}

function WideSidebar({
  pathname,
  inviteOpen,
  onCloseInvite,
  onProfile,
  toast,
}: {
  pathname: string;
  inviteOpen: boolean;
  onCloseInvite: () => void;
  onProfile: () => void;
  toast: (message: string) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-3">
        <button type="button" aria-label="Profile" onClick={onProfile} className="flex min-w-0 items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[#1f6f64] text-[10px] font-semibold text-white">MC</span>
          <span className="truncate text-[13px] font-medium">Maya Chen</span>
          <span className="text-[10px] text-ff-text-muted">▾</span>
        </button>
      </div>
      <nav className="flex flex-col px-2">
        {PRIMARY.map((item) => (
          <NavRow key={item.label} item={item} pathname={pathname} toast={toast} />
        ))}
        <div className="mx-2 my-2 border-t border-ff-strong" />
        {SECONDARY.map((item) => (
          <NavRow key={item.label} item={item} pathname={pathname} toast={toast} />
        ))}
        <div className="mx-2 my-2 border-t border-ff-strong" />
        <Link href="/upgrade" className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] ${pathname.startsWith("/upgrade") ? "bg-ff-active font-medium text-ff-nav-active-text" : "text-ff-text-secondary hover-ff"}`}>
          <Icon name="bolt" />
          Upgrade
          <span className="ml-auto rounded-md bg-ff-deal-bg px-1.5 py-0.5 text-[10px] font-semibold text-ff-deal-text">40% OFF</span>
        </Link>
      </nav>
      <div className="mt-auto px-2 pb-3">
        <button type="button" onClick={() => toast("Email assistant is coming soon")} className="flex w-full items-center gap-2 rounded-lg bg-ff-promo-bg px-2.5 py-2 text-left text-[13px] font-medium text-ff-text">
          <GmailMark />
          Try Email Assistant
        </button>
        <button type="button" onClick={() => toast("Integrations are coming soon")} className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ff-text-secondary hover-ff">
          <Icon name="puzzle" />
          Integrations
        </button>
        <Link href="/settings" className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] ${pathname === "/settings" ? "bg-ff-active font-medium text-ff-nav-active-text" : "text-ff-text-secondary hover-ff"}`}>
          <Icon name="gear" />
          Settings
        </Link>
        <div className="px-1 pt-3">
        {inviteOpen ? (
          <div className="relative rounded-xl border border-ff-strong bg-ff-invite-card p-3">
            <button type="button" aria-label="Dismiss invite" onClick={onCloseInvite} className="absolute top-2 right-2 text-xs text-ff-text-faint">
              ×
            </button>
            <p className="pr-4 text-[13px] leading-5 text-ff-text-secondary">Invite coworkers to your Scaler Flies team</p>
            <button type="button" onClick={() => toast("Teams are coming soon")} className="mt-3 w-full rounded-lg bg-[#6d4aff] py-2 text-sm font-medium text-on-accent">
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
      <div className={`absolute z-30 w-52 rounded-xl border border-ff-strong bg-ff-panel p-2 text-[13px] shadow-lg ${collapsed ? "top-2 left-12" : "top-12 left-3"}`}>
        <p className="px-2 py-1 font-medium">Maya Chen</p>
        <p className="px-2 pb-2 text-xs text-ff-text-muted">Profile is a placeholder. This workspace is already signed in.</p>
        <button
          type="button"
          className="block w-full rounded-lg px-2 py-1.5 text-left hover-ff"
          onClick={() => {
            onClose();
            toast("Account settings are coming soon");
          }}
        >
          Account
        </button>
        <Link href="/settings" onClick={onClose} className="block rounded-lg px-2 py-1.5 hover-ff">
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
  const className = `flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] ${active ? "bg-ff-active font-medium text-ff-nav-active-text" : "text-ff-text-secondary hover-ff"}`;
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative mx-auto block w-full max-w-md rounded-lg border border-ff-strong bg-ff-elevated py-1.5 pr-12 pl-3 text-left text-[13px] text-ff-text-faint hover:border-[#6d4aff]"
      >
        Search by title or keyword
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-ff-strong px-1 text-[10px]">⌘K</span>
      </button>
      {open ? <SearchModal onClose={() => setOpen(false)} /> : null}
    </>
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
  if (name === "ask") return <svg {...props}><circle cx="8" cy="8.4" r="3.1" /><path d="M8 5.2V3.1" /><circle cx="8" cy="2.5" r="0.7" fill="currentColor" stroke="none" /><circle cx="6.8" cy="8.2" r="0.45" fill="currentColor" stroke="none" /><circle cx="9.2" cy="8.2" r="0.45" fill="currentColor" stroke="none" /></svg>;
  if (name === "bolt") return <svg {...props}><path d="M9 1.8 4.2 9h3.2L6.8 14.2 12 6.6H8.6L9 1.8Z" /></svg>;
  if (name === "headset") return <svg {...props}><path d="M3 8.5a5 5 0 0 1 10 0" /><rect x="2.2" y="8" width="2.4" height="4" rx="1" /><rect x="11.4" y="8" width="2.4" height="4" rx="1" /></svg>;
  if (name === "puzzle") return <svg {...props}><path d="M6 2.5h3.2v2.1a1.4 1.4 0 1 0 0 2.6V9H6.2V7.2a1.4 1.4 0 1 1 0-2.6V2.5Z" /><path d="M9.2 9H13v3.2h-2.1a1.4 1.4 0 1 0-2.6 0H6V9" /></svg>;
  if (name === "camera") return <svg {...props}><rect x="1.8" y="4" width="8.2" height="8" rx="1.3" /><path d="M10 6.8 14.2 4.6v6.8L10 9.2" /></svg>;
  if (name === "tasks") return <svg {...props}><path d="M3 4.2h10M3 8h10M3 11.8h6" /></svg>;
  if (name === "skills") return <svg {...props}><path d="M8 1.8 9.1 6.2 13.4 8 9.1 9.8 8 14.2 6.9 9.8 2.6 8 6.9 6.2 8 1.8Z" /></svg>;
  if (name === "chart") return <svg {...props}><path d="M3 13V8.5M8 13V3.5M13 13V6.5" /></svg>;
  if (name === "wave") return <svg {...props}><path d="M1.8 8h1M4.2 5.2v5.6M6.6 3.2v9.6M9 5.6v4.8M11.4 4.4v7.2M13.8 7v2" /></svg>;
  if (name === "upgrade") return <svg {...props}><path d="M8 2.4 13.2 13H2.8L8 2.4Z" /></svg>;
  if (name === "plug") return <svg {...props}><path d="M6 2.2v2.6M10 2.2v2.6M4.2 4.8h7.6v3.1a3.8 3.8 0 0 1-7.6 0V4.8Z" /></svg>;
  if (name === "robot") return <svg {...props}><rect x="3.6" y="5.2" width="8.8" height="7" rx="2" /><path d="M8 5.2V3" /><circle cx="8" cy="2.4" r="0.7" fill="currentColor" stroke="none" /><circle cx="6.3" cy="8.2" r="0.5" fill="currentColor" stroke="none" /><circle cx="9.7" cy="8.2" r="0.5" fill="currentColor" stroke="none" /></svg>;
  if (name === "invite") return <svg {...props}><circle cx="6" cy="5" r="1.7" /><path d="M2.6 12.4c.5-2.1 1.8-3.2 3.4-3.2s2.9 1.1 3.4 3.2" /><path d="M11.2 6.4v3.4M9.5 8.1h3.4" /></svg>;
  if (name === "layers") return <svg {...props}><rect x="2.2" y="2.2" width="7.4" height="7.4" rx="1.4" /><rect x="6.4" y="6.4" width="7.4" height="7.4" rx="1.4" /></svg>;
  if (name === "gear") return <svg {...props}><path d="M6.7 1.8h2.6l.3 1.5c.4.1.8.3 1.1.6l1.4-.6 1.3 2.2-1.1 1.1c.1.4.1.7 0 1.1l1.1 1-1.3 2.3-1.4-.6c-.3.3-.7.5-1.1.6l-.3 1.5H6.7l-.3-1.5a3.6 3.6 0 0 1-1.1-.6l-1.4.6-1.3-2.2 1.1-1.1a3.6 3.6 0 0 1 0-1.1L2.6 5.5l1.3-2.2 1.4.6c.3-.3.7-.5 1.1-.6l.3-1.5Z" /><circle cx="8" cy="8" r="1.5" /></svg>;
  if (name === "bell") return <svg {...props}><path d="M4 11.4h8l-.8-1.1V7.1a3.2 3.2 0 0 0-6.4 0v3.2L4 11.4Z" /><path d="M6.7 12.5a1.3 1.3 0 0 0 2.6 0" /></svg>;
  if (name === "capture") return <svg {...props}><rect x="2.2" y="3.2" width="11.6" height="9.6" rx="1.4" /><path d="M6.2 8h3.6M8 6.2v3.6" /></svg>;
  return <svg {...props}><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>;
}
