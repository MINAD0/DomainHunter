# Domain Hunter Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium two-page marketing site for Domain Hunter while preserving the existing workspace UI under `/app`.

**Architecture:** Split the Next.js app into two route groups: a marketing surface at `/` and `/how-to-use`, and a workspace surface at `/app/*` that keeps the current dashboard and generator flows. Drive the new marketing pages from a shared content module so the copy, guide sections, and CTAs stay consistent and testable.

**Tech Stack:** Next.js 15 app router, React 19, TypeScript, Tailwind CSS, Vitest

---

## File Structure

- Create: `frontend/lib/site-content.ts`
  Responsibility: marketing-site copy, guide sections, command snippets, and shared page metadata.
- Create: `frontend/lib/site-content.test.ts`
  Responsibility: verify content structure, CTA targets, guide sections, and command snippets before UI work.
- Create: `frontend/app/(marketing)/layout.tsx`
  Responsibility: marketing-specific layout and metadata.
- Create: `frontend/app/(marketing)/page.tsx`
  Responsibility: premium homepage with hero, sections, and `Get Started` flow.
- Create: `frontend/app/(marketing)/how-to-use/page.tsx`
  Responsibility: complete guide page with anchors, commands, provider guidance, and workflow loop.
- Create: `frontend/app/(workspace)/layout.tsx`
  Responsibility: wrap workspace routes with the existing `AppShell`.
- Create: `frontend/app/(workspace)/app/page.tsx`
  Responsibility: move current dashboard page to `/app`.
- Create: `frontend/app/(workspace)/app/generator/page.tsx`
- Create: `frontend/app/(workspace)/app/results/page.tsx`
- Create: `frontend/app/(workspace)/app/saved/page.tsx`
- Create: `frontend/app/(workspace)/app/settings/page.tsx`
- Create: `frontend/app/(workspace)/app/logs/page.tsx`
  Responsibility: preserve current tool pages under `/app/*`.
- Modify: `frontend/app/layout.tsx`
  Responsibility: remove global `AppShell`, define root metadata and body classes only.
- Modify: `frontend/app/globals.css`
  Responsibility: add premium marketing tokens and shared utility styles without breaking workspace pages.
- Modify: `frontend/components/app-shell.tsx`
  Responsibility: retarget workspace nav items from `/` and `/generator` to `/app` and `/app/generator`.
- Delete/replace via move: `frontend/app/page.tsx`, `frontend/app/generator/page.tsx`, `frontend/app/results/page.tsx`, `frontend/app/saved/page.tsx`, `frontend/app/settings/page.tsx`, `frontend/app/logs/page.tsx`
  Responsibility: retire old root-level workspace routes after moving them into the route group.

### Task 1: Add testable marketing content data

**Files:**
- Create: `frontend/lib/site-content.ts`
- Create: `frontend/lib/site-content.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import {
  guideSections,
  homepageHighlights,
  marketingNav,
  quickStartCommands
} from "./site-content";

describe("marketing site content", () => {
  it("defines the primary marketing navigation", () => {
    expect(marketingNav).toEqual([
      { href: "/", label: "Overview" },
      { href: "/how-to-use", label: "How to Use" },
      { href: "/app", label: "Workspace" }
    ]);
  });

  it("keeps the homepage promise focused on outcomes", () => {
    expect(homepageHighlights).toHaveLength(3);
    expect(homepageHighlights.map((item) => item.title)).toEqual([
      "Move before the market notices",
      "Shortlist names worth your time",
      "Keep the hunt focused on upside"
    ]);
  });

  it("includes complete-guide commands for install and first run", () => {
    expect(quickStartCommands.install.command).toContain("pip install -r requirements.txt");
    expect(quickStartCommands.firstRun.command).toContain("python domain_hunter.py");
  });

  it("publishes all guide anchors in reading order", () => {
    expect(guideSections.map((section) => section.id)).toEqual([
      "orientation",
      "install",
      "first-run",
      "cli-usage",
      "ai-generation",
      "providers",
      "useful-options",
      "output",
      "workflow"
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- site-content.test.ts`
Expected: FAIL with module-not-found or export errors for `./site-content`

- [ ] **Step 3: Write minimal implementation**

```ts
export const marketingNav = [
  { href: "/", label: "Overview" },
  { href: "/how-to-use", label: "How to Use" },
  { href: "/app", label: "Workspace" }
] as const;

export const homepageHighlights = [
  { title: "Move before the market notices", body: "..." },
  { title: "Shortlist names worth your time", body: "..." },
  { title: "Keep the hunt focused on upside", body: "..." }
] as const;

export const quickStartCommands = {
  install: {
    label: "Install dependencies",
    command: "pip install -r requirements.txt"
  },
  firstRun: {
    label: "Open the interactive menu",
    command: "python domain_hunter.py"
  }
} as const;

export const guideSections = [
  { id: "orientation", title: "Orientation" },
  { id: "install", title: "Install" },
  { id: "first-run", title: "First Run" },
  { id: "cli-usage", title: "Direct CLI Usage" },
  { id: "ai-generation", title: "AI-Assisted Generation" },
  { id: "providers", title: "Provider Setup" },
  { id: "useful-options", title: "Useful Options" },
  { id: "output", title: "Output and Workflow" },
  { id: "workflow", title: "Practical Hunting Loop" }
] as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- site-content.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/site-content.ts frontend/lib/site-content.test.ts
git commit -m "test: add marketing site content coverage"
```

### Task 2: Split marketing and workspace routing

**Files:**
- Modify: `frontend/app/layout.tsx`
- Create: `frontend/app/(marketing)/layout.tsx`
- Create: `frontend/app/(workspace)/layout.tsx`
- Create: `frontend/app/(workspace)/app/page.tsx`
- Create: `frontend/app/(workspace)/app/generator/page.tsx`
- Create: `frontend/app/(workspace)/app/results/page.tsx`
- Create: `frontend/app/(workspace)/app/saved/page.tsx`
- Create: `frontend/app/(workspace)/app/settings/page.tsx`
- Create: `frontend/app/(workspace)/app/logs/page.tsx`
- Modify: `frontend/components/app-shell.tsx`
- Delete after move: `frontend/app/page.tsx`, `frontend/app/generator/page.tsx`, `frontend/app/results/page.tsx`, `frontend/app/saved/page.tsx`, `frontend/app/settings/page.tsx`, `frontend/app/logs/page.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { marketingNav } from "@/lib/site-content";

describe("workspace navigation targets", () => {
  it("links back to the moved workspace routes", () => {
    expect(marketingNav.find((item) => item.label === "Workspace")?.href).toBe("/app");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- site-content.test.ts`
Expected: FAIL if `/app` is not present or routing content is incomplete

- [ ] **Step 3: Write minimal implementation**

```tsx
// frontend/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Domain Hunter",
  description: "Find open domains before others do."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// frontend/app/(workspace)/layout.tsx
import { AppShell } from "@/components/app-shell";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

```tsx
// frontend/components/app-shell.tsx nav items
const navItems = [
  { href: "/app", label: "Dashboard", icon: Gauge },
  { href: "/app/generator", label: "Geo Generator", icon: Sparkles },
  { href: "/app/results", label: "Results", icon: ListChecks },
  { href: "/app/saved", label: "Saved Domains", icon: Bookmark },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/logs", label: "Logs", icon: ScrollText }
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- site-content.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/app/layout.tsx frontend/app/(workspace) frontend/components/app-shell.tsx
git commit -m "refactor: move workspace routes under app"
```

### Task 3: Build the premium homepage

**Files:**
- Create: `frontend/app/(marketing)/page.tsx`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/lib/site-content.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { ctaLinks, homepageSections } from "./site-content";

describe("homepage marketing structure", () => {
  it("anchors the primary CTA to the homepage get-started section", () => {
    expect(ctaLinks.primary.href).toBe("#get-started");
  });

  it("keeps the premium homepage section order stable", () => {
    expect(homepageSections.map((section) => section.id)).toEqual([
      "timing",
      "workflow-edge",
      "solo-hunter",
      "get-started"
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- site-content.test.ts`
Expected: FAIL with missing exports for `ctaLinks` or `homepageSections`

- [ ] **Step 3: Write minimal implementation**

```tsx
// frontend/app/(marketing)/page.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ctaLinks, homepageHighlights, homepageSections, quickStartCommands } from "@/lib/site-content";

export default function MarketingHomePage() {
  return (
    <main>
      <section>
        <h1>Catch open domains before the market notices.</h1>
        <Link href={ctaLinks.primary.href}>
          {ctaLinks.primary.label}
          <ArrowRight />
        </Link>
      </section>
      <section id="get-started">
        <code>{quickStartCommands.install.command}</code>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- site-content.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/app/(marketing)/page.tsx frontend/app/globals.css frontend/lib/site-content.ts frontend/lib/site-content.test.ts
git commit -m "feat: add premium homepage for domain hunter"
```

### Task 4: Build the complete guide page

**Files:**
- Create: `frontend/app/(marketing)/how-to-use/page.tsx`
- Modify: `frontend/lib/site-content.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { guideSections, quickStartCommands } from "./site-content";

describe("guide page content", () => {
  it("includes advanced guidance for AI generation and providers", () => {
    expect(guideSections.some((section) => section.id === "ai-generation")).toBe(true);
    expect(guideSections.some((section) => section.id === "providers")).toBe(true);
  });

  it("keeps the first-run command aligned with the CLI", () => {
    expect(quickStartCommands.firstRun.command).toBe("python domain_hunter.py");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- site-content.test.ts`
Expected: FAIL if guide content is incomplete

- [ ] **Step 3: Write minimal implementation**

```tsx
// frontend/app/(marketing)/how-to-use/page.tsx
import Link from "next/link";
import { guideSections, marketingNav, quickStartCommands } from "@/lib/site-content";

export default function HowToUsePage() {
  return (
    <main>
      <nav>
        {guideSections.map((section) => (
          <Link key={section.id} href={`#${section.id}`}>
            {section.title}
          </Link>
        ))}
      </nav>
      <section id="install">
        <pre>{quickStartCommands.install.command}</pre>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- site-content.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/app/(marketing)/how-to-use/page.tsx frontend/lib/site-content.ts frontend/lib/site-content.test.ts
git commit -m "feat: add complete guide page"
```

### Task 5: Verify build and preview quality

**Files:**
- Modify as needed after verification: `frontend/app/globals.css`, `frontend/app/(marketing)/page.tsx`, `frontend/app/(marketing)/how-to-use/page.tsx`, `frontend/components/app-shell.tsx`

- [ ] **Step 1: Run the unit tests**

Run: `npm test -- site-content.test.ts frontend/lib/domain.test.ts`
Expected: PASS

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: successful Next.js build with exit code 0

- [ ] **Step 3: Start the dev server**

Run: `npm run dev`
Expected: local preview available on `http://localhost:3000`

- [ ] **Step 4: Verify desktop and mobile layouts**

Run:

```bash
Use browser automation to inspect:
- /
- /how-to-use
- /app
At 390x844, 768x1024, and 1440x900
```

Expected: no text overlap, no horizontal overflow, no broken CTAs, and functioning navigation between the marketing pages and workspace.

- [ ] **Step 5: Commit**

```bash
git add frontend
git commit -m "feat: launch domain hunter marketing site"
```
