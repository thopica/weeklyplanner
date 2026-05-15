#!/usr/bin/env node
/**
 * Phase 3 contrast matrix — run: node scripts/verify-contrast.mjs
 * Exits 1 if any theme/check fails WCAG thresholds.
 */

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function relLum(rgb) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
}

function contrast(a, b) {
  const L1 = relLum(hslToRgb(...a));
  const L2 = relLum(hslToRgb(...b));
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

const themes = {
  boho: {
    bg: [36, 33, 94],
    card: [38, 33, 97],
    fg: [25, 32, 18],
    mfg: [25, 32, 34],
    fgs: [25, 28, 38],
    ph: [25, 22, 40],
    border: [36, 22, 51],
    bStrong: [36, 26, 45],
    pri: [17, 50, 47],
    pfg: [0, 0, 100],
    surf: [36, 18, 91],
    acc: [17, 28, 92],
    sec: [120, 18, 62],
    secFg: [25, 32, 18],
  },
  blush: {
    bg: [0, 60, 96],
    card: [0, 100, 98],
    fg: [337, 40, 21],
    mfg: [337, 40, 39],
    fgs: [337, 32, 41],
    ph: [337, 28, 41],
    border: [0, 22, 59],
    bStrong: [0, 26, 52],
    pri: [353, 38, 53],
    pfg: [0, 0, 100],
    surf: [0, 24, 92],
    acc: [353, 28, 92],
    sec: [355, 60, 78],
    secFg: [337, 40, 21],
  },
  matcha: {
    bg: [86, 28, 95],
    card: [86, 33, 97],
    fg: [120, 24, 23],
    mfg: [120, 24, 31],
    fgs: [120, 22, 35],
    ph: [120, 20, 36],
    border: [86, 22, 47],
    bStrong: [86, 26, 42],
    pri: [120, 21, 41],
    pfg: [0, 0, 100],
    surf: [86, 18, 91],
    acc: [120, 28, 92],
    sec: [120, 23, 71],
    secFg: [120, 24, 23],
  },
  lavender: {
    bg: [262, 33, 95],
    card: [260, 60, 98],
    fg: [264, 33, 19],
    mfg: [264, 33, 40],
    fgs: [264, 28, 42],
    ph: [264, 24, 42],
    border: [262, 22, 60],
    bStrong: [262, 26, 54],
    pri: [256, 31, 55],
    pfg: [0, 0, 100],
    surf: [262, 18, 91],
    acc: [256, 28, 92],
    sec: [260, 38, 75],
    secFg: [264, 33, 19],
  },
  minimal: {
    bg: [0, 0, 98],
    card: [0, 0, 100],
    fg: [0, 0, 10],
    mfg: [0, 0, 36],
    fgs: [0, 0, 40],
    ph: [0, 0, 42],
    border: [0, 0, 54],
    bStrong: [0, 0, 48],
    pri: [0, 0, 23],
    pfg: [0, 0, 100],
    surf: [0, 0, 95],
    acc: [0, 20, 92],
    sec: [0, 0, 40],
    secFg: [0, 0, 100],
  },
};

const checks = [
  ["Body on page", (t) => contrast(t.fg, t.bg), 4.5],
  ["Section desc (muted on card)", (t) => contrast(t.mfg, t.card), 4.5],
  ["Placeholder on card", (t) => contrast(t.ph, t.card), 4.5],
  ["Completed task (subtle on surface)", (t) => contrast(t.fgs, t.surf), 4.5],
  ["Empty state (muted on surface)", (t) => contrast(t.mfg, t.surf), 4.5],
  ["Border on page", (t) => contrast(t.border, t.bg), 3],
  ["Strong divider on page", (t) => contrast(t.bStrong, t.bg), 3],
  ["Step badge (white on primary)", (t) => contrast(t.pfg, t.pri), 4.5],
  ["Primary link on page", (t) => contrast(t.pri, t.bg), 3],
  ["Schedule block label", (t) => contrast(t.fg, t.acc), 4.5],
  ["Schedule half-hour tick", (t) => contrast(t.fgs, t.surf), 4.5],
  ["Add task button (secFg on sec)", (t) => contrast(t.secFg, t.sec), 4.5],
  ["Accomplished label (muted on card)", (t) => contrast(t.mfg, t.card), 4.5],
];

let failures = 0;

for (const [name, tokens] of Object.entries(themes)) {
  console.log(`\n## ${name}`);
  for (const [label, fn, min] of checks) {
    const ratio = fn(tokens);
    const pass = ratio >= min;
    if (!pass) failures += 1;
    console.log(`${pass ? "PASS" : "FAIL"} | ${label}: ${ratio.toFixed(2)} (need ${min})`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll themes pass the contrast matrix.");
