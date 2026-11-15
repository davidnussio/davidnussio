#!/usr/bin/env node
// Draws the profile's own images (hero, project cards, link pills, stack) as
// plain SVG, with no dependencies. The workflow publishes them to the `output`
// branch next to the stats cards.
//
//   node scripts/build.mjs [outDir]   write the SVGs (default: dist)
//   node scripts/build.mjs --readme   rewrite the generated block of README.md
//   node scripts/build.mjs --offline  skip the network, use the fallbacks

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ASSETS, OWNER, hero, pills, sections, stack } from "./data.mjs";

const args = process.argv.slice(2);
const OFFLINE = args.includes("--offline");
const README = args.includes("--readme");
const OUT = args.find((a) => !a.startsWith("--")) ?? "dist";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";
const MONO_EM = 0.602;

const THEMES = {
  dark: {
    cardTop: "#171c24",
    cardBottom: "#0d1117",
    border: "#30363d",
    title: "#f0f6fc",
    text: "#9198a1",
    muted: "#7d8590",
    chipBg: "#21262d",
    chipText: "#c9d1d9",
    glow: 0.2,
    live: "#3fb950",
    soon: "#d29922",
  },
  light: {
    cardTop: "#ffffff",
    cardBottom: "#f6f8fa",
    border: "#d1d9e0",
    title: "#1f2328",
    text: "#59636e",
    muted: "#6e7781",
    chipBg: "#eaeef2",
    chipText: "#424a53",
    glow: 0.13,
    live: "#1a7f37",
    soon: "#9a6700",
  },
};

const SIZES = {
  wide: { w: 880, h: 188, descW: 520, descSize: 14, lineH: 20, lines: 3, percent: "100%" },
  half: { w: 436, h: 188, descW: 392, descSize: 13.5, lineH: 19.5, lines: 3, percent: "49.5%" },
  third: { w: 288, h: 216, descW: 244, descSize: 13, lineH: 18, lines: 4, percent: "32.8%" },
};

const STATUS = { live: "live", active: "active", soon: "coming soon" };

// 24×24 line icons, drawn with a white stroke on the accent tile.
const ICONS = {
  card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10.5" r="2"/><path d="M5.8 16c.6-1.6 4.8-1.6 5.4 0M14 10h4M14 14h3"/>',
  tv: '<rect x="3" y="4.5" width="18" height="12.5" rx="2"/><path d="M8 20.5h8M12 17v3.5"/><path d="M10.4 8.2v5l4.2-2.5z" fill="#fff" stroke-width="1.2"/>',
  stopwatch: '<circle cx="12" cy="14" r="7"/><path d="M12 14V10M10 3h4M12 3v4M18.4 7.6l1.2-1.2"/>',
  bus: '<rect x="4" y="3.5" width="16" height="14" rx="2.5"/><path d="M4 11h16M7.5 17.5v2M16.5 17.5v2"/><circle cx="8" cy="14.3" r=".6" fill="#fff"/><circle cx="16" cy="14.3" r=".6" fill="#fff"/>',
  transfer: '<path d="M7 4 3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7"/>',
  treemap: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M12 3v18M12 11h9M3 14.5h9M16.5 11v10"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.7"/><path d="M21 15l-5-5L5 21"/>',
  archive: '<rect x="3" y="4" width="18" height="4.5" rx="1.2"/><path d="M5 8.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5M10 12.5h4"/>',
  braces: '<path d="M8.5 3.5c-2 0-2.8.9-2.8 2.8v2.5c0 1.6-.8 3.2-2.4 3.2 1.6 0 2.4 1.6 2.4 3.2v2.5c0 1.9.8 2.8 2.8 2.8M15.5 3.5c2 0 2.8.9 2.8 2.8v2.5c0 1.6.8 3.2 2.4 3.2-1.6 0-2.4 1.6-2.4 3.2v2.5c0 1.9-.8 2.8-2.8 2.8"/>',
  key: '<circle cx="8" cy="15.5" r="4.2"/><path d="M11 12.5 20 3.5M16 7.5l3 3M13.5 10l2 2"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5"/>',
  layers: '<path d="M12 3l9 4.8-9 4.8-9-4.8zM3 12.2l9 4.8 9-4.8M3 16.4l9 4.8 9-4.8"/>',
  shield: '<path d="M12 3l8 3v5.5c0 4.6-3.3 8.2-8 9.5-4.7-1.3-8-4.9-8-9.5V6zM8.8 12l2.3 2.3 4.2-4.4"/>',
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Rough advance widths (in em) for the system sans stack: good enough to wrap.
const charEm = (c) =>
  c === " " ? 0.29
  : /[ilj.,:;'|!]/.test(c) ? 0.27
  : /[ftr()[\]\-/]/.test(c) ? 0.36
  : /[mwMW]/.test(c) ? 0.87
  : /[A-Z]/.test(c) ? 0.68
  : /[0-9]/.test(c) ? 0.58
  : 0.55;
const sansWidth = (s, size) => [...s].reduce((n, c) => n + charEm(c), 0) * size;
const monoWidth = (s, size) => [...s].length * size * MONO_EM;

function wrap(text, width, size, maxLines) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && sansWidth(next, size) > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    throw new Error(`Text needs ${lines.length} lines, only ${maxLines} fit: "${text}"`);
  }
  return lines;
}

// ---------------------------------------------------------------- live data

async function getJson(url, init) {
  if (OFFLINE) return null;
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`  ! ${url}: ${error.message}, using the fallback`);
    return null;
  }
}

const github = (path) =>
  getJson(`https://api.github.com/${path}`, {
    headers: {
      "User-Agent": "profile-cards",
      Accept: "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });

const compact = (n) => (n >= 1000 ? `${Math.floor(n / 1000)}k` : String(n));
const version = (tag) => `v${String(tag).replace(/^[^0-9]*/, "")}`;

const cache = new Map();
function once(key, load) {
  if (!cache.has(key)) cache.set(key, load());
  return cache.get(key);
}

async function installs(extension, fallback) {
  const data = await once(`installs:${extension}`, () =>
    getJson("https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery", {
      method: "POST",
      headers: {
        Accept: "application/json;api-version=3.0-preview.1",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filters: [{ criteria: [{ filterType: 7, value: extension }] }], flags: 256 }),
    }),
  );
  const stats = data?.results?.[0]?.extensions?.[0]?.statistics ?? [];
  return stats.find((s) => s.statisticName === "install")?.value ?? fallback;
}

async function metric(m) {
  if (m.text) return m.text;
  if (m.stars) {
    const repo = await once(`repo:${m.stars}`, () => github(`repos/${OWNER}/${m.stars}`));
    const stars = repo?.stargazers_count ?? m.fallback;
    return stars >= 5 ? `★ ${stars}` : null;
  }
  if (m.installs) return `${compact(await installs(m.installs, m.fallback))} installs`;
  if (m.npm) {
    const pkg = await getJson(`https://registry.npmjs.org/${m.npm}/latest`);
    return pkg?.version ? version(pkg.version) : m.fallback;
  }
  if (m.release) {
    const release = await github(`repos/${OWNER}/${m.release}/releases/latest`);
    return release?.tag_name ? version(release.tag_name) : m.fallback;
  }
  return null;
}

// -------------------------------------------------------------------- cards

function chipRow(chips, x, y, maxRight, t) {
  const size = 10.5;
  let out = "";
  for (const chip of chips) {
    const w = monoWidth(chip, size) + 16;
    if (x + w > maxRight) break;
    out += `<rect x="${x}" y="${y}" width="${w.toFixed(1)}" height="22" rx="11" fill="${t.chipBg}"/>`;
    out += `<text x="${(x + 8).toFixed(1)}" y="${y + 15}" font-family="${MONO}" font-size="${size}" fill="${t.chipText}">${esc(chip)}</text>`;
    x += w + 6;
  }
  return out;
}

// Right-hand illustration of the wide cards.
const ART = {
  card(t, [a, b]) {
    const qr = [];
    const cells = ["111.1.1", "1.1.111", "111..1.", "..1.1.1", "1.111..", "11..1.1", "1.1.111"];
    cells.forEach((row, r) =>
      [...row].forEach((c, i) => {
        if (c === "1") qr.push(`<rect x="${164 + i * 7}" y="${62 + r * 7}" width="6" height="6" rx="1.5"/>`);
      }),
    );
    return `<g transform="translate(626 22) rotate(-5 116 72)">
  <rect x="14" y="20" width="232" height="132" rx="14" fill="${a}" opacity=".16"/>
  <rect width="232" height="132" rx="14" fill="${t.cardTop}" stroke="${t.border}"/>
  <rect width="232" height="6" rx="3" fill="url(#accent)"/>
  <circle cx="38" cy="46" r="16" fill="url(#accent)"/>
  <rect x="64" y="34" width="72" height="9" rx="4.5" fill="${t.title}" opacity=".85"/>
  <rect x="64" y="50" width="48" height="7" rx="3.5" fill="${t.muted}" opacity=".6"/>
  <rect x="22" y="82" width="104" height="7" rx="3.5" fill="${t.muted}" opacity=".45"/>
  <rect x="22" y="96" width="84" height="7" rx="3.5" fill="${t.muted}" opacity=".45"/>
  <rect x="22" y="110" width="60" height="7" rx="3.5" fill="${b}" opacity=".8"/>
  <g fill="${t.title}" opacity=".85">${qr.join("")}</g>
</g>`;
  },
  code(t, [a, b]) {
    const line = (y, parts) =>
      `<text x="18" y="${y}" xml:space="preserve" font-family="${MONO}" font-size="12">${parts
        .map(([text, fill]) => `<tspan fill="${fill}">${esc(text)}</tspan>`)
        .join("")}</text>`;
    return `<g transform="translate(622 24)">
  <rect width="236" height="140" rx="12" fill="${t.cardTop}" stroke="${t.border}"/>
  <circle cx="18" cy="16" r="4" fill="${t.muted}" opacity=".5"/><circle cx="32" cy="16" r="4" fill="${t.muted}" opacity=".5"/><circle cx="46" cy="16" r="4" fill="${t.muted}" opacity=".5"/>
  <path d="M0 30h236" stroke="${t.border}"/>
  ${line(52, [["jq ", a], ["'.[] | select(", t.title]])}
  ${line(70, [["   .stars > 50", b], [")'", t.title]])}
  ${line(88, [["  repos.json", t.muted]])}
  <path d="M0 100h236" stroke="${t.border}"/>
  ${line(122, [["{ ", t.muted], ['"name"', a], [": ", t.muted], ['"jq…"', t.live], [" }", t.muted]])}
</g>`;
  },
};

function card(p, theme, metricText) {
  const t = THEMES[theme];
  const S = SIZES[p.size];
  const [a, b] = p.accent;
  const pad = 22;
  const lines = wrap(p.description, S.descW, S.descSize, S.lines);
  const chipY = S.h - pad - 22;
  const metricW = metricText ? monoWidth(metricText, 11.5) + 12 : 0;
  const rightLimit = (p.art ? pad + S.descW : S.w - pad) - metricW;
  const statusText = STATUS[p.status];
  const statusColor = p.status === "soon" ? t.soon : t.live;
  const statusX = p.art ? pad + S.descW : S.w - pad;
  const dotX = statusX - monoWidth(statusText, 10.5) - 9;
  const metricX = p.art ? pad + S.descW : S.w - pad;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S.w}" height="${S.h}" viewBox="0 0 ${S.w} ${S.h}" role="img" aria-label="${esc(`${p.name}: ${p.summary}`)}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.cardTop}"/><stop offset="1" stop-color="${t.cardBottom}"/></linearGradient>
  <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
  <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}" stop-opacity=".75"/><stop offset=".35" stop-color="${t.border}"/><stop offset="1" stop-color="${t.border}"/></linearGradient>
  <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${S.w - 30} -10) scale(${Math.round(S.w * 0.55)} 190)"><stop offset="0" stop-color="${b}" stop-opacity="${t.glow}"/><stop offset="1" stop-color="${b}" stop-opacity="0"/></radialGradient>
  <clipPath id="clip"><rect width="${S.w}" height="${S.h}" rx="16"/></clipPath>
</defs>
<style>
  .pulse { animation: pulse 2.4s ease-in-out infinite; transform-origin: ${dotX}px 35.5px; }
  @keyframes pulse { 0%, 100% { opacity: .35; transform: scale(1); } 50% { opacity: 0; transform: scale(2.6); } }
  @media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
</style>
<g clip-path="url(#clip)">
  <rect width="${S.w}" height="${S.h}" fill="url(#bg)"/>
  <rect width="${S.w}" height="${S.h}" fill="url(#glow)"/>
  ${p.art ? ART[p.art](t, p.accent) : ""}
</g>
<rect x=".5" y=".5" width="${S.w - 1}" height="${S.h - 1}" rx="15.5" fill="none" stroke="url(#edge)"/>
<rect x="${pad}" y="${pad}" width="44" height="44" rx="12" fill="url(#accent)"/>
<g transform="translate(${pad + 10} ${pad + 10})" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[p.icon]}</g>
<text x="${pad + 58}" y="41" font-family="${SANS}" font-size="20" font-weight="700" fill="${t.title}">${esc(p.name)}</text>
<text x="${pad + 58}" y="59" font-family="${MONO}" font-size="10.5" letter-spacing=".4" fill="${t.muted}">${esc(p.kind.toUpperCase())}</text>
${`<circle class="pulse" cx="${dotX.toFixed(1)}" cy="35.5" r="3.5" fill="${statusColor}"/>
<circle cx="${dotX.toFixed(1)}" cy="35.5" r="3.5" fill="${statusColor}"/>
<text x="${statusX}" y="39" text-anchor="end" font-family="${MONO}" font-size="10.5" fill="${statusColor}">${statusText}</text>`}
${lines.map((l, i) => `<text x="${pad}" y="${94 + i * S.lineH}" font-family="${SANS}" font-size="${S.descSize}" fill="${t.text}">${esc(l)}</text>`).join("\n")}
${chipRow(p.chips, pad, chipY, rightLimit, t)}
${metricText ? `<text x="${metricX}" y="${chipY + 15}" text-anchor="end" font-family="${MONO}" font-size="11.5" font-weight="600" fill="${t.title}">${esc(metricText)}</text>` : ""}
</svg>
`;
}

// --------------------------------------------------------------------- hero

function heroSvg({ projectCount, installsText }) {
  const W = 880;
  const H = 272;
  const size = 15;
  const x0 = 62;
  const lines = hero.typed.map((l) => l.replace("{installs}", installsText));
  const n = lines.length;
  const slot = 4.5;
  const widths = lines.map((l) => monoWidth(l, size) + 4);
  const f = (v) => v.toFixed(4);
  const caretValues = [];
  const caretTimes = [];

  // Line 0 is fully typed at t=0, so a renderer that shows only the first
  // frame still gets a complete sentence. Each line holds, is erased, then
  // the next one is typed in the tail of the same slot.
  const typed = lines
    .map((l, i) => {
      const s = i / n;
      const w = widths[i].toFixed(1);
      const [values, times] =
        i === 0
          ? [`${w};${w};0;0;${w}`, [0, 0.6 / n, 0.7 / n, 1 - 0.3 / n, 1]]
          : [`0;0;${w};${w};0;0`, [0, s - 0.3 / n, s, s + 0.6 / n, s + 0.7 / n, 1]];
      caretValues.push(x0 + widths[i], x0 + widths[i], x0);
      caretTimes.push(s, s + 0.6 / n, s + 0.7 / n);
      return `<clipPath id="t${i}"><rect x="${x0}" y="168" height="26" width="${i === 0 ? w : 0}"><animate attributeName="width" dur="${n * slot}s" repeatCount="indefinite" values="${values}" keyTimes="${times.map(f).join(";")}"/></rect></clipPath>
<text clip-path="url(#t${i})" x="${x0}" y="186" font-family="${MONO}" font-size="${size}" fill="#a5d8ff">${esc(l)}</text>`;
    })
    .join("\n");
  caretValues.push(x0 + widths[0]);
  caretTimes.push(1);

  const stats = [
    [String(projectCount), "active projects"],
    [`${installsText}+`, "VS Code installs"],
    [String(hero.since), "on GitHub since"],
  ];
  let sx = 40;
  const statsSvg = stats
    .map(([value, label]) => {
      const vw = sansWidth(value, 24);
      const out = `<text x="${sx}" y="238" font-family="${SANS}" font-size="24" font-weight="700" fill="#fff">${esc(value)}</text>
<text x="${(sx + vw + 9).toFixed(1)}" y="237" font-family="${MONO}" font-size="10.5" letter-spacing=".6" fill="#fff" fill-opacity=".62">${esc(label.toUpperCase())}</text>`;
      sx += vw + 9 + monoWidth(label, 10.5) + label.length * 0.6 + 34;
      return out;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`${hero.name}. ${hero.tagline}`)}">
<defs>
  <linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1020"/><stop offset="1" stop-color="#10172a"/></linearGradient>
  <linearGradient id="name" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#bfdbfe"/></linearGradient>
  <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b1020" stop-opacity=".72"/><stop offset=".6" stop-color="#0b1020" stop-opacity=".25"/><stop offset="1" stop-color="#0b1020" stop-opacity="0"/></linearGradient>
  <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="46"/></filter>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="#fff" fill-opacity=".13"/></pattern>
  <radialGradient id="mask-g" cx=".78" cy=".4" r=".7"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <mask id="mask"><rect width="${W}" height="${H}" fill="url(#mask-g)"/></mask>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="20"/></clipPath>
</defs>
<style>
  .b { animation: drift 16s ease-in-out infinite alternate; }
  .b2 { animation-duration: 21s; animation-delay: -6s; }
  .b3 { animation-duration: 26s; animation-delay: -11s; }
  @keyframes drift { 0% { transform: translate(0, 0); } 50% { transform: translate(-46px, 22px); } 100% { transform: translate(34px, -18px); } }
  .caret { animation: blink 1s steps(2, start) infinite; }
  @keyframes blink { to { visibility: hidden; } }
  .ring { animation: ring 2.4s ease-out infinite; transform-origin: 45px 43.5px; }
  @keyframes ring { 0% { opacity: .5; transform: scale(1); } 100% { opacity: 0; transform: scale(3); } }
  @media (prefers-reduced-motion: reduce) { .b, .caret, .ring { animation: none; } }
</style>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#base)"/>
  <g filter="url(#blur)">
    <circle class="b" cx="690" cy="60" r="130" fill="#4338ca" opacity=".85"/>
    <circle class="b b2" cx="840" cy="210" r="120" fill="#0ea5e9" opacity=".7"/>
    <circle class="b b3" cx="520" cy="270" r="100" fill="#c026d3" opacity=".5"/>
  </g>
  <rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#mask)"/>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="19.5" fill="none" stroke="#fff" stroke-opacity=".1"/>
<circle class="ring" cx="45" cy="43.5" r="4" fill="#3fb950"/>
<circle cx="45" cy="43.5" r="4" fill="#3fb950"/>
<text x="58" y="48" font-family="${MONO}" font-size="12" letter-spacing=".3" fill="#fff" fill-opacity=".7">${esc(hero.place)}</text>
<text x="38" y="116" font-family="${SANS}" font-size="62" font-weight="800" letter-spacing="-2" fill="url(#name)">${esc(hero.name)}</text>
<text x="40" y="150" font-family="${SANS}" font-size="18" fill="#fff" fill-opacity=".8">${esc(hero.tagline)}</text>
<text x="40" y="186" font-family="${MONO}" font-size="${size}" font-weight="700" fill="#38bdf8">❯</text>
${typed}
<rect class="caret" x="${(x0 + widths[0]).toFixed(1)}" y="172" width="8" height="18" rx="1.5" fill="#a5d8ff"><animate attributeName="x" dur="${n * slot}s" repeatCount="indefinite" values="${caretValues.map((v) => v.toFixed(1)).join(";")}" keyTimes="${caretTimes.map(f).join(";")}"/></rect>
<path d="M40 208h800" stroke="#fff" stroke-opacity=".1"/>
${statsSvg}
</svg>
`;
}

// ------------------------------------------------------------ pills & stack

function pillSvg(pill, theme) {
  const t = THEMES[theme];
  const size = 12;
  const label = `${pill.label} ↗`;
  const w = Math.round(monoWidth(label, size) + 28);
  const fill = pill.primary ? "url(#accent)" : t.chipBg;
  const color = pill.primary ? "#fff" : t.chipText;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="30" viewBox="0 0 ${w} 30" role="img" aria-label="${esc(pill.label)}">
<defs><linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f6feb"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient></defs>
<rect x=".5" y=".5" width="${w - 1}" height="29" rx="14.5" fill="${fill}" stroke="${pill.primary ? "none" : t.border}"/>
<text x="${w / 2}" y="19.5" text-anchor="middle" font-family="${MONO}" font-size="${size}" font-weight="600" fill="${color}">${esc(label)}</text>
</svg>
`;
}

function stackSvg(theme) {
  const t = THEMES[theme];
  const W = 880;
  const rowH = 36;
  const H = stack.length * rowH - 8;
  const rows = stack
    .map(([label, items], r) => {
      const y = r * rowH;
      let x = 124;
      const chips = items
        .map((item) => {
          const w = monoWidth(item, 11.5) + 20;
          const out = `<rect x="${x.toFixed(1)}" y="${y + 0.5}" width="${w.toFixed(1)}" height="27" rx="13.5" fill="${t.chipBg}" stroke="${t.border}"/>
<text x="${(x + 10).toFixed(1)}" y="${y + 18}" font-family="${MONO}" font-size="11.5" fill="${t.chipText}">${esc(item)}</text>`;
          x += w + 7;
          return out;
        })
        .join("\n");
      if (x > W) throw new Error(`Stack row "${label}" is ${Math.round(x)}px wide, ${W} fit`);
      return `<text x="0" y="${y + 18}" font-family="${MONO}" font-size="10.5" letter-spacing=".8" fill="${t.muted}">${esc(label.toUpperCase())}</text>
${chips}`;
    })
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(stack.map(([l, i]) => `${l}: ${i.join(", ")}`).join(". "))}">
${rows}
</svg>
`;
}

// ------------------------------------------------------------------- README

const themed = (name, alt, attrs) =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="${ASSETS}/${name}-dark.svg" /><img src="${ASSETS}/${name}-light.svg" alt="${esc(alt)}" ${attrs} /></picture>`;

function linkList(p) {
  return Object.entries(p.links)
    .map(([label, target]) =>
      label === "repo" ? `[repo](https://github.com/${OWNER}/${target})` : `[${label}](${target})`,
    )
    .join(" · ");
}

function readmeBlock() {
  const out = [];
  for (const section of sections) {
    out.push(`### ${section.title}`, "", `<sub>${section.intro}</sub>`, "", '<p align="center">');
    for (const p of section.projects) {
      out.push(
        `  <a href="${p.url}">${themed(`card-${p.slug}`, `${p.name}: ${p.summary}`, `width="${SIZES[p.size].percent}"`)}</a>`,
      );
    }
    out.push("</p>", "");
  }
  out.push("<details>", "<summary><b>The same projects as a list, with all the links</b></summary>", "<br />", "");
  out.push("| Project | What it is | Links |", "| --- | --- | --- |");
  for (const p of sections.flatMap((s) => s.projects)) {
    out.push(`| **${p.name}** | ${p.summary} | ${linkList(p)} |`);
  }
  out.push("", "</details>");
  return out.join("\n");
}

async function updateReadme() {
  const path = join(ROOT, "README.md");
  const readme = await readFile(path, "utf8");
  const start = "<!-- projects:start -->";
  const end = "<!-- projects:end -->";
  const from = readme.indexOf(start);
  const to = readme.indexOf(end);
  if (from < 0 || to < 0) throw new Error(`README.md needs the ${start} and ${end} markers`);
  await writeFile(path, `${readme.slice(0, from + start.length)}\n${readmeBlock()}\n${readme.slice(to)}`);
  console.log("README.md updated");
}

// --------------------------------------------------------------------- main

async function buildImages() {
  await mkdir(OUT, { recursive: true });
  const files = [];
  const save = (name, svg) => files.push(writeFile(join(OUT, name), svg));

  const projects = sections.flatMap((s) => s.projects);
  for (const p of projects) {
    const parts = (await Promise.all(p.metrics.map(metric))).filter(Boolean);
    for (const theme of Object.keys(THEMES)) {
      save(`card-${p.slug}-${theme}.svg`, card(p, theme, parts.join(" · ")));
    }
  }

  const installsText = compact(await installs(hero.installs.installs, hero.installs.fallback));
  save("hero.svg", heroSvg({ projectCount: projects.length, installsText }));

  for (const theme of Object.keys(THEMES)) {
    for (const pill of pills) save(`pill-${pill.slug}-${theme}.svg`, pillSvg(pill, theme));
    save(`stack-${theme}.svg`, stackSvg(theme));
  }

  await Promise.all(files);
  console.log(`${files.length} images written to ${OUT}`);
}

await (README ? updateReadme() : buildImages());
