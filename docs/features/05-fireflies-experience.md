# Feature 5 — Fireflies experience

Features 1–4 decide what the app can do. This feature decides whether it feels like Fireflies while doing it. Visual similarity is one of the grading criteria, so this is real scope, not polish to skip.

This doc covers the parts every screen shares: navigation and layout, the transcript and summary panels, forms and modals, search and filters, toasts, and placeholders such as Settings. Screen behavior (what the list returns, how seek works, how a meeting is created) stays in features 1–4.

## Goal

A reviewer who has used Fireflies opens the app and recognizes it within a few seconds: the dark workspace, the left sidebar, the purple Capture button, the meetings list, and the meeting page with a player over notes and transcript.

The test is not pixel-for-pixel equality. It is this: nothing on screen looks like a generic admin template or a different product, and nothing the reviewer clicks is dead.

## What "like Fireflies" means here

The reference is the live app at app.fireflies.ai, checked while signed in to the 23/CS/075 workspace, plus the screenshots shared during the build. Where the live app and the assignment disagree, the assignment wins, and this doc says so.

What makes it read as Fireflies, in order of impact:

1. **The shell.** Dark background, left sidebar with the workspace name on top, the same nav items in the same order, and a top bar with search, a bell, and a purple Capture button.
2. **The meetings list.** Dense rows: a colored square, the title, then a small grey line with host, date, time, and duration, and participant avatars on the right.
3. **The meeting page.** Player on top, then Notes and Transcript, with timestamps you can click.
4. **Small chrome.** The trial banner, the green "40% OFF" badge, "3 Free meetings", the Help button, and an invite card. Cheap to add, and they make the screen recognizable.
5. **Feedback.** Every action answers with a toast or a visible change, never silence.

## Visual language

Every screen uses the same small set of values. New UI should use these values, not new ones.

| Use | Value |
|---|---|
| App background | `#121214` |
| Sidebar, player, cards | `#17171a`, `#1c1c20` |
| Menus, popovers | `#242428` |
| Hairline borders | `white/5` for dividers, `white/10` for inputs and cards |
| Main text | `#f4f4f5` |
| Secondary text | `#a1a1aa` (labels, meta lines) |
| Primary accent | `#6d4aff` (buttons, active tab underline, active line border) |
| Active transcript line | `#241c3d` background |
| Success and badge green | text `#86efac`, background `#14532d` |
| Danger | `#f87171` for text, a red fill only on the destructive button |
| Type | Geist, 13px for UI, 14px for body, 11–12px for meta |
| Radius | 8px controls, 12px cards and menus, 16px modals |

Rules:

- Grey meta text must stay readable on dark. `#6b7080` and darker greys are too dim for labels or buttons.
- Purple is for the main action on a screen and for "where you are now" (active tab, active line). It is not decoration.
- No light surfaces inside the dark app. A white or lilac pill on a dark modal is a bug.

## Required

The assignment asks for five things. Each one below lists what is required, what the app has today, and the gap.

### 1. Navigation and layout (library + detail)

Required:

- One shell on every page: sidebar, top bar, content. Library and meeting page share it.
- The sidebar shows where you are (the active item is highlighted).
- You can get from the library to a meeting and back in one click each way.
- The top bar has global search and a primary create action.

Sidebar rules (decided with the user, keep them):

- **Wide sidebar** on Home, Tasks, Analytics, and Settings. Order: Maya Chen with a teal "MC"; Home, AskFred, Meetings, Tasks, AI Skills; a divider; Analytics, Voice Agents; a divider; Upgrade with "40% OFF". Then a gap, then a footer: Try Email Assistant (Gmail logo), Integrations, Settings, and the invite card.
- **Compact icon rail** on Meetings (`/meetings` and every `/meetings/[id]`), AskFred, and Upgrade. On these routes the rail is always compact. The avatar is "MC" and the profile menu says Maya Chen.
- The signed-in name is Maya Chen everywhere. The old workspace label "23/CS/075" is gone.

Today:

- The shell, both sidebar modes, the top bar, and the Help button are built in `Shell.tsx`. The free-trial banner and the "3 Free meetings" label were removed. Light and dark themes share the same layout.
- The meeting page has a "Meetings" link back to the library.

Gaps:

- Once collapsed on a wide-sidebar page, the sidebar cannot be reopened without a refresh. The rail needs an expand button, or the collapse button should go away.
- Below tablet width (about 600px) with the wide sidebar open, the header search shrinks until the placeholder reads "Searc". A minimum width pushes the bell and Capture off screen instead, so this belongs to the mobile layout in Later additions. At 1024px and wider the header fits.

### 2. Transcript and summary panels

Required by the assignment and [PRD](../PRD.md) section 4.5:

- The transcript and the summary are separate panels, not one long page.
- The summary panel holds the summary, topics, and action items. The transcript panel holds the lines and the find box.
- The player stays visible while either panel scrolls.

Today:

- The player sits on top. Below it, **Notes** and **Transcript** are tabs, so only one shows at a time. This matches the live app at the width we inspected.

**Decision: side by side on wide screens.** The live meeting page was checked at 1440px. Notes (with an AI Skills tab) fills the center column. The right column has its own AskFred / Transcript tabs. Opening Transcript there leaves Notes visible, so the two panels sit side by side. That also satisfies the PRD's "separate panels".

So:

- At `xl` (1280px) and wider, Notes fills the main column and Transcript gets its own right column, about 420px wide. The Notes / Transcript tab switch is hidden at this width because both are visible. A note timestamp seeks the player, and the matching line lights up next to it.
- Below `xl`, keep the Notes / Transcript tabs.
- Transcript times use two digits for minutes (`00:37`), the same as the live transcript and the note timestamps.
- The live page puts the playback controls in a bar at the bottom and hides the sidebar behind a menu button. This build keeps the player on top and the compact rail. Both are layout choices, not missing behavior.

Whatever the layout, the panels keep the same look: same headers, same spacing, and the active line uses the same purple as the active tab.

### 3. Forms, modals, search, and filters

Required:

- Create and edit are modals over the page, not separate routes.
- Delete asks for confirmation in a modal.
- Search and filters on the library are always visible (PRD 4.5).
- Errors from the API appear in the form or as a toast. They are never silent.

Every modal works the same way:

- A dark card (`#1c1c20`) on a dim backdrop that clearly separates it from the page.
- Title on the left, a close "×" on the right.
- **Escape** closes the modal, and so does clicking the backdrop. Neither works while a save is running.
- Focus goes to the first field on open.
- Labels sit above the fields in readable grey. Inputs are dark with a purple focus border.
- Buttons at the bottom right: Cancel is quiet but readable, and the main action is purple. Delete is the only red button.
- While saving, the main button says "Saving…" or "Deleting…" and is disabled.
- The modal has `role="dialog"` and `aria-modal="true"`, with the title as its label.

Today:

- Add meeting, Edit meeting, and Delete meeting modals exist in `CreateMeetingModal.tsx`. They submit, show API errors inline, and disable while saving.
- The delete modal now shows its own error and blocks closing while it deletes. That change is still uncommitted from another chat.

Gaps, seen in the browser:

- **Light-theme leftovers.** The inactive Paste / Upload / Blank buttons and the participant chips are light lilac (`#f3f0ff` / `#5136d6`). On the dark modal they look like another product.
- **Unreadable text.** Cancel in Add meeting is `#3c4154` on `#1c1c20` and is close to invisible. Labels, hints, and "Close" use `#6b7080`, which is too dim.
- **Weak backdrop.** It is `#1b1d27` at 40% opacity, so the sidebar stays fully legible behind the modal. Use something like black at 60%.
- **Close control.** It is the word "Close". It should be an "×" icon button with an accessible label.
- **Keyboard and screen readers.** There is no Escape handling, no dialog role, and no first-field focus.
- **Error color.** Inline errors use `#b42318`, a dark red that is hard to read on dark. Use `#f87171`.

Search and filters (behavior lives in feature 1):

- The header search field is the one global search. Its placeholder is "Search by title or keyword".
- On the library, Filters (date from, date to, newest/oldest) sit in a bar under "Hosted by me / Shared with me". Feature 1 decided they stay visible.
- In-transcript find sits in the Transcript panel header, with "N found", Prev, and Next.
- All inputs use the same dark field style as the modals.

### 4. Notifications and toasts

Required:

- Every action that changes data, or fails, answers with a toast. That covers create, save, delete, action item changes, copy, download, and API errors.
- Every "coming soon" control answers with a toast that names the feature.
- Toasts disappear on their own and never block the page.

Today:

- `Toast.tsx` is one context with `toast(message, "ok" | "err")`. Toasts stack bottom-right, last 3.2 seconds, and use a darker red for errors.
- About 40 calls across the screens cover the success, error, and coming-soon cases.

Gaps:

- **Collisions.** Toasts sit in the same bottom-right corner as the Help button and cover it. Move them, or raise them above it.
- **No screen-reader announcement.** The container needs `aria-live="polite"`, or `role="status"`; errors can be `role="alert"`.
- **Weak error tone.** An error toast looks almost like a success toast. Add a small icon or a left color bar: green check for success, red for error.
- **No limit.** Many rapid clicks can stack many toasts. Keep at most three.

The bell icon is a placeholder. It toasts "No new notifications" and does not open a notification center. A notification center is later work.

### 5. Settings and other placeholders

Required:

- Settings is a real page at `/settings`, reachable from the sidebar footer, the compact rail, and the profile menu.
- Profile is a visible placeholder: the workspace label and a small menu. It never asks for a login.
- Features outside the assignment can appear in the nav, but they must be honest about being placeholders.

Placeholder rules (apply to every screen):

1. **No dead clicks.** Every visible control navigates, opens something, or shows a toast.
2. **Say what is missing.** Use "<Feature> is coming soon", not a vague "Not available".
3. **Never fake AI.** AskFred and AI Skills must not show model output that is not real. A toast saying a live model is not wired is fine.
4. **Keep the look.** A placeholder page uses the same shell, title style, and card style as a real page.

Today:

- `/settings` is a dark page with a "Coming soon" card.
- The profile menu shows "23/CS/075", a note that the workspace is already signed in, Account (toast), and Settings (link).
- Analytics is an upgrade lock screen over a blurred dashboard. Upgrade is a plan page.
- AI Skills, Voice Agents, Try Email Assistant, Integrations, Create Team, Help, the bell, and the trial banner all toast.

Gaps:

- The Settings page is one card. Fireflies settings is a page with sections. Show the section list as disabled rows (Profile, Notetaker, Integrations, Privacy, Billing), each marked coming soon. It will read as Fireflies Settings, not a 404 with styling.
- AskFred's Send and prompts must keep saying that no live model is wired, until the "ask about this meeting" bonus exists.

## Low-level design

Shared pieces, so every screen looks the same without copying classes:

| Piece | File | Responsibility |
|---|---|---|
| Shell | `frontend/components/Shell.tsx` | Banner, sidebar (wide or rail by route), top bar, global search, Help, profile menu |
| Toasts | `frontend/components/Toast.tsx` | `useToast()`, stacking, auto-dismiss, tones, live region |
| Modal | `frontend/components/CreateMeetingModal.tsx` (`Modal`, `Field`, `inputClass`) | Backdrop, card, title, close, Escape, focus, dialog role |
| Meeting list rows | `frontend/components/MeetingList.tsx` | Row look, row menu, empty state |
| Meeting layout | `frontend/components/MeetingView.tsx` | Header, player, Notes / Transcript panels, tool rail |
| Placeholder pages | `frontend/app/settings`, `analytics`, `upgrade` | Same shell, title, and card |

Implementation notes:

- `Modal`, `Field`, and `inputClass` stay inside `CreateMeetingModal.tsx`, because every modal lives in that file. Move them to their own file only if a modal appears somewhere else.
- The sidebar mode is still one line in `Shell.tsx`: `narrow = /meetings | /upgrade | /ask`. Add a route there if it needs the compact rail.
- Toast tone stays `"ok" | "err"`. Do not add more tones until a screen needs one.
- Colors stay as Tailwind arbitrary values, as today. If the same value spreads to many more files, move it into CSS variables in `globals.css`. Do not do that as part of this feature.

## How to build it

In order of what a reviewer notices first:

1. **Modals.** Replace the light pills and chips with dark ones (`#2a2a2e` inactive, purple active). Raise label, hint, and Cancel text to `#a1a1aa` or lighter. Darken the backdrop. Swap "Close" for "×". Add Escape, first-field focus, and the dialog role. Use `#f87171` for inline errors.
2. **Toasts.** Move them clear of the Help button. Add `aria-live`, a tone mark, and a three-toast limit.
3. **Panels.** Notes and Transcript side by side at `xl` and wider, tabs below. Two-digit transcript times.
4. **Sidebar.** Add an expand control on the rail for wide-sidebar pages.
5. **Settings.** Turn the single card into a section list of coming-soon rows.
6. **Sweep.** Click every visible control on every screen. Anything that does nothing gets a route or a toast.

Each step is small and touches only the files in the table above. None of them changes the API.

## Done when

Walk through the app at a normal laptop width (about 1440px) and again at about 1024px:

1. Home, Tasks, Analytics, and Settings show the wide sidebar. Meetings, a meeting page, AskFred, and Upgrade show the rail. If you collapse the sidebar on Home, you can expand it again without a refresh.
2. Library to meeting to library works in one click each way, and the active nav item follows.
3. On a meeting at about 1440px, Notes and Transcript are both visible and scroll on their own, with the player still visible. At about 1024px they are tabs.
4. Open Add meeting: nothing light or lilac shows, every label and button is readable, Escape closes it, and the cursor starts in Title.
5. Submit the form empty, or with a bad transcript, and see a readable error. Submit it correctly and see a success toast.
6. Delete a meeting: a confirmation modal, then a toast, then the library without that row.
7. Trigger three toasts quickly. They stack, they do not cover the Help button, and they disappear.
8. Click every sidebar item, top-bar button, banner link, and profile menu item. Each one navigates, opens, or toasts. None is dead.
9. Open Settings from the sidebar, the rail, and the profile menu. It is a styled placeholder, not an error.
10. Nothing on any screen claims a live AI produced content it did not produce.

## Later additions

- Light theme or a theme switch. The live product is dark, and that is the target.
- Real notification center behind the bell.
- Real Settings forms (profile, notetaker, privacy, billing), login, and teams.
- Command palette behind ⌘K. Today ⌘K is only a label.
- Exact Fireflies icon set and illustrations. The current icons are hand-drawn SVG stand-ins.
- Animations: modal fade, toast slide, sidebar width transition.
- Mobile layout below tablet width, including a header that fits: search as an icon, and Upgrade only in the sidebar.
- A real video player and a waveform built from the audio.
- Keyboard shortcuts beyond Escape (for example, `/` to search, `j` / `k` through lines).

## Out of scope

- Copying Fireflies logos, brand assets, or marketing copy word for word. Match the layout and feel, not the trademarks.
- Behavior owned by features 1–4. This feature changes how things look and answer, not what the API returns.
