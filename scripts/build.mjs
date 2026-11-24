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

// Cards are shown at their natural size: two halves or three thirds fill the
// 846px profile column, and on a narrower screen they wrap, one per row,
// instead of shrinking until the text is unreadable.
const SIZES = {
  half: { w: 418, h: 188, descW: 374, descSize: 13.5, lineH: 19.5, lines: 3 },
  third: { w: 276, h: 224, descW: 232, descSize: 13, lineH: 18, lines: 5 },
  // Full-width and low, for the 578-845px column of a 1012-1279px window.
  row: { w: 700, h: 170, descW: 656, descSize: 13.5, lineH: 19.5, lines: 2 },
};

// Transparent band above and below each card, so wrapped rows never touch.
const GAP = 3;

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
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
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

// Light and dark live in the same file and the image picks one from the
// reader's colour scheme. That keeps <picture> free for the width switch:
// GitHub rewrites the media of themed sources, which would break it.
const THEME_CSS =
  ".dark { display: none; } @media (prefers-color-scheme: dark) { .light { display: none; } .dark { display: inline; } }";
const themes = (draw) =>
  Object.keys(THEMES)
    .map((theme) => `<g class="${theme}">\n${draw(THEMES[theme], theme[0])}\n</g>`)
    .join("\n");

// Below 1280px the profile column is too narrow for two cards side by side,
// so every card is served alone on its row, drawn at twice its size: the
// browser scales it down to the column and it always fills the row. Up to
// 1011px (column up to 580px) it uses the half layout, above that the row one.
const WIDE = 2;
const LAYOUTS = { "": "natural", "-wide": "wide", "-row": "row" };
const LAYOUT_SIZE = { wide: "half", row: "row" };

function card(p, layout, metricText) {
  const S = SIZES[LAYOUT_SIZE[layout] ?? p.size];
  const zoom = layout === "natural" ? 1 : WIDE;
  const [a, b] = p.accent;
  const pad = 22;
  const lines = wrap(p.description, S.descW, S.descSize, S.lines);
  const chipY = S.h - pad - 22;
  const metricW = metricText ? monoWidth(metricText, 11.5) + 12 : 0;
  const rightLimit = S.w - pad - metricW;
  const statusText = STATUS[p.status];
  const statusX = S.w - pad;
  const dotX = statusX - monoWidth(statusText, 10.5) - 9;
  const H = S.h + 2 * GAP;

  const draw = (t, k) => {
    const statusColor = p.status === "soon" ? t.soon : t.live;
    return `<defs>
  <linearGradient id="${k}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.cardTop}"/><stop offset="1" stop-color="${t.cardBottom}"/></linearGradient>
  <linearGradient id="${k}edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}" stop-opacity=".75"/><stop offset=".35" stop-color="${t.border}"/><stop offset="1" stop-color="${t.border}"/></linearGradient>
  <radialGradient id="${k}glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${S.w - 30} -10) scale(${Math.round(S.w * 0.55)} 190)"><stop offset="0" stop-color="${b}" stop-opacity="${t.glow}"/><stop offset="1" stop-color="${b}" stop-opacity="0"/></radialGradient>
</defs>
<g clip-path="url(#clip)">
  <rect width="${S.w}" height="${S.h}" fill="url(#${k}bg)"/>
  <rect width="${S.w}" height="${S.h}" fill="url(#${k}glow)"/>
</g>
<rect x=".5" y=".5" width="${S.w - 1}" height="${S.h - 1}" rx="15.5" fill="none" stroke="url(#${k}edge)"/>
<text x="${pad + 58}" y="41" font-family="${SANS}" font-size="20" font-weight="700" fill="${t.title}">${esc(p.name)}</text>
<text x="${pad + 58}" y="59" font-family="${MONO}" font-size="10.5" letter-spacing=".4" fill="${t.muted}">${esc(p.kind.toUpperCase())}</text>
<circle class="pulse" cx="${dotX.toFixed(1)}" cy="35.5" r="3.5" fill="${statusColor}"/>
<circle cx="${dotX.toFixed(1)}" cy="35.5" r="3.5" fill="${statusColor}"/>
<text x="${statusX}" y="39" text-anchor="end" font-family="${MONO}" font-size="10.5" fill="${statusColor}">${statusText}</text>
${lines.map((l, i) => `<text x="${pad}" y="${94 + i * S.lineH}" font-family="${SANS}" font-size="${S.descSize}" fill="${t.text}">${esc(l)}</text>`).join("\n")}
${chipRow(p.chips, pad, chipY, rightLimit, t)}
${metricText ? `<text x="${S.w - pad}" y="${chipY + 15}" text-anchor="end" font-family="${MONO}" font-size="11.5" font-weight="600" fill="${t.title}">${esc(metricText)}</text>` : ""}`;
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S.w * zoom}" height="${H * zoom}" viewBox="0 ${-GAP} ${S.w} ${H}" role="img" aria-label="${esc(`${p.name}: ${p.summary}`)}">
<defs>
  <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
  <clipPath id="clip"><rect width="${S.w}" height="${S.h}" rx="16"/></clipPath>
</defs>
<style>
  ${THEME_CSS}
  .pulse { animation: pulse 2.4s ease-in-out infinite; transform-origin: ${dotX.toFixed(1)}px 35.5px; }
  @keyframes pulse { 0%, 100% { opacity: .35; transform: scale(1); } 50% { opacity: 0; transform: scale(2.6); } }
  @media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
</style>
${themes(draw)}
<rect x="${pad}" y="${pad}" width="44" height="44" rx="12" fill="url(#accent)"/>
<g transform="translate(${pad + 10} ${pad + 10})" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[p.icon]}</g>
</svg>
`;
}

// --------------------------------------------------------------------- hero

const HERO = {
  desktop: {
    W: 880, H: 272, x: 40, place: [48, 12], name: [116, 62, -2], tag: [150, 18, 24, 800],
    typed: [186, 15], rule: 208, stats: "inline",
    blobs: [[690, 60, 130], [840, 210, 120], [520, 270, 100]],
  },
  // Served below 1012px, where the profile column is at most 578px wide.
  mobile: {
    W: 440, H: 286, x: 26, place: [40, 11.5], name: [94, 48, -1.5], tag: [126, 16.5, 23, 380],
    typed: [192, 12], rule: 212, stats: "columns",
    blobs: [[380, 30, 110], [450, 230, 100], [200, 300, 90]],
  },
};

function heroSvg(layout, { projectCount, installsText }) {
  const L = HERO[layout];
  const { W, H, x } = L;
  const [typedY, size] = L.typed;
  const x0 = x + size * 1.5;
  const lines = hero.typed.map((l) => l.replace("{installs}", installsText));
  const n = lines.length;
  const slot = 4.5;
  const widths = lines.map((l) => monoWidth(l, size) + 3);
  if (x0 + Math.max(...widths) > W - x / 2) throw new Error(`Hero (${layout}): a typed line does not fit`);
  const f = (v) => v.toFixed(4);
  const caretValues = [];
  const caretTimes = [];

  // Each character is its own <text> that switches on and off. An animated
  // clipPath would be shorter, but Safari does not clip text with it and
  // shows every line at once. Line 0 is fully typed at t=0, so a renderer
  // that shows only the first frame still gets a complete sentence. A line
  // holds, is erased from the end, then the next one is typed.
  const advance = size * MONO_EM;
  const typed = lines
    .map((l, i) => {
      const s = i / n;
      const typeStart = (i === 0 ? 1 : s) - 0.3 / n;
      const chars = [...l];
      caretValues.push(x0 + widths[i], x0 + widths[i], x0);
      caretTimes.push(s, s + 0.6 / n, s + 0.7 / n);
      return chars
        .map((c, j) => {
          if (c === " ") return "";
          const on = Math.min(typeStart + ((0.3 / n) * (j + 1)) / chars.length, 1);
          const off = s + 0.6 / n + (0.1 / n) * (1 - j / chars.length);
          const [values, times] = i === 0 ? ["1;0;1", [0, off, on]] : ["0;1;0", [0, on, off]];
          return `<text x="${(x0 + j * advance).toFixed(1)}" y="${typedY}" opacity="${i === 0 ? 1 : 0}">${esc(c)}<animate attributeName="opacity" dur="${n * slot}s" repeatCount="indefinite" calcMode="discrete" values="${values}" keyTimes="${times.map(f).join(";")}"/></text>`;
        })
        .join("");
    })
    .join("\n");
  caretValues.push(x0 + widths[0]);
  caretTimes.push(1);

  const stats = [
    [String(projectCount), "active projects"],
    [`${installsText}+`, "VS Code installs"],
    [String(hero.since), "on GitHub since"],
  ];
  const label = (lx, ly, text, fs) =>
    `<text x="${lx.toFixed(1)}" y="${ly}" font-family="${MONO}" font-size="${fs}" letter-spacing=".6" fill="#fff" fill-opacity=".62">${esc(text.toUpperCase())}</text>`;
  const value = (vx, vy, text, fs) =>
    `<text x="${vx.toFixed(1)}" y="${vy}" font-family="${SANS}" font-size="${fs}" font-weight="700" fill="#fff">${esc(text)}</text>`;
  let sx = x;
  const statsSvg = stats
    .map(([v, l], i) => {
      if (L.stats === "columns") {
        const cx = x + (i * (W - 2 * x)) / 3;
        return value(cx, L.rule + 34, v, 22) + label(cx, L.rule + 52, l, 9.5);
      }
      const vw = sansWidth(v, 24);
      const out = value(sx, L.rule + 30, v, 24) + label(sx + vw + 9, L.rule + 29, l, 10.5);
      sx += vw + 9 + monoWidth(l, 10.5) + l.length * 0.6 + 34;
      return out;
    })
    .join("\n");

  const [tagY, tagSize, tagLineH, tagW] = L.tag;
  const tagLines = wrap(hero.tagline, tagW, tagSize, 2);
  const [placeY, placeSize] = L.place;
  const [nameY, nameSize, nameSpacing] = L.name;
  const dot = [x + 5, placeY - 4.5];
  const blobColors = [["#4338ca", 0.85], ["#0ea5e9", 0.7], ["#c026d3", 0.5]];

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
  .ring { animation: ring 2.4s ease-out infinite; transform-origin: ${dot[0]}px ${dot[1]}px; }
  @keyframes ring { 0% { opacity: .5; transform: scale(1); } 100% { opacity: 0; transform: scale(3); } }
  @media (prefers-reduced-motion: reduce) { .b, .caret, .ring { animation: none; } }
</style>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#base)"/>
  <g filter="url(#blur)">
${L.blobs.map(([cx, cy, r], i) => `    <circle class="b${i ? ` b${i + 1}` : ""}" cx="${cx}" cy="${cy}" r="${r}" fill="${blobColors[i][0]}" opacity="${blobColors[i][1]}"/>`).join("\n")}
  </g>
  <rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#mask)"/>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="19.5" fill="none" stroke="#fff" stroke-opacity=".1"/>
<circle class="ring" cx="${dot[0]}" cy="${dot[1]}" r="4" fill="#3fb950"/>
<circle cx="${dot[0]}" cy="${dot[1]}" r="4" fill="#3fb950"/>
<text x="${x + 18}" y="${placeY}" font-family="${MONO}" font-size="${placeSize}" letter-spacing=".3" fill="#fff" fill-opacity=".7">${esc(hero.place)}</text>
<text x="${x - 2}" y="${nameY}" font-family="${SANS}" font-size="${nameSize}" font-weight="800" letter-spacing="${nameSpacing}" fill="url(#name)">${esc(hero.name)}</text>
${tagLines.map((l, i) => `<text x="${x}" y="${tagY + i * tagLineH}" font-family="${SANS}" font-size="${tagSize}" fill="#fff" fill-opacity=".8">${esc(l)}</text>`).join("\n")}
<text x="${x}" y="${typedY}" font-family="${MONO}" font-size="${size}" font-weight="700" fill="#38bdf8">❯</text>
<g font-family="${MONO}" font-size="${size}" fill="#a5d8ff">
${typed}
</g>
<rect class="caret" x="${(x0 + widths[0]).toFixed(1)}" y="${typedY - size * 0.93}" width="${(size * 0.53).toFixed(1)}" height="${size * 1.2}" rx="1.5" fill="#a5d8ff"><animate attributeName="x" dur="${n * slot}s" repeatCount="indefinite" values="${caretValues.map((v) => v.toFixed(1)).join(";")}" keyTimes="${caretTimes.map(f).join(";")}"/></rect>
<path d="M${x} ${L.rule}h${W - 2 * x}" stroke="#fff" stroke-opacity=".1"/>
${statsSvg}
</svg>
`;
}

// ------------------------------------------------------------ pills & stack

function pillSvg(pill) {
  const size = 12;
  const label = `${pill.label} ↗`;
  const w = Math.round(monoWidth(label, size) + 28);
  const draw = (t) => `<rect x=".5" y=".5" width="${w - 1}" height="29" rx="14.5" fill="${pill.primary ? "url(#accent)" : t.chipBg}" stroke="${pill.primary ? "none" : t.border}"/>
<text x="${w / 2}" y="19.5" text-anchor="middle" font-family="${MONO}" font-size="${size}" font-weight="600" fill="${pill.primary ? "#fff" : t.chipText}">${esc(label)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="30" viewBox="0 0 ${w} 30" role="img" aria-label="${esc(pill.label)}">
<defs><linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f6feb"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient></defs>
<style>${THEME_CSS}</style>
${themes(draw)}
</svg>
`;
}

// One tile per stack group, in the same widths as the cards.
const stackWidth = (layout) => SIZES[LAYOUT_SIZE[layout] ?? "half"].w;

function stackLayout(items, width) {
  const pad = 16;
  let x = pad;
  let y = 44;
  const chips = items.map((item) => {
    const w = monoWidth(item, 11.5) + 20;
    if (x + w > width - pad && x > pad) {
      x = pad;
      y += 33;
    }
    const chip = { item, x, y, w };
    x += w + 6;
    return chip;
  });
  return { chips, height: y + 27 + pad };
}

function stackSvg(index, layout, height) {
  const [label, items] = stack[index];
  const STACK_W = stackWidth(layout);
  const { chips } = stackLayout(items, STACK_W);
  const zoom = layout === "natural" ? 1 : WIDE;
  const H = height + 2 * GAP;
  const draw = (t, k) => `<defs><linearGradient id="${k}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.cardTop}"/><stop offset="1" stop-color="${t.cardBottom}"/></linearGradient></defs>
<rect x=".5" y=".5" width="${STACK_W - 1}" height="${height - 1}" rx="15.5" fill="url(#${k}bg)" stroke="${t.border}"/>
<text x="16" y="28" font-family="${MONO}" font-size="10.5" letter-spacing=".8" fill="${t.muted}">${esc(label.toUpperCase())}</text>
${chips
  .map(
    (c) => `<rect x="${c.x.toFixed(1)}" y="${c.y + 0.5}" width="${c.w.toFixed(1)}" height="26" rx="13" fill="${t.chipBg}" stroke="${t.border}"/>
<text x="${(c.x + 10).toFixed(1)}" y="${c.y + 17.5}" font-family="${MONO}" font-size="11.5" fill="${t.chipText}">${esc(c.item)}</text>`,
  )
  .join("\n")}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${STACK_W * zoom}" height="${H * zoom}" viewBox="0 ${-GAP} ${STACK_W} ${H}" role="img" aria-label="${esc(`${label}: ${items.join(", ")}`)}">
<style>${THEME_CSS}</style>
${themes(draw)}
</svg>
`;
}

// ------------------------------------------------------------------- README

// GitHub's profile column reaches its full 846px only from a 1280px viewport:
// below that, one card per row, in the layout that suits the column.
const responsive = (name, alt) =>
  `<picture><source media="(max-width: 1011px)" srcset="${ASSETS}/${name}-wide.svg" /><source media="(max-width: 1279px)" srcset="${ASSETS}/${name}-row.svg" /><img src="${ASSETS}/${name}.svg" alt="${esc(alt)}" /></picture>`;

const slugOf = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

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
        `  <a href="${p.url}">${responsive(`card-${p.slug}`, `${p.name}: ${p.summary}`)}</a>`,
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

function stackBlock() {
  const out = ["### Stack", "", '<p align="center">'];
  for (const [label, items] of stack) {
    out.push(`  ${responsive(`stack-${slugOf(label)}`, `${label}: ${items.join(", ")}`)}`);
  }
  out.push("</p>");
  return out.join("\n");
}

async function updateReadme() {
  const path = join(ROOT, "README.md");
  let readme = await readFile(path, "utf8");
  for (const [name, block] of [["projects", readmeBlock()], ["stack", stackBlock()]]) {
    const start = `<!-- ${name}:start -->`;
    const end = `<!-- ${name}:end -->`;
    const from = readme.indexOf(start);
    const to = readme.indexOf(end);
    if (from < 0 || to < 0) throw new Error(`README.md needs the ${start} and ${end} markers`);
    readme = `${readme.slice(0, from + start.length)}\n${block}\n${readme.slice(to)}`;
  }
  await writeFile(path, readme);
  console.log("README.md updated");
}

// --------------------------------------------------------------------- main

async function buildImages() {
  await mkdir(OUT, { recursive: true });
  const files = [];
  const save = (name, svg) => files.push(writeFile(join(OUT, name), svg));

  const projects = sections.flatMap((s) => s.projects);
  for (const p of projects) {
    const text = (await Promise.all(p.metrics.map(metric))).filter(Boolean).join(" · ");
    for (const [suffix, layout] of Object.entries(LAYOUTS)) {
      save(`card-${p.slug}${suffix}.svg`, card(p, layout, text));
    }
  }

  const installsText = compact(await installs(hero.installs.installs, hero.installs.fallback));
  const heroData = { projectCount: projects.length, installsText };
  save("hero.svg", heroSvg("desktop", heroData));
  save("hero-mobile.svg", heroSvg("mobile", heroData));

  for (const pill of pills) save(`pill-${pill.slug}.svg`, pillSvg(pill));
  for (const [suffix, layout] of Object.entries(LAYOUTS)) {
    const height = Math.max(...stack.map(([, items]) => stackLayout(items, stackWidth(layout)).height));
    stack.forEach(([label], i) => save(`stack-${slugOf(label)}${suffix}.svg`, stackSvg(i, layout, height)));
  }

  await Promise.all(files);
  console.log(`${files.length} images written to ${OUT}`);
}

await (README ? updateReadme() : buildImages());
