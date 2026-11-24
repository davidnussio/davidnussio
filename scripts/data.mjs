// Everything the profile shows. Add a project here, then run
// `node scripts/build.mjs --readme` to refresh the README block.
//
// size:    half (two per row) | third (three per row)
// status:  live | active | soon
// metrics: read at build time, each with a fallback for when the API is down
//   { stars: "repo" }        GitHub stars (hidden below 5)
//   { installs: "pub.ext" }  VS Code Marketplace installs
//   { npm: "package" }       latest npm version
//   { release: "repo" }      latest GitHub release tag
//   { text: "…" }            shown as is

export const OWNER = "davidnussio";
export const ASSETS = `https://raw.githubusercontent.com/${OWNER}/${OWNER}/output`;

export const sections = [
  {
    title: "Products",
    intro: "Built and run by <a href=\"https://dambox.ch\">dambox Sagl</a>, in Ticino.",
    projects: [
      {
        slug: "bizcard",
        name: "bizCARD",
        size: "half",
        icon: "card",
        accent: ["#2f81f7", "#22d3ee"],
        kind: "SaaS · since 2021",
        summary: "Digital business cards for teams",
        description:
          "Digital business cards for teams, over NFC or a QR code, with no app to install. Dynamic QR codes, Microsoft Entra ID SSO and SCIM provisioning.",
        chips: ["Next.js", "Postgres", "Vercel"],
        status: "live",
        metrics: [{ text: "bizcard.ch" }],
        url: "https://bizcard.ch",
        links: { site: "https://bizcard.ch" },
      },
      {
        slug: "divano",
        name: "Divano",
        size: "half",
        icon: "tv",
        accent: ["#8b5cf6", "#d946ef"],
        kind: "Android · Android TV",
        summary: "IPTV player for phone and Android TV",
        description:
          "An IPTV player that ships with no content: bring your own playlist. Pause live TV, family profiles, end-to-end encrypted sync. No ads, no tracking.",
        chips: ["Kotlin", "Media3"],
        status: "live",
        metrics: [{ text: "Google Play" }],
        url: "https://divano.dambox.ch",
        links: {
          site: "https://divano.dambox.ch",
          "Google Play": "https://play.google.com/store/apps/details?id=ch.dambox.divano",
        },
      },
      {
        slug: "pace",
        name: "Pace",
        size: "third",
        icon: "stopwatch",
        accent: ["#f97316", "#fbbf24"],
        kind: "Android · Wear OS",
        summary: "Running pace calculator",
        description:
          "Running pace for the track: rep tables from 100 m to the marathon, splits every 400 m and training paces from a recent race. Offline, no account.",
        chips: ["Kotlin"],
        status: "live",
        metrics: [{ text: "Google Play" }],
        url: "https://pace.dambox.ch",
        links: {
          site: "https://pace.dambox.ch",
          "Google Play": "https://play.google.com/store/apps/details?id=com.davidnussio.pace",
        },
      },
      {
        slug: "lugo",
        name: "LuGo",
        size: "third",
        icon: "bus",
        accent: ["#14b8a6", "#4ade80"],
        kind: "Web app · Lugano",
        summary: "Real-time bus departures in Lugano",
        description:
          "Real-time bus departures in Lugano. A timer tells you when to leave, based on how far you are from the stop. Unofficial app.",
        chips: ["Next.js", "Effect"],
        status: "active",
        metrics: [{ text: "bus.oggi.ch" }],
        url: "https://bus.oggi.ch",
        links: { site: "https://bus.oggi.ch", repo: "lugano-timetable" },
      },
      {
        slug: "webcroc",
        name: "WebCroc",
        size: "third",
        icon: "transfer",
        accent: ["#22c55e", "#a3e635"],
        kind: "Web app · peer to peer",
        summary: "Peer-to-peer file transfer in the browser",
        description:
          "File transfer between two browsers: share a short code phrase or a QR code and the file streams over WebRTC, without passing through a server.",
        chips: ["React", "WebRTC"],
        status: "active",
        metrics: [{ text: "web-croc.web.app" }],
        url: "https://web-croc.web.app",
        links: { site: "https://web-croc.web.app" },
      },
    ],
  },
  {
    title: "Desktop apps",
    intro: "Native apps for the Mac, made with Tauri, Bun and Electrobun.",
    projects: [
      {
        slug: "granello",
        name: "Granello",
        size: "half",
        icon: "mic",
        accent: ["#eab308", "#84cc16"],
        kind: "macOS · Apple Silicon",
        summary: "Meeting notes with local transcription",
        description:
          "Meeting notes for the Mac: jot a few lines, Granello transcribes on your Mac with whisper.cpp and AI merges notes and transcript. No bot joins the call.",
        chips: ["Tauri", "Rust", "React"],
        status: "active",
        metrics: [{ release: "granello", fallback: "v0.2.6" }],
        url: "https://granello.dambox.ch",
        links: {
          site: "https://granello.dambox.ch",
          repo: "granello",
          Homebrew: "https://github.com/davidnussio/homebrew-tap",
        },
      },
      {
        slug: "ingombro",
        name: "Ingombro",
        size: "half",
        icon: "treemap",
        accent: ["#06b6d4", "#3b82f6"],
        kind: "macOS · TUI · CLI",
        summary: "Disk space analyzer for macOS",
        description:
          "Disk space analyzer with an interactive treemap, and Smart Clean for node_modules, target and other build folders.",
        chips: ["Bun", "Electrobun"],
        status: "active",
        metrics: [{ release: "ingombro", fallback: "v2.0.0" }],
        url: "https://ingombro.dambox.ch",
        links: { site: "https://ingombro.dambox.ch", repo: "ingombro" },
      },
      {
        slug: "aitelier",
        name: "AItelier",
        size: "half",
        icon: "image",
        accent: ["#ec4899", "#fb923c"],
        kind: "macOS",
        summary: "AI image studio with consistent styles",
        description:
          "An image studio that works like a chat. Styles live in a shared library, so images made a month apart look like the same hand.",
        chips: ["Bun", "Electrobun"],
        status: "active",
        metrics: [{ release: "aitelier", fallback: "v0.2.0" }],
        url: "https://github.com/davidnussio/aitelier",
        links: { repo: "aitelier" },
      },
      {
        slug: "arkimind",
        name: "Arkimind",
        size: "half",
        icon: "archive",
        accent: ["#6366f1", "#a78bfa"],
        kind: "Desktop app",
        summary: "Smart AI document filing",
        description:
          "Smart document filing: AI reads the content and decides where each document goes. No more manual folders.",
        chips: ["Bun", "Electrobun"],
        status: "soon",
        metrics: [{ release: "arkimind-releases", fallback: "v0.2.3" }],
        url: "https://github.com/davidnussio/arkimind-releases",
        links: { releases: "https://github.com/davidnussio/arkimind-releases" },
      },
    ],
  },
  {
    title: "Developer tools",
    intro: "Open source, around jq, secrets and Effect.",
    projects: [
      {
        slug: "jq-playground",
        name: "jq Playground",
        size: "half",
        icon: "braces",
        accent: ["#2f81f7", "#a78bfa"],
        kind: "VS Code extension",
        summary: "jq notebook for VS Code",
        description:
          "A jq notebook inside VS Code: write filters, pick a data source (file, URL, command output) and see the results instantly. AI help to explain and fix filters.",
        chips: ["TypeScript", "Effect", "jq"],
        status: "active",
        metrics: [
          { stars: "vscode-jq-playground", fallback: 53 },
          { installs: "davidnussio.vscode-jq-playground", fallback: 33000 },
        ],
        url: "https://jq.dambox.ch",
        links: {
          site: "https://jq.dambox.ch",
          repo: "vscode-jq-playground",
          Marketplace:
            "https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground",
        },
      },
      {
        slug: "envsec",
        name: "envsec",
        size: "half",
        icon: "key",
        accent: ["#10b981", "#2dd4bf"],
        kind: "CLI · npm · Homebrew",
        summary: "Secrets in the OS keychain instead of .env files",
        description:
          "Environment secrets in the OS credential store instead of .env files: macOS Keychain, Linux Secret Service, Windows Credential Manager.",
        chips: ["TypeScript", "CLI"],
        status: "active",
        metrics: [
          { stars: "envsec", fallback: 17 },
          { npm: "envsec", fallback: "v1.1.2" },
        ],
        url: "https://envsec.dev",
        links: {
          site: "https://envsec.dev",
          repo: "envsec",
          npm: "https://www.npmjs.com/package/envsec",
        },
      },
      {
        slug: "lazyjq",
        name: "lazyjq",
        size: "third",
        icon: "terminal",
        accent: ["#f97316", "#ef4444"],
        kind: "TUI · Homebrew",
        summary: "Terminal UI to explore JSON with jq",
        description:
          "Explore JSON with jq in the terminal, laid out in panels like lazygit: query, suggestions, history and result always on screen.",
        chips: ["Rust"],
        status: "active",
        metrics: [{ release: "lazyjq", fallback: "v0.4.1" }],
        url: "https://github.com/davidnussio/lazyjq",
        links: { repo: "lazyjq" },
      },
      {
        slug: "effect-cqrs",
        name: "effect-cqrs",
        size: "third",
        icon: "layers",
        accent: ["#a78bfa", "#60a5fa"],
        kind: "Library · npm",
        summary: "CQRS and event sourcing for Effect v4",
        description:
          "CQRS and event sourcing on Effect v4. Commands decide on events, events are the only source of truth, read models are projections you can rebuild.",
        chips: ["TypeScript", "Effect v4"],
        status: "active",
        metrics: [{ npm: "effect-cqrs", fallback: "v0.5.1" }],
        url: "https://effect-cqrs.dambox.ch",
        links: {
          site: "https://effect-cqrs.dambox.ch",
          repo: "effect-cqrs",
          npm: "https://www.npmjs.com/package/effect-cqrs",
        },
      },
      {
        slug: "oauth-lab",
        name: "OAuth Lab",
        size: "third",
        icon: "shield",
        accent: ["#eab308", "#f97316"],
        kind: "Interactive lab",
        summary: "Interactive OAuth 2.0 and OpenID Connect simulator",
        description:
          "Animated simulator for OAuth 2.0 and OpenID Connect. Every flow runs against a real authorization server living in a Service Worker.",
        chips: ["TypeScript", "Service Worker"],
        status: "active",
        metrics: [{ text: "in Italian" }],
        url: "https://davidnussio.github.io/oauth-simulator/",
        links: {
          site: "https://davidnussio.github.io/oauth-simulator/",
          repo: "oauth-simulator",
        },
      },
    ],
  },
];

export const hero = {
  name: "David Nussio",
  place: "lugano, switzerland · 46.00°N 8.95°E",
  tagline: "Software engineer. Products at dambox, developer tools in the open.",
  typed: [
    "building bizCARD, digital business cards for teams",
    "jq Playground: {installs} installs on VS Code",
    "TypeScript · Effect · Next.js · Bun · Kotlin · Rust",
    "secrets belong in the keychain, not in .env",
  ],
  installs: { installs: "davidnussio.vscode-jq-playground", fallback: 33000 },
  since: 2010,
};

export const pills = [
  { slug: "bizcard", label: "bizcard.ch", url: "https://bizcard.ch", primary: true },
  { slug: "dambox", label: "dambox.ch", url: "https://dambox.ch" },
  { slug: "x", label: "@davidnussio on X", url: "https://x.com/davidnussio" },
  {
    slug: "marketplace",
    label: "VS Code Marketplace",
    url: "https://marketplace.visualstudio.com/publishers/davidnussio",
  },
  { slug: "npm", label: "npm", url: "https://www.npmjs.com/~davidnussio" },
];

export const stack = [
  ["Languages", ["TypeScript", "Kotlin", "Rust", "C++", "Go", "Lua", "Bash"]],
  ["Web", ["Effect", "Next.js", "React", "Tailwind", "Vite", "Bun", "Node.js", "Tauri"]],
  ["Data & infra", ["Postgres", "SQLite", "Redis", "Docker", "Kubernetes", "Google Cloud", "Azure", "Vercel", "GitHub Actions"]],
  ["Daily drivers", ["Neovim", "fish", "Ghostty", "zellij", "mise", "jq", "Claude Code"]],
];
