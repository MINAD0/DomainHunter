type MarketingNavItem = {
  href: string;
  label: string;
};

type CallToAction = {
  href: string;
  label: string;
};

type Highlight = {
  title: string;
  body: string;
};

type Stat = {
  value: string;
  label: string;
};

type HomepageSection = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
};

type CommandEntry = {
  label: string;
  command: string;
};

type ValuePillar = {
  title: string;
  body: string;
};

type GuideSection = {
  id: string;
  title: string;
  summary: string;
  paragraphs: readonly string[];
  command?: string;
  bullets?: readonly string[];
};

export const marketingNav: readonly MarketingNavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/how-to-use", label: "How to Use" },
  { href: "/app", label: "Workspace" }
] as const;

export const ctaLinks: {
  readonly primary: CallToAction;
  readonly secondary: CallToAction;
  readonly workspace: CallToAction;
} = {
  primary: { href: "#get-started", label: "Get Started" },
  secondary: { href: "/how-to-use", label: "Read the Guide" },
  workspace: { href: "/app", label: "Open Workspace" }
} as const;

export const homepageHighlights: readonly Highlight[] = [
  {
    title: "Move before the market notices",
    body: "Surface open names while they still feel mispriced, not after they have already been picked over."
  },
  {
    title: "Shortlist names worth your time",
    body: "Generate tighter candidate sets and keep the hunt centered on readable names with real upside."
  },
  {
    title: "Keep the hunt focused on upside",
    body: "Spend less time checking dead ends and more time deciding which open names are worth acting on."
  }
] as const;

export const homepageStats: readonly Stat[] = [
  { value: "100+", label: "candidates per run" },
  { value: "4", label: "availability paths" },
  { value: "1", label: "open-only output stream" }
] as const;

export const homepageSections: readonly HomepageSection[] = [
  {
    id: "timing",
    eyebrow: "Timing",
    title: "Good names disappear while slow workflows are still opening tabs.",
    body: "Domain Hunter is built for solo hunters who care about timing, quality, and leverage. Instead of bouncing between brainstorm notes, registrar searches, and scattered checks, you can move through a tighter loop and stay closer to the names that still matter."
  },
  {
    id: "workflow-edge",
    eyebrow: "Workflow Edge",
    title: "Generate ideas, check availability, and keep the signal.",
    body: "The tool turns a messy search process into a simple operating rhythm: generate a focused batch, check it through your chosen provider chain, and keep only the open names. The result feels less like busywork and more like market filtering."
  },
  {
    id: "solo-hunter",
    eyebrow: "Built for Solo Hunters",
    title: "A sharper tool for independent operators.",
    body: "Whether you are searching for future brand assets, flipping candidates, or simply collecting better names before others do, the product is designed for people working alone who value speed, taste, and repeatable process."
  },
  {
    id: "get-started",
    eyebrow: "Get Started",
    title: "Start locally, get to open names quickly, and refine from there.",
    body: "Install the dependencies, open the interactive menu, and run your first focused search. When you want more control, move into AI-assisted prompts, provider tuning, and direct CLI usage."
  }
] as const;

export const quickStartCommands: {
  readonly install: CommandEntry;
  readonly firstRun: CommandEntry;
  readonly cliExample: CommandEntry;
  readonly aiExample: CommandEntry;
} = {
  install: {
    label: "Install dependencies",
    command: "pip install -r requirements.txt"
  },
  firstRun: {
    label: "Open the interactive menu",
    command: "python domain_hunter.py"
  },
  cliExample: {
    label: "Run a direct CLI search",
    command: "python domain_hunter.py --niches ai robot cloud --keywords agent store hub infra --tlds com ai io --count 100"
  },
  aiExample: {
    label: "Add AI-assisted idea generation",
    command: "python domain_hunter.py --ai-generate --ai-topic \"agentic developer tools and AI infrastructure\" --count 100"
  }
} as const;

export const heroPreviewLines: readonly string[] = [
  "$ python domain_hunter.py --ai-generate --count 100",
  "trend-aware niches loaded",
  "checking availability via provider chain",
  "open names appended to available.txt"
] as const;

export const valuePillars: readonly ValuePillar[] = [
  {
    title: "Readable candidate generation",
    body: "Combine niches, keywords, prefixes, suffixes, and TLDs without losing readability."
  },
  {
    title: "Availability-first workflow",
    body: "Use API-first checking paths and keep taken or unknown results out of the spotlight."
  },
  {
    title: "Quiet operator ergonomics",
    body: "Interactive mode for first runs, direct CLI control for tighter iteration, and saved output for follow-through."
  }
] as const;

export const guideSections: readonly GuideSection[] = [
  {
    id: "orientation",
    title: "Orientation",
    summary: "What Domain Hunter does and how the workflow fits solo domain hunting.",
    paragraphs: [
      "Domain Hunter is a Python CLI for generating domain ideas and checking availability with an API-first provider chain.",
      "The practical outcome is simple: you move from a niche or trend prompt to a filtered list of open names without spending the whole session jumping between tabs."
    ]
  },
  {
    id: "install",
    title: "Install",
    summary: "Set up the local environment before the first run.",
    paragraphs: [
      "Install the project requirements from the repository root. This pulls in the HTTP client, WHOIS support, and terminal color utilities the CLI expects."
    ],
    command: quickStartCommands.install.command
  },
  {
    id: "first-run",
    title: "First Run",
    summary: "Use the interactive menu to configure the first search cleanly.",
    paragraphs: [
      "The simplest starting path is the interactive menu. It lets you set niches, keywords, TLDs, provider behavior, output settings, and AI options without memorizing flags."
    ],
    command: quickStartCommands.firstRun.command
  },
  {
    id: "cli-usage",
    title: "Direct CLI Usage",
    summary: "Skip the menu when you want a faster repeated workflow.",
    paragraphs: [
      "Once you know the inputs you like, use direct flags for tighter iteration. This is the better mode when you are running several focused searches in a row."
    ],
    command: quickStartCommands.cliExample.command
  },
  {
    id: "ai-generation",
    title: "AI-Assisted Generation",
    summary: "Expand or replace manual term lists with OpenRouter-driven suggestions.",
    paragraphs: [
      "Set an OpenRouter API key when you want trend-aware niches and keywords before the availability checks start.",
      "Use AI as a faster ideation layer, not as the product story. It works best when you already know the market direction you want to search."
    ],
    command: quickStartCommands.aiExample.command,
    bullets: [
      "Set OPENROUTER_API_KEY before running AI generation.",
      "Use --ai-topic to steer the idea space.",
      "Add --ai-replace when you want AI terms to replace the manual lists instead of merging with them."
    ]
  },
  {
    id: "providers",
    title: "Provider Setup",
    summary: "Choose the most reliable availability path for the way you work.",
    paragraphs: [
      "Domain Hunter supports WhoisXML, GoDaddy, RapidAPI, and WHOIS fallback. API-first checking is usually more consistent than relying on raw WHOIS across every TLD."
    ],
    bullets: [
      "WhoisXML is a clean default when you already have a key.",
      "GoDaddy works well when you want registrar-backed availability checks.",
      "RapidAPI is flexible when you already use a marketplace provider.",
      "WHOIS fallback is available, but it should be the fallback path rather than the main plan."
    ]
  },
  {
    id: "useful-options",
    title: "Useful Options",
    summary: "Tune speed, resilience, and label variations without overcomplicating the run.",
    paragraphs: [
      "Most users only need a small handful of controls once the core workflow is in place."
    ],
    bullets: [
      "--concurrency controls how many checks run at once.",
      "--delay spaces request starts to reduce rate-limit pressure.",
      "--retries and --backoff help absorb temporary provider failures.",
      "--prefixes and --suffixes widen the candidate set without changing the niche itself.",
      "--append keeps growing available.txt instead of refreshing it for each run.",
      "--verbose shows provider-side errors without polluting the open-domain output."
    ]
  },
  {
    id: "output",
    title: "Output and Workflow",
    summary: "Understand what appears during a run and what gets saved.",
    paragraphs: [
      "Available domains print to the console and are appended to available.txt. Taken and unknown domains stay quiet by default, which keeps the session focused on usable output."
    ]
  },
  {
    id: "workflow",
    title: "Practical Hunting Loop",
    summary: "A simple operating pattern for solo hunters.",
    paragraphs: [
      "A strong working rhythm is more useful than memorizing every flag. Start with a focused trend, run a controlled batch, review only the open names, and tighten the next search based on what looked promising."
    ],
    bullets: [
      "Choose a niche or live trend.",
      "Generate a focused batch with a sensible count.",
      "Run availability checks through your preferred providers.",
      "Review only the open names and save the strongest ones.",
      "Repeat with sharper inputs instead of broader noise."
    ]
  }
] as const;
