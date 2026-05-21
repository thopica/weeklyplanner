#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist/standalone");
const distJs = path.join(distDir, "app.js");
const distCss = path.join(distDir, "weekly-planner.css");
const sourceHtml = path.join(root, "index.html");
const releaseRoot = path.join(root, "release");
const appDir = path.join(releaseRoot, "weekly-planner");
const zipPath = path.join(releaseRoot, "weekly-planner.zip");

const readme = `Weekly Planner — offline app
================================

HOW TO USE

1. Double-click "index.html" (or right-click → Open With → your browser).
2. Bookmark the page after it opens for quick access next time.

Your data stays in this browser on this computer. Use Settings → Export backup to save a copy.
Open Settings → Setup and keeping your data safe for the full in-app guide.

OPTIONAL — If the page is blank
  macOS:   Double-click "Open Weekly Planner.command"
  Windows: Double-click "Open Weekly Planner.bat"
  (Requires Python 3 — install from python.org on Windows if needed.)
  Press Enter in the terminal window when you are done.

REQUIREMENTS
- A modern web browser (Chrome, Edge, Firefox, or Safari).
- Internet only needed the first time for fonts (Google Fonts). After that, the app works offline.

TIPS
- Navigation uses the address bar hash (e.g. index.html#/week).
- Do not delete this folder while using the app; your planner data is stored in the browser.
- Always open the same index.html from this folder so your data stays in one place.

© Local-first planner — nothing is sent to a server unless you export data yourself.
`;

const macLauncher = `#!/bin/bash
set -e
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required. Install it from https://www.python.org/downloads/"
  read -r -p "Press Enter to close."
  exit 1
fi

PORT=8765
while lsof -Pi :"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

echo "Starting Weekly Planner at http://127.0.0.1:$PORT/index.html"
python3 -m http.server "$PORT" &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 0.5
open "http://127.0.0.1:$PORT/index.html" 2>/dev/null || xdg-open "http://127.0.0.1:$PORT/index.html" 2>/dev/null || true

echo "Press Enter to stop the server."
read -r
`;

const winLauncher = `@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>&1 && set PY=py
if not defined PY where python >nul 2>&1 && set PY=python
if not defined PY (
  echo Python 3 is required. Install it from https://www.python.org/downloads/
  pause
  exit /b 1
)

set PORT=8765
:find_port
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul && (
  set /a PORT+=1
  goto find_port
)

echo Starting Weekly Planner at http://127.0.0.1:%PORT%/index.html
start "" "http://127.0.0.1:%PORT%/index.html"
%PY% -m http.server %PORT%
`;

console.log("Building standalone app…");
execSync("pnpm run build:standalone", { cwd: root, stdio: "inherit" });

if (!fs.existsSync(distJs) || !fs.existsSync(distCss)) {
  console.error(`Build output missing: ${distJs} or ${distCss}`);
  process.exit(1);
}

/** Assemble a single HTML file for file:// — IIFE script after #root, inlined CSS. */
function buildStandaloneHtml() {
  const js = fs.readFileSync(distJs, "utf8");
  const css = fs.readFileSync(distCss, "utf8");

  let html = fs.readFileSync(sourceHtml, "utf8")
    .replace(/<link rel="icon"[^>]*>\s*/g, "")
    .replace(/\s*<script type="module"[^>]*><\/script>\s*/g, "");

  const headClose = html.indexOf("</head>");
  if (headClose === -1) {
    throw new Error("Standalone HTML invalid: missing </head>");
  }
  html = `${html.slice(0, headClose)}<style>${css}</style>\n  ${html.slice(headClose)}`;

  const bodyClose = html.lastIndexOf("</body>");
  if (bodyClose === -1) {
    throw new Error("Standalone HTML invalid: missing </body>");
  }
  html = `${html.slice(0, bodyClose)}<script>${js}</script>\n  ${html.slice(bodyClose)}`;

  const rootPos = html.indexOf('id="root"');
  const scriptPos = html.lastIndexOf("<script>");
  if (rootPos === -1) {
    throw new Error("Standalone HTML invalid: missing #root element");
  }
  if (scriptPos === -1) {
    throw new Error("Standalone HTML invalid: missing script tag");
  }
  if (scriptPos < rootPos) {
    throw new Error("Standalone HTML invalid: script runs before #root");
  }

  return html;
}

const builtHtml = buildStandaloneHtml();

fs.rmSync(releaseRoot, { recursive: true, force: true });
fs.mkdirSync(appDir, { recursive: true });
fs.writeFileSync(path.join(appDir, "index.html"), builtHtml, "utf8");
fs.writeFileSync(path.join(appDir, "README.txt"), readme, "utf8");

const macLauncherPath = path.join(appDir, "Open Weekly Planner.command");
fs.writeFileSync(macLauncherPath, macLauncher, { mode: 0o755 });
fs.writeFileSync(path.join(appDir, "Open Weekly Planner.bat"), winLauncher, "utf8");

console.log("Creating zip…");
if (fs.existsSync(zipPath)) fs.rmSync(zipPath);
execSync(`zip -r "${zipPath}" weekly-planner`, { cwd: releaseRoot, stdio: "inherit" });

const sizeMb = (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2);
console.log(`\nDone.\n  App folder: ${appDir}\n  Zip:        ${zipPath} (${sizeMb} MB)\n`);
