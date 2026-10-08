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
    <div className="h-full overflow-y-auto bg-[#121214] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h1 className="text-lg font-semibold">
            You are on the <span className="text-white">Free</span> plan
          </h1>
          <p className="mt-1 text-sm text-[#a1a1aa]">You need to upgrade your plan to perform this action.</p>
          <div className="mt-4 inline-flex items-center rounded-full bg-[#1c1c20] p-1 text-[11px] font-semibold tracking-wide">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-3 py-1 ${billing === "monthly" ? "bg-[#2a2a2e] text-white" : "text-[#a1a1aa]"}`}
            >
              MONTHLY
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={`flex items-center gap-2 rounded-full px-3 py-1 ${billing === "annual" ? "bg-[#2a2a2e] text-white" : "text-[#a1a1aa]"}`}
            >
              ANNUAL
              <span className="rounded bg-[#14532d] px-1.5 py-0.5 text-[9px] font-bold text-[#86efac]">2 MONTHS FREE</span>
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
            <p className="mt-4 mb-2 text-xs text-[#a1a1aa]">Features</p>
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
              <button type="button" disabled className="w-full rounded-lg bg-[#2a2a2e] py-2 text-sm text-[#71717a]">
                Current
              </button>
            </PlanFooter>
          </PlanCard>

          <PlanCard name="Pro" blurb="Best suited for individuals and small teams" price={`$${prices.pro}`} priceNote={cadence}>
            <CheckList items={PRO_LIMITS} />
            <p className="mt-4 mb-2 text-xs text-[#a1a1aa]">Everything in Free, plus</p>
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
            <p className="mb-2 text-xs text-[#a1a1aa]">Everything in Pro, plus</p>
            <CheckList items={BUSINESS_FEATURES} />
            <PlanFooter>
              <RateLimits onClick={() => toast("Rate limits apply per seat on the Business plan.")} />
              <UpgradeButton onClick={() => toast("Checkout is coming soon")} />
            </PlanFooter>
          </PlanCard>

          <PlanCard name="Enterprise" blurb="For enhanced security, control & support" price={`$${prices.enterprise}`} priceNote={cadence}>
            <p className="mb-2 text-xs text-[#a1a1aa]">Everything in Business, plus</p>
            <ul className="flex flex-col gap-1.5">
              {ENTERPRISE_FEATURES.map((item) => (
                <li key={item.text} className="flex items-start gap-2 text-[13px] text-[#d4d4d8]">
                  <Check />
                  <span>
                    {item.text}
                    {item.badge ? (
                      <span className="ml-1.5 rounded bg-[#14532d] px-1 py-0.5 align-middle text-[9px] font-bold text-[#86efac]">{item.badge}</span>
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
    <section className="flex h-full flex-col rounded-xl border border-white/10 bg-[#18181b] p-4">
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm font-semibold">{name}</h2>
        {info ? (
          <button type="button" aria-label={info} title={info} onClick={onInfo} className="grid h-4 w-4 place-items-center rounded-full border border-white/20 text-[10px] text-[#a1a1aa]">
            i
          </button>
        ) : null}
        {badge ? <span className="rounded bg-[#312e81] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#c4b5fd]">{badge}</span> : null}
      </div>
      <p className="mt-1 min-h-8 text-xs leading-4 text-[#a1a1aa]">{blurb}</p>
      <p className="mt-3 text-2xl font-semibold">{price}</p>
      <p className="mt-0.5 mb-4 text-[11px] text-[#71717a]">{priceNote}</p>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function CheckList({ items, onItem }: { items: string[]; onItem?: (item: string) => void }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-[13px] text-[#d4d4d8]">
          <Check />
          {onItem && item.startsWith("Desktop app") ? (
            <button type="button" onClick={() => onItem(item)} className="text-left hover:text-white">
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
    <svg width="14" height="14" viewBox="0 0 14 14" className="mt-0.5 shrink-0 text-[#a1a1aa]" aria-hidden="true">
      <path d="M2.5 7.2 5.4 10 11.5 3.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlanFooter({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex flex-col gap-3 pt-5">{children}</div>;
}

function RateLimits({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-[10px] font-semibold tracking-wider text-[#71717a] hover:text-[#a1a1aa]">
      RATE LIMITS
    </button>
  );
}

function UpgradeButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full rounded-lg bg-[#6d4aff] py-2 text-sm font-medium text-white hover:bg-[#7c5cff]">
      Upgrade
    </button>
  );
}
