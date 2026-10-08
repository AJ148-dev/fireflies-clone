const SECTIONS = [
  { title: "Profile", body: "Name, photo, and language" },
  { title: "Notetaker", body: "Auto-join, meeting language, and recap emails" },
  { title: "Integrations", body: "Calendar, Zoom, Slack, and CRM connections" },
  { title: "Privacy", body: "Who can see your meetings and recordings" },
  { title: "Billing", body: "Plan, seats, and invoices" },
];

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[#a1a1aa]">
        This workspace assumes you are already signed in. These settings are placeholders in this build.
      </p>
      <div className="mt-6 max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#1c1c20]">
        {SECTIONS.map((section) => (
          <div key={section.title} className="flex items-center gap-4 border-b border-white/5 px-5 py-4 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{section.title}</p>
              <p className="mt-0.5 text-[13px] text-[#a1a1aa]">{section.body}</p>
            </div>
            <span className="shrink-0 rounded-md bg-[#2a2a2e] px-2 py-0.5 text-[11px] font-medium text-[#a1a1aa]">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
