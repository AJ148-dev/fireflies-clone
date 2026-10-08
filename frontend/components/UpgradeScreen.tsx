"use client";

import { useState, type ReactNode } from "react";

import { useToast } from "@/components/Toast";

type Billing = "monthly" | "annual";

const PRICES: Record<Billing, { pro: number; business: number; enterprise: number }> = {
  monthly: { pro: 18, business: 29, enterprise: 39 },
  annual: { pro: 10, business: 19, enterprise: 39 },
};

const FREE_LIMITS = ["Unlimited transcription*", "Limited AI summaries", "800 minutes of storage/seat"];
const FREE_FEATURES = [
  "Record Zoom, GMeet, MS Teams, more",
  "Transcription in 100+ languages",
  "Real-time notes & live transcriptions",
  "Meeting search",
  "AskFred — AI assistant",
  "Soundbites",
  "Audio/video uploads",
  "Chrome extension",
  "Fireflies mobile app",
  "Desktop app (download)",
  "API Access",
];

const PRO_LIMITS = ["Unlimited transcription", "Unlimited AI summaries", "8,000 mins of storage/seat"];
const PRO_FEATURES = [
  "Capture meeting video",
  "Download transcripts, summaries, recordings",
  "Personal assistant",
  "Smart Search",
  "Action items & Task Manager",
  "AI Skills",
  "Voice Agents",
  "Talk-to-listen",
  "Unlimited public channels",
  "Unlimited integrations",
  "20 AI credits",
];

const BUSINESS_FEATURES = [
  "Multi language mode",
  "Conversation Intelligence",
  "Team analytics (Pro admin)",
  "Unlimited public & private channels",
  "User groups",
  "Public meeting access",
  "Priority support",
  "30 AI credits",
];

const ENTERPRISE_FEATURES = [
  { text: "Rules engine", badge: "NEW" },
  { text: "Super admin role" },
  { text: "Custom data retention" },
  { text: "Transcript + summary only mode" },
  { text: "Onboarding program" },
  { text: "Dedicated account manager" },
  { text: "SSO + SCIM" },
  { text: "HIPAA compliance" },
  { text: "Private storage" },
  { text: "Dedicated support" },
  { text: "Payment by invoice*" },
  { text: "50 AI credits" },
];

export function UpgradeScreen() {
  const toast = useToast();
  const [billing, setBilling] = useState<Billing>("annual");
  const prices = PRICES[billing];
  const cadence = billing === "annual" ? "Per seat/month billed annually" : "Per seat/month billed monthly";

  return (
    <div className="h-full overflow-y-auto bg-ff-bg px-6 py-8 text-ff-text">
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h1 className="text-lg font-semibold">
            You are on the <span className="font-semibold">Free</span> plan
          </h1>
          <p className="mt-1 text-sm text-ff-text-muted">You need to upgrade your plan to perform this action.</p>
          <div className="mt-4 inline-flex items-center rounded-full bg-ff-elevated p-1 text-[11px] font-semibold tracking-wide shadow-sm">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-3 py-1 ${billing === "monthly" ? "bg-ff-tab-active-bg text-ff-tab-active-text" : "text-ff-text-muted"}`}
            >
              MONTHLY
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={`flex items-center gap-2 rounded-full px-3 py-1 ${billing === "annual" ? "bg-ff-tab-active-bg text-ff-tab-active-text" : "text-ff-text-muted"}`}
            >
              ANNUAL
              <span className="rounded bg-ff-deal-bg px-1.5 py-0.5 text-[9px] font-bold text-ff-deal-text">2 MONTHS FREE</span>
            </button>
          </div>
        </header>

        <div className="mt-8 grid items-stretch gap-4 xl:grid-cols-4">
          <PlanCard
            name="Free"
            blurb="For individuals starting with Fireflies"
            price="$0"
            priceNote="Free forever"
            info="Storage and transcription limits apply on the Free plan."
            onInfo={() => toast("Storage and transcription limits apply on the Free plan.")}
          >
            <CheckList items={FREE_LIMITS} />
            <p className="mt-4 mb-2 text-xs text-ff-text-muted">Features</p>
            <CheckList
              items={FREE_FEATURES}
              onItem={(item) => {
                if (item.startsWith("Desktop app")) toast("Desktop app download is coming soon");
              }}
            />
            <PlanFooter>
              <span className="invisible text-[10px] font-semibold tracking-wider" aria-hidden="true">
                RATE LIMITS
              </span>
              <button type="button" disabled className="w-full rounded-lg bg-ff-chip py-2 text-sm text-ff-text-faint">
                Current
              </button>
            </PlanFooter>
          </PlanCard>

          <PlanCard name="Pro" blurb="Best suited for individuals and small teams" price={`$${prices.pro}`} priceNote={cadence}>
            <CheckList items={PRO_LIMITS} />
            <p className="mt-4 mb-2 text-xs text-ff-text-muted">Everything in Free, plus</p>
            <CheckList items={PRO_FEATURES} />
            <PlanFooter>
              <RateLimits onClick={() => toast("Rate limits apply per seat on the Pro plan.")} />
              <UpgradeButton onClick={() => toast("Checkout is coming soon")} />
            </PlanFooter>
          </PlanCard>

          <PlanCard
            name="Business"
            badge="MORE POPULAR"
            blurb="Manage your fast-growing team of business"
            price={`$${prices.business}`}
            priceNote={cadence}
          >
            <p className="mb-2 text-xs text-ff-text-muted">Everything in Pro, plus</p>
            <CheckList items={BUSINESS_FEATURES} />
            <PlanFooter>
              <RateLimits onClick={() => toast("Rate limits apply per seat on the Business plan.")} />
              <UpgradeButton onClick={() => toast("Checkout is coming soon")} />
            </PlanFooter>
          </PlanCard>

          <PlanCard name="Enterprise" blurb="For enhanced security, control & support" price={`$${prices.enterprise}`} priceNote={cadence}>
            <p className="mb-2 text-xs text-ff-text-muted">Everything in Business, plus</p>
            <ul className="flex flex-col gap-1.5">
              {ENTERPRISE_FEATURES.map((item) => (
                <li key={item.text} className="flex items-start gap-2 text-[13px] text-ff-text-secondary">
                  <Check />
                  <span>
                    {item.text}
                    {item.badge ? (
                      <span className="ml-1.5 rounded bg-ff-deal-bg px-1 py-0.5 align-middle text-[9px] font-bold text-ff-deal-text">{item.badge}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            <PlanFooter>
              <RateLimits onClick={() => toast("Rate limits apply per seat on the Enterprise plan.")} />
              <UpgradeButton onClick={() => toast("Checkout is coming soon")} />
            </PlanFooter>
          </PlanCard>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  name,
  badge,
  blurb,
  price,
  priceNote,
  info,
  onInfo,
  children,
}: {
  name: string;
  badge?: string;
  blurb: string;
  price: string;
  priceNote: string;
  info?: string;
  onInfo?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="flex h-full flex-col rounded-xl border border-ff-strong bg-ff-card p-4 shadow-sm">
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm font-semibold">{name}</h2>
        {info ? (
          <button type="button" aria-label={info} title={info} onClick={onInfo} className="grid h-4 w-4 place-items-center rounded-full border border-ff-strong text-[10px] text-ff-text-muted">
            i
          </button>
        ) : null}
        {badge ? <span className="rounded bg-ff-badge-bg px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-ff-badge-text">{badge}</span> : null}
      </div>
      <p className="mt-1 min-h-8 text-xs leading-4 text-ff-text-muted">{blurb}</p>
      <p className="mt-3 text-2xl font-semibold">{price}</p>
      <p className="mt-0.5 mb-4 text-[11px] text-ff-text-faint">{priceNote}</p>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function CheckList({ items, onItem }: { items: string[]; onItem?: (item: string) => void }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-[13px] text-ff-text-secondary">
          <Check />
          {onItem && item.startsWith("Desktop app") ? (
            <button type="button" onClick={() => onItem(item)} className="text-left hover-ff-text">
              {item}
            </button>
          ) : (
            <span>{item}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="mt-0.5 shrink-0 text-ff-text-muted" aria-hidden="true">
      <path d="M2.5 7.2 5.4 10 11.5 3.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlanFooter({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex flex-col gap-3 pt-5">{children}</div>;
}

function RateLimits({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-[10px] font-semibold tracking-wider text-ff-text-faint hover:text-ff-text-muted">
      RATE LIMITS
    </button>
  );
}

function UpgradeButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full rounded-lg bg-[#6d4aff] py-2 text-sm font-medium text-on-accent hover:bg-[#7c5cff]">
      Upgrade
    </button>
  );
}
