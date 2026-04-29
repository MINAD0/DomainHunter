# Domain Hunter Marketing Site and Guide Design

## Overview

This project adds a public-facing website for `Domain Hunter`, a Python CLI tool for generating domain ideas and checking availability. The website has two jobs:

1. Present the tool like a premium product for solo domain hunters.
2. Teach users how to install, run, and use the tool through a complete guide.

The site should not feel like generic SaaS marketing or raw developer docs. The homepage should feel editorial, high-end, and opportunity-aware. The guide page should feel polished and practical, like an operator manual for a serious niche tool.

## Audience

The primary audience is solo domain hunters.

They care about:

- finding open domains before other people do
- spotting names that may have resale or brand potential
- spending less time on repetitive search and availability checks
- using a focused tool instead of bouncing between tabs and registrars

The site should speak to users who think in terms of timing, opportunity, and leverage, not broad startup-team collaboration.

## Product Positioning

`Domain Hunter` should be positioned as a premium edge tool for discovering open names early without wasting time.

The core message is:

> Find open domains before others do, and turn more of your search time into real opportunity.

Supporting message themes:

- move faster from idea to available name
- reduce wasted time on manual checking
- work from sharper candidate lists
- surface names worth acting on while they are still open

The homepage should focus on outcomes, not on AI as the headline feature. AI-assisted generation can appear later in the guide as a capability, not the main brand story.

## Site Structure

The site consists of two distinct pages:

### 1. Homepage

Purpose:

- sell the value of the tool
- establish brand tone
- create desire and trust
- move users into the onboarding path

Primary CTA:

- `Get Started`

Secondary CTA:

- link to the full `How to Use` page

### 2. How to Use Page

Purpose:

- explain setup and usage in a complete but readable way
- help first-time users succeed quickly
- document the key workflows and important options

The relationship between the pages is intentional:

- the homepage is editorial, selective, and persuasive
- the guide page is practical, structured, and instructional

They should feel like parts of the same product experience, but not duplicate each other.

## Homepage Design

### Experience

The homepage should feel like a luxury market-intelligence product for people who hunt digital value. It should imply precision, timing, and opportunity. It must avoid noisy startup cliches, cartoon illustrations, and crowded feature grids.

The tone should be premium and high-end, with a subtle money-and-time angle. It should suggest upside without sounding cheap, hypey, or scammy.

### Visual Direction

Use a darker and warmer visual palette:

- deep charcoal or near-black base
- muted gold, bronze, or warm metallic accent
- restrained cream or soft white for high-value text

Typography direction:

- expressive serif or high-character display face for headlines
- cleaner readable supporting face for body copy and UI labels

The composition should feel more like a boutique research product than a general developer utility.

### Homepage Content Flow

#### Hero

The hero introduces the main promise:

- find open domains before the market notices
- turn long search sessions into faster opportunity discovery

The hero should include:

- strong premium headline
- short supporting paragraph
- primary `Get Started` CTA
- secondary guide link
- polished CLI or output preview, not a generic dashboard card

#### Timing Section

This section explains why timing matters in domain hunting:

- good names disappear quickly
- manual workflows are too slow and fragmented
- value often comes from speed plus taste

This section should frame the problem in a sophisticated way rather than using fear-based copy.

#### Workflow Edge Section

This section explains how `Domain Hunter` compresses the process:

- generate candidate names
- check availability
- keep only the open ones

The point is not to list features but to show a tighter path from idea to action.

#### Solo Hunter Section

This section speaks directly to the intended audience:

- built for people searching independently
- useful for brand hunters, flippers, and opportunity-driven solo operators
- helps users spend more time evaluating good names and less time wrestling with repetitive checks

#### Close

The final section returns to the opportunity frame:

- use the tool to move earlier
- capture better names
- stop wasting hours on low-signal searching

This close should reinforce the primary CTA without sounding pushy.

## How to Use Page Design

### Experience

The guide page should feel like elegant documentation. It should keep the premium identity, but shift into a brighter, more legible reading environment that supports scanning and long-form reading.

It should not feel like raw API documentation. It should feel like a guided manual for real users.

### Content Structure

The page should guide readers through a logical sequence:

#### 1. Orientation

One short section that says what the tool does and what users will accomplish with it.

#### 2. Install

Show the dependency install step:

```bash
pip install -r requirements.txt
```

#### 3. First Run

Show the simplest starting path:

```bash
python domain_hunter.py
```

Explain that this opens the interactive menu and helps users configure the run.

#### 4. Direct CLI Usage

Show a concise example using flags such as niches, keywords, tlds, and count.

#### 5. AI-Assisted Generation

Explain how users can set `OPENROUTER_API_KEY`, use `--ai-generate`, choose a topic, and optionally replace manual inputs.

This should be framed as an enhancement path, not the main identity of the product.

#### 6. Provider Setup

Explain the supported provider paths:

- WhoisXML
- GoDaddy
- RapidAPI
- WHOIS fallback

This section should help users understand that API-first checking is generally preferred for consistency.

#### 7. Useful Options

Summarize important controls such as:

- concurrency
- delay
- retries
- prefixes and suffixes
- append behavior
- verbose logging

#### 8. Output and Workflow

Explain that open domains print to the console and are appended to `available.txt`, while taken and unknown results stay quiet by default.

#### 9. Practical Hunting Loop

Add a short tactical section for solo hunters:

1. choose a niche or trend
2. generate a focused batch
3. run checks
4. review only the open names
5. repeat with sharper inputs

This section translates documentation into actual behavior and helps the page feel more useful than a reference list.

## Interaction Design

### Homepage

- strong first-viewport CTA
- visible next-section hint below the fold
- tasteful scroll-based reveal or staggered entrance motion
- buttons and nav should feel crisp and deliberate

### Guide Page

- anchored section navigation
- well-spaced code blocks
- readable section rhythm
- strong hierarchy for commands, explanations, and notes

The guide page should make it easy to jump between sections without feeling like a wiki.

## Content Strategy

### Homepage Writing Style

- concise
- polished
- selective
- value-aware
- confident without hype

Avoid:

- loud startup slogans
- generic "all-in-one" claims
- overexplaining the CLI at the top
- making AI the main storyline

### Guide Writing Style

- direct
- practical
- calm
- easy to scan

The guide should assume curiosity, not expertise. It should help a motivated first-time user succeed without sounding elementary.

## Asset Strategy

The homepage should include visual product context rather than abstract decoration.

Recommended assets:

- refined CLI or terminal-style previews
- branded visual panels that suggest signal, filtering, and discovery
- subtle background textures or gradients

Avoid:

- generic stock photos
- cartoon graphics
- oversized feature-card walls
- decorative blobs or random visual noise

## Technical Direction

This repo does not currently contain a web app stack. For the first version, the site should be created as a standalone local preview inside the repository under a dedicated folder such as `design-preview/`, unless implementation planning identifies a clearer lightweight structure.

The implementation should support:

- a clickable two-page experience
- responsive layouts for mobile and desktop
- maintainable HTML, CSS, and minimal JavaScript or a small framework only if justified

Because the content is primarily presentation plus documentation, the first version should favor a lightweight implementation over unnecessary tooling complexity.

## Responsive Expectations

The site must work cleanly on:

- phone width around 390px
- tablet width around 768px
- desktop width around 1440px

Particular care is required for:

- hero text wrapping
- CTA layout
- code block overflow
- section navigation behavior on smaller screens

## Quality Bar

The site is successful if:

- the homepage feels premium and productized
- the message is clearly aimed at solo domain hunters
- the value proposition emphasizes opportunity and time leverage
- the guide page makes the tool feel easy to start and powerful to grow into
- the two pages feel related but intentionally different

## Out of Scope

The first version does not need:

- user accounts
- email capture flows
- pricing tables
- blog infrastructure
- large content systems
- API documentation beyond what supports tool usage

## Recommended Next Step

Create an implementation plan for the two-page site, then build a local clickable preview before polishing final copy.
